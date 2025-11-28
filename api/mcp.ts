export const config = { runtime: 'edge' };

import { startMCPServer } from '../src/vercel-start';

/**
 * Wrap ReadableStream into Edge Response with SSE headers.
 */
function sseResponse(stream: ReadableStream) {
  return new Response(stream as unknown as ReadableStream, {
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
  try {
    const result = await startMCPServer(req);

    // If the implementation already returned a Response
    if (result instanceof Response) return result;

    // If returned a ReadableStream (Edge Web Streams)
    if (result && typeof (result as any).getReader === 'function') {
      return sseResponse(result as ReadableStream);
    }

    // If returned an object { stream: ReadableStream }
    if (result && (result as any).stream && typeof (result as any).stream.getReader === 'function') {
      return sseResponse((result as any).stream as ReadableStream);
    }

    // If result is regular JSON (fallback)
    if (result && typeof result === 'object') {
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response(JSON.stringify({ error: 'startMCPServer returned unexpected value' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
