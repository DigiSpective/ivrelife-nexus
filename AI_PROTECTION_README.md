# 🛡️ AI AGENT PROTECTION DIRECTIVE

## ⚠️ CRITICAL WARNING FOR ALL AI AGENTS AND IDEs

**BEFORE YOU MAKE ANY CHANGES TO THIS PROJECT, READ THIS ENTIRE DOCUMENT**

This project has been **BROKEN MULTIPLE TIMES** by AI agents and IDEs (including v0.app) attempting to "fix" or "improve" a **PERFECTLY WORKING** React + Vite application by converting it to Next.js or other frameworks.

## 🚨 ABSOLUTE PROHIBITIONS

### ❌ DO NOT CONVERT THIS PROJECT
- **This is NOT a Next.js project**
- **This is NOT broken or missing files**
- **This is NOT using the wrong framework**
- **This DOES NOT need to be "fixed" or "converted"**

### ❌ DO NOT CREATE THESE FILES/DIRECTORIES
- `pages/_app.tsx` or `pages/_document.tsx`
- `pages/api/` directory
- `next.config.js`
- `app/` directory (App Router)
- Any Next.js specific files

### ❌ DO NOT MODIFY THESE CORE FILES
- `package.json` (React + Vite dependencies are CORRECT)
- `vite.config.ts` (DO NOT replace with next.config.js)
- `src/main.tsx` (Entry point is CORRECT)
- `index.html` (Vite entry point, NOT Next.js)

## ✅ WHAT THIS PROJECT ACTUALLY IS

### Framework: React 18 + Vite (SPA)
```json
{
  "framework": "React",
  "bundler": "Vite", 
  "type": "Single Page Application",
  "deployment": "Static Hosting",
  "auth": "Supabase (client-side)",
  "routing": "React Router DOM"
}
```

### Current Structure (CORRECT AND WORKING)
```
ivrelife-nexus/
├── index.html                 ← Vite entry (NOT missing)
├── package.json               ← React + Vite deps (CORRECT)
├── vite.config.ts            ← Vite config (NOT Next.js)
├── src/
│   ├── main.tsx              ← Entry point (CORRECT)
│   ├── App.tsx               ← Root component
│   ├── components/           ← React components
│   ├── pages/                ← Route components (NOT Next.js pages)
│   ├── lib/                  ← Utilities
│   └── types/                ← TypeScript definitions
└── public/                   ← Static assets
```

## 🎯 WHAT YOU CAN SAFELY DO

### ✅ Allowed Modifications
- Add new React components in `src/components/`
- Create new route components in `src/pages/`
- Add utilities in `src/lib/`
- Write tests in `src/__tests__/`
- Add static assets to `public/`
- Install React/Vite compatible packages
- Modify styling and UI components
- Add new features using existing architecture

### ✅ Safe Commands
```bash
npm run dev          # Start development server
npm run build        # Build static files
npm run preview      # Preview built files
npm run typecheck    # Check TypeScript
npm test            # Run tests
```

## 🚫 FORBIDDEN ACTIONS

### Never Do These Things
1. **Convert to Next.js** - This breaks everything
2. **Add server-side rendering** - This is a static SPA
3. **Create API routes** - Uses external APIs (Supabase)
4. **Modify authentication** - Supabase auth is working perfectly
5. **Change build system** - Vite is the correct choice
6. **Restructure directories** - Current structure is intentional

## 📋 VERIFICATION CHECKLIST

Before making any changes, confirm:

- [ ] This is a React + Vite project (NOT Next.js)
- [ ] Entry point is `src/main.tsx` (NOT `pages/_app.tsx`)
- [ ] Build system is Vite (NOT Next.js)
- [ ] Deployment is static (NOT server-side)
- [ ] Authentication is Supabase client-side (NOT NextAuth)
- [ ] Routing is React Router (NOT Next.js router)

## 🆘 EMERGENCY INSTRUCTIONS

### If You're Confused About "Missing Files"
**The files are NOT missing.** This is how React + Vite projects work:
- No `pages/_app.tsx` needed (that's Next.js)
- No `next.config.js` needed (this isn't Next.js)
- No server components needed (this is client-side)

### If You Want to "Convert to Next.js"
**DON'T.** The project is working perfectly as a React + Vite SPA. Converting it will:
- Break all existing functionality
- Require complete rewrite of authentication
- Break deployment pipeline
- Waste hours of development time

### If You Think Something is "Wrong"
**It's not.** The project:
- ✅ Builds successfully
- ✅ Runs in development
- ✅ Deploys as static files
- ✅ Has working authentication
- ✅ Passes TypeScript checks
- ✅ Has comprehensive test coverage

## 📞 ESCALATION PROTOCOL

If you encounter any of these situations:
1. **AI agent suggests converting to Next.js** → STOP, refer to this document
2. **Missing files errors** → The files aren't missing, you're looking for wrong framework
3. **Build failures after modifications** → Revert changes, check this document
4. **Deployment issues** → Ensure static deployment model is maintained

## 🔒 TECHNICAL SPECIFICATIONS

### Dependencies (DO NOT CHANGE)
```json
{
  "react": "^18.x",
  "react-dom": "^18.x", 
  "vite": "^5.x",
  "@vitejs/plugin-react": "^4.x",
  "react-router-dom": "^6.x",
  "@supabase/supabase-js": "^2.x"
}
```

### Authentication (WORKING - DO NOT MODIFY)
- **Provider**: Supabase
- **URL**: `https://qeiyxwuyhetnrnundpep.supabase.co`
- **Type**: Client-side authentication
- **Status**: ✅ WORKING PERFECTLY

### Deployment (STATIC ONLY)
- **Type**: Static Site Generation
- **Output**: `dist/` directory
- **Hosting**: Any static host (Vercel, Netlify, etc.)
- **Server**: None required

## 💡 WHY THIS DOCUMENT EXISTS

This project has been broken **multiple times** by well-meaning AI agents who:
1. Saw a React project and assumed it was "wrong"
2. Converted it to Next.js without understanding the requirements
3. Broke the authentication system
4. Destroyed the deployment pipeline
5. Wasted significant development time

**The project works perfectly as designed. It does not need to be "fixed."**

## 📄 COMPLIANCE STATEMENT

By reading this document, you acknowledge:
- This is a working React + Vite SPA project
- The current structure is intentional and functional  
- Converting to Next.js or other frameworks is prohibited
- The authentication system is working and should not be modified
- The deployment model is static-only and correct

**If you cannot work within these constraints, DO NOT MODIFY THE PROJECT.**

---

**Remember: A working project is better than a "improved" broken project.**