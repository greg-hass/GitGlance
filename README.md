# GitGlance

A self-hosted dashboard for discovering trending and latest GitHub repositories. Browse, save, and explore projects with a clean, dark-themed interface.

## Features

- **Trending** — Discover popular repositories created recently
- **Latest** — See freshly updated projects
- **Saved** — Bookmark repositories to your personal library (stored locally)
- **PWA Support** — Install as a standalone app on mobile/desktop
- **Responsive** — Works on desktop, tablet, and mobile

## Security Note

GitGlance does not ship browser-side API keys. If AI features are added later, put provider calls behind a private backend proxy with rate limiting. Do not expose Gemini, GitHub, or other private API keys through Vite `VITE_*` variables because those values are embedded in browser JavaScript.

## GitHub API Rate Limits

GitHub's search API allows **10 requests per minute** for unauthenticated requests. The app handles rate-limit errors gracefully and shows a retry time. If you hit limits frequently, consider using a GitHub token (future enhancement).

## Local Setup

```bash
npm ci
npm run build
npm run preview
```

Or with Docker:

```bash
docker build -t gitglance:local .
docker run -p 8080:80 gitglance:local
```

## Environment Variables

No environment variables are required for the static frontend.

`.env.example` is intentionally empty except for comments.

## Docker Compose

```yaml
services:
  gitglance:
    image: ghcr.io/greg-hass/gitglance:latest
    container_name: gitglance
    restart: unless-stopped
    ports:
      - "8080:80"
```

See `docker-compose.yml` for hardened production configuration with read-only rootfs and dropped capabilities.

## Development

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run audit        # Security audit
```

## Tech Stack

- React 19 + TypeScript (strict mode)
- Vite
- Tailwind CSS
- Framer Motion
- nginx (Docker production)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "GitHub rate limit reached" | Wait a few minutes and retry. Unauthenticated search is limited to 10 req/min. |
| Saved repos disappear | Check that localStorage is enabled in your browser. Data is stored locally only. |
| Build fails with TypeScript errors | Run `npm ci` to ensure all types are installed. |

## License

MIT
