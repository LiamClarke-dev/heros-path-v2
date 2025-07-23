# Git Workflow & Branch Management

**Last Updated:** 14 July 2025  
**Project:** Hero's Path React Native/Expo App  

---

## **Branch Naming Conventions**

### **Standard Branch Types**

| Branch Type | Prefix | Example | Description |
|-------------|--------|---------|-------------|
| **Feature** | `feature/` | `feature/user-profiles` | New features or enhancements |
| **Bug Fix** | `fix/` | `fix/oauth-redirect` | Bug fixes and patches |
| **Hotfix** | `hotfix/` | `hotfix/critical-crash` | Urgent production fixes |
| **Release** | `release/` | `release/v1.2.0` | Release preparation |
| **Refactor** | `refactor/` | `refactor/auth-system` | Code refactoring |
| **Documentation** | `docs/` | `docs/api-documentation` | Documentation updates |
| **Testing** | `test/` | `test/unit-tests` | Test-related changes |

### **Branch Naming Rules**

1. **Use lowercase letters and hyphens**
   - ✅ `feature/user-profile-management`
   - ❌ `feature/UserProfileManagement`
   - ❌ `feature/user_profile_management`

2. **Be descriptive but concise**
   - ✅ `feature/email-authentication`
   - ❌ `feature/email-auth-and-password-reset-with-email-verification`

3. **Include ticket/issue numbers when applicable**
   - ✅ `feature/123-user-profile-avatar`
   - ✅ `fix/456-oauth-redirect-bug`

4. **Avoid special characters**
   - ✅ `feature/map-styles`
   - ❌ `feature/map-styles!@#`

---

## **Git Workflow**

### **1. Starting New Work**

```bash
# Always start from main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ... edit files ...

# Commit with descriptive messages
git add .
git commit -m "feat: add user profile management

- Add user profile creation and editing
- Implement avatar upload functionality
- Add profile validation and error handling"
```

### **2. Commit Message Format**

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**
```bash
git commit -m "feat(auth): add Google OAuth integration"
git commit -m "fix(maps): resolve location permission issue"
git commit -m "docs(readme): update installation instructions"
git commit -m "refactor(services): extract API client logic"
```

### **3. Pushing and Creating Pull Requests**

```bash
# Push your branch
git push origin feature/your-feature-name

# Create Pull Request on GitHub
# - Go to GitHub repository
# - Click "Compare & pull request"
# - Fill in PR description
# - Request reviews
```

### **4. PR Description Template**

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Manual testing completed
- [ ] No console errors

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or breaking changes documented)
```

### **5. Merging and Cleanup**

```bash
# After PR is approved and merged
git checkout main
git pull origin main

# Delete local feature branch
git branch -d feature/your-feature-name

# Delete remote feature branch (if not auto-deleted)
git push origin --delete feature/your-feature-name
```

---

## **Branch Protection Rules**

### **Main Branch Protection**

The `main` branch is protected with the following rules:

- ✅ **Require pull request reviews before merging**
- ✅ **Require at least 1 approving review**
- ✅ **Dismiss stale PR approvals when new commits are pushed**
- ✅ **Require status checks to pass before merging**
- ✅ **Require branches to be up to date before merging**
- ✅ **Restrict pushes that create files larger than 100MB**
- ✅ **Do not allow bypassing the above settings**

### **Protected Branches**

| Branch | Protection Level | Description |
|--------|------------------|-------------|
| `main` | Full Protection | Production branch, requires PR reviews |
| `develop` | Partial Protection | Development branch (if created) |
| `release/*` | Partial Protection | Release branches |

---

## **Automated Branch Cleanup**

### **Scheduled Cleanup**

- **Frequency:** Every Sunday at 2 AM UTC
- **Action:** Automatically deletes merged and stale branches
- **Stale Threshold:** 30 days of inactivity

### **Manual Cleanup**

```bash
# Run cleanup script
./scripts/cleanup-branches.sh

# Dry run (preview what would be deleted)
./scripts/cleanup-branches.sh --dry-run

# Custom stale threshold
./scripts/cleanup-branches.sh --stale-days=7
```

### **GitHub Actions Workflow**

The cleanup workflow (`/.github/workflows/cleanup-branches.yml`) can be triggered:

1. **Automatically:** Every Sunday at 2 AM UTC
2. **Manually:** Via GitHub Actions tab with custom parameters

---

## **Best Practices**

### **Do's**

- ✅ Always create feature branches from `main`
- ✅ Use descriptive branch names
- ✅ Write clear commit messages
- ✅ Keep branches small and focused
- ✅ Update your branch regularly with `main`
- ✅ Delete branches after merging
- ✅ Use conventional commit format
- ✅ Request code reviews for all changes

### **Don'ts**

- ❌ Don't commit directly to `main`
- ❌ Don't use generic branch names like `fix` or `update`
- ❌ Don't leave branches open for months
- ❌ Don't force push to shared branches
- ❌ Don't commit large files (>100MB)
- ❌ Don't merge without code review
- ❌ Don't commit debug code or console logs

---

## **Emergency Procedures**

### **Hotfix Process**

```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-issue

# Make urgent fix
# ... edit files ...

# Commit and push
git add .
git commit -m "hotfix: fix critical authentication bug"
git push origin hotfix/critical-issue

# Create PR and merge immediately after review
# Delete hotfix branch after merge
```

### **Reverting Changes**

```bash
# Revert last commit
git revert HEAD

# Revert specific commit
git revert <commit-hash>

# Revert merge commit
git revert -m 1 <merge-commit-hash>
```

---

## **Troubleshooting**

### **Common Issues**

**Can't push to main:**
- Create a feature branch instead
- Follow the PR workflow

**Branch conflicts:**
```bash
git checkout main
git pull origin main
git checkout your-branch
git rebase main
# Resolve conflicts, then continue
git rebase --continue
```

**Accidentally committed to main:**
```bash
# Create new branch with your changes
git checkout -b feature/save-changes
git checkout main
git reset --hard HEAD~1
git push origin main --force  # Only if you're sure!
```

**Lost local changes:**
```bash
# Check git reflog
git reflog

# Recover from specific commit
git checkout <commit-hash>
git checkout -b recovery-branch
```

---

## **Tools and Scripts**

### **Available Scripts**

- `scripts/cleanup-branches.sh` - Branch cleanup utility
- `scripts/setup-branch-protection.md` - Branch protection setup guide

### **Useful Git Aliases**

Add these to your `~/.gitconfig`:

```ini
[alias]
    st = status
    co = checkout
    br = branch
    ci = commit
    unstage = reset HEAD --
    last = log -1 HEAD
    visual = !gitk
    lg = log --oneline --graph --decorate
    cleanup = !git branch --merged | grep -v \"\\*\" | xargs -n 1 git branch -d
```

---

**Next Steps:**
1. Set up branch protection rules using the guide in `scripts/setup-branch-protection.md`
2. Test the cleanup script with `--dry-run` flag
3. Configure GitHub Actions for automated cleanup
4. Share this workflow with your team