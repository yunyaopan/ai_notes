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

