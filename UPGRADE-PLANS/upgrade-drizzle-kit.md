# Upgrade plan: drizzle-kit / drizzle-orm

Goal: Upgrade `drizzle-kit` and `drizzle-orm` to current compatible majors and ensure migration tooling works in CI and production images.

Scope
- `drizzle-kit` (currently ~0.17/0.31) → upgrade to latest stable (0.19+ or latest)
- `drizzle-orm` (current 0.44.7) → upgrade to latest stable if required by drizzle-kit

Checklist
- [ ] Create `chore/upgrade-drizzle-kit` branch (done)
- [ ] Review `drizzle-kit` CLI changes: note `push` vs `push:pg` command differences
- [ ] Update `package.json` devDependencies for `drizzle-kit` and `drizzle-orm`
- [ ] Ensure `drizzle.config.ts` remains compatible; copy into production image in Dockerfile if migrations run in-container
- [ ] Run `npx drizzle-kit --help` to validate CLI commands in the upgraded package
- [ ] Run migrations in a containerized environment (compose network) and validate schema
- [ ] Update Dockerfile to install required CLI (if needed) in a dedicated stage
- [ ] Commit lockfile changes, push branch, open PR with migration runbook and rollback steps

Rollout notes
- Prefer a staged migration: run migrations in a single-shot runner container before updating app images.
- Keep backup of DB or enable point-in-time recovery before migrations.

Risks
- CLI renames or option changes require updating scripts (`db:push` etc.)
- Newer drizzle-kit may change migration SQL; test thoroughly in staging.

Testing
- Run `npm ci` then `npm run db:push` against a staging DB
- Validate tables and relations, run app smoke tests

Estimated time: 1-3 hours (depends on CLI changes and migration complexity)
