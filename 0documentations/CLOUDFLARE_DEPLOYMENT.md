# Cloudflare Workers Deployment Setup

This document explains how to deploy to Cloudflare Workers, including automatic deployment via GitHub Actions and manual deployment to different environments.

## Manual Deployment to Different Environments
You need to set up the wrangler file.
You can deploy to different environments using these npm scripts:

- **Development**: `npm run deploy:dev` (uses default env in wrangler.toml)
- **UAT**: `npm run deploy:uat` 
- **Production**: `npm run deploy:prod`

## Automatic Deployment via GitHub Actions

## What to do where you have a new secret/env var?
1. if it's a secret
    - add a reference in deploy.yml and put dummy value in gitlab yml
    - add the real value in cloudflare dashboard
2. if it's an env var
    - add the real value in both the wrangler file and the deploy.yml



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

