'use client';

import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import {
  MessageSquare, Users, Brain, Shield, TrendingUp,
  Bell, Briefcase, GraduationCap, ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();

  const statsCards = [
    { label: 'Active Groups', value: '12', icon: MessageSquare, color: 'var(--accent-primary)', bg: 'rgba(56, 189, 248, 0.1)' },
    { label: 'Community Members', value: '847', icon: Users, color: 'var(--accent-secondary)', bg: 'rgba(129, 140, 248, 0.1)' },
    { label: 'AI Analyses', value: '156', icon: Brain, color: 'var(--accent-success)', bg: 'rgba(52, 211, 153, 0.1)' },
    { label: 'Encrypted Messages', value: '3.2K', icon: Shield, color: 'var(--accent-warning)', bg: 'rgba(251, 191, 36, 0.1)' },
  ];

  const quickActions = user?.role === 'student' ? [
    { label: 'Communication Hub', href: '/dashboard/communicate', icon: MessageSquare, desc: 'Join groups & chat' },
    { label: 'Career AI', href: '/dashboard/career-ai', icon: Brain, desc: 'Analyze your resume' },
    { label: 'My Profile', href: '/dashboard/profile', icon: GraduationCap, desc: 'Update portfolio' },
  ] : user?.role === 'recruiter' ? [
    { label: 'Search Talent', href: '/dashboard/recruiter', icon: Briefcase, desc: 'AI-powered search' },
  ] : [
    { label: 'Communication Hub', href: '/dashboard/communicate', icon: MessageSquare, desc: 'Manage groups' },
    { label: 'TPO Dashboard', href: '/dashboard/tpo', icon: TrendingUp, desc: 'Placement analytics' },
    { label: 'Search Talent', href: '/dashboard/recruiter', icon: Briefcase, desc: 'Find candidates' },
  ];

  const announcements = [
    { title: '🎯 Placement Drive: Google', time: '2h ago', priority: 'urgent' as const },
    { title: '📚 End Semester Exam Schedule', time: '5h ago', priority: 'normal' as const },
    { title: '🏆 Hackathon Registration Open', time: '1d ago', priority: 'normal' as const },
    { title: '🎓 Workshop: AI & ML Bootcamp', time: '2d ago', priority: 'normal' as const },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, <span className="text-gradient">{user?.name}</span>
          </h1>
          <p className="text-gray-400 mt-1">Here&apos;s what&apos;s happening on your campus today.</p>
        </div>
        <div className="e2e-badge">
          <Shield size={12} /> All communications E2E encrypted
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass p-5 glass-hover"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: stat.bg }}>
                <stat.icon size={20} style={{ color: stat.color }} />
              </div>
              <TrendingUp size={16} className="text-green-400" />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-gray-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ArrowUpRight size={18} className="text-sky-400" /> Quick Actions
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {quickActions.map((action, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <Link href={action.href} className="glass p-5 glass-hover block group">
                  <action.icon size={24} className="text-sky-400 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold mb-1">{action.label}</h3>
                  <p className="text-xs text-gray-400">{action.desc}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Announcements */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bell size={18} className="text-sky-400" /> Recent Announcements
          </h2>
          <div className="glass p-4 space-y-3">
            {announcements.map((ann, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  ann.priority === 'urgent' ? 'bg-red-400 animate-pulse' : 'bg-gray-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ann.title}</p>
                  <p className="text-xs text-gray-500">{ann.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
