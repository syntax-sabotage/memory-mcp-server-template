/**
 * VPS Memory Tools Tests
 */

import { VPSMemoryTools } from '../src/tools';
import { VPSMemoryClient } from '../src/vps-client';
import { VPSMemoryError } from '../src/types';

// Mock the VPS client
jest.mock('../src/vps-client');

describe('VPSMemoryTools', () => {
  let tools: VPSMemoryTools;
  let mockClient: jest.Mocked<VPSMemoryClient>;

  beforeEach(() => {
    mockClient = new VPSMemoryClient() as jest.Mocked<VPSMemoryClient>;
    tools = new VPSMemoryTools(mockClient);
  });

  describe('getTools', () => {
    it('should return all available tools', () => {
      const toolList = tools.getTools();
      
      expect(toolList).toHaveLength(13);
      expect(toolList.map(t => t.name)).toEqual([
        'memory_search',
        'memory_store',
        'memory_stats',
        'memory_list',
        'memory_health',
        'session_create',
        'session_get',
        'agent_register',
        'conflict_resolve',
        'pattern_learn',
        'pattern_apply',
        'orchestration_status'
      ]);
    });

    it('should have proper tool descriptions', () => {
      const toolList = tools.getTools();
      
      toolList.forEach(tool => {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema).toBeDefined();
      });
    });
  });

  describe('executeTool', () => {
    it('should return error for unknown tool', async () => {
      const result = await tools.executeTool('unknown_tool', {});
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Unknown tool: unknown_tool');
    });

    it('should handle VPSMemoryError properly', async () => {
      const error = new VPSMemoryError('Test error', 'TEST_ERROR', 400);
      mockClient.searchMemory.mockRejectedValue(error);

      const result = await tools.executeTool('memory_search', { query: 'test' });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('VPS Error: Test error');
    });

    it('should handle generic errors', async () => {
      mockClient.searchMemory.mockRejectedValue(new Error('Generic error'));

      const result = await tools.executeTool('memory_search', { query: 'test' });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Unexpected error: Generic error');
    });
  });

  describe('memory_search tool', () => {
    it('should execute search successfully', async () => {
      const mockResults = [
        {
          id: 'test-1',
          content: 'Test memory content',
          type: 'pattern',
          similarity: 0.9,
          timestamp: '2023-01-01T00:00:00Z'
        }
      ];

      mockClient.searchMemory.mockResolvedValue(mockResults);

      const result = await tools.executeTool('memory_search', {
        query: 'test query',
        limit: 5,
        threshold: 0.8
      });

      expect(result.isError).toBe(false);
      expect(result.content[0].text).toContain('Search Results for "test query"');
      expect(result.content[0].text).toContain('90.0% similarity');
      expect(mockClient.searchMemory).toHaveBeenCalledWith('test query', {
        limit: 5,
        threshold: 0.8,
        type: undefined,
        includeSession: false
      });
    });

    it('should validate search input', async () => {
      const result = await tools.executeTool('memory_search', {
        query: '', // Invalid empty query
        limit: 5
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid input');
    });

    it('should handle empty search results', async () => {
      mockClient.searchMemory.mockResolvedValue([]);

      const result = await tools.executeTool('memory_search', {
        query: 'no results query'
      });

      expect(result.isError).toBe(false);
      expect(result.content[0].text).toContain('No memories found matching your query');
    });
  });

  describe('memory_store tool', () => {
    it('should store memory successfully', async () => {
      mockClient.storeMemory.mockResolvedValue('stored-123');

      const result = await tools.executeTool('memory_store', {
        content: 'Test content to store',
        type: 'pattern',
        tags: ['test', 'pattern']
      });

      expect(result.isError).toBe(false);
      expect(result.content[0].text).toContain('Memory stored successfully');
      expect(result.content[0].text).toContain('ID: stored-123');
      expect(result.content[0].text).toContain('Type: pattern');
      expect(result.content[0].text).toContain('Tags: test, pattern');
    });

    it('should validate store input', async () => {
      const result = await tools.executeTool('memory_store', {
        content: '', // Invalid empty content
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid input');
    });
  });

  describe('memory_stats tool', () => {
    it('should get stats successfully', async () => {
      const mockStats = {
        totalMemories: 790,
        memoryTypes: {
          pattern: 200,
          solution: 300,
          general: 290
        },
        lastUpdated: '2023-01-01T00:00:00Z',
        serverStatus: 'healthy' as const
      };

      mockClient.getStats.mockResolvedValue(mockStats);

      const result = await tools.executeTool('memory_stats', {});

      expect(result.isError).toBe(false);
      expect(result.content[0].text).toContain('Memory Database Statistics');
      expect(result.content[0].text).toContain('Total Memories: 790');
      expect(result.content[0].text).toContain('pattern: 200');
      expect(result.content[0].text).toContain('solution: 300');
    });
  });

  describe('memory_list tool', () => {
    it('should list memories successfully', async () => {
      const mockMemories = [
        {
          id: 'mem-1',
          content: 'First memory content that is longer than 150 characters to test truncation functionality and ensure that the preview is properly limited',
          type: 'pattern',
          timestamp: '2023-01-01T00:00:00Z'
        },
        {
          id: 'mem-2',
          content: 'Short content',
          type: 'solution',
          timestamp: '2023-01-02T00:00:00Z'
        }
      ];

      mockClient.listMemories.mockResolvedValue(mockMemories);

      const result = await tools.executeTool('memory_list', {
        type: 'pattern',
        limit: 10
      });

      expect(result.isError).toBe(false);
      expect(result.content[0].text).toContain('Recent Memories (pattern)');
      expect(result.content[0].text).toContain('Found 2 memories');
      expect(result.content[0].text).toContain('mem-1');
      expect(result.content[0].text).toContain('...');  // Truncation
      expect(result.content[0].text).toContain('Short content');  // No truncation
    });

    it('should handle empty memory list', async () => {
      mockClient.listMemories.mockResolvedValue([]);

      const result = await tools.executeTool('memory_list', {});

      expect(result.isError).toBe(false);
      expect(result.content[0].text).toContain('No memories found');
    });
  });

  describe('memory_health tool', () => {
    it('should check health successfully', async () => {
      const mockHealth = {
        status: 'healthy' as const,
        uptime: 3600,
        version: '1.0.0',
        memoryCount: 790,
        lastCheck: '2023-01-01T00:00:00Z'
      };

      mockClient.healthCheck.mockResolvedValue(mockHealth);
      mockClient.validateConnection.mockResolvedValue(true);

      const result = await tools.executeTool('memory_health', {});

      expect(result.isError).toBe(false);
      expect(result.content[0].text).toContain('💚 Memory Server Health Check');
      expect(result.content[0].text).toContain('Status: healthy');
      expect(result.content[0].text).toContain('Uptime: 1h 0m');
      expect(result.content[0].text).toContain('✅ Connected');
    });

    it('should handle unhealthy status', async () => {
      const mockHealth = {
        status: 'error' as const,
        uptime: 0,
        version: 'unknown',
        memoryCount: 0,
        lastCheck: '2023-01-01T00:00:00Z'
      };

      mockClient.healthCheck.mockResolvedValue(mockHealth);
      mockClient.validateConnection.mockResolvedValue(false);

      const result = await tools.executeTool('memory_health', {});

      expect(result.isError).toBe(false);
      expect(result.content[0].text).toContain('❌ Memory Server Health Check');
      expect(result.content[0].text).toContain('❌ Disconnected');
    });
  });

  describe('orchestration tools', () => {
    describe('session_create tool', () => {
      it('should create session successfully', async () => {
        const result = await tools.executeTool('session_create', {
          agentRole: 'orchestrator',
          initialState: { project: 'test' },
          ttl: 3600,
          specialization: ['coordination']
        });

        expect(result.isError).toBe(false);
        expect(result.content[0].text).toContain('Session Created Successfully!');
        expect(result.content[0].text).toContain('Role: orchestrator');
        expect(result.content[0].text).toContain('TTL: 3600 seconds');
        expect(result.content[0].text).toContain('Status: Active');
      });

      it('should validate session create input', async () => {
        const result = await tools.executeTool('session_create', {
          agentRole: 'invalid_role' // Invalid role
        });

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('Invalid input');
      });
    });

    describe('session_get tool', () => {
      it('should retrieve session successfully', async () => {
        // First create a session
        const createResult = await tools.executeTool('session_create', {
          agentRole: 'specialist',
          initialState: { task: 'analysis' }
        });

        expect(createResult.isError).toBe(false);

        // Extract session ID from create result (simplified for test)
        const sessionId = 'test-session-id';

        const getResult = await tools.executeTool('session_get', {
          sessionId,
          includeHierarchy: true
        });

        expect(getResult.isError).toBe(false);
        expect(getResult.content[0].text).toContain('Session Context Retrieved');
      });

      it('should handle non-existent session', async () => {
        const result = await tools.executeTool('session_get', {
          sessionId: 'non-existent-session'
        });

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('Session not found');
      });
    });

    describe('agent_register tool', () => {
      it('should register agent successfully', async () => {
        const result = await tools.executeTool('agent_register', {
          agentId: 'test-agent-001',
          role: 'specialist',
          specialization: ['database', 'optimization']
        });

        expect(result.isError).toBe(false);
        expect(result.content[0].text).toContain('Agent Registered Successfully!');
        expect(result.content[0].text).toContain('Agent ID: test-agent-001');
        expect(result.content[0].text).toContain('Role: specialist');
        expect(result.content[0].text).toContain('database, optimization');
      });
    });

    describe('conflict_resolve tool', () => {
      it('should initiate conflict resolution', async () => {
        const result = await tools.executeTool('conflict_resolve', {
          conflictType: 'memory_conflict',
          involvedItems: ['memory-001', 'memory-002'],
          severity: 'medium',
          metadata: { similarity: 0.95 }
        });

        expect(result.isError).toBe(false);
        expect(result.content[0].text).toContain('Conflict Resolution Initiated');
        expect(result.content[0].text).toContain('Type: memory_conflict');
        expect(result.content[0].text).toContain('Severity: medium');
      });

      it('should validate conflict resolution input', async () => {
        const result = await tools.executeTool('conflict_resolve', {
          conflictType: 'invalid_type',
          involvedItems: [],
          severity: 'medium'
        });

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('Invalid input');
      });
    });

    describe('pattern_learn tool', () => {
      it('should learn pattern successfully', async () => {
        const result = await tools.executeTool('pattern_learn', {
          type: 'workflow',
          context: { taskType: 'analysis', complexity: 'high' },
          action: { steps: ['plan', 'execute', 'validate'] },
          applicableContexts: ['development', 'testing']
        });

        expect(result.isError).toBe(false);
        expect(result.content[0].text).toContain('Pattern Learned Successfully!');
        expect(result.content[0].text).toContain('Type: workflow');
        expect(result.content[0].text).toContain('Confidence: 50.0%');
        expect(result.content[0].text).toContain('development, testing');
      });
    });

    describe('pattern_apply tool', () => {
      it('should apply pattern successfully', async () => {
        const result = await tools.executeTool('pattern_apply', {
          patternId: 'test-pattern-001',
          context: { taskType: 'analysis', currentPhase: 'planning' }
        });

        expect(result.isError).toBe(false);
        expect(result.content[0].text).toContain('Pattern Application');
        expect(result.content[0].text).toContain('Pattern ID: test-pattern-001');
      });
    });

    describe('orchestration_status tool', () => {
      it('should return orchestration status', async () => {
        const result = await tools.executeTool('orchestration_status', {});

        expect(result.isError).toBe(false);
        expect(result.content[0].text).toContain('Orchestration System Status');
        expect(result.content[0].text).toContain('Multi-Agent Coordination: Active');
        expect(result.content[0].text).toContain('Session Management: Hierarchical TTL enabled');
        expect(result.content[0].text).toContain('Conflict Resolution: 3-tier system operational');
        expect(result.content[0].text).toContain('Pattern Learning: Global framework active');
        expect(result.content[0].text).toContain('8 new tools available');
      });
    });
  });
});