# Deployment Checklist for Netlify

## Pre-Deployment Checklist

### Backend Deployment
- [ ] Backend deployed to Railway/Render/Fly.io
- [ ] Backend URL is accessible and tested
- [ ] Backend CORS configured to allow Netlify domain
- [ ] Backend environment variables configured
- [ ] Backend database connected and working
- [ ] Backend API endpoints tested

### Frontend Preparation
- [ ] All environment variables documented
- [ ] `netlify.toml` configured correctly
- [ ] `next.config.mjs` optimized for production
- [ ] Build tested locally (`npm run build`)
- [ ] No TypeScript errors (or errors are acceptable)
- [ ] All dependencies in `package.json`

### Environment Variables to Set in Netlify

Required:
- [ ] `NEXT_PUBLIC_API_URL` - Your backend API URL (e.g., `https://your-app.railway.app/api`)

Optional (if using Firebase):
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`

## Netlify Configuration Steps

1. [ ] Create Netlify account or login
2. [ ] Connect Git repository
3. [ ] Set base directory to `frontend`
4. [ ] Set build command: `npm install && npm run build`
5. [ ] Set publish directory: `.next`
6. [ ] Set Node version to 20
7. [ ] Add all environment variables
8. [ ] Trigger first deployment
9. [ ] Review build logs for errors
10. [ ] Test deployed site

## Post-Deployment Verification

- [ ] Site loads without errors
- [ ] API calls work (check browser console)
- [ ] No CORS errors
- [ ] Authentication works (if applicable)
- [ ] All pages accessible
- [ ] Images and assets load correctly
- [ ] Mobile responsive design works
- [ ] Performance is acceptable

## Quick Deploy Commands

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize (first time only)
cd frontend
netlify init

# Set environment variable
netlify env:set NEXT_PUBLIC_API_URL "https://your-backend-url.railway.app/api"

# Deploy
netlify deploy --prod
```

## Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| Build fails | Check Node version, verify dependencies |
| API 404 | Verify `NEXT_PUBLIC_API_URL` is correct |
| CORS errors | Update backend CORS settings |
| Env vars not working | Ensure they start with `NEXT_PUBLIC_` |
| Images not loading | Check `next.config.mjs` image settings |




