export const config = { runtime: 'edge' };

import { startMCPServer } from '../src/index';

async function toResponse(stream: ReadableStream) {
  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

export default async function handler(req: Request) {
  // startMCPServer должен принять Request и вернуть ReadableStream или Response
  try {
    const maybe = await startMCPServer(req);
    if (maybe instanceof Response) return maybe;
    if (maybe && typeof maybe.getReader === 'function') {
      return toResponse(maybe as ReadableStream);
    }
    // Ожидаем объект со свойством stream
    if (maybe && maybe.stream) return toResponse(maybe.stream);
    // fallback: попытка вернуть JSON error
    return new Response(JSON.stringify({ error: 'startMCPServer returned unexpected value' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
