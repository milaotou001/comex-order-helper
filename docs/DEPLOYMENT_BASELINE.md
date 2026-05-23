# Deployment Baseline

This repository uses the following default deployment baseline for small Next.js projects:

- Alibaba Cloud lightweight application server
- Baota Panel available on the server
- Nginx reverse proxy
- Node.js v20.20.2
- PM2 for long-running process management
- Public verification starts with IP + HTTP

## Current comex-order-helper baseline

- Project path: `/www/wwwroot/comex-order-helper`
- PM2 process name: `comex-order-helper`
- Port: `3000`
- Source branch: `codex/continuous-refresh`

## Standard flow

1. GitHub Actions receives a push on the deployment branch.
2. The workflow connects to the Alibaba Cloud server by SSH.
3. The server runs `bash deploy.sh` in the project directory.
4. `deploy.sh` pulls the latest code, installs dependencies, builds the app, restarts PM2, and saves the process list.
5. Nginx keeps forwarding HTTP traffic to the local Next.js process.

## New project rule of thumb

- Keep the project directory explicit.
- Keep PM2 process names unique per project.
- Keep the deployment branch explicit.
- Use the same workflow shape for each small Next.js project.
