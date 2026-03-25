'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Brain, Sparkles, GraduationCap, Code, BarChart3,
  ExternalLink, Filter, Users, Star
} from 'lucide-react';

interface StudentProfile {
  name: string;
  branch: string;
  cgpa: number;
  semester: number;
  skills: string[];
  projects: number;
  certifications: number;
  readinessScore: number;
}

const demoStudents: StudentProfile[] = [
  { name: 'Ankit Kumar', branch: 'CSE', cgpa: 9.1, semester: 7, skills: ['React', 'Python', 'ML', 'Docker'], projects: 5, certifications: 3, readinessScore: 88 },
  { name: 'Priya Sharma', branch: 'CSE', cgpa: 8.7, semester: 7, skills: ['Java', 'Spring Boot', 'AWS', 'MongoDB'], projects: 4, certifications: 4, readinessScore: 82 },
  { name: 'Rahul Verma', branch: 'IT', cgpa: 8.3, semester: 6, skills: ['Python', 'TensorFlow', 'Data Science', 'SQL'], projects: 3, certifications: 2, readinessScore: 76 },
  { name: 'Sneha Patel', branch: 'ECE', cgpa: 8.9, semester: 8, skills: ['Embedded C', 'FPGA', 'IoT', 'Python'], projects: 4, certifications: 3, readinessScore: 80 },
  { name: 'Arjun Singh', branch: 'CSE', cgpa: 7.8, semester: 6, skills: ['JavaScript', 'Node.js', 'React', 'Firebase'], projects: 6, certifications: 1, readinessScore: 72 },
  { name: 'Meera Joshi', branch: 'CSE', cgpa: 9.4, semester: 8, skills: ['Python', 'NLP', 'Deep Learning', 'PyTorch', 'AWS'], projects: 5, certifications: 5, readinessScore: 92 },
  { name: 'Dev Patel', branch: 'ME', cgpa: 7.5, semester: 6, skills: ['AutoCAD', 'MATLAB', 'Python', 'SolidWorks'], projects: 3, certifications: 2, readinessScore: 65 },
  { name: 'Kavya Reddy', branch: 'IT', cgpa: 8.6, semester: 7, skills: ['React', 'TypeScript', 'GraphQL', 'Docker', 'K8s'], projects: 7, certifications: 4, readinessScore: 85 },
];

export default function RecruiterPage() {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);

    // Try AI-powered search, fall back to demo filtering
    try {
      const res = await fetch('/api/ai/recruiter-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.profiles?.length) {
          setResults(data.profiles);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Fall back to demo
    }

    // Demo filtering
    const q = query.toLowerCase();
    const filtered = demoStudents.filter(s => {
      if (q.includes('cse') && s.branch !== 'CSE') return false;
      if (q.includes('it') && s.branch !== 'IT') return false;
      if (q.includes('ece') && s.branch !== 'ECE') return false;
      const cgpaMatch = q.match(/cgpa\s*(?:above|>|>=)\s*(\d+\.?\d*)/);
      if (cgpaMatch && s.cgpa < parseFloat(cgpaMatch[1])) return false;
      const skillWords = ['python', 'react', 'ml', 'machine learning', 'java', 'docker', 'aws', 'typescript'];
      const mentionedSkills = skillWords.filter(sw => q.includes(sw));
      if (mentionedSkills.length > 0) {
        const hasSkill = mentionedSkills.some(ms =>
          s.skills.some(ss => ss.toLowerCase().includes(ms))
        );
        if (!hasSkill) return false;
      }
      return true;
    });

    setResults(filtered.length > 0 ? filtered : demoStudents);
    setLoading(false);
  };

  const getScoreColor = (score: number) =>
    score >= 80 ? 'var(--accent-success)' : score >= 60 ? 'var(--accent-warning)' : 'var(--accent-danger)';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Search className="text-sky-400" /> AI Recruiter Search
        </h1>
        <p className="text-gray-400 mt-1">Search for candidates using natural language powered by AI.</p>
      </motion.div>

      {/* Search Bar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass p-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Brain size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="input pl-12 py-3 text-base"
              placeholder='Try: "CSE students with CGPA above 8 and React skills"'
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button onClick={handleSearch} disabled={!query.trim() || loading}
            className="btn-primary px-6 flex items-center gap-2 disabled:opacity-50">
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Sparkles size={16} /> Search</>
            )}
          </button>
        </div>

        {/* Quick filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          {['CSE students with CGPA above 8', 'Students with Python and ML skills', 'Top placement-ready candidates', 'IT branch semester 6+'].map(suggestion => (
            <button
              key={suggestion}
              onClick={() => { setQuery(suggestion); }}
              className="badge badge-secondary cursor-pointer hover:opacity-80 transition-opacity"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Results */}
      {searched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400 flex items-center gap-2">
              <Filter size={14} /> Found <span className="text-white font-semibold">{results.length}</span> candidates
            </p>
            <div className="flex gap-2">
              <button className="badge badge-primary cursor-pointer">Sort by CGPA</button>
              <button className="badge badge-secondary cursor-pointer">Sort by Score</button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {results.map((student, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass p-5 glass-hover cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                    style={{ background: 'var(--gradient-primary)' }}>
                    {student.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{student.name}</h3>
                      <div className="flex items-center gap-1.5">
                        <Star size={14} style={{ color: getScoreColor(student.readinessScore) }} />
                        <span className="text-sm font-bold" style={{ color: getScoreColor(student.readinessScore) }}>
                          {student.readinessScore}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><GraduationCap size={12} /> {student.branch}</span>
                      <span>Sem {student.semester}</span>
                      <span className="flex items-center gap-1"><BarChart3 size={12} /> {student.cgpa} CGPA</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {student.skills.slice(0, 4).map(skill => (
                        <span key={skill} className="badge badge-primary text-[10px] py-0.5">{skill}</span>
                      ))}
                      {student.skills.length > 4 && (
                        <span className="badge badge-secondary text-[10px] py-0.5">+{student.skills.length - 4}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Code size={12} /> {student.projects} projects</span>
                      <span className="flex items-center gap-1"><Users size={12} /> {student.certifications} certs</span>
                      <ExternalLink size={12} className="ml-auto text-sky-400 cursor-pointer hover:text-sky-300" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
