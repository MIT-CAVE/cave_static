---
name: deploy
description: Compile the application and deploy static assets to AWS S3 and invalidate CloudFront CDN caches.
---

# Compiling and Deploying the Web App

> [!WARNING]
> **AI AGENT CRITICAL DIRECTIVE**: Under no circumstances should an AI agent run the deployment commands (`./deploy.sh`) directly. Instead, the agent must surface these deployment instructions to the user so that they can review the build and run the script themselves.

Deployment is automated via a local shell script. Only run this after validating the production build.

## Prerequisites

1. **AWS CLI v2+**: Installed and configured with permissions to manage S3 buckets and CloudFront distributions.
2. **Environment Variables**: A `.env` file at the root containing:
   - `S3_BUCKET`: AWS S3 bucket name.
   - `BUILD_PATH`: Production build target directory.
   - `BUILD_VERSION`: Deployment version path.

## Deployment Steps

Ask the user to follow these steps to deploy the application:

1. **Compile Production Assets**:
   ```sh
   npm run build
   ```
2. **Run Deploy Script**:

   ```sh
   ./deploy.sh
   ```

   - The script will read `.env` configurations.
   - If the target bucket or CloudFront distribution is missing, it will create them.
   - If the version already exists in the bucket, you will be prompted to overwrite it.
   - Overwriting a version will trigger a CloudFront cache invalidation.

3. **Verify Links**:
   Upon completion, verify the asset URLs printed by the script:
   - S3 direct URL: `https://<s3-bucket>.s3.amazonaws.com/<version>/index.html`
   - CloudFront CDN URL: `https://<cdn-domain>/<version>/index.html`
