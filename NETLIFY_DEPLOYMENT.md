# Netlify Deployment Guide

This guide will help you deploy the Syntra frontend to Netlify.

## Prerequisites

1. **Backend Deployment**: The FastAPI backend must be deployed separately (Netlify Functions have limitations for Python/FastAPI). Recommended platforms:
   - [Railway](https://railway.app) - Easy Python deployment
   - [Render](https://render.com) - Free tier available
   - [Fly.io](https://fly.io) - Good for Python apps
   - [Heroku](https://heroku.com) - Traditional option

2. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)

3. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Deploy Backend First

Before deploying the frontend, ensure your backend is deployed and accessible. You'll need the backend URL for the frontend environment variables.

### Example: Deploying Backend to Railway

1. Create a new project on Railway
2. Connect your repository
3. Set the root directory to `backend`
4. Railway will auto-detect Python and install dependencies
5. Set environment variables from your `.env` file
6. Deploy and note the generated URL (e.g., `https://your-app.railway.app`)

## Step 2: Configure Netlify

### Option A: Deploy via Netlify Dashboard

1. **Connect Repository**
   - Go to [app.netlify.com](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your Git provider and select the repository

2. **Configure Build Settings**
   - Base directory: `frontend`
   - Build command: `npm install && npm run build`
   - Publish directory: `.next`
   - Node version: `20` (or latest LTS)

3. **Set Environment Variables**
   - Go to Site settings → Environment variables
   - Add the following variables:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api
     ```
   - Add any Firebase variables if using Firebase Auth:
     ```
     NEXT_PUBLIC_FIREBASE_API_KEY=your-key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-domain
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-bucket
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
     NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
     ```

4. **Deploy**
   - Click "Deploy site"
   - Netlify will build and deploy your frontend

### Option B: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Initialize Site**
   ```bash
   cd frontend
   netlify init
   ```
   - Follow the prompts to connect to an existing site or create a new one
   - Select build settings when prompted

4. **Set Environment Variables**
   ```bash
   netlify env:set NEXT_PUBLIC_API_URL "https://your-backend-url.railway.app/api"
   ```

5. **Deploy**
   ```bash
   netlify deploy --prod
   ```

## Step 3: Verify Deployment

1. **Check Build Logs**
   - Go to your site dashboard → Deploys
   - Check for any build errors

2. **Test the Application**
   - Visit your Netlify URL (e.g., `https://your-site.netlify.app`)
   - Verify the frontend loads correctly
   - Test API connectivity to your backend

3. **Check Browser Console**
   - Open browser DevTools
   - Check for any CORS errors or API connection issues
   - Verify `NEXT_PUBLIC_API_URL` is correctly set

## Step 4: Configure Custom Domain (Optional)

1. Go to Site settings → Domain management
2. Click "Add custom domain"
3. Follow the DNS configuration instructions

## Troubleshooting

### Build Fails

- **Error: "Module not found"**
  - Ensure all dependencies are in `package.json`
  - Check that `node_modules` is not in `.gitignore` incorrectly

- **Error: "Command failed"**
  - Verify Node version matches (should be 20+)
  - Check build command in `netlify.toml`

### API Connection Issues

- **CORS Errors**
  - Ensure your backend has CORS configured to allow your Netlify domain
  - Check backend CORS settings in `backend/main.py`

- **404 on API Calls**
  - Verify `NEXT_PUBLIC_API_URL` is set correctly
  - Ensure backend URL includes `/api` path if needed
  - Check backend is running and accessible

### Environment Variables Not Working

- Variables must start with `NEXT_PUBLIC_` to be accessible in the browser
- Redeploy after changing environment variables
- Clear browser cache if variables seem cached

## File Structure

```
.
├── netlify.toml          # Netlify configuration
├── frontend/
│   ├── .env.example      # Example environment variables
│   ├── package.json      # Frontend dependencies
│   └── next.config.mjs   # Next.js configuration
└── backend/              # Deploy separately to Railway/Render/etc.
```

## Continuous Deployment

Netlify automatically deploys when you push to your main branch. To configure:

1. Go to Site settings → Build & deploy → Continuous Deployment
2. Configure branch settings:
   - Production branch: `main` or `master`
   - Branch deploys: Enable for PR previews

## Performance Optimization

The `netlify.toml` includes:
- Static asset caching (1 year)
- Security headers
- Next.js plugin for optimal performance

## Support

For issues:
1. Check Netlify build logs
2. Review browser console for errors
3. Verify backend is accessible
4. Check environment variables are set correctly




