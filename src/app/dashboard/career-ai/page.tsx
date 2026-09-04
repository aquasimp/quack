'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain, Upload, FileText, Target, AlertTriangle,
  CheckCircle, ArrowRight, Sparkles, BarChart3, Clock
} from 'lucide-react';

interface AnalysisResult {
  readinessScore: number;
  identifiedSkills: string[];
  missingCompetencies: string[];
  strengths: string[];
  weaknesses: string[];
  roadmap: { phase: string; duration: string; tasks: string[] }[];
  summary: string;
}

export default function CareerAIPage() {
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // Demo result for display
  const demoResult: AnalysisResult = {
    readinessScore: 72,
    identifiedSkills: ['React', 'JavaScript', 'Python', 'Node.js', 'MongoDB', 'Git', 'REST APIs'],
    missingCompetencies: ['System Design', 'TypeScript', 'Cloud Services (AWS/GCP)', 'CI/CD Pipelines', 'Data Structures (Advanced)'],
    strengths: ['Strong web development foundation', 'Multiple project experiences', 'Good communication skills'],
    weaknesses: ['Limited cloud experience', 'No competitive programming background', 'Missing system design knowledge'],
    roadmap: [
      { phase: 'Foundation Strengthening', duration: '2-3 weeks', tasks: ['Complete advanced DSA course', 'Practice 50 LeetCode medium problems', 'Learn TypeScript fundamentals'] },
      { phase: 'Cloud & DevOps', duration: '3-4 weeks', tasks: ['AWS Cloud Practitioner certification', 'Set up CI/CD pipeline on a project', 'Learn Docker & Kubernetes basics'] },
      { phase: 'System Design', duration: '2-3 weeks', tasks: ['Study system design patterns', 'Design 5 real-world systems', 'Read "Designing Data-Intensive Applications"'] },
      { phase: 'Interview Prep', duration: '2 weeks', tasks: ['Mock interviews (technical + HR)', 'Build portfolio website', 'Practice behavioral questions with STAR method'] },
    ],
    summary: 'You have a solid foundation in web development with good project experience. Focus on system design, cloud services, and advanced DSA to become placement-ready for top tier companies.',
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    // Try real API, fall back to demo
    try {
      const res = await fetch('/api/ai/resume-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, targetRole }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data.analysis);
      } else {
        setResult(demoResult);
      }
    } catch {
      setResult(demoResult);
    }
    setAnalyzing(false);
  };

  const displayResult = result || null;
  const scoreColor = displayResult
    ? displayResult.readinessScore >= 80 ? 'var(--accent-success)'
      : displayResult.readinessScore >= 60 ? 'var(--accent-warning)'
      : 'var(--accent-danger)'
    : 'var(--accent-primary)';

  const circumference = 2 * Math.PI * 60;
  const offset = displayResult ? circumference - (displayResult.readinessScore / 100) * circumference : circumference;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Brain className="text-violet-400" /> AI Career Intelligence
        </h1>
        <p className="text-gray-400 mt-1">Upload your resume for AI-powered analysis, readiness scoring, and personalized career roadmap.</p>
      </motion.div>

      {!displayResult ? (
        /* Upload Section */
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass p-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="border-2 border-dashed rounded-2xl p-10 text-center transition-colors hover:border-sky-400/30"
              style={{ borderColor: 'var(--border)' }}>
              <Upload size={40} className="mx-auto text-gray-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Upload Your Resume</h3>
              <p className="text-sm text-gray-400 mb-4">Paste your resume text below for AI analysis</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Resume Content</label>
              <textarea
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                className="input min-h-[200px] resize-y"
                placeholder="Paste your resume text here... Include education, skills, projects, experience, and certifications."
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Target Role (Optional)</label>
              <input
                type="text"
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                className="input"
                placeholder="e.g., Software Engineer, Data Scientist, Product Manager"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!resumeText.trim() || analyzing}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Sparkles size={18} /> Analyze Resume
                </>
              )}
            </button>
          </div>
        </motion.div>
      ) : (
        /* Results */
        <div className="space-y-6">
          {/* Score + Summary */}
          <div className="grid lg:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="glass p-6 flex flex-col items-center justify-center">
              <svg width="140" height="140" className="transform -rotate-90 mb-4">
                <circle cx="70" cy="70" r="60" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
                <circle
                  cx="70" cy="70" r="60"
                  stroke={scoreColor}
                  strokeWidth="8" fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                  style={{ filter: `drop-shadow(0 0 10px ${scoreColor})` }}
                />
              </svg>
              <p className="text-4xl font-black" style={{ color: scoreColor }}>{displayResult.readinessScore}</p>
              <p className="text-sm text-gray-400 mt-1">Placement Readiness Score</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="glass p-5 lg:col-span-2">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                <FileText size={18} className="text-sky-400" /> AI Summary
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed mb-4">{displayResult.summary}</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wider">Strengths</h4>
                  {displayResult.strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 mb-1.5">
                      <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{s}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wider">Areas to Improve</h4>
                  {displayResult.weaknesses.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 mb-1.5">
                      <AlertTriangle size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{w}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Skills Analysis */}
          <div className="grid lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="glass p-5">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Target size={18} className="text-sky-400" /> Identified Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {displayResult.identifiedSkills.map(skill => (
                  <span key={skill} className="badge badge-primary">{skill}</span>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="glass p-5">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <AlertTriangle size={18} className="text-yellow-400" /> Missing Competencies
              </h3>
              <div className="flex flex-wrap gap-2">
                {displayResult.missingCompetencies.map(comp => (
                  <span key={comp} className="badge badge-warning">{comp}</span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Roadmap */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass p-5">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
              <BarChart3 size={18} className="text-violet-400" /> Personalized Career Roadmap
            </h3>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5" style={{ background: 'var(--border)' }} />

              <div className="space-y-6">
                {displayResult.roadmap.map((phase, i) => (
                  <div key={i} className="relative flex gap-4 ml-0">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 z-10"
                      style={{ background: `rgba(56, 189, 248, ${0.1 + i * 0.05})` }}>
                      <span className="text-sm font-bold text-sky-400">{i + 1}</span>
                    </div>
                    <div className="glass-sm p-4 flex-1 glass-hover">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{phase.phase}</h4>
                        <span className="badge badge-secondary flex items-center gap-1">
                          <Clock size={10} /> {phase.duration}
                        </span>
                      </div>
                      <ul className="space-y-1.5">
                        {phase.tasks.map((task, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-gray-300">
                            <ArrowRight size={12} className="text-sky-400 mt-1 flex-shrink-0" />
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Reset */}
          <div className="text-center">
            <button onClick={() => { setResult(null); setResumeText(''); }}
              className="btn-ghost">
              ← Analyze Another Resume
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
