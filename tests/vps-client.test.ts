/**
 * VPS Client Tests
 */

import { VPSMemoryClient } from '../src/vps-client';
import { VPSMemoryError } from '../src/types';

// Mock fetch globally
global.fetch = jest.fn();

describe('VPSMemoryClient', () => {
  let client: VPSMemoryClient;

  beforeEach(() => {
    client = new VPSMemoryClient({
      baseUrl: 'http://localhost:8080',
      apiKey: 'test-key',
      timeout: 5000,
      retryAttempts: 2,
      retryDelay: 100
    });
    jest.clearAllMocks();
  });

  describe('searchMemory', () => {
    it('should search memories successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          results: [
            {
              id: 'test-1',
              content: 'Test memory',
              type: 'general',
              similarity: 0.85,
              timestamp: '2023-01-01T00:00:00Z'
            }
          ],
          total: 1
        }
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockResponse))
      });

      const results = await client.searchMemory('test query');

      expect(results).toHaveLength(1);
      expect(results[0].content).toBe('Test memory');
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/memory/search',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-key',
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            query: 'test query',
            limit: 5,
            threshold: 0.7,
            memoryType: undefined,
            sessionId: undefined
          })
        })
      );
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        success: false,
        error: 'Invalid query'
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve(JSON.stringify(mockResponse))
      });

      await expect(client.searchMemory('test')).rejects.toThrow(VPSMemoryError);
    });

    it('should retry on network errors', async () => {
      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify({
            success: true,
            data: { results: [] }
          }))
        });

      const results = await client.searchMemory('test');
      
      expect(results).toEqual([]);
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('storeMemory', () => {
    it('should store memory successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'stored-123',
          success: true,
          message: 'Memory stored'
        }
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockResponse))
      });

      const id = await client.storeMemory('test content', 'pattern', { tag: 'test' });

      expect(id).toBe('stored-123');
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/memory/store',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"content":"test content"')
        })
      );
    });
  });

  describe('getStats', () => {
    it('should get stats successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          totalMemories: 790,
          memoryTypes: { pattern: 100, solution: 200 },
          lastUpdated: '2023-01-01T00:00:00Z',
          serverStatus: 'healthy'
        }
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockResponse))
      });

      const stats = await client.getStats();

      expect(stats.totalMemories).toBe(790);
      expect(stats.serverStatus).toBe('healthy');
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when API responds', async () => {
      const mockResponse = {
        success: true,
        data: {
          status: 'healthy',
          uptime: 3600,
          version: '1.0.0',
          memoryCount: 790
        }
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockResponse))
      });

      const health = await client.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.uptime).toBe(3600);
    });

    it('should return error status when API fails', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Connection failed'));

      const health = await client.healthCheck();

      expect(health.status).toBe('error');
      expect(health.uptime).toBe(0);
    });
  });

  describe('validateConnection', () => {
    it('should return true for successful connection', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ success: true, data: {} }))
      });

      const isValid = await client.validateConnection();
      expect(isValid).toBe(true);
    });

    it('should return false for failed connection', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Connection failed'));

      const isValid = await client.validateConnection();
      expect(isValid).toBe(false);
    });
  });

  describe('configuration', () => {
    it('should use default configuration', () => {
      const defaultClient = new VPSMemoryClient();
      expect(defaultClient.getSessionId()).toMatch(/^mcp-server-/);
    });

    it('should update configuration', () => {
      client.updateConfig({ timeout: 10000 });
      // Configuration is private, but we can test it doesn't throw
      expect(() => client.updateConfig({ timeout: 10000 })).not.toThrow();
    });
  });
});