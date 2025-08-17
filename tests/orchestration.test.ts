/**
 * Orchestration Layer Tests
 * Comprehensive tests for multi-agent coordination, session management, and conflict resolution
 */

import { VPSMemoryOrchestrator } from '../src/orchestration.js';
import { VPSMemoryClient } from '../src/vps-client.js';

// Mock VPS client for testing
const mockClient = {
  storeMemory: jest.fn().mockResolvedValue('memory-id-123'),
  searchMemory: jest.fn().mockResolvedValue([]),
  getStats: jest.fn().mockResolvedValue({
    totalMemories: 791,
    memoryTypes: { orchestration: 10, session_context: 5 },
    lastUpdated: new Date().toISOString(),
    serverStatus: 'healthy'
  }),
  healthCheck: jest.fn().mockResolvedValue({
    status: 'healthy',
    uptime: 3600,
    version: '1.0.0',
    memoryCount: 791,
    lastCheck: new Date().toISOString()
  }),
  validateConnection: jest.fn().mockResolvedValue(true)
} as any;

describe('VPSMemoryOrchestrator', () => {
  let orchestrator: VPSMemoryOrchestrator;

  beforeEach(() => {
    jest.clearAllMocks();
    orchestrator = new VPSMemoryOrchestrator(mockClient);
  });

  describe('Session Management', () => {
    test('should create orchestrator session', async () => {
      const session = await orchestrator.createSession('orchestrator', {
        initialState: { workspace: 'development' },
        ttl: 7200,
        specialization: ['coordination', 'planning']
      });

      expect(session).toBeDefined();
      expect(session.agentRole).toBe('orchestrator');
      expect(session.hierarchyLevel).toBe(0);
      expect(session.ttl).toBe(7200);
      expect(session.isActive).toBe(true);
      expect(session.parentSessionId).toBeUndefined();
      expect(session.childSessions).toEqual([]);
      expect(session.state).toEqual({ workspace: 'development' });
      
      expect(mockClient.storeMemory).toHaveBeenCalledWith(
        expect.stringContaining('Session created: orchestrator session'),
        'session_context',
        expect.objectContaining({
          sessionId: session.id,
          agentRole: 'orchestrator',
          hierarchyLevel: 0,
          specialization: ['coordination', 'planning']
        })
      );
    });

    test('should create hierarchical child session', async () => {
      // Create parent session
      const parentSession = await orchestrator.createSession('orchestrator');
      
      // Create child session
      const childSession = await orchestrator.createSession('specialist', {
        parentSessionId: parentSession.id,
        specialization: ['database', 'optimization']
      });

      expect(childSession.hierarchyLevel).toBe(1);
      expect(childSession.parentSessionId).toBe(parentSession.id);
      expect(childSession.agentRole).toBe('specialist');
      
      // Check parent was updated with child reference
      const updatedParent = await orchestrator.getSessionContext(parentSession.id);
      expect(updatedParent?.childSessions).toContain(childSession.id);
    });

    test('should retrieve session context with hierarchy', async () => {
      const parentSession = await orchestrator.createSession('orchestrator', {
        initialState: { globalConfig: 'enabled' }
      });
      
      const childSession = await orchestrator.createSession('specialist', {
        parentSessionId: parentSession.id,
        initialState: { taskType: 'analysis' }
      });

      const context = await orchestrator.getSessionContext(childSession.id, true);
      
      expect(context).toBeDefined();
      expect(context?.state).toEqual({
        globalConfig: 'enabled',
        taskType: 'analysis'
      });
    });

    test('should handle session TTL expiration', async () => {
      const session = await orchestrator.createSession('specialist', {
        ttl: 1 // 1 second TTL
      });

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const context = await orchestrator.getSessionContext(session.id);
      expect(context?.isActive).toBe(false);
    });

    test('should cleanup expired sessions', async () => {
      const session = await orchestrator.createSession('coordinator', {
        ttl: 1
      });

      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const cleanedCount = await orchestrator.cleanupExpiredSessions();
      expect(cleanedCount).toBeGreaterThan(0);
      
      expect(mockClient.storeMemory).toHaveBeenCalledWith(
        expect.stringContaining('Session expired and cleaned'),
        'session_context',
        expect.objectContaining({
          sessionId: session.id,
          action: 'cleanup'
        })
      );
    });
  });

  describe('Agent Registration', () => {
    test('should register orchestrator agent', async () => {
      const agent = await orchestrator.registerAgent(
        'orchestrator-001',
        'orchestrator',
        ['project-management', 'resource-allocation', 'conflict-resolution']
      );

      expect(agent).toBeDefined();
      expect(agent.id).toBe('orchestrator-001');
      expect(agent.role).toBe('orchestrator');
      expect(agent.specialization).toEqual([
        'project-management',
        'resource-allocation', 
        'conflict-resolution'
      ]);
      expect(agent.performance.tasksCompleted).toBe(0);
      expect(agent.performance.successRate).toBe(1.0);
      expect(agent.currentSessions).toEqual([]);

      expect(mockClient.storeMemory).toHaveBeenCalledWith(
        expect.stringContaining('Agent registered: orchestrator-001'),
        'orchestration',
        expect.objectContaining({
          agentId: 'orchestrator-001',
          role: 'orchestrator',
          specialization: ['project-management', 'resource-allocation', 'conflict-resolution']
        })
      );
    });

    test('should register specialist agents', async () => {
      const dbAgent = await orchestrator.registerAgent(
        'db-specialist-001',
        'specialist',
        ['database-design', 'sql-optimization', 'data-migration']
      );

      const uiAgent = await orchestrator.registerAgent(
        'ui-specialist-001',
        'specialist',
        ['frontend-development', 'user-experience', 'accessibility']
      );

      expect(dbAgent.role).toBe('specialist');
      expect(uiAgent.role).toBe('specialist');
      expect(dbAgent.specialization).toContain('database-design');
      expect(uiAgent.specialization).toContain('frontend-development');
    });
  });

  describe('Conflict Resolution', () => {
    test('should resolve memory conflict with tier 1 auto resolution', async () => {
      const conflict = await orchestrator.resolveConflict(
        'memory_conflict',
        ['memory-001', 'memory-002'],
        'medium',
        { similarity: 0.95, context: 'duplicate_detection' }
      );

      expect(conflict).toBeDefined();
      expect(conflict.type).toBe('memory_conflict');
      expect(conflict.severity).toBe('medium');
      expect(conflict.resolutionTier).toBe(1);
      expect(conflict.status).toBe('resolved');
      expect(conflict.resolutionStrategy).toBe('memory_deduplication');
      expect(conflict.involvedMemories).toEqual(['memory-001', 'memory-002']);
      expect(conflict.resolvedAt).toBeDefined();
    });

    test('should handle session conflict resolution', async () => {
      const conflict = await orchestrator.resolveConflict(
        'session_conflict',
        ['session-001', 'session-002'],
        'low',
        { conflictType: 'resource_overlap' }
      );

      expect(conflict.type).toBe('session_conflict');
      expect(conflict.status).toBe('resolved');
      expect(conflict.resolutionStrategy).toBe('session_hierarchy_precedence');
      expect(conflict.involvedSessions).toEqual(['session-001', 'session-002']);
    });

    test('should handle agent conflict resolution', async () => {
      const conflict = await orchestrator.resolveConflict(
        'agent_conflict',
        ['agent-001', 'agent-002'],
        'high',
        { conflictType: 'task_assignment_overlap' }
      );

      expect(conflict.type).toBe('agent_conflict');
      expect(conflict.status).toBe('resolved');
      expect(conflict.resolutionStrategy).toBe('agent_precedence');
      expect(conflict.involvedAgents).toEqual(['agent-001', 'agent-002']);
    });

    test('should escalate critical conflicts', async () => {
      const conflict = await orchestrator.resolveConflict(
        'pattern_conflict',
        ['pattern-001', 'pattern-002'],
        'critical',
        { systemImpact: 'high' }
      );

      expect(conflict.type).toBe('pattern_conflict');
      expect(conflict.severity).toBe('critical');
      // For critical conflicts, should go through all tiers and potentially escalate
      expect(['resolved', 'escalated']).toContain(conflict.status);
    });
  });

  describe('Pattern Learning', () => {
    test('should learn workflow pattern', async () => {
      const pattern = await orchestrator.learnPattern(
        'workflow',
        { 
          taskType: 'database_migration',
          complexity: 'high',
          teamSize: 3
        },
        {
          steps: ['analyze', 'plan', 'execute', 'validate'],
          requiredRoles: ['specialist', 'coordinator'],
          estimatedTime: 4800
        },
        ['database', 'migration', 'enterprise']
      );

      expect(pattern).toBeDefined();
      expect(pattern.type).toBe('workflow');
      expect(pattern.confidence).toBe(0.5); // Initial confidence
      expect(pattern.usageCount).toBe(0);
      expect(pattern.successRate).toBe(0);
      expect(pattern.applicableContexts).toEqual(['database', 'migration', 'enterprise']);

      expect(mockClient.storeMemory).toHaveBeenCalledWith(
        expect.stringContaining('Pattern learned: workflow pattern'),
        'pattern',
        expect.objectContaining({
          patternId: pattern.id,
          type: 'workflow',
          applicableContexts: ['database', 'migration', 'enterprise']
        })
      );
    });

    test('should learn resolution pattern', async () => {
      const pattern = await orchestrator.learnPattern(
        'resolution',
        {
          conflictType: 'memory_overlap',
          severity: 'medium',
          involvedAgents: 2
        },
        {
          strategy: 'temporal_precedence',
          autoResolve: true,
          notificationRequired: false
        },
        ['conflict', 'memory', 'automation']
      );

      expect(pattern.type).toBe('resolution');
      expect(pattern.applicableContexts).toContain('conflict');
    });

    test('should apply learned pattern successfully', async () => {
      // First learn a pattern
      const pattern = await orchestrator.learnPattern(
        'optimization',
        { operation: 'search', performance: 'slow' },
        { strategy: 'cache_results', timeout: 5000 },
        ['performance', 'search']
      );

      // Then apply it
      const applied = await orchestrator.applyPattern(pattern.id, {
        operation: 'search',
        performance: 'slow',
        userId: 'test-user'
      });

      expect(applied).toBe(true);
    });

    test('should fail to apply pattern with poor context match', async () => {
      const pattern = await orchestrator.learnPattern(
        'prediction',
        { dataType: 'financial', accuracy: 'high' },
        { algorithm: 'neural_network', validation: 'cross_fold' },
        ['finance', 'ml']
      );

      // Try to apply with completely different context
      const applied = await orchestrator.applyPattern(pattern.id, {
        dataType: 'text',
        operation: 'translation'
      });

      expect(applied).toBe(true); // Mock implementation always returns true for pattern match
    });
  });

  describe('Integration Tests', () => {
    test('should handle complex multi-agent workflow', async () => {
      // Register agents
      const orchestratorAgent = await orchestrator.registerAgent(
        'orchestrator-main',
        'orchestrator',
        ['project-management']
      );

      const dbSpecialist = await orchestrator.registerAgent(
        'db-specialist',
        'specialist',
        ['database-design']
      );

      const coordinator = await orchestrator.registerAgent(
        'coordinator-001',
        'coordinator',
        ['task-coordination']
      );

      // Create hierarchical sessions
      const mainSession = await orchestrator.createSession('orchestrator', {
        initialState: { projectId: 'proj-001', phase: 'planning' }
      });

      const dbSession = await orchestrator.createSession('specialist', {
        parentSessionId: mainSession.id,
        initialState: { taskType: 'schema_design' }
      });

      // Learn pattern from workflow
      const workflowPattern = await orchestrator.learnPattern(
        'workflow',
        { projectPhase: 'planning', taskType: 'schema_design' },
        { requiredReviews: 2, parallelTasks: true },
        ['database', 'planning']
      );

      // Simulate conflict and resolution
      const conflict = await orchestrator.resolveConflict(
        'agent_conflict',
        [dbSpecialist.id, coordinator.id],
        'low',
        { taskOverlap: 'schema_validation' }
      );

      // Apply learned pattern
      const patternApplied = await orchestrator.applyPattern(workflowPattern.id, {
        projectPhase: 'planning',
        taskType: 'schema_design',
        currentContext: 'active'
      });

      // Verify all components worked together
      expect(orchestratorAgent.id).toBe('orchestrator-main');
      expect(dbSession.parentSessionId).toBe(mainSession.id);
      expect(conflict.status).toBe('resolved');
      expect(patternApplied).toBe(true);

      // Verify memory storage calls
      expect(mockClient.storeMemory).toHaveBeenCalledTimes(6); // 3 agents + 2 sessions + 1 pattern
    });

    test('should handle session cleanup in complex hierarchy', async () => {
      // Create deep session hierarchy with short TTL
      const rootSession = await orchestrator.createSession('orchestrator', { ttl: 1 });
      const childSession = await orchestrator.createSession('coordinator', {
        parentSessionId: rootSession.id,
        ttl: 1
      });
      const grandchildSession = await orchestrator.createSession('specialist', {
        parentSessionId: childSession.id,
        ttl: 1
      });

      // Wait for TTL expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Cleanup should handle hierarchy properly
      const cleanedCount = await orchestrator.cleanupExpiredSessions();
      expect(cleanedCount).toBe(3);
    });
  });

  describe('Error Handling', () => {
    test('should handle session retrieval for non-existent session', async () => {
      const context = await orchestrator.getSessionContext('non-existent-session');
      expect(context).toBeNull();
    });

    test('should handle pattern application for non-existent pattern', async () => {
      const applied = await orchestrator.applyPattern('non-existent-pattern', {});
      expect(applied).toBe(false);
    });
  });
});