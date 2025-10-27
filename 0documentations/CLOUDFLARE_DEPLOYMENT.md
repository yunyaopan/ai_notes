# Cloudflare Workers Auto-Deployment Setup

This document explains how to configure automatic deployment to Cloudflare Workers when pushing to the main branch.

## GitHub Actions Environment Variables

The deployment workflow requires both **Secrets** and **Variables**:

- if you reference an env var as secrets.xxx in deploy.yml, you need to create the env var in github actions as secrets
- similarly, if you reference an env var as var.xxx in deploy.yml, you need to create it as variables
- additionally in github action, you need to set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN

## Set up logging
- Add the following to the wrangler file
```
[observability]
enabled = true
head_sampling_rate = 100
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

