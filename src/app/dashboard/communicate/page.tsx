'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FolderOpen, MessageSquare, Users, ChevronRight, ChevronDown,
  Send, Pin, Shield, Plus, Hash, Megaphone, Search
} from 'lucide-react';

interface FolderItem {
  id: string;
  name: string;
  icon: string;
  groups: { id: string; name: string; type: string; memberCount: number; lastMessage: string }[];
}

const demoFolders: FolderItem[] = [
  {
    id: '1', name: 'Academics', icon: '📚',
    groups: [
      { id: 'g1', name: 'CSE-A Section', type: 'academic', memberCount: 62, lastMessage: 'Assignment 3 due tomorrow!' },
      { id: 'g2', name: 'Data Structures', type: 'academic', memberCount: 120, lastMessage: 'Binary tree lecture notes uploaded' },
      { id: 'g3', name: 'AI/ML Club', type: 'academic', memberCount: 85, lastMessage: 'Workshop this Saturday' },
    ],
  },
  {
    id: '2', name: 'Placements', icon: '🎯',
    groups: [
      { id: 'g4', name: 'Placement Updates', type: 'placement', memberCount: 450, lastMessage: 'Google hiring for SDE intern' },
      { id: 'g5', name: 'Interview Prep', type: 'placement', memberCount: 230, lastMessage: 'DSA round tips shared' },
    ],
  },
  {
    id: '3', name: 'Sports', icon: '⚽',
    groups: [
      { id: 'g6', name: 'Cricket Team', type: 'sports', memberCount: 35, lastMessage: 'Practice at 5PM today' },
      { id: 'g7', name: 'Basketball', type: 'sports', memberCount: 28, lastMessage: 'Inter-college tournament next week' },
    ],
  },
  {
    id: '4', name: 'Cultural', icon: '🎭',
    groups: [
      { id: 'g8', name: 'Music Club', type: 'cultural', memberCount: 45, lastMessage: 'Auditions for annual fest' },
      { id: 'g9', name: 'Drama Society', type: 'cultural', memberCount: 32, lastMessage: 'Rehearsal schedule updated' },
    ],
  },
  {
    id: '5', name: 'Hostel', icon: '🏠',
    groups: [
      { id: 'g10', name: 'Block A', type: 'hostel', memberCount: 90, lastMessage: 'Water supply issue resolved' },
      { id: 'g11', name: 'Mess Committee', type: 'hostel', memberCount: 15, lastMessage: 'New menu for next week' },
    ],
  },
];

const demoMessages = [
  { id: '1', sender: 'Ankit Kumar', content: 'Hey everyone! The placement drive for Google is confirmed for next month 🎉', time: '10:32 AM', avatar: 'A' },
  { id: '2', sender: 'Priya Sharma', content: 'That\'s amazing! What are the eligibility criteria?', time: '10:34 AM', avatar: 'P' },
  { id: '3', sender: 'Rahul Verma', content: 'CGPA above 7.5 and no active backlogs. They\'re looking for CSE, IT, and ECE branches.', time: '10:36 AM', avatar: 'R' },
  { id: '4', sender: 'Sneha Patel', content: 'I\'ve been preparing DSA for two months now. Any specific topics to focus on?', time: '10:38 AM', avatar: 'S' },
  { id: '5', sender: 'Ankit Kumar', content: 'Focus on graphs, dynamic programming, and system design basics. Here are some resources I found helpful...', time: '10:40 AM', avatar: 'A' },
  { id: '6', sender: 'Dr. Mehta', content: '📢 ANNOUNCEMENT: Pre-placement talk by Google will be held this Friday at 3 PM in the auditorium. Attendance is mandatory for eligible students.', time: '10:45 AM', avatar: 'D', isAnnouncement: true },
];

