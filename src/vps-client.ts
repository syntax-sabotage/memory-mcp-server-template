/**
 * VPS Memory Client - Optimized HTTP Integration
 * Extracted and refined from existing VPS memory integration
 */

import { createRequire } from 'module';
import { VPSConfig, Memory, MemoryStats, HealthStatus, SearchResponse, StoreResponse, VPSMemoryError } from './types.js';

const moduleRequire = createRequire(import.meta.url);
const http = moduleRequire('http');

export class VPSMemoryClient {
  private config: VPSConfig;
  private sessionId: string;

  constructor(config?: Partial<VPSConfig>) {
    // SECURITY: All configuration must be provided via environment variables or config parameter
    // NO hardcoded credentials or server endpoints allowed
    const baseUrl = config?.baseUrl || process.env.VPS_MEMORY_BASE_URL;
    const apiKey = config?.apiKey || process.env.VPS_MEMORY_API_KEY;
    
    if (!baseUrl) {
      throw new Error('VPS_MEMORY_BASE_URL environment variable or baseUrl config is required');
    }
    
    if (!apiKey) {
      throw new Error('VPS_MEMORY_API_KEY environment variable or apiKey config is required');
    }

    this.config = {
      baseUrl,
      apiKey,
      timeout: config?.timeout || parseInt(process.env.VPS_MEMORY_TIMEOUT || '30000'),
      retryAttempts: config?.retryAttempts || parseInt(process.env.VPS_MEMORY_RETRY_ATTEMPTS || '3'),
      retryDelay: config?.retryDelay || parseInt(process.env.VPS_MEMORY_RETRY_DELAY || '1000'),
      ...config
    };
    this.sessionId = `mcp-server-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Make authenticated HTTP request with retry logic
   */
  private async makeRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' = 'GET', 
    data?: unknown
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const result = await this.makeHttpRequest<T>(endpoint, method, data);
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (error instanceof VPSMemoryError) {
          // Don't retry client errors (4xx)
          if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
            throw error;
          }
        }

        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelay * attempt);
          continue;
        }
      }
    }

    throw new VPSMemoryError(
      `Failed after ${this.config.retryAttempts} attempts: ${lastError?.message}`,
      'RETRY_EXHAUSTED',
      undefined,
      lastError
    );
  }

  /**
   * Make single HTTP request using Node.js http module
   */
  private async makeHttpRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    data?: unknown
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.config.baseUrl);
      const options = {
        method,
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'VPS-Memory-MCP-Server/1.0.0'
        },
        timeout: this.config.timeout
      };

      const req = http.request(url, options, (res: any) => {
        let body = '';
        res.on('data', (chunk: any) => body += chunk);
        res.on('end', () => {
          try {
            // Handle empty responses
            if (!body.trim()) {
              throw new VPSMemoryError(
                'Empty response from server',
                'EMPTY_RESPONSE',
                res.statusCode
              );
            }

            const result = JSON.parse(body);
            
            if (res.statusCode >= 200 && res.statusCode < 300) {
              // For successful responses, return the data directly if it's structured correctly
              if (result && typeof result === 'object') {
                resolve(result as T);
              } else {
                resolve(result);
              }
            } else {
              throw new VPSMemoryError(
                result.error || `HTTP ${res.statusCode}: ${body}`,
                'HTTP_ERROR',
                res.statusCode,
                result
              );
            }
          } catch (parseError) {
            if (parseError instanceof VPSMemoryError) {
              reject(parseError);
            } else {
              reject(new VPSMemoryError(
                `Invalid JSON response: ${body}`,
                'PARSE_ERROR',
                res.statusCode,
                { body, parseError }
              ));
            }
          }
        });
      });

      req.on('error', (error: Error) => {
        reject(new VPSMemoryError(
          `Network error: ${error.message}`,
          'NETWORK_ERROR',
          undefined,
          error
        ));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new VPSMemoryError(
          `Request timeout after ${this.config.timeout}ms`,
          'TIMEOUT_ERROR',
          undefined
        ));
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Search memories with semantic similarity
   */
  async searchMemory(
    query: string,
    options: {
      limit?: number;
      threshold?: number;
      type?: string;
      includeSession?: boolean;
    } = {}
  ): Promise<Memory[]> {
    const data = {
      query,
      limit: options.limit || 5,
      threshold: options.threshold || 0.7,
      memoryType: options.type,
      sessionId: options.includeSession ? this.sessionId : undefined
    };

    const response = await this.makeRequest<SearchResponse>('/api/memory/search', 'POST', data);
    return response.results || [];
  }

  /**
   * Store new memory with metadata
   */
  async storeMemory(
    content: string,
    type: string = 'general',
    metadata: Record<string, unknown> = {}
  ): Promise<string> {
    const data = {
      content,
      type,
      metadata: {
        ...metadata,
        source: 'mcp-server',
        sessionId: this.sessionId,
        timestamp: new Date().toISOString()
      }
    };

    const response = await this.makeRequest<StoreResponse>('/api/memory/store', 'POST', data);
    return response.id;
  }

  /**
   * Get memory database statistics
   */
  async getStats(): Promise<MemoryStats> {
    const stats = await this.makeRequest<MemoryStats>('/api/stats');
    return {
      totalMemories: stats.totalMemories || 0,
      memoryTypes: stats.memoryTypes || {},
      lastUpdated: stats.lastUpdated || new Date().toISOString(),
      serverStatus: stats.serverStatus || 'healthy'
    };
  }

  /**
   * List recent memories by type
   */
  async listMemories(
    options: {
      type?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Memory[]> {
    const params = new URLSearchParams();
    if (options.type) params.append('type', options.type);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());

    const endpoint = `/api/memory/list${params.toString() ? '?' + params.toString() : ''}`;
    const response = await this.makeRequest<{ memories: Memory[] }>(endpoint);
    return response.memories || [];
  }

  /**
   * Health check and connectivity test
   */
  async healthCheck(): Promise<HealthStatus> {
    try {
      const health = await this.makeRequest<HealthStatus>('/health');
      return {
        status: 'healthy',
        uptime: health.uptime || 0,
        version: health.version || '1.0.0',
        memoryCount: health.memoryCount || 0,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        uptime: 0,
        version: 'unknown',
        memoryCount: 0,
        lastCheck: new Date().toISOString()
      };
    }
  }

  /**
   * Validate API configuration
   */
  async validateConnection(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get session ID for debugging
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<VPSConfig>): void {
    this.config = { ...this.config, ...config };
  }
}