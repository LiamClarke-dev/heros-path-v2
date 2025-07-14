# Git Automation Setup Guide

This directory contains scripts and tools for automating git workflow and branch management.

## **Quick Setup (5 minutes)**

### **1. Set Up Branch Protection (Required)**

Follow the step-by-step guide in `setup-branch-protection.md` to protect your `main` branch:

```bash
# Read the setup guide
cat scripts/setup-branch-protection.md
```

**What this does:**
- Prevents direct pushes to `main`
- Requires pull request reviews
- Enforces code quality standards

### **2. Test the Cleanup Script**

```bash
# Test what the script would do (safe)
./scripts/cleanup-branches.sh --dry-run

# Run actual cleanup (after reviewing)
./scripts/cleanup-branches.sh
```

**What this does:**
- Deletes merged feature branches
- Identifies stale branches
- Keeps repository organized

### **3. Enable GitHub Actions (Optional)**

The GitHub Actions workflow will automatically run every Sunday at 2 AM UTC. To enable:

1. Go to your GitHub repository
2. Click **Actions** tab
3. The workflow should be automatically detected
4. Click **Enable workflow**

## **Available Tools**

| Tool | Purpose | Usage |
|------|---------|-------|
| `cleanup-branches.sh` | Branch cleanup utility | `./scripts/cleanup-branches.sh --dry-run` |
| `setup-branch-protection.md` | Branch protection guide | Follow the instructions in the file |
| `.github/workflows/cleanup-branches.yml` | Automated cleanup | Runs weekly via GitHub Actions |

## **Workflow Integration**

### **For New Features:**

```bash
# 1. Create feature branch
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# 2. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 3. Push and create PR
git push origin feature/your-feature-name

# 4. After PR is merged, cleanup is automatic
```

### **For Regular Maintenance:**

```bash
# Weekly cleanup (automatic via GitHub Actions)
# Or manual cleanup:
./scripts/cleanup-branches.sh

# Check for stale branches
./scripts/cleanup-branches.sh --stale-days=7
```

## **Configuration Options**

### **Environment Variables:**

```bash
# Dry run mode
DRY_RUN=true ./scripts/cleanup-branches.sh

# Custom stale threshold
STALE_DAYS=7 ./scripts/cleanup-branches.sh
```

### **Command Line Options:**

```bash
# Show help
./scripts/cleanup-branches.sh --help

# Dry run
./scripts/cleanup-branches.sh --dry-run

# Custom stale days
./scripts/cleanup-branches.sh --stale-days=14
```

## **Troubleshooting**

### **Script won't run:**
```bash
# Make executable
chmod +x scripts/cleanup-branches.sh
```

### **Permission denied:**
```bash
# Check if you have write access to the repository
git push origin main --dry-run
```

### **GitHub Actions not working:**
1. Check repository permissions
2. Ensure workflow file is in `.github/workflows/`
3. Check Actions tab for error messages

## **Next Steps**

1. **Set up branch protection** (most important)
2. **Test the cleanup script** with `--dry-run`
3. **Enable GitHub Actions** for automation
4. **Share the workflow** with your team
5. **Read the full documentation** in `docs/GIT_WORKFLOW.md`

## **Support**

If you encounter issues:

1. Check the troubleshooting section in `docs/GIT_WORKFLOW.md`
2. Review the script output for error messages
3. Ensure you have the necessary repository permissions
4. Check GitHub Actions logs for automation issues

---

**Remember:** These tools are designed to make your git workflow more efficient and maintainable. Start with branch protection, then gradually adopt the automation features as your team becomes comfortable with them.