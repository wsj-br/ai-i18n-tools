# Contributing to ai-i18n-tools

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## 🎯 Code of Conduct

Please be respectful and inclusive. We welcome contributions from everyone regardless of background or experience level.

## 🚀 Getting Started

Contributor-oriented setup is also summarized in **[docs/DEVELOPING.md](./docs/DEVELOPING.md)**. The full documentation map lives in **[docs/README.md](./docs/README.md)**.

### Prerequisites

- Node.js >= 18.0.0
- pnpm (recommended) or npm
- Git

### Setup Development Environment

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/ai-i18n-tools.git
cd ai-i18n-tools

# Install dependencies
pnpm install

# Build the project
pnpm build

# Run tests
pnpm test
```

## 📝 How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the behavior
- **Expected vs actual behavior**
- **Screenshots** if applicable
- **Environment details** (OS, Node version, package version)

**Example:**
```markdown
**Describe the bug**
Cache entries are not being hit on subsequent runs.

**To Reproduce**
1. Run `ai-i18n-tools translate`
2. Run it again without changes
3. See all segments translated instead of cached

**Expected behavior**
Second run should show cache hits

**Environment:**
- OS: Ubuntu 22.04
- Node: 18.19.0
- Package: 1.0.0
```

### Suggesting Features

Feature suggestions are welcome! Please provide:

- **Use case**: Why is this feature needed?
- **Proposed solution**: How should it work?
- **Alternatives considered**: Other approaches you've thought about
- **Additional context**: Examples, mockups, etc.

### Pull Requests

1. **Fork** the repository
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/amazing-feature
   # or
   git checkout -b fix/bug-description
   ```
3. **Make your changes** following our coding standards
4. **Add tests** for new functionality
5. **Ensure tests pass**:
   ```bash
   pnpm test
   pnpm lint
   ```
6. **Commit your changes** using conventional commits:
   ```bash
   git commit -m "feat: add SVG translation support"
   git commit -m "fix: resolve cache collision issue"
   git commit -m "docs: update configuration examples"
   ```
7. **Push to your fork**:
   ```bash
   git push origin feature/amazing-feature
   ```
8. **Open a Pull Request** with a clear description

## 💻 Development Guidelines

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Check code style
npm run lint

# Fix automatic issues
npm run lint:fix
npm run format
```

ESLint uses flat config: **`eslint.config.mjs`** (ESLint 10).

**Key rules:**
- Use TypeScript for all new code
- Follow existing naming conventions
- Write meaningful variable/function names
- Add comments for complex logic
- Keep functions small and focused

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**
```
feat: add batch translation fallback
fix: resolve placeholder restoration order
docs: update migration guide with examples
test: add cache cleanup unit tests
```

### Testing

All new features must include tests:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test -- cache.test.ts

# Check coverage
pnpm test -- --coverage
```

**Test structure:**
```typescript
describe('TranslationCache', () => {
  describe('getSegment', () => {
    it('should return cached translation when available', async () => {
      // Test implementation
    });
    
    it('should return null for missing cache entry', async () => {
      // Test implementation
    });
  });
});
```

### Documentation

Update documentation when making changes:

- **CLI `init`**: Starter configs use **`-t ui-markdown`** (default) or **`-t ui-docusaurus`**; document both when you change `initConfigTemplates` in `src/core/config.ts`.
- **API changes**: Update `docs/API-REFERENCE.md`
- **Configuration**: Update `docs/CONFIGURATION.md`
- **Migration guides**: Update relevant migration guide
- **README**: Update if user-facing changes

## 🏗️ Architecture Overview

```
src/
├── core/           # Core translation engine
├── extractors/     # Content extractors (React, Markdown, JSON, SVG)
├── processors/     # Translation processors (batch, validation)
├── glossary/       # Glossary management
├── api/            # OpenRouter API client
├── utils/          # Utility functions
└── cli/            # CLI commands
```

See [Implementation Plan](./docs/I18N_TOOLS_IMPLEMENTATION_PLAN.md) for detailed architecture.

## 📋 Project Structure

```
ai-i18n-tools/
├── src/              # Source code
├── dist/             # Compiled output (generated)
├── tests/            # Test files
├── docs/             # Documentation
├── examples/         # Example projects
├── edit-cache-app/   # Web-based cache editor
└── scripts/          # Build/utility scripts
```

## 🔍 Code Review Process

All PRs are reviewed by maintainers. We look for:

- ✅ Functionality works as described
- ✅ Tests included and passing
- ✅ Code follows style guidelines
- ✅ Documentation updated
- ✅ No breaking changes (or properly versioned)
- ✅ Performance considerations addressed

## 🎨 Types of Contributions

### 👥 For Developers

- **Bug fixes**: Fix reported issues
- **Features**: Implement new functionality
- **Performance**: Optimize existing code
- **Tests**: Improve test coverage
- **Refactoring**: Improve code quality

### 📚 For Writers

- **Documentation**: Improve guides and examples
- **Tutorials**: Create how-to content
- **Translations**: Translate documentation
- **Blog posts**: Write about the project

### 🐛 For Testers

- **Bug reports**: Report issues with reproduction steps
- **Testing**: Test new features before release
- **Feedback**: Provide user experience feedback

### 💡 For Everyone

- **Feature requests**: Suggest improvements
- **Community help**: Answer questions in issues
- **Spread the word**: Share the project

## 🚦 Release Process

1. **Version bump** based on semantic versioning:
   - `MAJOR` - Breaking changes
   - `MINOR` - New features (backward compatible)
   - `PATCH` - Bug fixes

2. **Update CHANGELOG.md** with all changes

3. **Create release tag**:
   ```bash
   git tag -a v1.1.0 -m "Release v1.1.0"
   git push origin v1.1.0
   ```

4. **Publish to npm**:
   ```bash
   pnpm publish
   ```

## ❓ Questions?

- 📖 Check [documentation](./docs/)
- 🐛 Search [existing issues](https://github.com/wsj-br/ai-i18n-tools/issues)
- 💬 Join our [Discord community](https://discord.gg/your-server)
- 📧 Email: [maintainer email]

## 🙏 Thank You!

Every contribution matters, no matter how small. Thank you for helping make `ai-i18n-tools` better!

---

*Last updated: April 5, 2026*
