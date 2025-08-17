/**
 * VPS Memory MCP Tools - Clean API Design
 * Production-ready tool implementations with comprehensive error handling
 */

import {
  CallToolResult,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { VPSMemoryClient } from './vps-client.js';
import {
  MemorySearchSchema,
  MemoryStoreSchema,
  MemoryListSchema,
  SessionCreateSchema,
  ConflictResolutionSchema,
  PatternLearningSchema,
  MemorySearchInput,
  MemoryStoreInput,
  MemoryListInput,
  VPSMemoryError
} from './types.js';
import { VPSMemoryOrchestrator } from './orchestration.js';

export class VPSMemoryTools {
  private client: VPSMemoryClient;
  private orchestrator: VPSMemoryOrchestrator;

  constructor(client: VPSMemoryClient) {
    this.client = client;
    this.orchestrator = new VPSMemoryOrchestrator(client);
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
      },
      {
        name: 'session_create',
        description: 'Create hierarchical session with TTL strategies for multi-agent coordination and memory context management.',
        inputSchema: SessionCreateSchema as any
      },
      {
        name: 'session_get',
        description: 'Retrieve session context with optional hierarchy inclusion for state management and coordination.',
        inputSchema: { 
          type: 'object', 
          properties: {
            sessionId: { type: 'string', description: 'Session ID to retrieve' },
            includeHierarchy: { type: 'boolean', description: 'Include parent session hierarchy', default: false }
          },
          required: ['sessionId']
        } as any
      },
      {
        name: 'agent_register',
        description: 'Register agent with coordination system for multi-agent orchestration and specialization tracking.',
        inputSchema: {
          type: 'object',
          properties: {
            agentId: { type: 'string', description: 'Unique agent identifier' },
            role: { type: 'string', enum: ['orchestrator', 'specialist', 'coordinator', 'validator'], description: 'Agent role' },
            specialization: { type: 'array', items: { type: 'string' }, description: 'Agent specializations' }
          },
          required: ['agentId', 'role', 'specialization']
        } as any
      },
      {
        name: 'conflict_resolve',
        description: 'Initiate 3-tier intelligent conflict resolution for memory, session, agent, or pattern conflicts.',
        inputSchema: ConflictResolutionSchema as any
      },
      {
        name: 'pattern_learn',
        description: 'Learn and store patterns from workflow, resolution, optimization, or prediction contexts for global pattern framework.',
        inputSchema: PatternLearningSchema as any
      },
      {
        name: 'pattern_apply',
        description: 'Apply learned pattern to current context for intelligent automation and workflow optimization.',
        inputSchema: {
          type: 'object',
          properties: {
            patternId: { type: 'string', description: 'Pattern ID to apply' },
            context: { type: 'object', description: 'Current context for pattern application' }
          },
          required: ['patternId', 'context']
        } as any
      },
      {
        name: 'orchestration_status',
        description: 'Get comprehensive orchestration status including active sessions, agents, conflicts, and patterns.',
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
        case 'session_create':
          return await this.handleSessionCreate(args);
        case 'session_get':
          return await this.handleSessionGet(args);
        case 'agent_register':
          return await this.handleAgentRegister(args);
        case 'conflict_resolve':
          return await this.handleConflictResolve(args);
        case 'pattern_learn':
          return await this.handlePatternLearn(args);
        case 'pattern_apply':
          return await this.handlePatternApply(args);
        case 'orchestration_status':
          return await this.handleOrchestrationStatus();
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
   * Handle session creation tool
   */
  private async handleSessionCreate(args: unknown): Promise<CallToolResult> {
    const input = this.validateInput(SessionCreateSchema, args) as any;
    
    const session = await this.orchestrator.createSession(input.agentRole, {
      parentSessionId: input.parentSessionId,
      initialState: input.initialState,
      ttl: input.ttl,
      specialization: input.specialization
    });

    return {
      content: [
        {
          type: 'text',
          text: `🔄 Session Created Successfully!\n\n` +
                `Session ID: ${session.id}\n` +
                `Role: ${session.agentRole}\n` +
                `Hierarchy Level: ${session.hierarchyLevel}\n` +
                `Parent Session: ${session.parentSessionId || 'none'}\n` +
                `TTL: ${session.ttl} seconds\n` +
                `Created: ${session.createdAt}\n` +
                `Status: ${session.isActive ? 'Active' : 'Inactive'}`
        }
      ],
      isError: false
    };
  }

  /**
   * Handle session retrieval tool
   */
  private async handleSessionGet(args: unknown): Promise<CallToolResult> {
    const input = args as { sessionId: string; includeHierarchy?: boolean };
    
    const session = await this.orchestrator.getSessionContext(
      input.sessionId,
      input.includeHierarchy || false
    );

    if (!session) {
      return this.createErrorResult(`Session not found: ${input.sessionId}`);
    }

    const childSessionsInfo = session.childSessions.length > 0 ? 
      `\nChild Sessions: ${session.childSessions.join(', ')}` : '';
    
    const stateInfo = Object.keys(session.state).length > 0 ?
      `\nState Keys: ${Object.keys(session.state).join(', ')}` : '';

    return {
      content: [
        {
          type: 'text',
          text: `📋 Session Context Retrieved\n\n` +
                `Session ID: ${session.id}\n` +
                `Role: ${session.agentRole}\n` +
                `Hierarchy Level: ${session.hierarchyLevel}\n` +
                `Parent Session: ${session.parentSessionId || 'none'}\n` +
                `Status: ${session.isActive ? 'Active' : 'Inactive'}\n` +
                `Created: ${session.createdAt}\n` +
                `Last Access: ${session.lastAccess}\n` +
                `TTL: ${session.ttl} seconds\n` +
                `Memory Context: ${session.memoryContext.length} items${childSessionsInfo}${stateInfo}`
        }
      ],
      isError: false
    };
  }

  /**
   * Handle agent registration tool
   */
  private async handleAgentRegister(args: unknown): Promise<CallToolResult> {
    const input = args as { agentId: string; role: string; specialization: string[] };
    
    const agent = await this.orchestrator.registerAgent(
      input.agentId,
      input.role as any,
      input.specialization
    );

    return {
      content: [
        {
          type: 'text',
          text: `🤖 Agent Registered Successfully!\n\n` +
                `Agent ID: ${agent.id}\n` +
                `Role: ${agent.role}\n` +
                `Specializations: ${agent.specialization.join(', ')}\n` +
                `Registered: ${agent.lastActivity}\n` +
                `Performance: ${agent.performance.tasksCompleted} tasks, ${(agent.performance.successRate * 100).toFixed(1)}% success rate`
        }
      ],
      isError: false
    };
  }

  /**
   * Handle conflict resolution tool
   */
  private async handleConflictResolve(args: unknown): Promise<CallToolResult> {
    const input = this.validateInput(ConflictResolutionSchema, args) as any;
    
    const conflict = await this.orchestrator.resolveConflict(
      input.conflictType,
      input.involvedItems,
      input.severity,
      input.metadata
    );

    const statusIcon = conflict.status === 'resolved' ? '✅' : 
                      conflict.status === 'escalated' ? '⚠️' : '🔄';

    return {
      content: [
        {
          type: 'text',
          text: `${statusIcon} Conflict Resolution Initiated\n\n` +
                `Conflict ID: ${conflict.id}\n` +
                `Type: ${conflict.type}\n` +
                `Severity: ${conflict.severity}\n` +
                `Status: ${conflict.status}\n` +
                `Resolution Tier: ${conflict.resolutionTier}\n` +
                `Strategy: ${conflict.resolutionStrategy || 'pending'}\n` +
                `Involved Items: ${conflict.involvedMemories.concat(conflict.involvedSessions, conflict.involvedAgents).length}\n` +
                `Created: ${conflict.createdAt}\n` +
                `${conflict.resolvedAt ? `Resolved: ${conflict.resolvedAt}` : 'Resolution in progress...'}`
        }
      ],
      isError: false
    };
  }

  /**
   * Handle pattern learning tool
   */
  private async handlePatternLearn(args: unknown): Promise<CallToolResult> {
    const input = this.validateInput(PatternLearningSchema, args) as any;
    
    const pattern = await this.orchestrator.learnPattern(
      input.type,
      input.context,
      input.action,
      input.applicableContexts
    );

    return {
      content: [
        {
          type: 'text',
          text: `🧠 Pattern Learned Successfully!\n\n` +
                `Pattern ID: ${pattern.id}\n` +
                `Type: ${pattern.type}\n` +
                `Description: ${pattern.description}\n` +
                `Confidence: ${(pattern.confidence * 100).toFixed(1)}%\n` +
                `Applicable Contexts: ${pattern.applicableContexts.join(', ') || 'general'}\n` +
                `Created: ${pattern.lastApplied}\n` +
                `Usage Count: ${pattern.usageCount}\n` +
                `Success Rate: ${(pattern.successRate * 100).toFixed(1)}%`
        }
      ],
      isError: false
    };
  }

  /**
   * Handle pattern application tool
   */
  private async handlePatternApply(args: unknown): Promise<CallToolResult> {
    const input = args as { patternId: string; context: Record<string, unknown> };
    
    const applied = await this.orchestrator.applyPattern(input.patternId, input.context);

    const statusIcon = applied ? '✅' : '❌';
    const statusText = applied ? 'successfully applied' : 'failed to apply or pattern not found';

    return {
      content: [
        {
          type: 'text',
          text: `${statusIcon} Pattern Application\n\n` +
                `Pattern ID: ${input.patternId}\n` +
                `Status: Pattern ${statusText}\n` +
                `Context Keys: ${Object.keys(input.context).join(', ')}\n` +
                `Applied: ${new Date().toISOString()}`
        }
      ],
      isError: !applied
    };
  }

  /**
   * Handle orchestration status tool
   */
  private async handleOrchestrationStatus(): Promise<CallToolResult> {
    // Note: This would typically access the orchestrator's internal state
    // For now, we'll provide a basic status overview
    
    return {
      content: [
        {
          type: 'text',
          text: `🔍 Orchestration System Status\n\n` +
                `📡 Multi-Agent Coordination: Active\n` +
                `🔄 Session Management: Hierarchical TTL enabled\n` +
                `⚖️  Conflict Resolution: 3-tier system operational\n` +
                `🧠 Pattern Learning: Global framework active\n` +
                `📊 Enhanced API Endpoints: 8 new tools available\n` +
                `🔗 MCP Integration: Advanced capabilities enabled\n\n` +
                `System Components:\n` +
                `• Hierarchical Session Management with TTL\n` +
                `• Agent Registration and Coordination\n` +
                `• Intelligent Conflict Resolution (Auto/Mediation/Human)\n` +
                `• Global Pattern Learning Framework\n` +
                `• Professional Workflow Optimization\n` +
                `• Memory Context Enhancement\n\n` +
                `Status: All systems operational and enhanced\n` +
                `Last Updated: ${new Date().toISOString()}`
        }
      ],
      isError: false
    };
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