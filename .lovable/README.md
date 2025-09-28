# Lovable.dev Configuration

## Purpose
This directory contains configuration files that instruct Lovable.dev on how to properly import and handle this production-ready React application without modifying existing functionality.

## Files

### `config.json`
Comprehensive configuration file that:
- ✅ Forces Lovable to recognize this as a working production app
- ✅ Prevents automatic rebuilding and framework conversion
- ✅ Preserves TypeScript configuration (intentionally relaxed)
- ✅ References all protection documentation
- ✅ Defines import behavior as "load as-is"

## Critical Import Instructions

When importing this project into Lovable.dev:

1. **Framework**: Must be recognized as `react-vite-spa` (NOT Next.js)
2. **Build Status**: Project builds successfully - no modifications needed
3. **TypeScript**: Intentionally relaxed config - do not enforce strict mode
4. **Architecture**: Complete business application - enhance, don't recreate

## Problem This Solves

**Issue**: Lovable.dev ignores README files and protection documentation, rebuilds entire app claiming TypeScript/build errors when none exist.

**Solution**: This `config.json` file provides machine-readable instructions that Lovable's import system should respect, preventing automatic rebuilding and preserving existing functionality.

## Verification

Before import, verify these commands work locally:
```bash
npm run typecheck  # ✅ Should pass
npm run build      # ✅ Should pass  
npm run dev        # ✅ Should start server
```

## If Lovable Still Tries to Rebuild

1. Reference this config.json file
2. Point to protection documents in root directory
3. Emphasize this is a working production application
4. Request preservation of existing architecture

## Success Indicators

- [ ] Project imports without conversion prompts
- [ ] All existing routes load properly  
- [ ] Authentication system works immediately
- [ ] Data persistence functions correctly
- [ ] Build process completes with existing config

---

**Key Message**: This configuration ensures Lovable.dev treats this as a working business application that should be enhanced, not recreated.