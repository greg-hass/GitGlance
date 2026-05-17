# GitGlance Fix And Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn GitGlance from a polished prototype into a safer, clearer, maintainable self-hosted app.

**Architecture:** Keep the current Vite + React static frontend, but separate concerns into focused components, hooks, and services. Remove browser-delivered secrets by either disabling AI without a backend or adding a small self-hosted API proxy in a later phase. Harden Docker/nginx so the default deployment is reproducible and safer.

**Tech Stack:** React 19, Vite, TypeScript, nginx Docker image, GitHub REST API, optional Google Gemini API.

---

## File Structure

- Create: `src/main.tsx` - React entrypoint replacing root-level `index.tsx`.
- Create: `src/App.tsx` - top-level app composition only.
- Create: `src/types.ts` - shared domain types moved from root `types.ts`.
- Create: `src/services/github.ts` - GitHub API fetch, response validation, rate-limit errors.
- Create: `src/services/ai.ts` - AI feature boundary; no raw client secret assumptions.
- Create: `src/hooks/useSavedRepos.ts` - localStorage parsing and persistence.
- Create: `src/hooks/useRepositories.ts` - feed state, pagination, refresh, loading/error states.
- Create: `src/hooks/useSmartFilter.ts` - smart filtering state and errors.
- Create: `src/components/RepoCard.tsx`
- Create: `src/components/RepoDetailModal.tsx`
- Create: `src/components/RepoLanguages.tsx`
- Create: `src/components/StarGrowthChart.tsx`
- Create: `src/components/Toast.tsx`
- Create: `src/components/Header.tsx`
- Create: `src/components/MobileNav.tsx`
- Create: `src/components/SkeletonCard.tsx`
- Create: `src/components/EmptyState.tsx`
- Create: `src/lib/date.ts` - date formatting helpers.
- Create: `src/lib/languageColors.ts` - language color map.
- Create: `src/lib/storage.ts` - safe JSON localStorage helpers.
- Create: `src/test/setup.ts` - test setup if Vitest is added.
- Create: `nginx.conf` - SPA fallback and security headers.
- Create: `.dockerignore` - clean Docker build context.
- Modify: `index.html` - remove CDN Tailwind and importmap residue.
- Modify: `package.json` - add lint/test/audit scripts and dependencies.
- Modify: `tsconfig.json` - enable stricter TypeScript gradually.
- Modify: `Dockerfile` - use pinned nginx stage config and copy `nginx.conf`.
- Modify: `docker-compose.yml` - add healthcheck and container hardening.
- Modify: `README.md` - replace AI Studio text with real self-hosting docs.
- Modify: `README_DOCKGE.md` - align env and deployment story.
- Delete after migration: root `App.tsx`, `types.ts`, `index.tsx`.

---

## Phase 1: Stabilize Build, Supply Chain, And Self-Hosting

### Task 1: Add Docker Build Hygiene

**Files:**
- Create: `.dockerignore`
- Modify: `Dockerfile`

- [ ] **Step 1: Add `.dockerignore`**

```dockerignore
.git
.github
node_modules
dist
coverage
.DS_Store
*.log
.env
.env.*
!.env.example
```

- [ ] **Step 2: Update `Dockerfile` to copy nginx config**

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1
CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 3: Verify Docker context and build**

Run:

```bash
docker build -t gitglance:local .
```

Expected: image builds successfully and does not upload `node_modules` or `dist` as build context.

### Task 2: Add nginx Runtime Baseline

**Files:**
- Create: `nginx.conf`
- Modify: `docker-compose.yml`

- [ ] **Step 1: Create `nginx.conf`**

```nginx
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header X-Frame-Options "DENY" always;
  add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
  add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: data:; connect-src 'self' https://api.github.com https://generativelanguage.googleapis.com; base-uri 'self'; frame-ancestors 'none'; object-src 'none'" always;

  location = /healthz {
    access_log off;
    return 200 "ok\n";
  }

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /assets/ {
    try_files $uri =404;
    add_header Cache-Control "public, max-age=31536000, immutable";
  }
}
```

- [ ] **Step 2: Harden `docker-compose.yml`**

```yaml
services:
  gitglance:
    image: ghcr.io/greg-hass/gitglance:latest
    container_name: gitglance
    restart: unless-stopped
    ports:
      - "8080:80"
    read_only: true
    tmpfs:
      - /var/cache/nginx
      - /var/run
      - /tmp
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - SETGID
      - SETUID
      - NET_BIND_SERVICE
    security_opt:
      - no-new-privileges:true
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1/healthz"]
      interval: 30s
      timeout: 3s
      retries: 3
```

