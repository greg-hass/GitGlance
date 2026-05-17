# Deploy with Dockge

Results from the GitHub Action "Build and Push Docker Image" can be deployed using Dockge on your Ubuntu server.

## 1. GitHub Secrets

No application secrets are required for the default static frontend image.

## 2. Dockge Configuration

In your Dockge dashboard, create a new stack or update an existing one with the following `compose.yaml`:

```yaml
version: "3.8"
services:
  gitglance:
    image: ghcr.io/greg-hass/gitglance:latest
    container_name: gitglance
    restart: unless-stopped
    ports:
      - "8080:80"
```

## 3. Updating

When you push code to `main`:

1. The GitHub Action will build and push a new image to GHCR.
2. In Dockge, simply click "Update" (or "Pull & Restart") to fetch the latest image and restart the container.

## Security Note

Do not bake private API keys into the frontend image. If AI features are added later, run them through a private backend proxy with rate limiting.