export default function CommunicatePage() {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['1', '2']));
  const [selectedGroup, setSelectedGroup] = useState<string>('g4');
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectedGroupData = demoFolders
    .flatMap(f => f.groups)
    .find(g => g.id === selectedGroup);

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-120px)] flex gap-4">
      {/* Left: Folder Tree */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-72 flex-shrink-0 glass flex flex-col"
      >
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <FolderOpen size={16} className="text-sky-400" /> Folders
            </h2>
            <button className="btn-icon w-7 h-7" title="New Folder">
              <Plus size={14} />
            </button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input text-xs py-1.5 pl-8"
              style={{ background: 'rgba(15, 23, 42, 0.3)', fontSize: '0.75rem' }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
          {demoFolders.map(folder => (
            <div key={folder.id}>
              <button
                onClick={() => toggleFolder(folder.id)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors"
              >
                {expandedFolders.has(folder.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span>{folder.icon}</span>
                <span className="flex-1 text-left">{folder.name}</span>
                <span className="text-xs text-gray-500">{folder.groups.length}</span>
              </button>

              {expandedFolders.has(folder.id) && (
                <div className="ml-6 space-y-0.5">
                  {folder.groups
                    .filter(g => !searchQuery || g.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(group => (
                    <button
                      key={group.id}
                      onClick={() => setSelectedGroup(group.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                        selectedGroup === group.id
                          ? 'bg-white/10 text-white'
                          : 'text-gray-400 hover:bg-white/5 hover:text-gray-300'
                      }`}
                    >
                      <Hash size={12} className="text-gray-500 flex-shrink-0" />
                      <span className="flex-1 text-left truncate">{group.name}</span>
                      <span className="text-gray-600">{group.memberCount}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Center: Chat */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 glass flex flex-col"
      >
        {/* Chat Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(56, 189, 248, 0.1)' }}>
              <Hash size={16} className="text-sky-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{selectedGroupData?.name || 'Select a group'}</h3>
              <p className="text-xs text-gray-500">{selectedGroupData?.memberCount || 0} members</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="e2e-badge">
              <Shield size={10} /> E2E Encrypted
            </div>
            <button className="btn-icon w-8 h-8" title="Pinned">
              <Pin size={14} />
            </button>
            <button className="btn-icon w-8 h-8" title="Members">
              <Users size={14} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
          {demoMessages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex gap-3 ${msg.isAnnouncement ? 'p-3 rounded-xl' : ''}`}
              style={msg.isAnnouncement ? { background: 'rgba(251, 191, 36, 0.05)', border: '1px solid rgba(251, 191, 36, 0.15)' } : {}}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: 'var(--gradient-primary)' }}>
                {msg.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-sm font-semibold">{msg.sender}</span>
                  {msg.isAnnouncement && (
                    <span className="badge badge-warning text-[10px] py-0.5">
                      <Megaphone size={10} /> Announcement
                    </span>
                  )}
                  <span className="text-xs text-gray-600">{msg.time}</span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{msg.content}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={messageInput}
              onChange={e => setMessageInput(e.target.value)}
              placeholder="Type an encrypted message..."
              className="input flex-1 py-2.5 text-sm"
              onKeyDown={e => e.key === 'Enter' && setMessageInput('')}
            />
            <button
              onClick={() => setMessageInput('')}
              className="btn-primary px-4 py-2.5 flex items-center gap-2"
            >
              <Send size={16} /> Send
            </button>
          </div>
          <p className="text-[10px] text-gray-600 mt-1.5 flex items-center gap-1">
            <Shield size={10} /> Messages are end-to-end encrypted. Only group members can read them.
          </p>
        </div>
      </motion.div>

      {/* Right: Group Info */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-64 flex-shrink-0 glass p-4 space-y-4"
      >
        <h3 className="text-sm font-semibold">Group Info</h3>

        <div className="space-y-3">
          <div className="p-3 rounded-xl" style={{ background: 'var(--surface)' }}>
            <p className="text-xs text-gray-400 mb-1">Type</p>
            <p className="text-sm capitalize badge badge-primary">{selectedGroupData?.type || 'general'}</p>
          </div>

          <div className="p-3 rounded-xl" style={{ background: 'var(--surface)' }}>
            <p className="text-xs text-gray-400 mb-1">Members</p>
            <p className="text-sm font-semibold">{selectedGroupData?.memberCount || 0}</p>
          </div>

          <div className="p-3 rounded-xl" style={{ background: 'var(--surface)' }}>
            <p className="text-xs text-gray-400 mb-1">Encryption</p>
            <div className="e2e-badge mt-1">
              <Shield size={10} /> AES-256-GCM
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-2 font-medium">Online Members</p>
          <div className="space-y-2">
            {['Ankit Kumar', 'Priya Sharma', 'Rahul Verma', 'Sneha Patel'].map((name, i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background: 'var(--gradient-primary)' }}>
                  {name[0]}
                </div>
                <span className="text-xs">{name}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
