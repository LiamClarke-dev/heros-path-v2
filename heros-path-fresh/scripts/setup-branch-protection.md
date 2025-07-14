# Branch Protection Setup Guide

## **GitHub Branch Protection Configuration**

Follow these steps to protect your `main` branch and enforce code quality standards.

### **Step 1: Access Repository Settings**

1. Go to your GitHub repository: `https://github.com/LiamClarke-dev/heros-path-v2`
2. Click on **Settings** tab
3. In the left sidebar, click **Branches**

### **Step 2: Add Branch Protection Rule**

1. Click **Add rule** or **Add branch protection rule**
2. In the **Branch name pattern** field, enter: `main`
3. Check the following options:

#### **✅ Required Settings:**
- [ ] **Require a pull request before merging**
  - [ ] Require approvals: `1` (minimum)
  - [ ] Dismiss stale PR approvals when new commits are pushed
  - [ ] Require review from code owners (if you have a CODEOWNERS file)

- [ ] **Require status checks to pass before merging**
  - [ ] Require branches to be up to date before merging

- [ ] **Restrict pushes that create files larger than 100MB**

- [ ] **Do not allow bypassing the above settings**

#### **🔒 Security Settings:**
- [ ] **Restrict pushes that create files larger than 100MB**
- [ ] **Do not allow bypassing the above settings**

#### **📝 Optional but Recommended:**
- [ ] **Require conversation resolution before merging**
- [ ] **Require signed commits** (if you want to enforce GPG signing)

### **Step 3: Save the Rule**

1. Click **Create** or **Save changes**
2. Verify the rule is active by checking the branch list

### **Step 4: Test the Protection**

1. Try to push directly to `main` - it should be blocked
2. Create a test PR to ensure the workflow works
3. Verify that reviews are required before merging

---

## **Branch Protection Rules Summary**

Once configured, your `main` branch will have these protections:

| Protection | Description |
|------------|-------------|
| **PR Required** | No direct pushes to main |
| **Reviews Required** | At least 1 approval needed |
| **Status Checks** | Must pass all CI checks |
| **Up-to-date** | Branch must be current with main |
| **No Bypass** | Even admins must follow rules |
| **File Size Limit** | Prevents large file uploads |

---

## **Troubleshooting**

### **If you can't push to main:**
- Create a feature branch: `git checkout -b feature/your-feature`
- Push the feature branch: `git push origin feature/your-feature`
- Create a Pull Request on GitHub
- Get approval and merge through the UI

### **If PR reviews aren't working:**
- Check that the branch protection rule is active
- Verify the reviewer has appropriate permissions
- Ensure the PR is targeting the `main` branch

### **If you need emergency access:**
- Temporarily disable branch protection (not recommended)
- Use the bypass option if you're an admin (if enabled)
- Consider creating a `hotfix/` branch for urgent fixes

---

**Next Steps:** After setting up branch protection, consider implementing the automated cleanup scripts below.