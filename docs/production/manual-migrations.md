**Manual Migrations (GitHub Actions)**

This project runs database migrations from a built Docker image using a manual GitHub Actions workflow. The workflow file is `.github/workflows/run-migrations.yml` and is designed to require explicit approval via GitHub Environments.

How it works
- A maintainer triggers the workflow from the GitHub Actions UI (`Run workflow`).
- The workflow pulls a Docker image from Docker Hub (tag provided by the trigger) and runs `npx drizzle-kit push:pg` inside the container using the repository `DATABASE_URL` secret.
- The workflow uses the `production` environment so repository admins can require approvals or specific reviewers before the job runs.

Best practice
- Trigger migrations only after verifying the image tag corresponds to the exact commit you intend to deploy (prefer commit SHA tags).
- Protect the `production` environment in GitHub (Repository Settings → Environments → production) and configure required reviewers.
- Use a staging environment to test migrations prior to running them in production.

How to run (UI)
1. Go to the repository on GitHub → Actions → "Run Migrations (manual)".
2. Click "Run workflow".
3. Set `image_tag` to the image you want to run migrations from (e.g., a commit SHA or `latest`).
4. Click "Run workflow". The run will pause for approvals if the `production` environment is protected.

How to run (gh CLI)
```powershell
gh workflow run "Run Migrations (manual)" --ref main -f image_tag="<your-tag>"
```

Notes
- Ensure `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, and `DATABASE_URL` are configured as repository secrets before running.
- The workflow runs `npx drizzle-kit push:pg` inside the container; you can modify the workflow if you need additional migration flags.
