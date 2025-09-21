# Deployment Guide

## Vercel Deployment

This application is configured for deployment on Vercel with the following setup:

### Prerequisites

1. **GitHub Repository**: Push your code to a GitHub repository
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **Environment Variables**: Configure the required environment variables

### Required Environment Variables

Set these environment variables in your Vercel project settings:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Deployment Steps

1. **Connect Repository**: 
   - Connect your GitHub repository to Vercel
   - Import the project in Vercel dashboard

2. **Configure Build Settings**:
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)
   - Install Command: `npm install` (auto-detected)

3. **Set Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

4. **Deploy**:
   - Click "Deploy" - Vercel will build and deploy automatically
   - Subsequent pushes to the main branch will trigger automatic deployments

### SPA Routing Configuration

The `vercel.json` file is already configured to handle React Router properly:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "routes": [
    {
      "handle": "filesystem"
    },
    {
      "src": "/.*",
      "dest": "/index.html"
    }
  ]
}
```

This configuration:
- Serves static files normally
- Routes all other requests to `index.html` for client-side routing
- Prevents 404 errors on direct URL access

### Troubleshooting

**404 Errors on Routes**:
- Ensure `vercel.json` is in the root directory
- Verify the routing configuration is correct

**Build Failures**:
- Check that environment variables are set
- Verify Node.js version compatibility
- Review build logs for specific errors

**Environment Variables Not Working**:
- Ensure variables start with `VITE_` prefix
- Redeploy after adding/changing environment variables
- Check case sensitivity of variable names

### Testing Deployment

After deployment:
1. Test the login functionality with demo credentials
2. Navigate directly to routes like `/dashboard` to ensure SPA routing works
3. Verify all environment-dependent features work correctly