# 🚀 TruthLens AI — Complete Deployment Guide

This guide provides step-by-step instructions to deploy **TruthLens AI** to the cloud so anyone can access it via a public `https://...` link for project evaluation, grading, or production use.

---

## 🌟 Architecture Overview for Deployment

TruthLens AI is configured as a **unified full-stack application**:
- The **Express backend** serves both the **REST API endpoints** (`/api/*`) and the **compiled React single-page app** (`client/dist`).
- **Benefit:** You only need to deploy **ONE service on ONE free hosting platform** (e.g. Render). No separate frontend and backend deployments, and **zero CORS issues**!

---

## 📦 Step 1: Push Your Code to GitHub

Before deploying to any cloud host, your code must be in a GitHub repository.

Open PowerShell or terminal in `C:\Users\xproo\Desktop\TruthLens-AI`:

```powershell
cd C:\Users\xproo\Desktop\TruthLens-AI

# 1. Initialize Git repository
git init

# 2. Add all files (the included .gitignore will protect your node_modules and .env files)
git add .

# 3. Create initial commit
git commit -m "TruthLens AI — Production Release"

# 4. Rename main branch
git branch -M main

# 5. Link your GitHub repository (replace with your repository URL from github.com)
git remote add origin https://github.com/YOUR_USERNAME/TruthLens-AI.git

# 6. Push code to GitHub
git push -u origin main
```

---

## 🟢 Option 1 (Recommended): Deploy to Render.com (100% Free)

**Render** offers free hosting for web services with automatic HTTPS, free SSL, and continuous deployment directly from your GitHub repo.

### Walkthrough:
1. Go to **[https://render.com/](https://render.com/)** and sign in (or create a free account with GitHub).
2. On your Render Dashboard, click the **"New +"** button in the top right and select **"Web Service"**.
3. Under **"Connect a repository"**, select your `TruthLens-AI` repository (click *Connect*).
4. Fill in the deployment settings:
   - **Name**: `truthlens-ai` (or any custom name)
   - **Region**: Choose the closest region (e.g., *Oregon (US West)* or *Frankfurt (EU)*)
   - **Branch**: `main`
   - **Root Directory**: *(leave blank)*
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm run build
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Plan Type**: Select **Free** ($0 / month).
5. Scroll down to **"Environment Variables"** and click **"Add Environment Variable"**:
   - `NODE_ENV` = `production`
   - `PORT` = `10000` *(Render sets this automatically, but adding it ensures alignment)*
   - `GEMINI_API_KEY` = *[Your Gemini API Key from Google AI Studio](https://aistudio.google.com/)* *(Optional: app works in consensus mode if empty)*
   - `GOOGLE_FACTCHECK_API_KEY` = *[Your Google Fact Check API Key]* *(Optional)*
   - `NEWS_API_KEY` = *[Your NewsAPI Key]* *(Optional: falls back to free live RSS feeds if empty)*
6. Click **"Create Web Service"**.
7. Render will now clone your repo, run `npm run build` (which compiles the React frontend), and execute `npm start`.
8. Once deployment finishes (usually 2–3 minutes), your public URL will be live at:
   ```
   https://truthlens-ai.onrender.com
   ```

---

## 🚂 Option 2: Deploy to Railway.app

**Railway** is another developer-friendly platform that automatically detects Node or Docker setups.

1. Go to **[https://railway.app/](https://railway.app/)** and sign in with GitHub.
2. Click **"New Project"** -> **"Deploy from GitHub repo"**.
3. Select your `TruthLens-AI` repository.
4. Railway will automatically detect the root `package.json` and `Dockerfile`.
5. Under project **Settings** -> **Variables**, add:
   - `NODE_ENV` = `production`
   - `GEMINI_API_KEY` = *your_key*
6. Under project **Settings** -> **Networking**, click **"Generate Domain"** to get your public `https://...railway.app` URL.

---

## ⚡ Option 3: Two-Tier Split (Vercel Frontend + Render Backend)

If you prefer hosting the React client on **Vercel** and the API backend on **Render**:

### Step 3A: Deploy Backend to Render
1. Follow Option 1, but set:
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `node server/src/index.js`
2. Copy your Render backend URL (e.g. `https://truthlens-backend.onrender.com`).

### Step 3B: Deploy Frontend to Vercel
1. Go to **[https://vercel.com/](https://vercel.com/)** and import the `TruthLens-AI` GitHub repository.
2. Under **Root Directory**, click *Edit* and select `client`.
3. Under **Environment Variables**, add:
   - `VITE_API_URL` = `https://truthlens-backend.onrender.com`
4. Click **Deploy**. Vercel will build and deploy the React frontend globally on edge servers!

---

## 🐳 Option 4: Deploy with Docker (VPS / AWS / Google Cloud)

A production-ready multi-stage `Dockerfile` and `docker-compose.yml` are included in the project.

### Run locally or on any Linux VPS:
```bash
# Build and run container
docker-compose up -d --build

# View container logs
docker-compose logs -f

# Stop container
docker-compose down
```
Access the application at `http://YOUR_SERVER_IP:5000`.

---

## 🧪 Post-Deployment Verification Checklist

Once your cloud instance is live:
1. **Check Backend Health**: Visit `https://your-domain.onrender.com/health`  
   *(Expected response: `{"status":"healthy","name":"TruthLens AI Verification API",...}`)*
2. **Check Status Endpoint**: Visit `https://your-domain.onrender.com/api/config/status`  
   *(Expected response: confirms SSRF protection, readability parser, and consensus engine)*
3. **Test Claim Analysis**:
   - Open your web application URL.
   - Go to **Quick Claim Check** tab.
   - Enter *"Drinking bleach cures viruses"*.
   - Verify it flags the claim as **`Likely False`** with cited debunks.
4. **Test Live News Feed**:
   - Click the **Live News** tab.
   - Verify headlines appear and clicking *"Verify with TruthLens"* loads the story into the analyzer.
5. **Test PDF Dossier Export**:
   - On any completed analysis, click **"Export PDF"** to ensure print-friendly formatting renders cleanly.

---

## 🎓 Tips for Presentation and Submission

- **No API Key Required to Demo**: TruthLens has built-in rule consensus and free Google News RSS fallback. Even if your API keys exceed daily free quotas during a demo, TruthLens continues working smoothly!
- **Settings Modal**: Evaluators can test their own keys at runtime by clicking the **"APIs Active" / "Consensus Mode"** button in the top navigation bar.
