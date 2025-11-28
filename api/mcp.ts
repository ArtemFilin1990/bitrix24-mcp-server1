export const config = { runtime: 'edge' };

import { startMCPServer } from '../src/index';

export default async function handler(req: Request) {
  try {
    return await startMCPServer(req);
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
