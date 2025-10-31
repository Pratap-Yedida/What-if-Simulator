# How to Upload Your Code to GitHub

## Method 1: Using GitHub Desktop (RECOMMENDED - Easiest)

1. **Install GitHub Desktop:**
   - Go to: https://desktop.github.com/
   - Download and install

2. **Open GitHub Desktop:**
   - Sign in with your GitHub account
   - Click "File" → "Add Local Repository"
   - Click "Choose" and navigate to: `C:\Users\saich\Downloads\What-if-Simulator`
   - Click "Open"

3. **Commit your files:**
   - You'll see all your files listed
   - Type a commit message like: "Initial commit: What-If Simulator"
   - Click "Commit to main"

4. **Push to GitHub:**
   - Click "Publish repository" button (top right)
   - Make sure "Keep this code private" is unchecked (or checked, your choice)
   - Click "Publish repository"

Done! Your code will be on GitHub.

---

## Method 2: Using Git Command Line

### Step 1: Install Git
- Download from: https://git-scm.com/download/win
- Install with default settings

### Step 2: Open Git Bash or PowerShell
- Navigate to your project:
```bash
cd C:\Users\saich\Downloads\What-if-Simulator
```

### Step 3: Initialize Git
```bash
git init
```

### Step 4: Add all files
```bash
git add .
```

### Step 5: Commit
```bash
git commit -m "Initial commit: What-If Simulator"
```

### Step 6: Connect to GitHub
```bash
git remote add origin https://github.com/Pratap-Yedida/What-if-Simulator.git
```

### Step 7: Push to GitHub
```bash
git branch -M main
git push -u origin main
```

---

## Method 3: Drag & Drop on GitHub (Manual - Slow)

⚠️ **Not recommended for large projects** - This is tedious for many files.

1. Go to your repository: https://github.com/Pratap-Yedida/What-if-Simulator
2. Click "uploading an existing file"
3. Drag and drop files one by one
4. Type commit message
5. Click "Commit changes"

**Note:** You can't drag entire folders - only individual files.

---

## Recommended: Method 1 (GitHub Desktop) - Easiest!

