# Deploy with Dockge

Results from the GitHub Action "Build and Push Docker Image" can be deployed using Dockge on your Ubuntu server.

## 1. GitHub Secrets

Ensure these secrets are set in your GitHub repository (Settings > Secrets and variables > Actions):

- `VITE_API_KEY`: Your Vite API/Application key (used during build).

## 2. Dockge Configuration

In your Dockge dashboard, create a new stack or update an existing one with the following `compose.yaml`:

```yaml
version: "3.8"
services:
  gitglance:
    image: ghcr.io/<YOUR_GITHUB_USERNAME>/gitglance:latest
    container_name: gitglance
    restart: unless-stopped
    ports:
      - "8080:80"
```

Replace `<YOUR_GITHUB_USERNAME>` with your actual GitHub username (lowercase).

## 3. Updating

When you push code to `main`:

1. The GitHub Action will build and push a new image to GHCR.
2. In Dockge, simply click "Update" (or "Pull & Restart") to fetch the latest image and restart the container.
