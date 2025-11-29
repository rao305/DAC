# Quick Start: Deploy to Netlify

## 🚀 Fast Deployment (5 minutes)

### Step 1: Deploy Backend (Railway - Recommended)

1. Go to [railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add a new service → Select `backend` directory
5. Add environment variables from your `.env` file
6. Deploy and copy the URL (e.g., `https://your-app.railway.app`)

### Step 2: Deploy Frontend (Netlify)

1. Go to [app.netlify.com](https://app.netlify.com) and sign up
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub/GitLab repository
4. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm install && npm run build`
   - **Publish directory**: `.next`
5. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = `https://your-app.railway.app/api`
6. Click "Deploy site"

### Step 3: Update Backend CORS

In your backend deployment, ensure CORS allows your Netlify domain:

```python
# In backend/main.py, update CORS origins:
allow_origins=[
    "https://your-site.netlify.app",
    # ... other origins
]
```

## ✅ Done!

Your site should now be live at `https://your-site.netlify.app`

## Troubleshooting

**Build fails?**
- Check Node version is 20
- Verify all dependencies are in `package.json`

**API not working?**
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check backend CORS settings
- Ensure backend is accessible

**Need help?**
- See [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md) for detailed guide
- Check [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for verification steps




