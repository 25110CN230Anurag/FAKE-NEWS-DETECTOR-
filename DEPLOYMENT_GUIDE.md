# 🚀 Deployment Guide for Veritas AI Fake News Detector

This guide explains how to deploy your Veritas application to the cloud for free with HTTPS / SSL, so anyone in the world can access it via a public URL.

---

## 🌟 Option 1: Deploy on Render.com (Recommended - 100% Free & Easy)

**Render** is the best free hosting platform for Python/Flask apps. It automatically builds your project and provides a free `https://your-app.onrender.com` URL with SSL.

### Step-by-Step:
1. **Create a GitHub Repository**:
   - Go to [github.com](https://github.com) and create a new repository (e.g. `veritas-fake-news-detector`).
   - Push your project code to GitHub:
     ```bash
     git init
     git add .
     git commit -m "Initial commit for Veritas"
     git branch -M main
     git remote add origin https://github.com/YOUR_USERNAME/veritas-fake-news-detector.git
     git push -u origin main
     ```

2. **Sign up on Render**:
   - Go to [render.com](https://render.com) and sign up with your GitHub account.

3. **Create a New Web Service**:
   - Click **New +** &rarr; **Web Service**.
   - Select **Build and deploy from a Git repository**.
   - Connect your `veritas-fake-news-detector` repository.

4. **Configure Settings**:
   - **Name**: `veritas-news-detector`
   - **Region**: Choose the closest region (e.g., Singapore, Frankfurt, or Oregon).
   - **Branch**: `main`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --threads 4 --timeout 120`
   - **Plan**: Select **Free**.

5. **Deploy**:
   - Click **Create Web Service**.
   - Render will build your dependencies, train the ML model, and launch the website in ~2 minutes!
   - Your public link will be live at: `https://veritas-news-detector.onrender.com`.

---

## 🌟 Option 2: Deploy on Railway.app

**Railway** is another developer-friendly platform that detects the `Dockerfile` or `Procfile` automatically.

1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. Click **New Project** &rarr; **Deploy from GitHub repo**.
3. Select your repository.
4. Railway will automatically detect the `Procfile` and `requirements.txt` and begin deployment.
5. In **Settings** &rarr; **Networking**, click **Generate Domain** to get your live public HTTPS link!

---

## 🌟 Option 3: Deploy on Hugging Face Spaces (Free Docker Hosting)

**Hugging Face Spaces** provides free 16 GB RAM containers for machine learning web apps.

1. Go to [huggingface.co/spaces](https://huggingface.co/spaces) and log in.
2. Click **Create new Space**.
3. Name your space (e.g., `veritas-detector`).
4. Select **Docker** as the Space SDK (Blank template).
5. Clone the space repository to your computer and paste all the files from this folder into it.
6. Commit and push:
   ```bash
   git add .
   git commit -m "Deploy Veritas on Hugging Face"
   git push
   ```
7. Hugging Face will automatically build your `Dockerfile` and run Veritas with a public link!

---

## 🌟 Option 4: Deploy using Docker (Any Cloud / Local / VPS)

You can containerize and run Veritas on any Linux VPS (Ubuntu, Debian, AWS EC2, DigitalOcean) in two commands:

1. **Build the Docker image**:
   ```bash
   docker build -t veritas-detector .
   ```

2. **Run the container**:
   ```bash
   docker run -d -p 5000:5000 --name veritas veritas-detector
   ```

3. Open `http://localhost:5000` or your server's public IP address.

---

## 📁 Included Deployment Files in This Folder:

- `Procfile` &rarr; Used by Render, Railway, and Heroku to start the Gunicorn WSGI server.
- `requirements.txt` &rarr; Contains all required Python libraries including `gunicorn`.
- `Dockerfile` &rarr; Multi-stage production container with pre-compiled ML models.
- `.dockerignore` &rarr; Excludes temp files to speed up cloud builds.
- `render.yaml` &rarr; Infrastructure-as-code blueprint for 1-click Render deployment.
- `vercel.json` &rarr; Serverless configuration for Vercel.
- `app.py` &rarr; Configured with dynamic cloud port binding (`$PORT`).
