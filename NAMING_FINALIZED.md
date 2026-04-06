# Project Naming Finalized: ai-i18n-tools

## ✅ Package Name Confirmed

The project is now published as **`ai-i18n-tools`** (without any scope prefix).

---

## 📝 Final Configuration

### Package Name
- **Name**: `ai-i18n-tools`
- **No scope prefix** (not `@transrewrt/` or `@wsj-br/`)
- **Simple and clean**

### Installation
```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

### CLI Command
```bash
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate
npx ai-i18n-tools status
```

### GitHub Repository
- **URL**: `https://github.com/wsj-br/ai-i18n-tools`
- **Organization**: `wsj-br`
- **Repository**: `ai-i18n-tools`

---

## 🔄 What Changed

### From Previous Versions

| Aspect | Old | New |
|--------|-----|-----|
| Package Name | `@transrewrt/i18n-tools` | `ai-i18n-tools` |
| Installation | `npm install @transrewrt/i18n-tools` | `npm install ai-i18n-tools` |
| CLI Command | `i18n-tools` | `ai-i18n-tools` |
| GitHub Org | `transrewrt` | `wsj-br` |

### Files Updated

✅ **package.json** - Removed scope, name is now `ai-i18n-tools`  
✅ **README.md** - All installation and usage examples updated  
✅ **All documentation** - 13 markdown files updated  
✅ **Migration guides** - Both Transrewrt and Duplistatus guides updated  

---

## 💻 Usage Examples

### Installation
```bash
# Install the package
pnpm add ai-i18n-tools
```

### Programmatic Usage
```javascript
const { Translator } = require('ai-i18n-tools');

const translator = new Translator('./i18n.config.json');
await translator.extract();
await translator.translate();
```

### TypeScript Usage
```typescript
import { Translator } from 'ai-i18n-tools';

const translator = new Translator('./i18n.config.json');
await translator.extract();
await translator.translate();
```

### CLI Usage
```bash
# Initialize configuration
npx ai-i18n-tools init

# Extract translatable strings
npx ai-i18n-tools extract

# Translate to all locales
npx ai-i18n-tools translate

# Check translation status
npx ai-i18n-tools status

# Clean orphaned cache
npx ai-i18n-tools cleanup

# Launch web-based cache editor
npx ai-i18n-tools edit
```

---

## 📦 npm Publishing

When ready to publish:

```bash
# Login to npm
npm login

# Build the package
pnpm build

# Run tests
pnpm test

# Publish (public package, no scope)
npm publish --access public
```

The package will be available at:
- **npm**: https://www.npmjs.com/package/ai-i18n-tools
- **GitHub**: https://github.com/wsj-br/ai-i18n-tools

---

## 🔍 Verification

All references have been updated:
- ✅ Package name: `ai-i18n-tools` (no scope)
- ✅ Installation: `npm install ai-i18n-tools`
- ✅ CLI: `npx ai-i18n-tools <command>`
- ✅ GitHub: `github.com/wsj-br/ai-i18n-tools`
- ✅ Zero scoped references in active code/docs

---

## 🎯 Benefits of Unscoped Name

1. **Simpler Installation**: `npm install ai-i18n-tools` vs `npm install @transrewrt/ai-i18n-tools`
2. **Easier to Remember**: No organization prefix to type
3. **More Discoverable**: Shorter name, easier to search
4. **Cleaner Imports**: `require('ai-i18n-tools')` is cleaner
5. **Professional**: Stands on its own without organizational branding

---

## ⚠️ Important Notes

- The package name `ai-i18n-tools` was chosen because `i18n-tools` was already taken on npm
- The `ai-` prefix indicates AI-powered translation capabilities
- No organizational scope means anyone can use it without namespace confusion
- GitHub repository is under `wsj-br` organization for proper ownership

---

## 📋 Migration for Existing Users

If you were using a previous scoped version:

```bash
# Remove old package
npm uninstall @transrewrt/ai-i18n-tools

# Install new package
npm install ai-i18n-tools

# Update imports
# Old: const { Translator } = require('@transrewrt/ai-i18n-tools');
# New: const { Translator } = require('ai-i18n-tools');

# Update CLI commands
# Old: npx @transrewrt/ai-i18n-tools translate
# New: npx ai-i18n-tools translate
```

---

*Final naming confirmed: April 5, 2026*  
*Package: ai-i18n-tools*  
*GitHub: github.com/wsj-br/ai-i18n-tools*
