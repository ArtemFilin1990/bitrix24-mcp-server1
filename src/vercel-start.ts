export async function startMCPServer(req: Request) {
  // Try primary entry: src/index(.ts/.js)
  try {
    const mod = await import('./index.js').catch(() => null) as any;
    if (mod) {
      if (typeof mod.startMCPServer === 'function') {
        return await mod.startMCPServer(req);
      }
      if (typeof mod.default === 'function') {
        return await mod.default(req);
      }
    }
  } catch (err) {
    // fallthrough to other attempts
  }

  // Try common alternate entry names
  try {
    // Use variable to prevent static module resolution
    const serverPath = './server.js';
    const alt = await import(/* webpackIgnore: true */ serverPath).catch(() => null) as any;
    if (alt) {
      if (typeof alt.startMCPServer === 'function') return await alt.startMCPServer(req);
      if (typeof alt.default === 'function') return await alt.default(req);
    }
  } catch (err) {}

  throw new Error('startMCPServer is not exported from src/index or other expected entrypoints. Please export async function startMCPServer(req: Request).');
}
