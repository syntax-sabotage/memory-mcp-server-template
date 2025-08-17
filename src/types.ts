/**
 * VPS Memory MCP Server - Type Definitions
 * Production-ready types for memory operations
 */

import { z } from 'zod';

// Base Memory Types
export interface Memory {
  id: string;
  content: string;
  type: 'solution' | 'pattern' | 'code_context' | 'conversation' | 'general' | 'orchestration' | 'session_context';
  metadata: Record<string, unknown>;
  timestamp: string;
  similarity?: number;
  sessionId?: string;
  agentId?: string;
  conflictLevel?: number;
  ttl?: number;
}

// Enhanced Session Management Types
export interface SessionContext {
  id: string;
  parentSessionId?: string;
  hierarchyLevel: number;
  agentRole: 'orchestrator' | 'specialist' | 'coordinator' | 'validator';
  state: Record<string, unknown>;
  createdAt: string;
  lastAccess: string;
  ttl: number;
  isActive: boolean;
  childSessions: string[];
  memoryContext: string[];
}

export interface AgentCoordination {
  orchestratorId: string;
  activeAgents: Map<string, AgentContext>;
  sessionHierarchy: Map<string, SessionContext>;
  conflictResolution: ConflictResolutionState;
  globalPatterns: PatternLearningContext;
}

export interface AgentContext {
  id: string;
  role: 'orchestrator' | 'specialist' | 'coordinator' | 'validator';
  specialization: string[];
  currentSessions: string[];
  lastActivity: string;
  performance: AgentPerformance;
  state: Record<string, unknown>;
}

export interface AgentPerformance {
  tasksCompleted: number;
  successRate: number;
  averageResponseTime: number;
  conflictResolutions: number;
  patternContributions: number;
}

// Conflict Resolution System
export interface ConflictResolutionState {
  tier1: AutoResolution;
  tier2: AgentMediation;
  tier3: HumanEscalation;
  activeConflicts: ConflictRecord[];
  resolutionHistory: ConflictRecord[];
}

export interface ConflictRecord {
  id: string;
  type: 'memory_conflict' | 'session_conflict' | 'agent_conflict' | 'pattern_conflict';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  involvedMemories: string[];
  involvedSessions: string[];
  involvedAgents: string[];
  resolutionTier: 1 | 2 | 3;
  resolutionStrategy: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'escalated';
  createdAt: string;
  resolvedAt?: string;
  metadata: Record<string, unknown>;
}

export interface AutoResolution {
  enabled: boolean;
  strategies: {
    memoryDeduplication: boolean;
    temporalRecency: boolean;
    similarityMerging: boolean;
    agentPrecedence: boolean;
  };
  thresholds: {
    similarityThreshold: number;
    timeThreshold: number;
    confidenceThreshold: number;
  };
}

export interface AgentMediation {
  enabled: boolean;
  mediatorAgentId?: string;
  strategies: {
    contextualAnalysis: boolean;
    votingMechanism: boolean;
    expertConsensus: boolean;
  };
  escalationCriteria: {
    maxMediationTime: number;
    complexityThreshold: number;
    stakeholderCount: number;
  };
}

export interface HumanEscalation {
  enabled: boolean;
  notificationChannels: string[];
  escalationThreshold: {
    criticalConflicts: number;
    unresolvedTime: number;
    systemImpact: number;
  };
}

// Global Pattern Learning
export interface PatternLearningContext {
  patterns: Map<string, LearnedPattern>;
  learningStrategies: LearningStrategy[];
  adaptationRules: AdaptationRule[];
  performanceMetrics: LearningMetrics;
}

export interface LearnedPattern {
  id: string;
  type: 'workflow' | 'resolution' | 'optimization' | 'prediction';
  description: string;
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
  confidence: number;
  usageCount: number;
  successRate: number;
  lastApplied: string;
  applicableContexts: string[];
}

