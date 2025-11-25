# chore: remove device-tracking feature & production hardening

## Summary
Removes the entire device-tracking feature (schema, server routes, storage methods, client page, Docker image assets) and introduces production hardening: structured logging, conditional migrations via `ENABLE_AUTO_MIGRATIONS`, security scanning, and CI/CD workflows. Also updates docs to reflect feature removal and new operational guidance.

## Key Changes
- Removed: tracking-agent folder, related docs, device-tracking schema tables & types, routes, storage functions, client sidebar/page, env flag `ENABLE_DEVICE_TRACKING`.
- Added: Pino logger integration for structured logs.
- Docker: Image no longer bundles tracking-agent; entrypoint respects `ENABLE_AUTO_MIGRATIONS`.
- CI: Build & scan workflows (Trivy), manual migrations workflow.
- Security: Local Trivy scans show no HIGH/CRITICAL after base image pull and dependency audit fix.
- Dependencies: Updated `package-lock.json` (npm install) and applied non-breaking `npm audit fix`.

## Security Scan Results
Artifacts generated locally:
- `trivy-report.json` (initial) contained 1 CRITICAL (Go stdlib) + HIGH items.
- `trivy-report-pulled.json` (after `--pull` rebuild) shows zero HIGH/CRITICAL.
- `trivy-report-post-audit.json` (after `npm audit fix`) maintains zero HIGH/CRITICAL.
All remaining findings are MEDIUM/LOW typical of alpine base + ecosystem libs.

## Migrations
Device-tracking tables removed from code; production DB still needs explicit migration to drop them (to avoid orphaned tables). Provide a manual drizzle migration or retain tables for historical audit until a retention decision is finalized.

Suggested next step migration script (example):
```sql
-- 2025-11-25_drop_device_tracking.sql
DROP TABLE IF EXISTS device_tracking_history;
DROP TABLE IF EXISTS device_tracking;
```
Execute via approved workflow only after data retention sign-off.

## Operational Flags
- `ENABLE_AUTO_MIGRATIONS`: default false; prevents unintended schema changes on startup.
- `ENABLE_DEVICE_TRACKING`: deprecated and removed from env examples.

## Testing
- Build succeeded with reproducible `npm ci` after lockfile sync.
- Frontend build (`npm run build`) completes in Docker multi-stage build.
- No runtime validation failures observed in build logs.

## Follow-Ups
1. Add migration file to drop obsolete tables (post retention decision).
2. Drop legacy device tracking tables (after retention review).
3. Consider switching to a distroless base image to further reduce MEDIUM/LOW noise.
4. Review structured log fields for alignment with observability platform.

## PR Checklist
- [ ] Review removal scope for unintended references.
- [ ] Confirm production DB state & migration plan.
- [ ] Approve security posture (no HIGH/CRITICAL).
- [ ] Merge and tag release.

---
Prepared by automated assistant.
