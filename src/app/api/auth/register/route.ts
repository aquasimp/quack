import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import Profile from '@/lib/models/Profile';
import { signToken } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous';
    // Rate limit: 10 registrations per minute per IP
    const rl = rateLimit(`register:${ip}`, 10, 60_000);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many registration requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rl.reset) } }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { name, email, password, role } = body;

    if (!name || !email || !password || typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const safeName = name.trim().slice(0, 100);
    const normalizedEmail = email.trim().toLowerCase();

    if (!safeName) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 100) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: 'Password must be between 8 and 128 characters' }, { status: 400 });
    }

    await connectDB();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const ALLOWED_ROLES = ['student', 'faculty', 'tpo', 'recruiter'] as const;
    const assignedRole = ALLOWED_ROLES.includes(role) ? role : 'student';

    const user = await User.create({
      name: safeName,
      email: normalizedEmail,
      password: hashedPassword,
      role: assignedRole,
    });

    // Create profile for students
    if (assignedRole === 'student') {
      await Profile.create({ userId: user._id });
    }

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      message: 'Registration successful',
    }, { status: 201 });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
