# Contributing to VPS Memory MCP Server

Thank you for your interest in contributing to VPS Memory MCP Server! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Process](#contributing-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Issue Guidelines](#issue-guidelines)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)
- [Community](#community)

## Code of Conduct

This project adheres to a Code of Conduct that we expect all contributors to follow. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

### Summary

- Be respectful and inclusive
- Focus on constructive feedback
- Help create a welcoming environment
- Respect different viewpoints and experiences

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- Git
- TypeScript knowledge
- Familiarity with Model Context Protocol (MCP)

### First Contribution

1. **Look for good first issues**: Issues labeled `good first issue` are perfect for newcomers
2. **Read the documentation**: Understand the project structure and goals
3. **Set up your development environment**: Follow the setup guide below
4. **Start small**: Begin with documentation improvements or small bug fixes

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR-USERNAME/vps-memory-mcp-server.git
cd vps-memory-mcp-server

# Add upstream remote
git remote add upstream https://github.com/syntax-sabotage/vps-memory-mcp-server.git
```

### 2. Install Dependencies

```bash
# Install all dependencies
npm install

# Install global tools (optional)
npm install -g typescript tsx jest
```

### 3. Environment Setup

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your VPS server details
# VPS_MEMORY_BASE_URL=http://your-test-server:8080
# VPS_MEMORY_API_KEY=your-test-api-key
```

### 4. Verify Setup

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Run tests
npm test

# Build the project
npm run build

# Test CLI
npm run dev -- --help
```

## Contributing Process

### 1. Choose Your Contribution

- **Bug Fixes**: Look for issues labeled `bug`
- **Features**: Check issues labeled `enhancement` or `feature request`
- **Documentation**: Issues labeled `documentation`
- **Tests**: Issues labeled `needs tests`

### 2. Create an Issue (if needed)

Before starting work on a significant change:

1. Check if an issue already exists
2. Create a new issue describing your proposal
3. Wait for maintainer feedback before proceeding
4. Reference the issue in your pull request

### 3. Branch Strategy

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-description

# Keep your branch up to date
git fetch upstream
git rebase upstream/main
```

## Coding Standards

### TypeScript Guidelines

```typescript
// Use strict type checking
// Enable all strict mode flags in tsconfig.json

// Prefer explicit types over 'any'
interface MemorySearchParams {
  query: string;
  limit?: number;
  threshold?: number;
}

// Use proper error handling
try {
  const result = await client.searchMemory(params);
  return result;
} catch (error) {
  if (error instanceof VPSMemoryError) {
    throw new McpError(ErrorCode.InternalError, error.message);
  }
  throw error;
}
```

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Check formatting
npm run format:check

# Fix formatting
npm run format
```

### Naming Conventions

- **Files**: `kebab-case.ts`
- **Classes**: `PascalCase`
- **Functions/Variables**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`

```typescript
// Good examples
class VPSMemoryClient {}
interface MemorySearchOptions {}
const DEFAULT_TIMEOUT = 30000;
function searchMemory() {}
const searchResults = await client.search();
```

### Documentation Standards

```typescript
/**
 * Search memories using semantic similarity
 * @param query - Search query string
 * @param options - Search configuration options
 * @returns Promise resolving to search results
 * @throws {VPSMemoryError} When VPS server is unreachable
 * @example
 * ```typescript
 * const results = await client.searchMemory('React hooks', {
 *   limit: 10,
 *   threshold: 0.7
 * });
 * ```
 */
async searchMemory(
  query: string,
  options: MemorySearchOptions = {}
): Promise<MemorySearchResult[]> {
  // Implementation
}
```

## Testing Guidelines

### Test Structure

```typescript
describe('VPSMemoryClient', () => {
  let client: VPSMemoryClient;

  beforeEach(() => {
    client = new VPSMemoryClient({
      baseUrl: 'http://test-server:8080',
      apiKey: 'test-key'
    });
  });

  describe('searchMemory', () => {
    it('should return search results for valid query', async () => {
      // Arrange
      const query = 'test query';
      const expectedResults = [/* mock data */];

      // Act
      const results = await client.searchMemory(query);

      // Assert
      expect(results).toEqual(expectedResults);
    });

    it('should handle network errors gracefully', async () => {
      // Test error scenarios
    });
  });
});
```

### Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=client.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="search"
```

### Coverage Requirements

- **Minimum Coverage**: 90% overall
- **Critical Paths**: 100% coverage required
- **New Features**: Must include comprehensive tests
- **Bug Fixes**: Must include regression tests

## Documentation

### Types of Documentation

1. **Code Comments**: For complex logic and public APIs
2. **README Updates**: For new features and configuration changes
3. **API Documentation**: Generated from JSDoc comments
4. **Guides**: Step-by-step tutorials for common tasks

### Documentation Commands

```bash
# Generate API documentation
npm run docs

# Serve documentation locally
npm run docs:serve

# Check documentation links
npm run docs:check-links
```

## Issue Guidelines

### Bug Reports

Use the bug report template and include:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node.js version, OS, etc.)
- Error messages and stack traces
- Minimal reproduction example

### Feature Requests

Use the feature request template and include:

- Clear description of the proposed feature
- Use cases and motivation
- Proposed API or implementation approach
- Any related issues or discussions

### Issue Labels

- `bug`: Something isn't working
- `enhancement`: New feature or improvement
- `documentation`: Documentation updates
- `good first issue`: Good for newcomers
- `help wanted`: Community contributions welcome
- `needs triage`: Needs maintainer review
- `priority: high/medium/low`: Issue priority

## Pull Request Process

### Before Creating a PR

1. **Test thoroughly**: All tests should pass
2. **Update documentation**: Include relevant documentation updates
3. **Follow conventions**: Code style and commit message conventions
4. **Rebase if needed**: Clean up commit history

### PR Checklist

- [ ] Tests pass locally (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Code is formatted (`npm run format`)
- [ ] Documentation updated
- [ ] CHANGELOG.md updated (if applicable)
- [ ] No breaking changes (or clearly documented)

### PR Template

We provide a pull request template that includes:

- Description of changes
- Related issues
- Type of change (bug fix, feature, docs, etc.)
- Testing performed
- Screenshots (if applicable)

### Review Process

1. **Automated Checks**: CI pipeline must pass
2. **Code Review**: At least one maintainer review required
3. **Testing**: Additional testing for significant changes
4. **Approval**: Maintainer approval required before merge

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

Examples:
```
feat(search): add semantic similarity threshold option
fix(client): handle network timeout errors properly
docs(readme): update installation instructions
test(tools): add tests for memory storage functionality
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Adding or updating tests
- `refactor`: Code refactoring
- `style`: Code formatting changes
- `chore`: Maintenance tasks

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

1. Update CHANGELOG.md
2. Update version in package.json
3. Create release branch
4. Run full test suite
5. Create GitHub release
6. Publish to npm
7. Update documentation

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and community discussions
- **Email**: security@syntax-sabotage.com for security issues

### Maintainers

- **Lars Weiler** (@larsweiler) - Project Lead
- **Syntax Sabotage Team** - Core maintainers

### Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Invited to join the contributor team (for regular contributors)

### Getting Help

- Check existing issues and documentation first
- Use GitHub Discussions for questions
- Join our community calls (schedule in COMMUNITY.md)
- Reach out to maintainers directly if needed

## License

By contributing to VPS Memory MCP Server, you agree that your contributions will be licensed under the same [MIT License](LICENSE) that covers the project.

---

Thank you for contributing to VPS Memory MCP Server! Your efforts help make this project better for everyone in the MCP community.