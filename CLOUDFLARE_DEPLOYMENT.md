# Cloudflare Workers Auto-Deployment Setup

This document explains how to configure automatic deployment to Cloudflare Workers when pushing to the main branch.

## Required GitHub Secrets

You need to set up the following secrets in your GitHub repository:

### 1. CLOUDFLARE_API_TOKEN

This is your Cloudflare API token that allows GitHub Actions to deploy to your Cloudflare Workers.

**Steps to create:**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use the "Custom token" template
4. Configure the token with these permissions:
   - **Account**: `Cloudflare Workers:Edit` (for your account)
   - **Zone**: `Zone:Read` (if you need zone access)
5. Copy the generated token

### 2. CLOUDFLARE_ACCOUNT_ID

This is your Cloudflare Account ID.

**How to find it:**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select any domain from your account
3. In the right sidebar, you'll see "Account ID"
4. Copy this ID

## Setting up GitHub Secrets

1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret:
   - Name: `CLOUDFLARE_API_TOKEN`, Value: [your API token]
   - Name: `CLOUDFLARE_ACCOUNT_ID`, Value: [your account ID]

## How it Works

The deployment workflow (`.github/workflows/deploy.yml`) will:

1. **Trigger**: Automatically run when you push to the `main` branch
2. **Test**: Run type checking, linting, and tests
3. **Build**: Build your Next.js application
4. **Deploy**: Deploy to Cloudflare Workers using your `npm run deploy` script

## Manual Deployment

You can also trigger deployment manually:

1. Go to **Actions** tab in your GitHub repository
2. Select "Deploy to Cloudflare Workers" workflow
3. Click "Run workflow"
4. Select the branch and click "Run workflow"

## Troubleshooting

### Common Issues

1. **Authentication Error**: Make sure your `CLOUDFLARE_API_TOKEN` has the correct permissions
2. **Account ID Error**: Verify your `CLOUDFLARE_ACCOUNT_ID` is correct
3. **Build Failures**: Check that all tests pass and there are no TypeScript errors
4. **Stripe Connection Error**: If you see "An error occurred with our connection to Stripe" in Cloudflare but not locally:
   - This is because Cloudflare Workers use the Fetch API instead of Node.js HTTP
   - The fix is already implemented in `lib/stripe/server.ts` using `httpClient: Stripe.createFetchHttpClient()`

### Checking Deployment Status

- Go to **Actions** tab to see deployment logs
- Check your Cloudflare Workers dashboard to see the deployed worker
- Your worker will be available at: `https://ai-note.your-subdomain.workers.dev`

## Environment Variables

Your application requires several environment variables for production. You can set them in your `wrangler.toml` file or through the Cloudflare dashboard.

### Required Environment Variables

Based on your application setup, you need these environment variables:

```toml
[vars]
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL = "your-supabase-url"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY = "your-supabase-anon-key"

# OpenRouter API Configuration
OPENROUTER_API_KEY = "your-openrouter-api-key"
NEXT_PUBLIC_SITE_URL = "https://ai-note.your-subdomain.workers.dev"

# Stripe Configuration (if using payments)
STRIPE_SECRET_KEY = "sk_live_..." # or sk_test_... for testing
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_live_..." # or pk_test_... for testing

# Optional: Stripe Webhook Secret
STRIPE_WEBHOOK_SECRET = "whsec_..."
```

### Setting Environment Variables

**Option 1: Using wrangler.toml (Recommended)**
Add the `[vars]` section to your `wrangler.toml` file as shown above.

**Option 2: Using Cloudflare Dashboard**
1. Go to your Cloudflare Workers dashboard
2. Select your worker
3. Go to Settings → Variables
4. Add each environment variable

**Option 3: Using Wrangler CLI**
```bash
wrangler secret put OPENROUTER_API_KEY
wrangler secret put STRIPE_SECRET_KEY
# etc.
```

### Security Notes

- **Never commit sensitive keys** to your repository
- Use **secrets** for sensitive data like API keys
- Use **vars** for non-sensitive configuration
- Consider using Cloudflare's secret management for production keys
