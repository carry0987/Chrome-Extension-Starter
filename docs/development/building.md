---
sidebar_position: 1
---

# Building

Learn how to build your Chrome extension for development and production environments.

## Build Scripts

Chrome Extension Starter provides several npm scripts for building:

```bash
# Development build (unminified, with source maps)
pnpm build

# Production build (minified, optimized)
pnpm build:prod

# Development build with watch mode
pnpm build:watch
```

## Build Process

### What Happens During Build

1. **TypeScript Compilation** — Transpiles `.ts` and `.tsx` files
2. **Bundling** — Combines modules using RSBuild (Rspack)
3. **Asset Processing** — Copies icons, locales, and manifest
4. **CSS Processing** — Compiles TailwindCSS
5. **Manifest Injection** — Updates version from `package.json`
6. **Output** — Generates `dist/` folder

### Build Output

```
dist/
├── manifest.json          # Updated with version from package.json
├── popup.html             # Popup page
├── options.html           # Options page
├── popup.js               # Popup script bundle
├── popup.css              # Popup styles
├── options.js             # Options script bundle
├── options.css            # Options styles
├── content.js             # Content script bundle
├── content.css            # Content script styles
├── static/
│   └── js/
│       └── background.js  # Background service worker
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── _locales/              # i18n messages
    ├── en/
    │   └── messages.json
    ├── ja/
    │   └── messages.json
    └── zh_TW/
        └── messages.json
```

## Development Workflow

### 1. Start Watch Mode

```bash
pnpm build:watch
```

This command:
- Builds the extension initially
- Watches for file changes
- Rebuilds automatically on save
- Writes output to disk (required for Chrome to reload)

### 2. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `dist/` folder

### 3. Develop and Test

