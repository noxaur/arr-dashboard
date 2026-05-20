# Agent Rules

## Security

- **NEVER commit `.env.local`, `docker-compose.yml`, or any file containing secrets**
- Before committing, run `git diff --cached --name-only` and verify no env files or credential files are staged
- `.gitignore` must always exclude `.env.local`, `docker-compose.yml`, and `*.env`
- If a secret is accidentally staged, stop immediately and unstage it

## Docker

- Before committing changes, build and verify the Docker image works: `docker compose up -d --build`
- Test the container starts and serves the dashboard on port 3000
- All environment variables must be defined in `docker-compose.yml` (source of truth for production)
- `.env.local` is for local development only

## Development Workflow

1. Make changes
2. Run lint: `npm run lint`
3. Build Docker image and verify it works
4. Verify no secrets are staged
5. Commit

## Code Style

- TypeScript strict mode
- No comments unless explicitly requested
- Follow existing patterns in the codebase
- OKLCH color system for all styling
