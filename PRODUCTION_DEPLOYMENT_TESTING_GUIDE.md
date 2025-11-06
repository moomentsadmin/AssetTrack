# Production Deployment Testing Guide

This guide provides a step-by-step checklist for testing the AssetTrack application after a production deployment. It is designed to be used with the official deployment guides for Docker and Ubuntu.

## 🧪 Pre-Launch Testing Checklist

### 1. Environment Configuration
- [ ] Verify that `NODE_ENV` is set to `production`.
- [ ] Ensure `DATABASE_URL` is correctly configured for your production database.
- [ ] Confirm that a strong, unique `SESSION_SECRET` has been generated and set.

### 2. Docker Deployment Verification
- [ ] **Internal Database**: Run `docker compose ps` and confirm both `asset-app` and `asset-db` containers are `running (healthy)`.
- [ ] **External Database**: Run `docker compose -f docker-compose.production.yml ps` and confirm the `asset-app` container is `running (healthy)`.

### 3. Ubuntu Deployment Verification
- [ ] Run `pm2 status` and confirm the `asset-management` process has a status of `online`.
- [ ] Run `systemctl status nginx` and confirm the Nginx service is `active (running)`.
- [ ] Run `systemctl status postgresql` and confirm the PostgreSQL service is `active (running)`.

## 🚀 Application Health & Functionality

### 1. Health Checks
- [ ] Access the application's health check endpoint at `http://<your_domain_or_ip>:5000/api/health` and confirm it returns an `OK` status.

### 2. Initial Setup
- [ ] Access the application in your browser.
- [ ] Complete the initial setup process by creating the administrator account.

### 3. Core Functionality
- [ ] Log in with the administrator credentials.
- [ ] Create a new asset.
- [ ] Edit an existing asset.
- [ ] Delete an asset.

## 🔒 Security Checks

### 1. HTTPS & SSL/TLS
- [ ] If using Nginx, confirm that accessing the application via `http://` automatically redirects to `https://`.
- [ ] Use an online SSL checker to verify the SSL/TLS certificate is valid and properly configured.

### 2. Headers
- [ ] Use your browser's developer tools to inspect the network requests and confirm that security-related headers (e.g., `X-Frame-Options`, `X-Content-Type-Options`) are present.

##  DATABASE MIGRATIONS

- [ ] After any schema changes, confirm that the new migration was generated using `npm run db:generate`.
- [ ] Verify that the generated SQL was reviewed and applied manually to the production database *before* deploying the new application code.