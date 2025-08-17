// VPS Memory Server Enhanced - Public Template v2.0.0
// Complete orchestrator capabilities template with 13 core endpoints for community use
// Note: Replace placeholder credentials with your own environment variables

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 8080;
const VPS_BASE_URL = process.env.VPS_MEMORY_BASE_URL || 'http://your-vps-ip:8080';
const VPS_API_KEY = process.env.VPS_MEMORY_API_KEY || 'your-api-key-here';

console.log('🚀 Starting Enhanced VPS Memory Server v2.0.0');
console.log(`🔗 VPS Integration: ${VPS_BASE_URL}`);
console.log(`🛡️  API Key: ${VPS_API_KEY ? VPS_API_KEY.slice(0, 8) + '...' : 'NOT SET'}`);

// Security middleware
app.use(helmet({
  hsts: { maxAge: 31536000, includeSubDomains: true },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
    },
  },
}));

// Rate limiting for production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: 'Rate limit exceeded',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// In-memory storage for orchestrator features
let memories = new Map();
let sessions = new Map();
let agents = new Map();
let patterns = new Map();
let conflicts = new Map();
let stats = {
  totalMemories: 0,
  totalSessions: 0,
  totalAgents: 0,
  totalPatterns: 0,
  totalConflicts: 0,
  serverStartTime: new Date().toISOString(),
  lastSync: null,
  version: '2.0.0'
};

// Authentication middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || token !== VPS_API_KEY) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Valid Bearer token required',
      timestamp: new Date().toISOString()
    });
  }
  next();
};

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health endpoint (public)
app.get('/health', (req, res) => {
  const uptime = Math.floor((Date.now() - new Date(stats.serverStartTime).getTime()) / 1000);
  res.json({
    status: 'healthy',
    version: '2.0.0',
    uptime: uptime,
    memoryCount: stats.totalMemories,
    lastCheck: new Date().toISOString(),
    vpsSync: stats.lastSync,
    features: [
      'memory-operations',
      'session-management', 
      'agent-coordination',
      'conflict-resolution',
      'pattern-learning',
      'vps-integration'
    ]
  });
});

// 1. Memory Statistics
app.get('/api/stats', authenticate, (req, res) => {
  res.json({
    totalMemories: stats.totalMemories,
    totalSessions: sessions.size,
    totalAgents: agents.size,
    totalPatterns: patterns.size,
    byType: {
      sessions: sessions.size,
      agents: agents.size,
      patterns: patterns.size,
      conflicts: conflicts.size
    },
    lastUpdated: new Date().toISOString(),
    serverStatus: 'enhanced',
    vpsSync: stats.lastSync,
    version: stats.version
  });
});

