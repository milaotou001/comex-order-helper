# Port Registry

Current local and server port planning for this workspace:

- `3000`: `comex-order-helper`
- `3001`: reserved for the next small project
- `3002+`: keep available for future small projects unless explicitly assigned

## Guidance

- One project should own one primary port.
- When adding a new small Next.js project, assign the next free port before creating the PM2 process and Nginx proxy.
- Keep the chosen port documented in the project README and deployment template.
