'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import { motion } from 'framer-motion';
import { Lock, Mail, User, ArrowRight, GraduationCap, Briefcase, Shield, BookOpen } from 'lucide-react';

const roles = [
  { value: 'student', label: 'Student', icon: GraduationCap, color: 'var(--accent-primary)' },
  { value: 'faculty', label: 'Faculty', icon: BookOpen, color: 'var(--accent-secondary)' },
  { value: 'tpo', label: 'TPO', icon: Shield, color: 'var(--accent-success)' },
  { value: 'recruiter', label: 'Recruiter', icon: Briefcase, color: 'var(--accent-warning)' },
];

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register(name, email, password, role);
    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <AnimatedBackground />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass relative z-10 w-full max-w-md p-8"
        style={{ boxShadow: '0 0 60px rgba(129, 140, 248, 0.08)' }}
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-2xl font-black mb-4"
            style={{ background: 'var(--gradient-secondary)' }}>
            Q
          </div>
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-gray-400 text-sm mt-1">Join the Qwack platform</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: 'rgba(248, 113, 113, 0.1)', color: 'var(--accent-danger)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                className="input pl-10" placeholder="Your name" required />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input pl-10" placeholder="you@college.edu" required />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="input pl-10" placeholder="Min. 6 characters" required minLength={6} />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {roles.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    role === r.value
                      ? 'border-2 text-white'
                      : 'border border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                  style={role === r.value ? { borderColor: r.color, background: `${r.color}15` } : {}}
                >
                  <r.icon size={16} style={role === r.value ? { color: r.color } : {}} />
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Creating...' : <>Create Account <ArrowRight size={16} /></>}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-sky-400 hover:text-sky-300 font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
