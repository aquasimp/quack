'use client';

import { motion } from 'framer-motion';
import {
  BarChart3, Users, GraduationCap, TrendingUp,
  Award, Code, Megaphone, Send
} from 'lucide-react';
import { useState } from 'react';

const analytics = {
  totalStudents: 847,
  totalProfiles: 723,
  avgCgpa: 7.84,
  eligibleAbove7: 489,
  eligibleAbove8: 312,
  topSkills: [
    { skill: 'Python', count: 412 },
    { skill: 'JavaScript', count: 387 },
    { skill: 'React', count: 298 },
    { skill: 'Java', count: 276 },
    { skill: 'SQL', count: 253 },
    { skill: 'Machine Learning', count: 189 },
    { skill: 'Node.js', count: 178 },
    { skill: 'Docker', count: 134 },
    { skill: 'AWS', count: 121 },
    { skill: 'TypeScript', count: 112 },
  ],
  branchDistribution: [
    { branch: 'CSE', count: 310 },
    { branch: 'IT', count: 185 },
    { branch: 'ECE', count: 120 },
    { branch: 'EE', count: 65 },
    { branch: 'ME', count: 43 },
  ],
};

export default function TPOPage() {
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');

  const maxSkillCount = Math.max(...analytics.topSkills.map(s => s.count));
  const maxBranchCount = Math.max(...analytics.branchDistribution.map(b => b.count));

  const statCards = [
    { label: 'Total Students', value: analytics.totalStudents, icon: Users, color: 'var(--accent-primary)', bg: 'rgba(56, 189, 248, 0.1)' },
    { label: 'With Profiles', value: analytics.totalProfiles, icon: GraduationCap, color: 'var(--accent-secondary)', bg: 'rgba(129, 140, 248, 0.1)' },
    { label: 'Avg CGPA', value: analytics.avgCgpa, icon: BarChart3, color: 'var(--accent-success)', bg: 'rgba(52, 211, 153, 0.1)' },
    { label: 'Eligible (7+)', value: analytics.eligibleAbove7, icon: Award, color: 'var(--accent-warning)', bg: 'rgba(251, 191, 36, 0.1)' },
    { label: 'Eligible (8+)', value: analytics.eligibleAbove8, icon: TrendingUp, color: 'var(--accent-tertiary)', bg: 'rgba(167, 139, 250, 0.1)' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BarChart3 className="text-sky-400" /> TPO Analytics Dashboard
        </h1>
        <p className="text-gray-400 mt-1">Placement statistics, skill distributions, and bulk announcements.</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass p-4 glass-hover"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: stat.bg }}>
              <stat.icon size={18} style={{ color: stat.color }} />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-gray-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Skill Distribution */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass p-5">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-5">
            <Code size={18} className="text-sky-400" /> Top Skills Distribution
          </h3>
          <div className="space-y-3">
            {analytics.topSkills.map((skill, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm text-gray-300 w-28 truncate">{skill.skill}</span>
                <div className="flex-1 h-6 rounded-lg overflow-hidden" style={{ background: 'var(--surface)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(skill.count / maxSkillCount) * 100}%` }}
                    transition={{ delay: 0.3 + i * 0.05, duration: 0.8 }}
                    className="h-full rounded-lg flex items-center justify-end pr-2"
                    style={{ background: `linear-gradient(90deg, rgba(56, 189, 248, 0.3), rgba(129, 140, 248, 0.5))` }}
                  >
                    <span className="text-[10px] font-bold text-white">{skill.count}</span>
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Branch Distribution */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="glass p-5">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-5">
            <GraduationCap size={18} className="text-violet-400" /> Branch Distribution
          </h3>
          <div className="space-y-4">
            {analytics.branchDistribution.map((branch, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{branch.branch}</span>
                  <span className="text-xs text-gray-400">{branch.count} students</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--surface)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(branch.count / maxBranchCount) * 100}%` }}
                    transition={{ delay: 0.4 + i * 0.08, duration: 0.8 }}
                    className="h-full rounded-full"
                    style={{
                      background: [
                        'var(--gradient-primary)',
                        'var(--gradient-secondary)',
                        'var(--gradient-accent)',
                        'var(--gradient-warm)',
                        'linear-gradient(135deg, #64748b, #94a3b8)',
                      ][i],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Eligibility Pie Summary */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="glass-sm p-3 text-center">
              <p className="text-xl font-bold text-gradient">{Math.round(analytics.eligibleAbove7 / analytics.totalStudents * 100)}%</p>
              <p className="text-xs text-gray-400">CGPA ≥ 7</p>
            </div>
            <div className="glass-sm p-3 text-center">
              <p className="text-xl font-bold text-gradient">{Math.round(analytics.eligibleAbove8 / analytics.totalStudents * 100)}%</p>
              <p className="text-xs text-gray-400">CGPA ≥ 8</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bulk Announcement */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass p-5">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Megaphone size={18} className="text-yellow-400" /> Broadcast Announcement
        </h3>
        <div className="space-y-3">
          <input
            type="text"
            value={announcementTitle}
            onChange={e => setAnnouncementTitle(e.target.value)}
            className="input"
            placeholder="Announcement title..."
          />
          <textarea
            value={announcementContent}
            onChange={e => setAnnouncementContent(e.target.value)}
            className="input min-h-[100px] resize-y"
            placeholder="Write your announcement here. This will be broadcast to all selected folders and groups..."
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {['📚 Academics', '🎯 Placements', '⚽ Sports', '🏠 Hostel'].map(folder => (
                <label key={folder} className="badge badge-secondary cursor-pointer hover:opacity-80">
                  <input type="checkbox" className="hidden" />
                  {folder}
                </label>
              ))}
            </div>
            <button className="btn-primary flex items-center gap-2">
              <Send size={16} /> Broadcast
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
