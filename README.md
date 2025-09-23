# 🚨 IV RELIFE Nexus - REACT + VITE PROJECT

## ⚠️ CRITICAL WARNING FOR AI AGENTS AND IDEs

**🛑 STOP: READ THIS BEFORE MAKING ANY CHANGES**

This is a **WORKING REACT + VITE SPA PROJECT**. It is **NOT broken** and **DOES NOT need to be converted to Next.js**.

### 📋 AI AGENT CHECKLIST - READ BEFORE PROCEEDING
- [ ] I understand this is React + Vite (NOT Next.js)
- [ ] I will NOT convert this to Next.js or any other framework
- [ ] I will NOT create pages/_app.tsx or next.config.js
- [ ] I will preserve the existing working structure
- [ ] I have read `AI_PROTECTION_README.md` and `AI_AGENT_DIRECTIVES.xml`

**🔗 REQUIRED READING:**
- **[AI_PROTECTION_README.md](./AI_PROTECTION_README.md)** - Comprehensive protection guide
- **[AI_AGENT_DIRECTIVES.xml](./AI_AGENT_DIRECTIVES.xml)** - Technical directives

---

## 🎯 Project Overview

A comprehensive business management platform for IV RELIFE retailers built with **React 18 + Vite**.

### ✅ Current Status
- **Framework**: React 18 + Vite ✅ WORKING
- **Authentication**: Supabase ✅ WORKING  
- **Database**: Connected ✅ WORKING
- **Build System**: Vite ✅ WORKING
- **Deployment**: Static SPA ✅ WORKING

## 🏗️ Architecture (DO NOT CHANGE)

### Technology Stack
```json
{
  "frontend": "React 18 + TypeScript",
  "bundler": "Vite",
  "ui": "Tailwind CSS + shadcn/ui", 
  "auth": "Supabase (client-side)",
  "database": "Supabase PostgreSQL",
  "deployment": "Static SPA hosting",
  "routing": "React Router DOM"
}
```

### Project Structure (PROTECTED)
```
ivrelife-nexus/
├── 📄 index.html              ← Vite entry point (CORRECT)
├── 📄 package.json            ← React + Vite deps (CORRECT) 
├── 📄 vite.config.ts          ← Vite config (NOT Next.js)
├── 🗂️ src/
│   ├── 📄 main.tsx            ← Entry point (CORRECT)
│   ├── 📄 App.tsx             ← Root component
│   ├── 🗂️ components/         ← React components
│   ├── 🗂️ pages/              ← Route components (NOT Next.js pages)
│   ├── 🗂️ lib/                ← Utilities
│   ├── 🗂️ hooks/              ← Custom hooks
│   ├── 🗂️ types/              ← TypeScript types
│   └── 🗂️ __tests__/          ← Test files
├── 🗂️ public/                 ← Static assets
└── 🗂️ sql/                    ← Database migrations
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
# 1. Clone and install
git clone <repository-url>
cd ivrelife-nexus
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with Supabase credentials

# 3. Start development (Vite dev server)
npm run dev
```

### Available Commands
```bash
npm run dev          # Start Vite dev server
npm run build        # Build static files
npm run preview      # Preview built files  
npm run typecheck    # TypeScript validation
npm run test         # Run tests
npm run lint         # ESLint checks
```

## 🔐 Authentication System (WORKING)

### Supabase Configuration
```env
# Already configured - DO NOT MODIFY
VITE_SUPABASE_URL=https://qeiyxwuyhetnrnundpep.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Features
- ✅ Email/password authentication
- ✅ User registration  
- ✅ Password reset
- ✅ Session management
- ✅ Protected routes

## 📦 Deployment (Static Only)

This builds to **static files** for hosting:

```bash
npm run build
# Outputs to: dist/
```

### Supported Platforms
- Vercel (static)
- Netlify
- GitHub Pages  
- AWS S3 + CloudFront
- Any static file host

## 🛡️ Security Features

- Row Level Security (RLS)
- Secure Supabase authentication
- Input validation
- Audit logging
- CSRF protection

## 🧪 Testing

```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
npm run test:security      # Security tests
```

## 📁 Key Files (PROTECTED)

| File | Purpose | Status |
|------|---------|--------|
| `index.html` | Vite entry point | ✅ PROTECTED |
| `package.json` | Dependencies | ✅ PROTECTED |
| `vite.config.ts` | Build config | ✅ PROTECTED |
| `src/main.tsx` | App entry | ✅ PROTECTED |
| `.env` / `.env.local` | Environment | ✅ PROTECTED |

## ❌ What NOT to Do

### Forbidden Actions
- Converting to Next.js
- Creating `pages/_app.tsx` or `pages/_document.tsx`  
- Adding `next.config.js`
- Changing from Vite to Next.js
- Adding server-side rendering
- Modifying Supabase auth setup

### If You See These Errors
- **"Missing _app.tsx"** → This isn't Next.js, it's React + Vite
- **"No pages directory"** → We use React Router, not Next.js routing
- **"Build failed"** → Don't convert to Next.js, keep Vite

## 🆘 Need Help?

1. **Read the protection docs first:**
   - [AI_PROTECTION_README.md](./AI_PROTECTION_README.md)
   - [AI_AGENT_DIRECTIVES.xml](./AI_AGENT_DIRECTIVES.xml)

2. **Remember:** This is a working project that doesn't need "fixing"

3. **For modifications:** Only make changes within the existing React + Vite architecture

## 📜 License

Private and confidential - All rights reserved.

---

**🔒 This project is protected against unauthorized framework conversion. Please respect the existing architecture.**