# 🛡️ Memory MCP Server Template

[![Node.js Version](https://img.shields.io/node/v/memory-mcp-server-template.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-brightgreen.svg)](https://modelcontextprotocol.io/)
[![Security First](https://img.shields.io/badge/Security-First-red.svg)](./SECURITY.md)

> 🔐 **Security-First MCP Server Template** for memory systems. Zero hardcoded credentials, environment-based configuration, production-ready template for memory database integration.

## ⚠️ SECURITY FIRST

**This template contains NO hardcoded credentials, API keys, or server endpoints.** All sensitive configuration must be provided via environment variables. This ensures:

- ✅ No accidental credential exposure in version control
- ✅ Secure deployment across environments  
- ✅ Easy credential rotation and management
- ✅ Production security best practices

## Overview

This is a security-first template for building MCP servers that connect to memory systems. The template provides a production-ready implementation of the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) with comprehensive security features, environment-based configuration, and best practices for memory database integration.

### Key Features

- **🛡️ Security First**: Zero hardcoded credentials, environment-based configuration
- **🧠 Memory Operations**: Semantic search, storage, and management capabilities  
- **💾 Flexible Storage**: Configurable memory backend with metadata support
- **📊 Health Monitoring**: Connection validation and statistics tracking
- **⚡ Production Ready**: TypeScript, error handling, retry logic, validation
- **🔧 Developer Friendly**: Complete template with documentation and examples
- **🔐 Best Practices**: Security guidelines, secret detection, audit-ready

## Quick Start

### Installation

```bash
# Clone the template
git clone https://github.com/syntax-sabotage/memory-mcp-server-template.git
cd memory-mcp-server-template

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure your environment variables (see below)
```

### 🔐 Required Configuration

**CRITICAL**: You MUST configure these environment variables before use:

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your actual values:**
   ```bash
   # REQUIRED: Your memory server configuration
   VPS_MEMORY_BASE_URL=https://your-secure-memory-server.com
   VPS_MEMORY_API_KEY=your-actual-api-key-here
   
   # OPTIONAL: Performance tuning
   VPS_MEMORY_TIMEOUT=30000
   VPS_MEMORY_RETRY_ATTEMPTS=3
   VPS_MEMORY_RETRY_DELAY=1000
   ```

3. **Add to Claude configuration (`~/.claude.json`):**
   ```json
   {
     "mcpServers": {
       "memory": {
         "command": "node",
         "args": ["dist/index.js"],
         "cwd": "/path/to/memory-mcp-server-template"
       }
     }
   }
   ```

### Environment Variables (ALL REQUIRED)

| Variable | Description | Security Notes |
|----------|-------------|----------------|
| `VPS_MEMORY_BASE_URL` | Memory server endpoint | Use HTTPS in production |
| `VPS_MEMORY_API_KEY` | Authentication token | Rotate every 90 days |
| `VPS_MEMORY_TIMEOUT` | Request timeout (ms) | Default: 30000 |
| `VPS_MEMORY_RETRY_ATTEMPTS` | Retry attempts | Default: 3 |
| `VPS_MEMORY_RETRY_DELAY` | Retry delay (ms) | Default: 1000 |

## Available Tools

### memory_search
Search through memories using semantic similarity matching.

```typescript
// Search for coding patterns
{
  "query": "React hooks implementation",
  "limit": 10,
  "threshold": 0.7,
  "type": "code",
  "includeSession": true
}
```

### memory_store
Store new memory content with metadata and automatic categorization.

```typescript
// Store a new memory
{
  "content": "Implemented React useCallback hook for performance optimization",
  "type": "implementation",
  "tags": ["react", "hooks", "performance"],
  "metadata": {
    "project": "web-app",
    "difficulty": "intermediate"
  }
}
```

### memory_stats
Get comprehensive statistics about the memory database.

```typescript
// Returns database statistics
{
  "totalMemories": 792,
  "memoryTypes": {
    "code": 245,
    "conversation": 180,
    "documentation": 156,
    "implementation": 98,
    "solution": 113
  },
  "serverStatus": "healthy",
  "lastUpdated": "2025-01-16T10:30:00Z"
}
```

### memory_list
List recent memories with optional filtering and pagination.

```typescript
// List recent code memories
{
  "type": "code",
  "limit": 20,
  "offset": 0
}
```

### memory_health
Check memory server health, connectivity, and performance metrics.

```typescript
// Returns health status
{
  "status": "healthy",
  "uptime": 7200,
  "version": "1.0.0",
  "memoryCount": 792,
  "lastCheck": "2025-01-16T10:30:00Z"
}
```

## CLI Usage

### Test Connection
```bash
# Test VPS memory connection
vps-memory-mcp-server --test
```

### Get Help
```bash
# Show help information
vps-memory-mcp-server --help
```

### Version Information
```bash
# Show version
vps-memory-mcp-server --version
```

## Development

### Prerequisites

- Node.js 18.0.0 or higher
- TypeScript 5.3 or higher
- Access to VPS memory server

### Installation

```bash
# Clone repository
git clone https://github.com/syntax-sabotage/vps-memory-mcp-server.git
cd vps-memory-mcp-server

# Install dependencies
npm install

# Build project
npm run build
```

### Development Commands

```bash
# Development mode with hot reload
npm run dev

# Build TypeScript
npm run build

# Run tests
npm test

# Watch tests
npm run test:watch

# Lint code
npm run lint

# Type checking
npm run type-check
```

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- tools.test.ts

# Watch mode for development
npm run test:watch
```

## API Reference

### VPSMemoryClient

The core client class for interacting with the VPS memory system.

```typescript
import { VPSMemoryClient } from 'vps-memory-mcp-server';

const client = new VPSMemoryClient({
  baseUrl: 'http://your-server:8080',
  apiKey: 'your-api-key',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000
});
```

### VPSMemoryTools

High-level tools interface for MCP protocol integration.

```typescript
import { VPSMemoryTools } from 'vps-memory-mcp-server';

const tools = new VPSMemoryTools(client);
const availableTools = tools.getTools();
```

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Claude/AI     │    │  MCP Server      │    │  VPS Memory     │
│   Client        │◄──►│  (This Package)  │◄──►│  Database       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Components

- **MCP Server**: Implements Model Context Protocol specification
- **VPS Client**: Handles HTTP communication with VPS memory system
- **Tools Interface**: Provides high-level memory operations
- **Type System**: Full TypeScript definitions and validation

## Security

### Authentication
All requests require valid API key authentication. The server validates credentials before processing any memory operations.

### Data Protection
- All sensitive data is transmitted over HTTPS
- API keys are never logged or exposed
- Memory content is validated and sanitized

### Vulnerability Reporting
Please report security vulnerabilities to [security@syntax-sabotage.com](mailto:security@syntax-sabotage.com). See our [Security Policy](SECURITY.md) for details.

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Standards

- TypeScript with strict type checking
- ESLint configuration for code quality
- Jest for testing with >90% coverage
- Conventional commits for commit messages

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](https://github.com/syntax-sabotage/vps-memory-mcp-server/wiki)
- 🐛 [Issue Tracker](https://github.com/syntax-sabotage/vps-memory-mcp-server/issues)
- 💬 [Discussions](https://github.com/syntax-sabotage/vps-memory-mcp-server/discussions)
- 📧 [Email Support](mailto:support@syntax-sabotage.com)

## Related Projects

- [Model Context Protocol](https://modelcontextprotocol.io/) - The protocol specification
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) - Official TypeScript SDK
- [Claude MCP Servers](https://github.com/modelcontextprotocol/servers) - Collection of MCP servers

---

**Built with ❤️ by the Syntax Sabotage team**

*VPS Memory MCP Server - Bridging AI agents with intelligent memory systems*