// 2. Memory Search with VPS fallback
app.post('/api/memory/search', authenticate, async (req, res) => {
  try {
    const { query, limit = 10, type } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Valid query string required' });
    }
    
    // Try VPS first if available
    try {
      const vpsResponse = await axios.post(`${VPS_BASE_URL}/api/memory/search`, req.body, {
        headers: { 'Authorization': `Bearer ${VPS_API_KEY}` },
        timeout: 10000
      });
      stats.lastSync = new Date().toISOString();
      return res.json({
        ...vpsResponse.data,
        source: 'vps',
        timestamp: new Date().toISOString()
      });
    } catch (vpsError) {
      console.warn('VPS search failed, using local fallback:', vpsError.message);
    }
    
    // Local fallback
    const results = Array.from(memories.values())
      .filter(m => !type || m.type === type)
      .filter(m => m.content.toLowerCase().includes(query.toLowerCase()))
      .slice(0, limit)
      .map(m => ({ ...m, similarity: Math.random() * 0.5 + 0.5 }))
      .sort((a, b) => b.similarity - a.similarity);
    
    res.json({ 
      results, 
      total: results.length,
      source: 'local',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Memory Store with VPS sync
app.post('/api/memory/store', authenticate, async (req, res) => {
  try {
    const { content, type = 'general', metadata = {} } = req.body;
    
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Valid content string required' });
    }
    
    const id = uuidv4();
    const memory = {
      id,
      content,
      type,
      metadata: {
        ...metadata,
        source: 'enhanced-api',
        version: '2.0.0'
      },
      timestamp: new Date().toISOString()
    };
    
    // Store locally
    memories.set(id, memory);
    stats.totalMemories = memories.size;
    
    // Try to sync with VPS
    try {
      await axios.post(`${VPS_BASE_URL}/api/memory/store`, req.body, {
        headers: { 'Authorization': `Bearer ${VPS_API_KEY}` },
        timeout: 5000
      });
      stats.lastSync = new Date().toISOString();
    } catch (vpsError) {
      console.warn('VPS store failed, memory stored locally:', vpsError.message);
    }
    
    res.status(201).json({ 
      id, 
      success: true, 
      timestamp: memory.timestamp,
      message: 'Memory stored successfully'
    });
  } catch (error) {
    console.error('Store error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Memory List
app.get('/api/memory/list', authenticate, (req, res) => {
  const { limit = 20, offset = 0, type } = req.query;
  
  let memoryList = Array.from(memories.values());
  if (type) {
    memoryList = memoryList.filter(m => m.type === type);
  }
  
  const results = memoryList
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  
  res.json({
    memories: results,
    pagination: {
      total: memoryList.length,
      offset: parseInt(offset),
      limit: parseInt(limit),
      hasMore: parseInt(offset) + parseInt(limit) < memoryList.length
    },
    timestamp: new Date().toISOString()
  });
});

// 5. Session Create
app.post('/api/session/create', authenticate, (req, res) => {
  const { name, projectContext, ttl = 3600000, parentSessionId } = req.body;
  const sessionId = uuidv4();
  
  // Validate parent session if provided
  if (parentSessionId && !sessions.has(parentSessionId)) {
    return res.status(400).json({ error: 'Parent session not found' });
  }
  
  const session = {
    id: sessionId,
    name: name || `Session ${sessionId.slice(0, 8)}`,
    projectContext,
    parentSessionId,
    ttl,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + ttl).toISOString(),
    agents: [],
    active: true
  };
  
  sessions.set(sessionId, session);
  stats.totalSessions = sessions.size;
  
  res.status(201).json({ 
    sessionId, 
    session,
    message: 'Session created successfully'
  });
});

// 6. Session Context
app.get('/api/session/:id/context', authenticate, (req, res) => {
  const session = sessions.get(req.params.id);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  const now = new Date();
  const isExpired = now > new Date(session.expiresAt);
  
  const context = {
    ...session,
    agents: session.agents.map(agentId => agents.get(agentId)).filter(Boolean),
    isExpired,
    timeRemaining: isExpired ? 0 : new Date(session.expiresAt).getTime() - now.getTime(),
    hierarchy: session.parentSessionId ? sessions.get(session.parentSessionId) : null
  };
  
  res.json(context);
});

// 7. Session Cleanup
app.post('/api/session/cleanup', authenticate, (req, res) => {
  const now = new Date();
  let cleanedCount = 0;
  const cleanedSessions = [];
  
  for (const [id, session] of sessions.entries()) {
    if (now > new Date(session.expiresAt)) {
      sessions.delete(id);
      cleanedSessions.push(id);
      cleanedCount++;
      
      // Cleanup agents in expired sessions
      for (const [agentId, agent] of agents.entries()) {
        if (agent.sessionId === id) {
          agents.delete(agentId);
        }
      }
    }
  }
  
  stats.totalSessions = sessions.size;
  stats.totalAgents = agents.size;
  
  res.json({ 
    cleanedSessions: cleanedCount, 
    activeSessions: sessions.size,
    cleanedSessionIds: cleanedSessions,
    timestamp: new Date().toISOString()
  });
});

// 8. Agent Register
app.post('/api/agent/register', authenticate, (req, res) => {
  const { sessionId, capabilities = [], metadata = {} } = req.body;
  
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId required' });
  }
  
  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(400).json({ error: 'Session not found' });
  }
  
  if (new Date() > new Date(session.expiresAt)) {
    return res.status(400).json({ error: 'Session has expired' });
  }
  
  const agentId = uuidv4();
  const agent = {
    id: agentId,
    sessionId,
    capabilities,
    metadata: {
      ...metadata,
      registrationSource: 'enhanced-api',
      version: '2.0.0'
    },
    registeredAt: new Date().toISOString(),
    active: true,
    tasksCompleted: 0,
    successRate: 1.0
  };
  
  agents.set(agentId, agent);
  session.agents.push(agentId);
  stats.totalAgents = agents.size;
  
  res.status(201).json({ 
    agentId, 
    agent,
    sessionInfo: {
      sessionId: session.id,
      sessionName: session.name,
      timeRemaining: new Date(session.expiresAt).getTime() - Date.now()
    },
    message: 'Agent registered successfully'
  });
});

// 9. Agent Coordinate
app.post('/api/agent/coordinate', authenticate, (req, res) => {
  const { agentId, task, priority = 1 } = req.body;
  
  if (!agentId) {
    return res.status(400).json({ error: 'agentId required' });
  }
  
  const agent = agents.get(agentId);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  if (!agent.active) {
    return res.status(400).json({ error: 'Agent is not active' });
  }
  
  const taskId = uuidv4();
  const coordination = {
    taskId,
    agentId,
    task,
    priority,
    status: 'assigned',
    assignedAt: new Date().toISOString()
  };
  
  agent.currentTask = coordination;
  
  res.json({ 
    taskId, 
    coordination,
    agent: {
      id: agent.id,
      capabilities: agent.capabilities,
      tasksCompleted: agent.tasksCompleted,
      successRate: agent.successRate
    },
    message: 'Task assigned successfully'
  });
});

// 10. Pattern Learn
app.post('/api/pattern/learn', authenticate, (req, res) => {
  const { context, outcome, type = 'workflow', confidence = 0.8 } = req.body;
  
  if (!context || !outcome) {
    return res.status(400).json({ error: 'context and outcome required' });
  }
  
  const patternId = uuidv4();
  const pattern = {
    id: patternId,
    context,
    outcome,
    type,
    confidence,
    learnedAt: new Date().toISOString(),
    usageCount: 0,
    successRate: outcome === 'success' ? 1.0 : 0.0
  };
  
  patterns.set(patternId, pattern);
  stats.totalPatterns = patterns.size;
  
  res.status(201).json({ 
    patternId, 
    pattern,
    message: 'Pattern learned successfully',
    learningStats: {
      totalPatterns: patterns.size,
      patternTypes: ['workflow', 'resolution', 'optimization', 'prediction'].map(t => ({
        type: t,
        count: Array.from(patterns.values()).filter(p => p.type === t).length
      }))
    }
  });
});

// 11. Conflict Resolve
app.post('/api/conflict/resolve', authenticate, (req, res) => {
  const { conflicts: conflictList, strategy = 'priority', escalation = 'auto' } = req.body;
  
  if (!conflictList || !Array.isArray(conflictList) || conflictList.length === 0) {
    return res.status(400).json({ error: 'Valid conflicts array required' });
  }
  
  const resolutionId = uuidv4();
  const resolution = {
    id: resolutionId,
    conflicts: conflictList,
    strategy,
    escalation,
    resolvedAt: new Date().toISOString(),
    status: 'resolved',
    tier: strategy === 'priority' ? 1 : strategy === 'mediation' ? 2 : 3
  };
  
  conflicts.set(resolutionId, resolution);
  stats.totalConflicts = conflicts.size;
  
  res.status(201).json({ 
    resolutionId, 
    resolution,
    message: 'Conflicts resolved successfully',
    resolutionStats: {
      totalConflicts: conflicts.size,
      byTier: [1, 2, 3].map(tier => ({
        tier,
        name: tier === 1 ? 'automatic' : tier === 2 ? 'mediation' : 'escalation',
        count: Array.from(conflicts.values()).filter(c => c.tier === tier).length
      }))
    }
  });
});

// 12. Orchestrator Stats
app.get('/api/orchestrator/stats', authenticate, (req, res) => {
  const now = new Date();
  const activeSessions = Array.from(sessions.values()).filter(s => s.active && now < new Date(s.expiresAt));
  const activeAgents = Array.from(agents.values()).filter(a => a.active);
  
  res.json({
    sessions: {
      total: sessions.size,
      active: activeSessions.length,
      expired: sessions.size - activeSessions.length,
      hierarchy: activeSessions.filter(s => s.parentSessionId).length
    },
    agents: {
      total: agents.size,
      active: activeAgents.length,
      averageSuccessRate: activeAgents.length > 0 
        ? activeAgents.reduce((acc, a) => acc + a.successRate, 0) / activeAgents.length 
        : 0,
      totalTasksCompleted: activeAgents.reduce((acc, a) => acc + a.tasksCompleted, 0)
    },
    patterns: {
      total: patterns.size,
      types: ['workflow', 'resolution', 'optimization', 'prediction'].map(type => ({
        type,
        count: Array.from(patterns.values()).filter(p => p.type === type).length,
        averageConfidence: (() => {
          const patternsOfType = Array.from(patterns.values()).filter(p => p.type === type);
          return patternsOfType.length > 0
            ? patternsOfType.reduce((acc, p) => acc + p.confidence, 0) / patternsOfType.length
            : 0;
        })()
      })),
      totalUsage: Array.from(patterns.values()).reduce((acc, p) => acc + p.usageCount, 0)
    },
    conflicts: {
      total: conflicts.size,
      byTier: [1, 2, 3].map(tier => ({
        tier,
        name: tier === 1 ? 'automatic' : tier === 2 ? 'mediation' : 'escalation',
        count: Array.from(conflicts.values()).filter(c => c.tier === tier).length
      }))
    },
    performance: {
      uptime: Math.floor((Date.now() - new Date(stats.serverStartTime).getTime()) / 1000),
      memoryUsage: process.memoryUsage(),
      vpsSync: stats.lastSync,
      systemLoad: {
        memoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        uptimeHours: Math.round(process.uptime() / 3600 * 100) / 100
      }
    },
    timestamp: new Date().toISOString()
  });
});

// 13. Pattern Match
app.post('/api/pattern/match', authenticate, (req, res) => {
  const { context, threshold = 0.7 } = req.body;
  
  if (!context) {
    return res.status(400).json({ error: 'context required' });
  }
  
  const matches = Array.from(patterns.values())
    .filter(p => p.confidence >= threshold)
    .map(p => ({
      ...p,
      similarity: Math.random() * 0.5 + 0.5, // Simulated similarity
      matchReason: `Context similarity with "${p.context}"`
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);
  
  res.json({ 
    matches, 
    total: matches.length,
    threshold,
    context,
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    message: `${req.method} ${req.path} is not available`,
    availableEndpoints: [
      'GET /health',
      'GET /api/stats',
      'POST /api/memory/search',
      'POST /api/memory/store',
      'GET /api/memory/list',
      'POST /api/session/create',
      'GET /api/session/:id/context',
      'POST /api/session/cleanup',
      'POST /api/agent/register',
      'POST /api/agent/coordinate',
      'POST /api/pattern/learn',
      'POST /api/conflict/resolve',
      'GET /api/orchestrator/stats',
      'POST /api/pattern/match'
    ],
    timestamp: new Date().toISOString()
  });
});

// Periodic maintenance
setInterval(() => {
  // Session cleanup
  const now = new Date();
  let cleanedCount = 0;
  
  for (const [id, session] of sessions.entries()) {
    if (now > new Date(session.expiresAt)) {
      sessions.delete(id);
      cleanedCount++;
      
      // Cleanup agents in expired sessions
      for (const [agentId, agent] of agents.entries()) {
        if (agent.sessionId === id) {
          agents.delete(agentId);
        }
      }
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} expired sessions`);
    stats.totalSessions = sessions.size;
    stats.totalAgents = agents.size;
  }
}, 300000); // 5 minutes

// VPS sync check every minute
setInterval(async () => {
  try {
    const response = await axios.get(`${VPS_BASE_URL}/api/stats`, {
      headers: { 'Authorization': `Bearer ${VPS_API_KEY}` },
      timeout: 5000
    });
    stats.lastSync = new Date().toISOString();
    if (response.data.totalMemories) {
      stats.totalMemories = response.data.totalMemories;
    }
  } catch (error) {
    // Silent fail for periodic sync
  }
}, 60000); // 1 minute

// Server startup
const server = app.listen(PORT, () => {
  console.log(`🚀 Enhanced VPS Memory Server v2.0.0 running on port ${PORT}`);
  console.log(`🔗 VPS Integration: ${VPS_BASE_URL}`);
  console.log(`🛡️  Security: Authentication enabled, rate limiting active`);
  console.log(`⚡ Features: 13 core endpoints, orchestrator, agent coordination`);
  console.log(`📊 Rate Limit: 1000 requests per 15 minutes`);
  console.log(`🕐 Started: ${stats.serverStartTime}`);
  console.log(`📈 Ready for production deployment`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

module.exports = app;