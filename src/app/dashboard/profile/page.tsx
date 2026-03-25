'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, GraduationCap, Code, Award, Briefcase, ExternalLink,
  Edit3, Save, Github, Linkedin, BookOpen, Plus, X
} from 'lucide-react';

export default function ProfilePage() {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Demo Student',
    branch: 'Computer Science & Engineering',
    semester: 6,
    cgpa: 8.5,
    bio: 'Passionate about AI/ML and full-stack development. Always eager to learn new technologies.',
    skills: ['React', 'TypeScript', 'Python', 'Node.js', 'MongoDB', 'Machine Learning', 'Docker', 'Git'],
    projects: [
      { name: 'E-Commerce Platform', description: 'Full-stack e-commerce with payment integration', tech: ['React', 'Node.js', 'MongoDB'], link: '#' },
      { name: 'AI Chatbot', description: 'NLP-powered customer support chatbot', tech: ['Python', 'TensorFlow', 'Flask'], link: '#' },
      { name: 'Task Manager', description: 'Collaborative project management tool', tech: ['Next.js', 'PostgreSQL', 'Socket.io'], link: '#' },
    ],
    certifications: ['AWS Cloud Practitioner', 'Google ML Crash Course', 'Meta React Developer'],
    extracurriculars: ['Coding Club Lead', 'Hackathon Winner x3', 'Tech Event Organizer'],
    linkedin: 'linkedin.com/in/demo',
    github: 'github.com/demo',
    readinessScore: 78,
  });

  const [newSkill, setNewSkill] = useState('');

  const addSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setProfile(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const scoreColor = profile.readinessScore >= 80 ? 'var(--accent-success)' :
    profile.readinessScore >= 60 ? 'var(--accent-warning)' : 'var(--accent-danger)';

  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (profile.readinessScore / 100) * circumference;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 flex items-start gap-6"
      >
        <div className="relative">
          {/* Score Ring */}
          <svg width="100" height="100" className="transform -rotate-90">
            <circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="none" />
            <circle
              cx="50" cy="50" r="45"
              stroke={scoreColor}
              strokeWidth="6" fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000"
              style={{ filter: `drop-shadow(0 0 6px ${scoreColor})` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">{profile.readinessScore}</span>
            <span className="text-[10px] text-gray-400">Score</span>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{profile.name}</h1>
              <p className="text-gray-400 flex items-center gap-2 mt-1">
                <GraduationCap size={16} />
                {profile.branch} · Semester {profile.semester}
              </p>
              <p className="text-sm text-gray-500 mt-2">{profile.bio}</p>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className={`btn-ghost flex items-center gap-2 text-sm ${editing ? 'text-green-400 border-green-400/30' : ''}`}
            >
              {editing ? <><Save size={14} /> Save</> : <><Edit3 size={14} /> Edit</>}
            </button>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <div className="glass-sm px-4 py-2 text-center">
              <p className="text-xl font-bold text-gradient">{profile.cgpa}</p>
              <p className="text-xs text-gray-500">CGPA</p>
            </div>
            <div className="glass-sm px-4 py-2 text-center">
              <p className="text-xl font-bold text-gradient">{profile.projects.length}</p>
              <p className="text-xs text-gray-500">Projects</p>
            </div>
            <div className="glass-sm px-4 py-2 text-center">
              <p className="text-xl font-bold text-gradient">{profile.certifications.length}</p>
              <p className="text-xs text-gray-500">Certs</p>
            </div>
            <div className="flex gap-2 ml-auto">
              <a href="#" className="btn-icon w-9 h-9" title="LinkedIn">
                <Linkedin size={16} />
              </a>
              <a href="#" className="btn-icon w-9 h-9" title="GitHub">
                <Github size={16} />
              </a>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Skills */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass p-5">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Code size={18} className="text-sky-400" /> Technical Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map(skill => (
              <span key={skill} className="badge badge-primary relative group">
                {skill}
                {editing && (
                  <button onClick={() => removeSkill(skill)}
                    className="ml-1 text-red-400 hover:text-red-300">
                    <X size={10} />
                  </button>
                )}
              </span>
            ))}
            {editing && (
              <div className="flex items-center gap-1">
                <input
                  type="text" value={newSkill} onChange={e => setNewSkill(e.target.value)}
                  className="input py-1 px-2 text-xs w-24"
                  placeholder="Add skill"
                  onKeyDown={e => e.key === 'Enter' && addSkill()}
                />
                <button onClick={addSkill} className="btn-icon w-6 h-6"><Plus size={12} /></button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Certifications */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass p-5">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Award size={18} className="text-yellow-400" /> Certifications
          </h2>
          <div className="space-y-2">
            {profile.certifications.map((cert, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(251, 191, 36, 0.1)' }}>
                  <Award size={14} className="text-yellow-400" />
                </div>
                <span className="text-sm">{cert}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Projects */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Briefcase size={18} className="text-violet-400" /> Projects
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {profile.projects.map((project, i) => (
              <div key={i} className="glass-sm p-4 glass-hover">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm">{project.name}</h3>
                  <ExternalLink size={14} className="text-gray-500 hover:text-sky-400 cursor-pointer" />
                </div>
                <p className="text-xs text-gray-400 mb-3">{project.description}</p>
                <div className="flex flex-wrap gap-1">
                  {project.tech.map(t => (
                    <span key={t} className="badge badge-secondary text-[10px] py-0.5">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Extracurriculars */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="glass p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <BookOpen size={18} className="text-green-400" /> Extracurriculars
          </h2>
          <div className="flex flex-wrap gap-3">
            {profile.extracurriculars.map((activity, i) => (
              <span key={i} className="badge badge-success">{activity}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
