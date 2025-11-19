# Upgrade plan: Vite & esbuild

Goal: Upgrade `vite` and `esbuild` to latest stable major versions with minimal disruption.

Scope
- `vite` (current ~7.x) → target latest stable (8.x+ if available)
- `esbuild` (current 0.27.0) → target latest stable (≥0.28/0.29+)

Checklist
- [ ] Create a branch `chore/upgrade-vite-esbuild` (done)
- [ ] Update `package.json` devDependencies: `vite`, `esbuild`, `@vitejs/plugin-react` if needed
- [ ] Run `npm i` and resolve peer warnings (use `--legacy-peer-deps` if necessary)
- [ ] Run `npm run build` and fix build issues (PostCSS warning, plugin changes)
- [ ] Run `npm run check` (tsc) and fix typing issues caused by plugin upgrades
- [ ] Run app locally and smoke test core flows (login, asset list, create asset)
- [ ] Run `npm audit` and capture remaining vulnerabilities
- [ ] Commit lockfile changes, push branch, open PR with testing checklist and rollout plan

Rollout notes
- If Vite major introduces breaking changes (config rename/options), apply changes in `vite.config.ts` and test.
- Monitor chunk size & consider manualChunks for large bundles.

Risks
- Tailwind/PostCSS or plugin compatibility causing CSS processing changes
- Plugin API changes (React plugin) requiring small config edits

Testing
- `npm run build`, `npm run check`, `npm run dev`, manual verification of core pages

Estimated time: 1-4 hours depending on breaking changes found.