export interface LearningStrategy {
  type: 'reinforcement' | 'pattern_recognition' | 'anomaly_detection' | 'optimization';
  enabled: boolean;
  parameters: Record<string, unknown>;
  priority: number;
}

export interface AdaptationRule {
  id: string;
  condition: string;
  action: string;
  priority: number;
  enabled: boolean;
}

export interface LearningMetrics {
  patternsLearned: number;
  patternsApplied: number;
  adaptationRate: number;
  learningEfficiency: number;
  lastUpdated: string;
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
  type: z.enum(['solution', 'pattern', 'code_context', 'conversation', 'general', 'orchestration', 'session_context']).optional().describe("Filter by memory type"),
  includeSession: z.boolean().default(false).describe("Include memories from current session only"),
  sessionId: z.string().optional().describe("Specific session ID to search within"),
  agentId: z.string().optional().describe("Filter by agent ID"),
  includeConflictLevel: z.number().min(0).max(10).optional().describe("Include conflict level in results")
});

export const MemoryStoreSchema = z.object({
  content: z.string().min(1).max(10000).describe("Content to store in memory"),
  type: z.enum(['solution', 'pattern', 'code_context', 'conversation', 'general', 'orchestration', 'session_context']).default('general').describe("Type of memory to store"),
  metadata: z.record(z.unknown()).default({}).describe("Additional metadata for the memory"),
  tags: z.array(z.string()).default([]).describe("Tags to categorize the memory"),
  sessionId: z.string().optional().describe("Associate with specific session"),
  agentId: z.string().optional().describe("Associate with specific agent"),
  ttl: z.number().optional().describe("Time-to-live in seconds"),
  conflictLevel: z.number().min(0).max(10).optional().describe("Conflict detection level")
});

export const MemoryListSchema = z.object({
  type: z.enum(['solution', 'pattern', 'code_context', 'conversation', 'general', 'orchestration', 'session_context']).optional().describe("Filter by memory type"),
  limit: z.number().int().min(1).max(100).default(10).describe("Maximum number of memories to return"),
  offset: z.number().int().min(0).default(0).describe("Number of memories to skip"),
  sessionId: z.string().optional().describe("Filter by session ID"),
  agentId: z.string().optional().describe("Filter by agent ID"),
  includeExpired: z.boolean().default(false).describe("Include expired TTL memories")
});

// New Enhanced Schemas
export const SessionCreateSchema = z.object({
  parentSessionId: z.string().optional().describe("Parent session for hierarchy"),
  agentRole: z.enum(['orchestrator', 'specialist', 'coordinator', 'validator']).describe("Agent role in session"),
  initialState: z.record(z.unknown()).default({}).describe("Initial session state"),
  ttl: z.number().default(3600).describe("Session TTL in seconds"),
  specialization: z.array(z.string()).default([]).describe("Agent specializations")
});

export const ConflictResolutionSchema = z.object({
  conflictType: z.enum(['memory_conflict', 'session_conflict', 'agent_conflict', 'pattern_conflict']).describe("Type of conflict to resolve"),
  involvedItems: z.array(z.string()).describe("IDs of involved items"),
  severity: z.enum(['low', 'medium', 'high', 'critical']).describe("Conflict severity"),
  preferredStrategy: z.string().optional().describe("Preferred resolution strategy"),
  metadata: z.record(z.unknown()).default({})
});

export const PatternLearningSchema = z.object({
  type: z.enum(['workflow', 'resolution', 'optimization', 'prediction']).describe("Pattern type"),
  context: z.record(z.unknown()).describe("Pattern context conditions"),
  action: z.record(z.unknown()).describe("Pattern action definition"),
  applicableContexts: z.array(z.string()).default([]).describe("Contexts where pattern applies")
});

export const AgentCoordinationSchema = z.object({
  operation: z.enum(['register', 'deregister', 'update_status', 'assign_task', 'report_completion']).describe("Coordination operation"),
  agentId: z.string().describe("Agent identifier"),
  data: z.record(z.unknown()).default({}).describe("Operation data")
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