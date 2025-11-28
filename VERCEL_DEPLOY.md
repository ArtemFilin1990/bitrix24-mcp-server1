# Vercel deployment (Edge MCP endpoint)

This repository includes a Vercel Edge Function endpoint for the MCP server.

- Endpoint: /api/mcp
- Example production URL: https://<project-name>.vercel.app/api/mcp

Files added:
- vercel.json — marks `api/mcp.ts` as `edge` runtime.
- api/mcp.ts — Edge function handler that delegates to your server implementation.
- src/vercel-start.ts — compatibility wrapper (delegates to `src/index` exports).
- .env.example — environment variables example.

Requirements:
- Ensure `src/index` exports `startMCPServer(req: Request)` or `default` handler that accepts a Request and returns:
  - Response (edge Response), or
  - ReadableStream with SSE events, or
  - Object { stream: ReadableStream }.

SSE / CORS:
- The Edge handler sets `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive` and `Access-Control-Allow-Origin: *`.

Build:
- Ensure `npm run build` compiles TypeScript (if used) and outputs files as expected.
- Vercel will run the build step; make sure tsconfig and package.json scripts are configured.

If your project uses a different entrypoint, update `api/mcp.ts` import to point to the correct module.
