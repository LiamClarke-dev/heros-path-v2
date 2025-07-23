# 🚀 Onboarding & Handover Guide

Welcome to Hero's Path! This guide is for both new developers joining the project and anyone taking over or reviewing the current state. It combines onboarding, handover, and audit essentials for a fast, confident start.

---

## 🏁 Quick Start (30 minutes)

### 1. Environment Setup
- [ ] Clone the repository: `git clone [repo-url]`
- [ ] Navigate to project: `cd heros-path-fresh`
- [ ] Install dependencies: `npm install`
- [ ] Verify setup: `npx expo start --clear`

### 2. Documentation Review
- [ ] Read `README.md` – Project overview and current status
- [ ] Read `docs/DEVELOPMENT_STATUS.md` – Known issues and priorities
- [ ] Read `docs/AUDIT_PROGRESS.md` – Previous audit findings
- [ ] Read `docs/AUDIT_WORKFLOW_GUIDE.md` – Complete audit process

### 3. Project Status & Audit
- [ ] Check current branch: `git branch`
- [ ] Review recent commits: `git log --oneline -10`
- [ ] Check for uncommitted changes: `git status`

---

## 🔍 Current Status & Next Steps

### What We're Doing
- Systematic Code Audit of Hero's Path app
- **Current Phase:** All phases completed ✅
- **Next Task:** Address remaining identified issues and focus on iOS platform improvements

### What We've Fixed
- DiscoveriesScreen Navigation: Fixed journeyId parameter mismatch
- Filtering Functionality: Restored missing type and route filters
- Theme Integration: Added proper theme system integration
- Route Discovery Algorithm: SAR implementation is complete and working
- Documentation: Updated to reflect current implementation status
- Critical Colors Error: Fixed app startup crash due to top-level colors usage

### What's Broken / Critical Issues
- Apple Maps Fallback: Google Maps API key injection issue on iOS
- Link Sprite Rendering: Animated GIF appears white on iOS
- DEBUG_MODE: Should be false in Logger utility for production
- API key management: Standardize and remove hardcoded keys

### Immediate Next Steps
- Fix iOS platform issues (Apple Maps fallback, Link sprite rendering)
- Clean up production code (debug logging, API keys)
- Review and address any remaining audit findings

---

## 🛠️ Audit Process Summary
- **Why Audit?** Ensures you understand the codebase, identifies issues, and follows our quality process.
- **How:**
  1. Follow the workflow in `docs/AUDIT_WORKFLOW_GUIDE.md`
  2. Track progress in `docs/AUDIT_PROGRESS.md`
  3. Document findings using the [Audit Issue Template](HANDOVER_ISSUE_TEMPLATE.md)
  4. Prioritize and address critical issues first
- **Expected Timeline:** 6–9 hours for a full audit (see onboarding for breakdown)

---

## 📂 Essential Files & Structure
- `App.js` – Main app entry point
- `navigation/AppNavigator.js` – Navigation structure
- `styles/theme.js` – Theme system
- `services/` – API and data services
- `screens/` – Main app screens
- `components/` – Reusable UI components
- `config.js` – Environment variables
- `app.json` – Expo configuration
- `firebase.js` – Firebase setup

---

## ⚠️ Critical Issues to Watch
- **Navigation Parameter Mismatches:** Screen A passes `paramName` but Screen B expects `differentParamName`
- **Theme Integration Issues:** Hardcoded colors instead of theme colors; always use `useTheme()`
- **Service Integration Problems:** Missing service imports or incorrect function calls
- **API Keys:** Never hardcode, always use environment variables

---

## 🏃 Quick Commands
```bash
# Start development server
cd heros-path-fresh && npx expo start

# Check for navigation issues
grep -r "navigate.*Discoveries" screens/
grep -r "navigation.navigate" screens/

# Check theme usage
grep -r "useTheme" screens/
grep -r "Colors\." screens/
```

---

## ✅ Completion Checklist
- [ ] Environment is set up and working
- [ ] Documentation is reviewed and understood
- [ ] Code audit is completed
- [ ] Any critical issues are addressed
- [ ] You can build and run the app
- [ ] You understand the theme system
- [ ] You can navigate the codebase confidently

---

**For bug tracking and audit issues, use the [Audit Issue Template](HANDOVER_ISSUE_TEMPLATE.md).**

**Welcome to the team! 🎉** 