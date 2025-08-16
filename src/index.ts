#!/usr/bin/env node

/**
 * VPS Memory MCP Server - Main Entry Point
 * Production-ready Model Context Protocol server for VPS memory system
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';

import { VPSMemoryClient } from './vps-client.js';
import { VPSMemoryTools } from './tools.js';
import { VPSMemoryError } from './types.js';

class VPSMemoryMCPServer {
  private server: Server;
  private client: VPSMemoryClient;
  private tools: VPSMemoryTools;

  constructor() {
    // Initialize MCP server
    this.server = new Server(
      {
        name: 'vps-memory-mcp-server',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    // Initialize VPS client with environment-based configuration
    this.client = new VPSMemoryClient({
      baseUrl: process.env.VPS_MEMORY_BASE_URL || 'http://185.163.117.155:8080',
      apiKey: process.env.VPS_MEMORY_API_KEY || 'cf89c3896dd1f14728b81c7be45e7d30d48e75517deb6e3c22335ff0a1635484',
      timeout: parseInt(process.env.VPS_MEMORY_TIMEOUT || '30000'),
      retryAttempts: parseInt(process.env.VPS_MEMORY_RETRY_ATTEMPTS || '3'),
      retryDelay: parseInt(process.env.VPS_MEMORY_RETRY_DELAY || '1000')
    });

    // Initialize tools
    this.tools = new VPSMemoryTools(this.client);

    this.setupHandlers();
  }

  /**
   * Setup MCP protocol handlers
   */
  private setupHandlers(): void {
    // Handle tools/list requests
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      try {
        const tools = this.tools.getTools();
        return { tools };
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to list tools: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });

    // Handle tools/call requests
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        // Validate tool exists
        const availableTools = this.tools.getTools();
        const tool = availableTools.find(t => t.name === name);
        
        if (!tool) {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Tool '${name}' not found. Available tools: ${availableTools.map(t => t.name).join(', ')}`
          );
        }

        // Execute tool
        return await this.tools.executeTool(name, args);
        
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        
        if (error instanceof VPSMemoryError) {
          // Map VPS errors to appropriate MCP errors
          const errorCode = error.statusCode === 400 ? ErrorCode.InvalidParams :
                           error.statusCode === 401 ? ErrorCode.InvalidRequest :
                           error.statusCode === 404 ? ErrorCode.MethodNotFound :
                           ErrorCode.InternalError;
          
          throw new McpError(errorCode, `VPS Memory Error: ${error.message}`);
        }

        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });

    // Error handling
    this.server.onerror = (error) => {
      console.error('MCP Server Error:', error);
    };

    // Setup graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Received SIGINT, shutting down gracefully...');
      await this.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('Received SIGTERM, shutting down gracefully...');
      await this.shutdown();
      process.exit(0);
    });
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    try {
      // Validate VPS connection before starting
      console.log('Validating VPS memory connection...');
      const isConnected = await this.client.validateConnection();
      
      if (!isConnected) {
        console.warn('⚠️  Warning: Could not connect to VPS memory server. Server will start but tools may fail.');
      } else {
        console.log('✅ VPS memory connection validated');
        
        // Get initial stats
        try {
          const stats = await this.client.getStats();
          console.log(`📊 Connected to memory database with ${stats.totalMemories} memories`);
        } catch (error) {
          console.warn('Could not retrieve initial stats:', error instanceof Error ? error.message : String(error));
        }
      }

      // Start MCP server with stdio transport
      console.log('Starting VPS Memory MCP Server...');
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      console.log('✅ VPS Memory MCP Server started successfully');
      console.log(`Session ID: ${this.client.getSessionId()}`);
      console.log('Available tools:', this.tools.getTools().map(t => t.name).join(', '));
      
    } catch (error) {
      console.error('❌ Failed to start VPS Memory MCP Server:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  private async shutdown(): Promise<void> {
    try {
      console.log('Shutting down VPS Memory MCP Server...');
      // Add any cleanup logic here
      console.log('✅ Server shutdown complete');
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }
}

// CLI handling
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
VPS Memory MCP Server v1.0.0

A production-ready Model Context Protocol server for VPS memory system.
Provides access to 790+ memories through semantic search and storage operations.

Usage:
  vps-memory-mcp-server [options]

Options:
  --help, -h     Show this help message
  --version, -v  Show version information
  --test         Test VPS connection and exit

Environment Variables:
  VPS_MEMORY_BASE_URL         VPS server base URL (default: http://185.163.117.155:8080)
  VPS_MEMORY_API_KEY          VPS API key for authentication
  VPS_MEMORY_TIMEOUT          Request timeout in ms (default: 30000)
  VPS_MEMORY_RETRY_ATTEMPTS   Retry attempts for failed requests (default: 3)
  VPS_MEMORY_RETRY_DELAY      Delay between retries in ms (default: 1000)

Tools:
  memory_search    Search memories using semantic similarity
  memory_store     Store new memory content with metadata
  memory_stats     Get memory database statistics
  memory_list      List recent memories with filtering
  memory_health    Check server health and connectivity

Examples:
  # Start server
  vps-memory-mcp-server

  # Test connection
  vps-memory-mcp-server --test

  # Use with Claude Code
  Add to ~/.claude.json:
  {
    "mcpServers": {
      "vps-memory": {
        "command": "npx",
        "args": ["vps-memory-mcp-server"]
      }
    }
  }
`);
    return;
  }

  if (args.includes('--version') || args.includes('-v')) {
    console.log('vps-memory-mcp-server v1.0.0');
    return;
  }

  if (args.includes('--test')) {
    console.log('Testing VPS memory connection...');
    const client = new VPSMemoryClient();
    
    try {
      console.log('Attempting health check...');
      const health = await client.healthCheck();
      console.log('Health check result:', health);
      
      if (health.status === 'healthy') {
        console.log('Attempting to get stats...');
        const stats = await client.getStats();
        console.log('Stats result:', stats);
        
        console.log('✅ Connection successful!');
        console.log(`📊 Total memories: ${stats.totalMemories}`);
        console.log(`💚 Server status: ${health.status}`);
        console.log(`🔧 Version: ${health.version}`);
        console.log(`⏱️  Session ID: ${client.getSessionId()}`);
      } else {
        console.log(`❌ Connection failed - status: ${health.status}`);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Connection test failed:', error instanceof Error ? error.message : String(error));
      console.error('Error details:', error);
      process.exit(1);
    }
    return;
  }

  // Start the server
  const server = new VPSMemoryMCPServer();
  await server.start();
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { VPSMemoryMCPServer };