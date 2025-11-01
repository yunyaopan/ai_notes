# Cloudflare Workers Deployment Setup

This document explains how to deploy to Cloudflare Workers, including automatic deployment via GitHub Actions and manual deployment to different environments.

## Manual Deployment to Different Environments

You can deploy to different environments using these npm scripts:

- **Development**: `npm run deploy:dev` (uses default env in wrangler.toml)
- **UAT**: `npm run deploy:uat` 
- **Production**: `npm run deploy:prod`

## Automatic Deployment via GitHub Actions

The deployment workflow requires environment variables to be stored in **TWO places**:

1. **GitHub Actions** - for build/deploy process
2. **Cloudflare Workers** - for runtime execution

### How It Works

- **UAT**: Automatically deploys when you push to the `uat` branch
- **Production**: Deploys when you manually trigger the workflow from GitHub Actions UI

### Setting Up Environment Variables

#### Step 1: Configure GitHub Actions

1. **Go to GitHub Repository Settings**:
   - Navigate to: `Settings` → `Environments`
   
2. **Create/Configure Environments**:


#### Step 2: Configure Cloudflare Workers

You need to set the same environment variables in Cloudflare Workers (these are what the app actually uses at runtime).


### Why Two Places?

- **GitHub Actions env vars**: Used during build and deployment process only
- **Cloudflare Workers env vars**: Used at runtime when your app executes
- These are completely separate systems with separate storage

### Important Notes

- **Secrets vs Variables in GitHub**: 
  - `secrets.*` → stored as secrets (encrypted, not visible in logs)
  - `vars.*` → stored as variables (visible in logs, safe for public values)
  
- **Environment-Specific Values**: You can use different values for UAT vs Production:
  - UAT might use a test Supabase project
  - Production uses the live Supabase project
  - Different `NEXT_PUBLIC_SITE_URL` for each environment

## Set up logging
- Add the following to the wrangler file
```
[observability]
enabled = true
head_sampling_rate = 1 #must be a value between 0 and 1
invocation_logs = true
persist = true
```

## Troubleshooting

### Common Issues

1. **Stripe Connection Error**: If you see "An error occurred with our connection to Stripe" in Cloudflare but not locally:
   - This is because Cloudflare Workers use the Fetch API instead of Node.js HTTP
   - The fix is already implemented in `lib/stripe/server.ts` using `httpClient: Stripe.createFetchHttpClient()`
2. **Email Confirmation Links Redirect to Localhost**: 
   - **Code Fix**: The issue was that `window.location.origin` was being used in sign-up and forgot-password forms. The code has been updated to use a `getBaseUrl()` utility that respects environment variables.
   - **Files Updated**:
     - `lib/utils.ts`: Added `getBaseUrl()` function that checks `NEXT_PUBLIC_SITE_URL` first
     - `components/sign-up-form.tsx`: Updated to use `getBaseUrl()` for `emailRedirectTo`
     - `components/forgot-password-form.tsx`: Updated to use `getBaseUrl()` for `redirectTo`
   - **Environment Configuration**: Ensure `NEXT_PUBLIC_SITE_URL` is set to your production domain (e.g., `https://your-worker.workers.dev`)
   - **Supabase Configuration**: Configure redirect URLs in Supabase Dashboard → Authentication → URL Configuration:
     - Add your production domain to "Site URL"
     - Add `https://your-worker.workers.dev/**` to "Redirect URLs" 
     - Keep `http://localhost:3000/**` for local development

