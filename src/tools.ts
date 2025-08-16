/**
 * VPS Memory MCP Tools - Clean API Design
 * Production-ready tool implementations with comprehensive error handling
 */

import {
  CallToolRequestSchema,
  CallToolResult,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { VPSMemoryClient } from './vps-client.js';
import {
  MemorySearchSchema,
  MemoryStoreSchema,
  MemoryListSchema,
  MemorySearchInput,
  MemoryStoreInput,
  MemoryListInput,
  VPSMemoryError,
  ToolResult
} from './types.js';

export class VPSMemoryTools {
  private client: VPSMemoryClient;

  constructor(client: VPSMemoryClient) {
    this.client = client;
  }

  /**
   * Get all available tools
   */
  getTools(): Tool[] {
    return [
      {
        name: 'memory_search',
        description: 'Search through 790+ memories using semantic similarity matching. Find relevant solutions, patterns, code contexts, and conversations.',
        inputSchema: MemorySearchSchema as any
      },
      {
        name: 'memory_store',
        description: 'Store new memory content with metadata and automatic categorization. Adds to the persistent memory database.',
        inputSchema: MemoryStoreSchema as any
      },
      {
        name: 'memory_stats',
        description: 'Get comprehensive statistics about the memory database including total count, type distribution, and server health.',
        inputSchema: { type: 'object', properties: {} } as any
      },
      {
        name: 'memory_list',
        description: 'List recent memories with optional filtering by type. Supports pagination for large result sets.',
        inputSchema: MemoryListSchema as any
      },
      {
        name: 'memory_health',
        description: 'Check memory server health, connectivity, and performance metrics. Returns detailed status information.',
        inputSchema: { type: 'object', properties: {} } as any
      }
    ];
  }

  /**
   * Execute tool based on name and arguments
   */
  async executeTool(name: string, args: unknown): Promise<CallToolResult> {
    try {
      switch (name) {
        case 'memory_search':
          return await this.handleMemorySearch(args);
        case 'memory_store':
          return await this.handleMemoryStore(args);
        case 'memory_stats':
          return await this.handleMemoryStats();
        case 'memory_list':
          return await this.handleMemoryList(args);
        case 'memory_health':
          return await this.handleMemoryHealth();
        default:
          return this.createErrorResult(`Unknown tool: ${name}`);
      }
    } catch (error) {
      if (error instanceof VPSMemoryError) {
        return this.createErrorResult(`VPS Error: ${error.message}`, error.details);
      }
      return this.createErrorResult(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handle memory search tool
   */
  private async handleMemorySearch(args: unknown): Promise<CallToolResult> {
    const input = this.validateInput(MemorySearchSchema, args) as MemorySearchInput;
    
    const results = await this.client.searchMemory(input.query, {
      limit: input.limit,
      threshold: input.threshold,
      type: input.type,
      includeSession: input.includeSession
    });

    const summary = this.createSearchSummary(input.query, results);
    const formattedResults = this.formatSearchResults(results);

    return {
      content: [
        {
          type: 'text',
          text: `${summary}\n\n${formattedResults}`
        }
      ],
      isError: false
    };
  }

  /**
   * Handle memory store tool
   */
  private async handleMemoryStore(args: unknown): Promise<CallToolResult> {
    const input = this.validateInput(MemoryStoreSchema, args) as MemoryStoreInput;
    
    const enhancedMetadata = {
      ...input.metadata,
      tags: input.tags,
      storedAt: new Date().toISOString(),
      source: 'mcp-server'
    };

    const memoryId = await this.client.storeMemory(
      input.content,
      input.type,
      enhancedMetadata
    );

    return {
      content: [
        {
          type: 'text',
          text: `✅ Memory stored successfully!\n\n` +
                `ID: ${memoryId}\n` +
                `Type: ${input.type}\n` +
                `Content: ${input.content.substring(0, 100)}${input.content.length > 100 ? '...' : ''}\n` +
                `Tags: ${input.tags.join(', ') || 'none'}\n` +
                `Timestamp: ${new Date().toISOString()}`
        }
      ],
      isError: false
    };
  }

  /**
   * Handle memory stats tool
   */
  private async handleMemoryStats(): Promise<CallToolResult> {
    const stats = await this.client.getStats();
    
    const typesSummary = Object.entries(stats.memoryTypes)
      .map(([type, count]) => `  • ${type}: ${count}`)
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `📊 Memory Database Statistics\n\n` +
                `Total Memories: ${stats.totalMemories}\n` +
                `Server Status: ${stats.serverStatus}\n` +
                `Last Updated: ${stats.lastUpdated}\n\n` +
                `Memory Types:\n${typesSummary || '  • No type data available'}`
        }
      ],
      isError: false
    };
  }

  /**
   * Handle memory list tool
   */
  private async handleMemoryList(args: unknown): Promise<CallToolResult> {
    const input = this.validateInput(MemoryListSchema, args) as MemoryListInput;
    
    const memories = await this.client.listMemories({
      type: input.type,
      limit: input.limit,
      offset: input.offset
    });

    const typeFilter = input.type ? ` (${input.type})` : '';
    const pagination = input.offset > 0 ? ` (offset: ${input.offset})` : '';
    
    const formattedList = memories.map((memory, index) => {
      const preview = memory.content.substring(0, 150);
      const truncated = memory.content.length > 150 ? '...' : '';
      
      return `${input.offset + index + 1}. [${memory.type}] ${memory.id}\n` +
             `   ${preview}${truncated}\n` +
             `   Created: ${memory.timestamp || 'unknown'}`;
    }).join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `📝 Recent Memories${typeFilter}${pagination}\n\n` +
                `Found ${memories.length} memories:\n\n` +
                (formattedList || 'No memories found.')
        }
      ],
      isError: false
    };
  }

  /**
   * Handle memory health tool
   */
  private async handleMemoryHealth(): Promise<CallToolResult> {
    const health = await this.client.healthCheck();
    
    const statusIcon = health.status === 'healthy' ? '💚' : 
                      health.status === 'degraded' ? '⚠️' : '❌';
    
    const uptimeDisplay = health.uptime > 0 ? 
      `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m` : 
      'unknown';

    return {
      content: [
        {
          type: 'text',
          text: `${statusIcon} Memory Server Health Check\n\n` +
                `Status: ${health.status}\n` +
                `Uptime: ${uptimeDisplay}\n` +
                `Version: ${health.version}\n` +
                `Memory Count: ${health.memoryCount}\n` +
                `Last Check: ${health.lastCheck}\n\n` +
                `Connection: ${await this.client.validateConnection() ? '✅ Connected' : '❌ Disconnected'}`
        }
      ],
      isError: false
    };
  }

  /**
   * Validate input against schema
   */
  private validateInput(schema: any, args: unknown): unknown {
    try {
      return schema.parse(args);
    } catch (error) {
      throw new VPSMemoryError(
        `Invalid input: ${error instanceof Error ? error.message : 'Unknown validation error'}`,
        'VALIDATION_ERROR',
        400,
        { args, error }
      );
    }
  }

  /**
   * Create search summary
   */
  private createSearchSummary(query: string, results: any[]): string {
    const count = results.length;
    const avgSimilarity = count > 0 ? 
      (results.reduce((sum, r) => sum + (r.similarity || 0), 0) / count * 100).toFixed(1) : 
      '0';
    
    return `🔍 Search Results for "${query}"\n` +
           `Found ${count} memories (avg similarity: ${avgSimilarity}%)`;
  }

  /**
   * Format search results for display
   */
  private formatSearchResults(results: any[]): string {
    if (results.length === 0) {
      return 'No memories found matching your query.';
    }

    return results.map((memory, index) => {
      const similarity = memory.similarity ? (memory.similarity * 100).toFixed(1) : '0';
      const preview = memory.content.substring(0, 200);
      const truncated = memory.content.length > 200 ? '...' : '';
      
      return `${index + 1}. [${memory.type}] ${similarity}% similarity\n` +
             `   ID: ${memory.id}\n` +
             `   ${preview}${truncated}\n` +
             `   Timestamp: ${memory.timestamp || 'unknown'}`;
    }).join('\n\n');
  }

  /**
   * Create error result
   */
  private createErrorResult(message: string, details?: unknown): CallToolResult {
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error: ${message}${details ? `\n\nDetails: ${JSON.stringify(details, null, 2)}` : ''}`
        }
      ],
      isError: true
    };
  }
}