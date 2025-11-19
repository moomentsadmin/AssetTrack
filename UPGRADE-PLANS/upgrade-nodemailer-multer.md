# Upgrade plan: nodemailer & multer

Goal: Upgrade `nodemailer` and `multer` to latest majors and validate runtime behavior.

Scope
- `nodemailer` (current 7.x) → upgrade to latest stable major
- `multer` (current 2.x) → upgrade to latest stable major and update usage if API changes

Checklist
- [ ] Create `chore/upgrade-nodemailer-multer` branch (done)
- [ ] Update `package.json` dependencies for `nodemailer` and `multer`
- [ ] Run `npm i` and resolve peer warnings
- [ ] Run `npm run build` and `npm run check` to find compile-time issues
- [ ] Review runtime code that uses `multer` (file uploads) and `nodemailer` (email templates/transport)
- [ ] Run local end-to-end tests for upload endpoints and email sending (use test SMTP or mocked transport)
- [ ] Commit lockfile changes, push branch, open PR with README on behavioural changes required

Rollout notes
- Nodemailer 7 introduced ESM-first changes; ensure `import` usage remains consistent
- Multer 2 may require small API adjustments in middleware usage; check `@types/multer` alignment

Risks
- Email transport config may need small updates
- Upload middleware breaking changes affecting file parsing

Testing
- Upload a CSV import and verify parsing
- Trigger password reset or email-based flows and verify transport (use console transport locally)

Estimated time: 1-3 hours (depends on API changes and test coverage)