- [ ] **Step 3: Verify headers**

Run:

```bash
docker compose up -d
curl -I http://127.0.0.1:8080
docker compose down
```

Expected: response includes `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, and `X-Frame-Options`.

### Task 3: Fix Dependency Audit

**Files:**
- Modify: `package-lock.json`
- Possibly modify: `package.json`

- [ ] **Step 1: Apply non-breaking audit fixes**

Run:

```bash
npm audit fix
npm run build
npm audit --audit-level=moderate
```

Expected: build passes and audit reports `found 0 vulnerabilities`.

- [ ] **Step 2: If audit still fails, update direct dependencies conservatively**

Run:

```bash
npm install @google/genai@latest vite@^6.4.2 @vitejs/plugin-react@latest
npm run build
npm audit --audit-level=moderate
```

Expected: build passes. If `@google/genai` has breaking API changes, pin the newest compatible version that clears `protobufjs` advisories.

---

## Phase 2: Remove Prototype Residue

### Task 4: Replace CDN Tailwind With Local Styling

**Files:**
- Modify: `package.json`
- Create: `src/styles.css`
- Modify: `index.html`
- Modify: `src/main.tsx`

- [ ] **Step 1: Install Tailwind locally**

Run:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 2: Create `src/styles.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-color: #0a0a0b;
  --safe-top: env(safe-area-inset-top);
  --safe-bottom: env(safe-area-inset-bottom);
}

html,
body {
  width: 100%;
  min-height: 100%;
  margin: 0;
  padding: 0;
  background-color: var(--bg-color);
  color: #e2e8f0;
  font-family: "Inter", sans-serif;
  overflow-x: hidden;
  -webkit-tap-highlight-color: transparent;
}

#root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.mono {
  font-family: "JetBrains Mono", monospace;
}

