/**
 * VPS Memory MCP Server - Type Definitions
 * Production-ready types for memory operations
 */

import { z } from 'zod';

// Base Memory Types
export interface Memory {
  id: string;
  content: string;
  type: 'solution' | 'pattern' | 'code_context' | 'conversation' | 'general';
  metadata: Record<string, unknown>;
  timestamp: string;
  similarity?: number;
}

export interface MemoryStats {
  totalMemories: number;
  memoryTypes: Record<string, number>;
  lastUpdated: string;
  serverStatus: 'healthy' | 'degraded' | 'error';
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'error';
  uptime: number;
  version: string;
  memoryCount: number;
  lastCheck: string;
}

// Zod Schemas for Tool Input Validation
export const MemorySearchSchema = z.object({
  query: z.string().min(1).max(1000).describe("Search query to find similar memories"),
  limit: z.number().int().min(1).max(50).default(5).describe("Maximum number of results to return"),
  threshold: z.number().min(0).max(1).default(0.7).describe("Similarity threshold (0-1)"),
  type: z.enum(['solution', 'pattern', 'code_context', 'conversation', 'general']).optional().describe("Filter by memory type"),
  includeSession: z.boolean().default(false).describe("Include memories from current session only")
});

export const MemoryStoreSchema = z.object({
  content: z.string().min(1).max(10000).describe("Content to store in memory"),
  type: z.enum(['solution', 'pattern', 'code_context', 'conversation', 'general']).default('general').describe("Type of memory to store"),
  metadata: z.record(z.unknown()).default({}).describe("Additional metadata for the memory"),
  tags: z.array(z.string()).default([]).describe("Tags to categorize the memory")
});

export const MemoryListSchema = z.object({
  type: z.enum(['solution', 'pattern', 'code_context', 'conversation', 'general']).optional().describe("Filter by memory type"),
  limit: z.number().int().min(1).max(100).default(10).describe("Maximum number of memories to return"),
  offset: z.number().int().min(0).default(0).describe("Number of memories to skip")
});

// Tool Input Types (auto-inferred from schemas)
export type MemorySearchInput = z.infer<typeof MemorySearchSchema>;
export type MemoryStoreInput = z.infer<typeof MemoryStoreSchema>;
export type MemoryListInput = z.infer<typeof MemoryListSchema>;

// VPS Client Configuration
export interface VPSConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

// Error Types
export class VPSMemoryError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'VPSMemoryError';
  }
}

// HTTP Response Types
export interface VPSResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SearchResponse {
  results: Memory[];
  total: number;
  query: string;
  threshold: number;
}

export interface StoreResponse {
  id: string;
  success: boolean;
  message: string;
}

// Tool Result Types
export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  isError?: boolean;
}