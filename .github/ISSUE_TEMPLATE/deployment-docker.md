---
name: Docker Deployment Issue
about: Problems deploying with Docker or Docker Compose
title: '[Docker] '
labels: deployment, docker
assignees: ''
---

## Problem Description
Brief description of the Docker deployment issue.

## Environment
- **Docker version**: (run `docker --version`)
- **Docker Compose version**: (run `docker-compose --version` or `docker compose version`)
- **OS**: 

## Steps to Reproduce
1. 
2. 
3. 

## Error Output
```
(Paste error logs here)
```

## Common Solutions

### Container Exits Immediately
**Check logs**:
```bash
docker-compose logs app
docker-compose logs db
```

### Database Connection Refused
**Ensure database is healthy**:
```bash
docker-compose ps
# Database should show "healthy" status
```

**Check DATABASE_URL in docker-compose.yml**:
```yaml
environment:
  DATABASE_URL: postgresql://user:pass@db:5432/dbname?sslmode=disable
  # Note: hostname is 'db' (service name), not 'localhost'
```

### Build Failures
**Clean build**:
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Permission Issues
**Check file permissions**:
```bash
ls -la
# Ensure you own the files, not root
```

## Expected Behavior
What you expected to happen.

## Additional Context
- Using internal database (Docker Postgres) or external?
- Custom docker-compose.yml modifications?
- Environment variables configured?

## Related Documentation
- [Docker Deployment Guide](../../DEPLOYMENT.md#docker-deployment)