.glass {
  background: rgba(10, 10, 11, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.fixed-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  padding-top: var(--safe-top);
}

.mobile-nav-safe {
  padding-bottom: var(--safe-bottom);
}

.card-gradient {
  background: rgba(255, 255, 255, 0.02);
  transition: background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease;
}

.card-gradient:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 0 15px -5px rgba(99, 102, 241, 0.1);
}
```

- [ ] **Step 3: Remove runtime Tailwind and importmap from `index.html`**

Keep only normal metadata, font links, manifest links, `root`, and the Vite module script. Delete:

```html
<script src="https://cdn.tailwindcss.com"></script>
<script type="importmap">...</script>
<style>...</style>
```

- [ ] **Step 4: Import CSS in `src/main.tsx`**

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 5: Verify no CDN residue**

Run:

```bash
npm run build
rg -n "cdn.tailwindcss|importmap|esm.sh" dist index.html
```

Expected: build passes and `rg` finds no matches.

---

## Phase 3: Fix Product Truthfulness And API Reliability

### Task 5: Replace Fake Star Chart

**Files:**
- Modify: `src/components/StarGrowthChart.tsx`
- Modify: `src/components/RepoDetailModal.tsx`

- [ ] **Step 1: Rename fake chart to an honest metric panel**

Replace random chart behavior with a deterministic summary:

```tsx
export const RepoActivitySummary = ({ repo }: { repo: GithubRepo }) => {
  return (
    <div className="w-full mt-6 mb-10 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <h4 className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-500 mono">
        Repository Activity
      </h4>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Metric label="Stars" value={repo.stargazers_count.toLocaleString()} />
        <Metric label="Forks" value={repo.forks_count.toLocaleString()} />
        <Metric label="Watchers" value={repo.watchers_count.toLocaleString()} />
        <Metric label="Open Issues" value={repo.open_issues_count.toLocaleString()} />
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Remove `Math.random()` chart code**

Run:

```bash
rg -n "Math.random|Star Growth|Simulate historical" src
```

Expected: no matches.

### Task 6: Add GitHub API Error Handling

**Files:**
- Create: `src/services/github.ts`
- Modify: `src/hooks/useRepositories.ts`
- Modify: `src/components/EmptyState.tsx`

- [ ] **Step 1: Create typed API errors**

```ts
export class GitHubApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly resetAt?: Date,
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}
```

- [ ] **Step 2: Validate GitHub responses**

```ts
export async function fetchGitHubJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" },
  });

  if (!response.ok) {
    const reset = response.headers.get("x-ratelimit-reset");
    const resetAt = reset ? new Date(Number(reset) * 1000) : undefined;
    const body = await response.json().catch(() => null);
    const message =
      body?.message ||
      (response.status === 403 ? "GitHub rate limit reached." : "GitHub request failed.");

    throw new GitHubApiError(message, response.status, resetAt);
  }

  return response.json() as Promise<T>;
}
```

- [ ] **Step 3: Surface user-friendly errors**

When `GitHubApiError.status === 403`, show:

```ts
`GitHub rate limit reached. Try again after ${error.resetAt?.toLocaleTimeString() ?? "a few minutes"}.`
```

- [ ] **Step 4: Verify failure behavior**

Temporarily change the GitHub URL to `https://api.github.com/search/repositories?q=bad&per_page=999`.

Run:

```bash
npm run dev
```

Expected: UI shows a helpful error instead of “Something went wrong”.

Revert the temporary URL change before committing.

---

## Phase 4: Secure Or Reframe AI

### Task 7: Make AI Feature Explicitly Optional

**Files:**
- Create: `src/services/ai.ts`
- Modify: `src/components/Header.tsx`
- Modify: `src/components/RepoDetailModal.tsx`
- Modify: `README.md`
- Modify: `.env.example`

- [ ] **Step 1: Rename env var honestly**

Use:

```env
VITE_ENABLE_CLIENT_AI=false
```

Do not document a browser-side Gemini key as production-safe.

- [ ] **Step 2: Gate AI UI**

```ts
export const isClientAiEnabled = import.meta.env.VITE_ENABLE_CLIENT_AI === "true";
```

Hide smart filter and AI insight when disabled.

- [ ] **Step 3: Document production-safe path**

In `README.md`, state:

```md
AI features are disabled by default because Gemini API keys must not be shipped in browser JavaScript. For production, put Gemini behind a private API endpoint or reverse proxy with rate limiting.
```

### Task 8: Optional Backend Proxy Plan

Do this only if AI must ship in production.

**Files:**
- Create: `server/package.json`
- Create: `server/src/index.ts`
- Modify: `docker-compose.yml`
- Modify: `nginx.conf`

- [ ] **Step 1: Add a minimal API service**

Expose:

```http
POST /api/ai/filter
POST /api/ai/insight
```

- [ ] **Step 2: Store `GEMINI_API_KEY` only server-side**

Use compose env:

```yaml
environment:
  GEMINI_API_KEY: ${GEMINI_API_KEY}
```

- [ ] **Step 3: Add basic rate limiting at nginx or API level**

Limit by IP for `/api/ai/*`.

---

## Phase 5: Decompose The App

### Task 9: Move Domain Types And Helpers

**Files:**
- Create: `src/types.ts`
- Create: `src/lib/date.ts`
- Create: `src/lib/languageColors.ts`
- Modify imports throughout `src/`

- [ ] **Step 1: Move types**

Copy the current root `types.ts` into `src/types.ts`.

- [ ] **Step 2: Move date helpers**

```ts
export const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export const getRelativeTimeString = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};
```

- [ ] **Step 3: Move language colors**

Move `LANGUAGE_COLORS` and `getLanguageColor` to `src/lib/languageColors.ts`.

### Task 10: Split Components

**Files:**
- Create all component files listed in File Structure.
- Modify: `src/App.tsx`

- [ ] **Step 1: Extract one component at a time**

Order:

1. `Toast.tsx`
2. `SkeletonCard.tsx`
3. `RepoLanguages.tsx`
4. `RepoActivitySummary.tsx`
5. `RepoCard.tsx`
6. `RepoDetailModal.tsx`
7. `Header.tsx`
8. `MobileNav.tsx`
9. `EmptyState.tsx`

- [ ] **Step 2: Run build after each extraction**

Run:

```bash
npm run build
```

Expected: build passes after every extraction.

- [ ] **Step 3: Delete root monolith**

After `src/App.tsx` is fully assembled and `index.html` points to `/src/main.tsx`, delete root `App.tsx`, `index.tsx`, and root `types.ts`.

---

## Phase 6: Add Tests And Type Discipline

### Task 11: Add Vitest Smoke Tests

**Files:**
- Modify: `package.json`
- Create: `src/lib/storage.test.ts`
- Create: `src/services/github.test.ts`

- [ ] **Step 1: Install test tooling**

```bash
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 2: Add scripts**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "audit": "npm audit --audit-level=moderate"
  }
}
```

- [ ] **Step 3: Test safe storage**

```ts
import { describe, expect, it } from "vitest";
import { parseStoredRepos } from "./storage";

describe("parseStoredRepos", () => {
  it("returns an empty array for corrupt JSON", () => {
    expect(parseStoredRepos("{bad json")).toEqual([]);
  });
});
```

- [ ] **Step 4: Test GitHub rate-limit parsing**

Mock a 403 response with `x-ratelimit-reset` and assert `GitHubApiError.resetAt` is set.

### Task 12: Tighten TypeScript

**Files:**
- Modify: `tsconfig.json`

- [ ] **Step 1: Enable safer checks**

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitOverride": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

- [ ] **Step 2: Replace `motion.div as any`**

Prefer normal `motion.div` usage in extracted components. If a type cast remains necessary, isolate it in one file with a short comment explaining why.

- [ ] **Step 3: Verify**

Run:

```bash
npm run build
npm test
```

Expected: both pass.

---

## Phase 7: Documentation And Release Readiness

### Task 13: Rewrite README

**Files:**
- Modify: `README.md`
- Modify: `README_DOCKGE.md`
- Modify: `.env.example`

- [ ] **Step 1: Replace AI Studio README**

README must include:

- What GitGlance is.
- Local setup.
- Docker setup.
- AI feature status.
- GitHub API rate-limit note.
- Security note that browser env vars are public.
- Troubleshooting.

- [ ] **Step 2: Normalize env docs**

`.env.example`:

```env
VITE_ENABLE_CLIENT_AI=false
```

- [ ] **Step 3: Verify docs commands**

Run every command in the README once:

```bash
npm ci
npm run build
docker build -t gitglance:local .
```

Expected: commands work as documented.

### Task 14: Add CI

**Files:**
- Create: `.github/workflows/ci.yml`
- Modify: `.github/workflows/docker-build.yml`

- [ ] **Step 1: Add CI workflow**

```yaml
name: CI

on:
  pull_request:
  push:
    branches: ["main"]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npm audit --audit-level=moderate
```

- [ ] **Step 2: Make Docker publish depend on CI quality**

Ensure Docker build still runs only after `npm run build` succeeds in its own image build.

---

## Phase 8: Polish Performance

### Task 15: Reduce Bundle Size

**Files:**
- Modify: `src/components/RepoDetailModal.tsx`
- Modify: `src/App.tsx`
- Possibly remove: `recharts`

- [ ] **Step 1: Remove Recharts if the fake chart is gone**

Run:

```bash
npm uninstall recharts
npm run build
```

Expected: build passes and bundle shrinks.

- [ ] **Step 2: Lazy-load the modal**

```tsx
const RepoDetailModal = React.lazy(() => import("./components/RepoDetailModal"));
```

Wrap modal rendering with:

```tsx
<React.Suspense fallback={null}>
  {selectedRepo && <RepoDetailModal ... />}
</React.Suspense>
```

- [ ] **Step 3: Check final bundle**

Run:

```bash
npm run build
```

Target: no Vite chunk warning, or a documented reason for keeping the larger bundle.

---

## Final Verification

- [ ] `npm ci`
- [ ] `npm run build`
- [ ] `npm test`
- [ ] `npm audit --audit-level=moderate`
- [ ] `docker build -t gitglance:local .`
- [ ] `docker compose up -d`
- [ ] `curl -I http://127.0.0.1:8080`
- [ ] Browser smoke test:
  - Trending loads.
  - Latest loads.
  - Save/unsave persists after refresh.
  - Corrupt localStorage does not crash app.
  - GitHub API error shows useful message.
  - Mobile layout has no horizontal overflow.
- [ ] `docker compose down`

---

## Commit Plan

1. `chore: harden docker and nginx deployment`
2. `chore: update dependencies and clear audit`
3. `chore: remove cdn runtime residue`
4. `fix: handle github api errors and storage corruption`
5. `fix: remove simulated star growth chart`
6. `refactor: split app into components and hooks`
7. `test: add core service and storage coverage`
8. `docs: rewrite self-hosting documentation`
9. `perf: reduce client bundle size`

