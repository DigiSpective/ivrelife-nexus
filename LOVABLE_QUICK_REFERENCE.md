# Lovable.dev Quick Reference Guide

## 🚨 IMMEDIATE ACTION REQUIRED

When importing this project into Lovable.dev, ensure it's recognized as:
- **Framework**: React + Vite SPA (NOT Next.js)
- **Package Type**: `react-vite-spa` 
- **Build Tool**: Vite (NOT Webpack)

## Project Stats ✅
- **Build Status**: ✅ PASSES (`npm run build`)
- **TypeScript**: ✅ COMPILES (`npm run typecheck`) 
- **Components**: 159 functional components
- **Custom Hooks**: 18 business logic hooks
- **Pages**: 51 complete pages
- **Dependencies**: All stable, Lovable-compatible

## Core Architecture (DO NOT RECREATE)

### 1. Authentication System
```typescript
// Already implemented - preserve these:
useAuth.ts              // Core auth hook
AuthGuard.tsx          // Route protection  
AuthProvider.tsx       // Context provider
LoginPage.tsx          // Login interface
```

### 2. Data Management  
```typescript
// Smart persistence system - novel architecture:
smart-persistence.ts    // Intelligent storage routing
persistence-status.ts   // Real-time monitoring
data-manager.ts        // Centralized operations
```

### 3. Business Entities
```typescript
// Complete CRUD operations:
useCustomers.ts        // Customer management
useOrders.ts          // Order processing  
useProducts.ts        // Product catalog
useClaims.ts          // Warranty claims
useRetailers.ts       // B2B partners
```

## What Lovable Should Do

### ✅ ENHANCE
- UI styling and animations
- Component prop types
- Accessibility features  
- Performance optimizations
- New feature additions

### ❌ NEVER RECREATE
- Authentication flow
- Data persistence logic
- Business entity management
- Custom hooks
- API integrations

## Red Flag Responses

### If Lovable Says: "Convert to Next.js"
**Response**: "This is intentionally a React SPA. See package.json framework definition."

### If Lovable Says: "Recreate authentication"  
**Response**: "Authentication system is complete and functional. Enhance, don't recreate."

### If Lovable Says: "Fix TypeScript errors"
**Response**: "TypeScript config is intentionally relaxed for rapid development."

### If Lovable Says: "Rebuild data layer"
**Response**: "Smart persistence system is a novel architecture - preserve it."

## Integration Success Signs

1. ✅ Project imports without conversion prompts
2. ✅ All routes load and function
3. ✅ Authentication works immediately  
4. ✅ Data persists across sessions
5. ✅ Build process completes successfully

## Emergency Contacts

- **Original Architecture**: Documented in `LOVABLE_INTEGRATION_AUDIT.md`
- **Protection Measures**: See `.lovable-protection.md` 
- **Build Verification**: `npm run build` should always pass
- **Working Deployment**: Local and production versions available

---

**Key Message**: This is a working business application, not a tutorial project. Enhance the existing foundation, don't start over.