- Edit source files
- RSBuild rebuilds automatically
- Click reload button in `chrome://extensions/` to apply changes
- Or use an extension like [Extensions Reloader](https://chromewebstore.google.com/detail/extensions-reloader/fimgfedafeadlieiabdeeaodndnlbhid) for auto-reload

### 4. Check Console Logs

**Background Service Worker**:
1. Go to `chrome://extensions/`
2. Click "Inspect views: background page"
3. View Console tab

**Content Script**:
1. Right-click on webpage
2. Click "Inspect"
3. View Console tab (filter by `[Chrome-Extension-Starter]`)

**Popup/Options**:
1. Right-click on popup/options page
2. Click "Inspect"
3. View Console tab

## Production Build

### Building for Release

```bash
# Create optimized production build
pnpm build:prod
```

**Production Optimizations**:
- Minified JavaScript
- Removed source maps
- Optimized CSS
- Smaller bundle sizes
- Tree-shaking applied

### Bundle Size Comparison

| Context | Development | Production |
|---------|-------------|------------|
| Background | ~60 KB | ~45 KB |
| Popup | ~90 KB | ~65 KB |
| Content | ~95 KB | ~70 KB |
| Options | ~90 KB | ~65 KB |

## Build Configuration

### RSBuild Config

**Location**: `rsbuild.config.ts`

The build configuration defines two environments:

#### Web Environment (UI Contexts)

```typescript
environments: {
  web: {
    plugins: [pluginPreact(), pluginTypeCheck()],
    source: {
      entry: {
        popup: './src/pages/popup/index.tsx',
        options: './src/pages/options/index.tsx',
        content: {
          import: './src/content/index.tsx',
          html: false
        }
      }
    },
    output: {
      target: 'web',
      injectStyles: false,
      filename: {
        js: '[name].js',
        css: '[name].css'
      }
    }
  }
}
```

**Key Settings**:
- `injectStyles: false` — Emits separate CSS files (required for content scripts)
- `filenameHash: false` — Stable filenames for manifest references
- `html.template` — Maps entries to HTML templates

#### Worker Environment (Background)

```typescript
environments: {
  worker: {
    plugins: [pluginTypeCheck()],
    source: {
      entry: {
        background: './src/background/index.ts'
      }
    },
    output: {
      target: 'webworker',
      distPath: { js: 'static/js' },
      filename: { js: '[name].js' }
    }
  }
}
```

**Key Settings**:
- `target: 'webworker'` — Optimized for service worker context
- `distPath: { js: 'static/js' }` — Output to `dist/static/js/`
- No DOM APIs included

### Manifest Version Injection

The build automatically injects version from `package.json`:

```typescript
new rspack.CopyRspackPlugin({
  patterns: [
    {
      from: 'public/manifest.json',
      to: 'manifest.json',
      transform(content: Buffer) {
        const m = JSON.parse(content.toString());
        m.version = pkg.version;  // Inject version
        m.name = m.name ?? pkg.name;
        return Buffer.from(JSON.stringify(m, null, 2));
      }
    }
  ]
})
```

**Update Version**:
1. Edit `version` in `package.json`
2. Run `pnpm build`
3. `manifest.json` will have the updated version

## TailwindCSS Integration

### Configuration

TailwindCSS v4 is integrated via PostCSS:

```typescript
tools: {
  postcss: (opts, { addPlugins }) => {
    addPlugins([tailwind()]);
  }
}
```

### Usage in Components

```tsx
import '@/shared/styles.css';  // Import Tailwind base styles

const Button = () => {
  return (
    <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
      Click Me
    </button>
  );
};
```

### Custom Styles

Add global styles in `src/shared/styles.css`:

```css
@import "tailwindcss";

/* Custom utilities */
@layer utilities {
  .text-shadow {
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  }
}

/* Custom components */
@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-blue-500 text-white rounded;
  }
}
```

## Troubleshooting

### Build Errors

#### Module Not Found

```bash
Error: Can't resolve '@/shared/lib/messaging'
```

**Solution**: Check TypeScript path aliases in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

#### Syntax Errors

```bash
ERROR in ./src/components/MyComponent.tsx
Module parse failed: Unexpected token
```

**Solution**: Ensure file extensions are correct (`.tsx` for JSX, `.ts` for plain TypeScript)

### Extension Not Loading

#### Invalid Manifest

```
Manifest version 2 is deprecated, and support will be removed in 2023.
```

**Solution**: Ensure `manifest.json` has `"manifest_version": 3`

#### File Not Found

```
Could not load file 'static/js/background.js'
```

**Solution**: Check that background script path in manifest matches build output:
```json
{
  "background": {
    "service_worker": "static/js/background.js"
  }
}
```

### Performance Issues

#### Large Bundle Size

**Solution**:
1. Use dynamic imports for large dependencies
2. Enable code splitting in RSBuild config
3. Analyze bundle with `rsbuild inspect`

```typescript
// Dynamic import
const loadHeavyLibrary = async () => {
  const lib = await import('heavy-library');
  return lib.default;
};
```

#### Slow Rebuild

**Solution**:
1. Disable type checking during watch mode
2. Use incremental builds
3. Reduce watched files

```typescript
// Conditional type checking
environments: {
  web: {
    plugins: [
      pluginPreact(),
      process.env.SKIP_TYPE_CHECK ? null : pluginTypeCheck()
    ].filter(Boolean)
  }
}
```

## Advanced Configuration

### Source Maps

Enable source maps for debugging:

```typescript
// rsbuild.config.ts
export default defineConfig({
  output: {
    sourceMap: {
      js: process.env.NODE_ENV === 'development' ? 'source-map' : false
    }
  }
});
```

### Code Splitting

Split vendor code for better caching:

```typescript
export default defineConfig({
  performance: {
    chunkSplit: {
      strategy: 'split-by-experience'
    }
  }
});
```

### Custom Assets

Copy additional assets:

```typescript
new rspack.CopyRspackPlugin({
  patterns: [
    { from: 'public/icons', to: 'icons' },
    { from: 'public/_locales', to: '_locales' },
    { from: 'public/assets', to: 'assets', noErrorOnMissing: true }
  ]
})
```

## Build Performance

### Optimization Tips

1. **Use pnpm** — Faster than npm/yarn
2. **Enable caching** — RSBuild caches builds by default
3. **Parallel builds** — Utilize multi-core CPUs
4. **Incremental type checking** — Only check changed files

### Benchmark

On a typical development machine:

| Build Type | Time (Cold) | Time (Warm) |
|------------|-------------|-------------|
| Development | ~8s | ~2s |
| Production | ~15s | ~5s |
| Watch rebuild | - | < 1s |

## Next Steps

- Learn about [Testing](/development/testing) your extension
- Explore [Debugging](/development/debugging) techniques
- Read about [Packaging](/development/packaging) for distribution
