'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import {
  MessageSquare, Brain, Shield, Users, FolderTree, Zap,
  ArrowRight, ChevronRight, Lock, BarChart3
} from 'lucide-react';

const features = [
  {
    icon: FolderTree,
    title: 'Folder-Based Communication',
    description: 'Hierarchical organization of groups into thematic folders — Academics, Placements, Sports, and more. Broadcast to all groups in a folder with one click.',
    color: 'var(--accent-primary)',
    bg: 'rgba(56, 189, 248, 0.1)',
  },
  {
    icon: Shield,
    title: 'End-to-End Encryption',
    description: 'Every message is encrypted client-side using ECDH + AES-GCM before it leaves your device. Even the server cannot read your messages.',
    color: 'var(--accent-success)',
    bg: 'rgba(52, 211, 153, 0.1)',
  },
  {
    icon: Brain,
    title: 'AI Career Intelligence',
    description: 'Upload your resume for AI-powered readiness scoring, skill gap analysis, and personalized career roadmaps powered by Google Gemini.',
    color: 'var(--accent-secondary)',
    bg: 'rgba(129, 140, 248, 0.1)',
  },
  {
    icon: Users,
    title: 'Digital Career Portfolio',
    description: 'Maintain a structured profile with CGPA, skills, projects, certifications. Recruiters can browse and filter candidates directly.',
    color: 'var(--accent-tertiary)',
    bg: 'rgba(167, 139, 250, 0.1)',
  },
  {
    icon: Zap,
    title: 'Real-Time Collaboration',
    description: 'Socket-based instant messaging within communities. Get live announcements, collaborate on projects, and never miss an update.',
    color: 'var(--accent-warning)',
    bg: 'rgba(251, 191, 36, 0.1)',
  },
  {
    icon: BarChart3,
    title: 'TPO Analytics Dashboard',
    description: 'Placement officers get insights into skill distributions, CGPA trends, and can run AI-powered natural language candidate searches.',
    color: 'var(--accent-danger)',
    bg: 'rgba(248, 113, 113, 0.1)',
  },
];

const stats = [
  { value: '256-bit', label: 'AES-GCM Encryption' },
  { value: 'AI', label: 'Career Intelligence' },
  { value: 'Real-time', label: 'Messaging' },
  { value: '4 Roles', label: 'Student · Faculty · TPO · Recruiter' },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black"
            style={{ background: 'var(--gradient-primary)' }}>
            Q
          </div>
          <span className="text-xl font-bold text-gradient">Qwack</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="btn-ghost text-sm">Sign In</Link>
          <Link href="/register" className="btn-primary text-sm flex items-center gap-2">
            Get Started <ArrowRight size={16} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <Lock size={14} className="text-green-400" />
            <span className="text-sm text-gray-300">End-to-End Encrypted Platform</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
            <span className="text-gradient">AI-Powered</span><br />
            Campus Communication &<br />
            Career Intelligence
          </h1>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            A unified digital ecosystem for structured communication, collaborative learning,
            and intelligent career analytics. Secure. Smart. Scalable.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link href="/register" className="btn-primary text-base px-8 py-3 flex items-center gap-2">
              Launch Platform <ChevronRight size={18} />
            </Link>
            <Link href="/login" className="btn-ghost text-base px-8 py-3">
              Sign In
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-3xl mx-auto"
        >
          {stats.map((stat, i) => (
            <div key={i} className="glass-sm p-4 text-center glass-hover">
              <p className="text-xl font-bold text-gradient">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything Your Campus <span className="text-gradient">Needs</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            From secure messaging to AI career coaching — one platform to rule them all.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass p-6 glass-hover cursor-default"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: feature.bg }}>
                <feature.icon size={22} style={{ color: feature.color }} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-8 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass p-12"
          style={{ boxShadow: '0 0 60px rgba(56, 189, 248, 0.1)' }}
        >
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Campus?
          </h2>
          <p className="text-gray-400 mb-8">
            Join the next generation of campus communication. Secure, intelligent, and built for you.
          </p>
          <Link href="/register" className="btn-primary text-base px-10 py-3 inline-flex items-center gap-2">
            Get Started Now <ArrowRight size={18} />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-sm text-gray-600">
        <p>© 2026 Qwack. Built with 🔒 E2E Encryption & 🧠 AI Intelligence.</p>
      </footer>
    </div>
  );
}
