PR Title:
Production docs + CI improvements (Docker Hub + GHCR, Trivy, manual migrations, pino)

PR Body:
Summary
- Adds provider-specific production deployment documentation and a `.env.production.example`.
- CI/CD: builds and publishes Docker images to Docker Hub and GHCR, tags images by `latest`, commit SHA and ref name, runs a Trivy scan (fails on HIGH+), and gates migrations behind a manual GitHub Actions workflow that runs migrations inside a pulled Docker image.
- Adds structured server logging with `pino` (and `pino-pretty` in dev).
- Fixes tracking-agent downloads by including `tracking-agent` in the production image and updating the client link.

Files / areas changed
- `.github/workflows/ci-cd.yml` — build/publish + GHCR + Trivy scan
- `.github/workflows/run-migrations.yml` — manual migration workflow (workflow_dispatch) using `production` environment approval
- `docs/production/*` — new provider-specific deployment guides and `.env.production.example`
- `package.json` — added `pino` and `pino-pretty`
- `server/logger.ts` — pino-based logger
- `server/vite.ts`, `server/routes.ts`, `server/index.ts` — use structured logging / safer date handling
- `client/src/pages/device-tracking-page.tsx` — download link change
- `Dockerfile` — copy `tracking-agent` into production image

Why
- Safer production deployments: manual migration approval and image-based migration ensures the same artifact that was tested is used to run migrations.
- Better observability: structured logs make aggregating and searching logs easier.
- Security: container image scans with Trivy before publishing reduce risk of shipping vulnerable images.
- User experience: tracking-agent downloads now work in containerized production.

Reviewer checklist
- [ ] Run local build: `npm ci` and `npm run build` (verify no build errors).
- [ ] Run dev server: `npm run dev` and check `GET /health`.
- [ ] Review `docs/production/*` and confirm provider-specific instructions match your infra.
- [ ] Verify `Dockerfile` changes (no large unwanted artifacts added).
- [ ] Confirm required Actions secrets are set: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `DATABASE_URL`. (GHCR uses `GITHUB_TOKEN` automatically.)
- [ ] Configure repo environment protection for `production` (required reviewers) so manual migrations require approval.
- [ ] Optional: run Trivy locally or inspect CI Trivy output to confirm acceptable vulnerability levels.
- [ ] Sanity check frontend: open Device Tracking page, click Download Agent, confirm `/tracking-agent/` loads.

Suggested labels / reviewers
- Labels: `chore`, `ci`, `docs`, `security` (optional)
- Reviewers: Backend lead / DB owner, DevOps/SRE, Frontend owner

Suggested merge strategy
- Create PR → request reviews from Backend & DevOps → merge after approvals and verifying Actions run successfully in the PR context. For `main`, prefer manual approval for migrations.
