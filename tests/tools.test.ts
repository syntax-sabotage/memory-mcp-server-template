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
      
      expect(toolList).toHaveLength(5);
      expect(toolList.map(t => t.name)).toEqual([
        'memory_search',
        'memory_store',
        'memory_stats',
        'memory_list',
        'memory_health'
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
});