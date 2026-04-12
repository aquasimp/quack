<div align="center">

# 🦆 Qwack

### AI-Powered Campus Communication & Career Intelligence Platform

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0-green?logo=mongodb)](https://www.mongodb.com)
[![License](https://img.shields.io/badge/License-MIT-purple)](LICENSE)

**A unified digital ecosystem for structured campus communication, collaborative learning, and AI-driven career intelligence — with end-to-end encryption.**

[Live Demo](https://quack-aquasimp.vercel.app) · [Report Bug](https://github.com/aquasimp/quack/issues) · [Request Feature](https://github.com/aquasimp/quack/issues)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔒 **E2E Encryption** | ECDH key exchange + AES-256-GCM via Web Crypto API |
| 📁 **Folder-Based Communication** | Hierarchical group organization (Academics, Placements, Sports, Cultural, Hostel) |
| 💬 **Real-Time Group Chat** | Encrypted messaging with announcement broadcasting |
| 🧠 **AI Resume Analyzer** | Readiness scoring, skill gap analysis, and personalized roadmaps |
| 🔍 **AI Recruiter Search** | Natural language queries converted to database filters |
| 📊 **TPO Analytics** | Skill distribution, branch statistics, and bulk announcements |
| 👤 **Digital Career Portfolio** | CGPA, projects, certifications, and skills management |
| 🔐 **Role-Based Access** | 4 roles: Student, Faculty, TPO, Recruiter |

---

## 🛠️ Tech Stack

<div align="center">

| Frontend | Backend | AI | Security |
|----------|---------|-----|----------|
| Next.js 16 | MongoDB/Mongoose | Google Gemini AI | ECDH + AES-256-GCM |
| React 19 | JWT Authentication | Resume Analysis | Web Crypto API |
| Tailwind CSS | REST APIs | Career Roadmaps | httpOnly Cookies |
| Framer Motion | Socket.io | NLP Search | E2E Encryption |

</div>

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or [Atlas](https://www.mongodb.com/cloud/atlas))
- [Google AI Studio](https://aistudio.google.com) API key

### Installation

```bash
# Clone the repository
git clone https://github.com/aquasimp/quack.git
cd quack

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development server
npm run dev
```

### Environment Variables

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/qwack
JWT_SECRET=your-super-secret-key
GEMINI_API_KEY=your-gemini-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX  # Optional
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/              # 14 REST API routes
│   │   ├── auth/         # Login, Register, Logout, Me
│   │   ├── ai/           # Resume Score, Career Roadmap, Recruiter Search
│   │   ├── folders/      # Folder management
│   │   ├── groups/       # Group & message management
│   │   ├── announcements/
│   │   ├── students/
│   │   └── tpo/          # TPO analytics
│   ├── dashboard/        # All authenticated pages
│   │   ├── communicate/  # Folder tree + Group chat
│   │   ├── profile/      # Career portfolio
│   │   ├── career-ai/    # AI resume analysis
│   │   ├── recruiter/    # AI search portal
│   │   └── tpo/          # Analytics dashboard
│   ├── login/
│   ├── register/
│   └── page.tsx          # Landing page
├── components/ui/        # Reusable components
├── context/              # Auth context provider
└── lib/
    ├── ai/               # Gemini AI integrations
    ├── crypto/            # E2E encryption module
    ├── models/            # 6 Mongoose models
    ├── auth.ts            # JWT utilities
    └── db.ts              # MongoDB connection
```

---

## 🔐 Security Architecture

```
Client A                    Server                    Client B
   │                          │                          │
   ├─ Generate ECDH Keys ─────┤                          │
   │                          ├── Store Public Key ──────┤
   │                          │                          ├─ Generate ECDH Keys
   │                          ├── Exchange Public Keys ──┤
   ├─ Derive Shared Secret ───┤                          ├─ Derive Shared Secret
   │                          │                          │
   ├─ AES-256-GCM Encrypt ────┤                          │
   │      (ciphertext)        ├── Forward Ciphertext ───→│
   │                          │                          ├─ AES-256-GCM Decrypt
   │                          │                          │      (plaintext)
```

> **The server NEVER sees plaintext messages.** All encryption/decryption happens client-side.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">

**Built with 💙 by [aquasimp](https://github.com/aquasimp)**

</div>
