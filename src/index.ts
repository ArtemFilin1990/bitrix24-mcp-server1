#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { allTools, executeToolCall } from './tools/index.js';

// Initialize the MCP server
const server = new Server({
  name: 'bitrix24-mcp-server',
  version: '1.0.0',
  capabilities: {
    tools: {}
  }
});

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.error('Listing available Bitrix24 tools...');
  return {
    tools: allTools
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  console.error(`Executing tool: ${name} with args:`, JSON.stringify(args, null, 2));
  
  try {
    const result = await executeToolCall(name, args || {});
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (error) {
    console.error(`Tool execution failed [${name}]:`, error);
    
    if (error instanceof McpError) {
      throw error;
    }
    
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});

// Start the server
async function main() {
  console.error('Starting Bitrix24 MCP Server...');
  console.error('Available tools:', allTools.map(t => t.name).join(', '));
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('Bitrix24 MCP Server running on stdio transport');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

// Export for Vercel Edge deployment
export { allTools };

/**
 * startMCPServer - Edge-compatible MCP server handler for Vercel deployment
 * Handles JSON-RPC requests and returns SSE stream with responses
 */
export async function startMCPServer(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }

  // Handle GET request - return server info and available tools
  if (req.method === 'GET') {
    const serverInfo = {
      name: 'bitrix24-mcp-server',
      version: '1.0.0',
      capabilities: {
        tools: {}
      },
      tools: allTools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }))
    };
    return new Response(JSON.stringify(serverInfo, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  // Handle POST request - JSON-RPC
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const { method, params, id } = body as { method: string; params?: Record<string, unknown>; id?: string | number };

      // Handle JSON-RPC initialize method
      if (method === 'initialize') {
        const initResponse = {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: 'bitrix24-mcp-server',
              version: '1.0.0'
            }
          }
        };
        return new Response(JSON.stringify(initResponse), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // Handle tools/list method
      if (method === 'tools/list') {
        const toolsResponse = {
          jsonrpc: '2.0',
          id,
          result: {
            tools: allTools.map(tool => ({
              name: tool.name,
              description: tool.description,
              inputSchema: tool.inputSchema
            }))
          }
        };
        return new Response(JSON.stringify(toolsResponse), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // Handle tools/call method
      if (method === 'tools/call') {
        const toolParams = params as { name: string; arguments?: Record<string, unknown> };
        const toolName = toolParams?.name;
        const toolArgs = toolParams?.arguments || {};

        if (!toolName) {
          return new Response(JSON.stringify({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32602,
              message: 'Invalid params: tool name is required'
            }
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

        try {
          const result = await executeToolCall(toolName, toolArgs);
          const callResponse = {
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
                }
              ]
            }
          };
          return new Response(JSON.stringify(callResponse), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        } catch (toolError) {
          return new Response(JSON.stringify({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32603,
              message: `Tool execution failed: ${toolError instanceof Error ? toolError.message : String(toolError)}`
            }
          }), {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
      }

      // Unknown method
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: `Method not found: ${method}`
        }
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } catch (parseError) {
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: `Parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`
        }
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }

  // Method not allowed
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Allow': 'GET, POST, OPTIONS'
    }
  });
}
