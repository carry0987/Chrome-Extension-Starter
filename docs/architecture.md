---
sidebar_position: 2
---

# Architecture

Chrome Extension Starter follows a modular architecture designed for scalability, maintainability, and type safety. This document explains the core architectural patterns and design decisions.

## Extension Structure

The extension consists of four main contexts:

### 1. Background Service Worker

**Location**: `src/background/`

The background service worker is the heart of your extension, running as a persistent or event-based background script.

**Key Responsibilities**:
- Lifecycle management (`onInstalled`, `onStartup`)
- Tab-level action policies
- Centralized event and permission management
- Alarm scheduling and background tasks

**Files**:
- `index.ts` — Entry point
- `runtime.ts` — Runtime event handlers
- `alarms.ts` — Scheduled task management

```ts
// Example: background/runtime.ts
import { logger } from '@/shared/lib/logger';

chrome.runtime.onInstalled.addListener((details) => {
  logger.info('Extension installed:', details);
});
```

### 2. Content Scripts

**Location**: `src/content/`

Content scripts run in the context of web pages, allowing DOM manipulation and UI injection.

**Key Responsibilities**:
- DOM manipulation and observation
- UI overlay injection
- Message listening from popup/background
- Bridge communication with page context

**Files**:
- `index.tsx` — Content script entry with Preact overlay
- `bridge.ts` — Communication bridge utilities

```ts
// Content scripts can render UI directly on pages
import { render } from 'preact';
import { mount } from '@/shared/lib/dom';

const el = mount('ces-overlay');
render(<Overlay />, el);
```

### 3. UI Pages

**Location**: `src/pages/`

Preact-based user interfaces for popup and options pages.

**Popup** (`pages/popup/`):
- Quick access interface
- Compact design for browser action
- Real-time communication with content/background

**Options** (`pages/options/`):
- Full-page settings interface
- Advanced configuration
- Preference management

```tsx
// Example: pages/popup/index.tsx
import { bus } from '@/shared/lib/messaging';
import { MSG } from '@/shared/constants';

const Popup = () => {
  const changeBackground = async () => {
    await bus.sendToActive(MSG.CHANGE_BG, { color: '#0ea5e9' });
  };
  
  return <button onClick={changeBackground}>Change BG</button>;
};
```

### 4. Shared Library

**Location**: `src/shared/`

Shared utilities, types, and configuration used across all contexts.

**Key Modules**:
- `lib/messaging.ts` — Type-safe message bus
- `lib/storage.ts` — Type-safe Chrome Storage API wrapper
- `lib/migration.ts` — Version migration system
- `lib/logger.ts` — Structured logging
- `lib/i18n.ts` — Internationalization utilities
- `constants.ts` — Global constants and enums
- `types.d.ts` — Shared type definitions

## Communication Patterns

### Message Flow

```
┌─────────────┐
│   Popup     │
└──────┬──────┘
       │ sendToActive()
       │
       ▼
┌─────────────┐      ┌─────────────┐
│ Background  │◄────►│   Content   │
└─────────────┘      └─────────────┘
       │                    │
       │                    │ on()
       ▼                    ▼
   Storage API         DOM Manipulation
```

### Type-Safe Messaging

The messaging system uses TypeScript generics to ensure type safety across contexts:

```ts
// Define message contract in constants.ts
export const MESSAGE_SPEC = {
  [MSG.CHANGE_BG]: {
    req: {} as { color: string },
    res: {} as { ok: boolean }
  }
} as const;

// Sender gets type checking
await bus.sendToActive(MSG.CHANGE_BG, { color: '#0ea5e9' });

// Listener gets typed payload
bus.on(MSG.CHANGE_BG, (payload) => {
  // payload.color is typed as string
  document.body.style.backgroundColor = payload.color;
  return { ok: true };
});
```

## Storage Architecture

### Multi-Area Storage

Chrome Extension Starter supports all four Chrome storage areas:

1. **local** — Local data, no sync, larger quota
2. **sync** — Synced across devices
3. **managed** — Read-only, enterprise-controlled
4. **session** — Ephemeral, lives with service worker session

```ts
// Type-safe storage operations
await kv.set('sync', 'theme', 'dark');
const theme = await kv.get('sync', 'theme', 'system');

// Managed storage (read-only)
const orgPolicy = await kv.get('managed', 'orgEnabled', false);
```

### Storage Schema

Define your storage schema in `shared/types.d.ts`:

```ts
export interface StorageSchema {
  local: {
    darkMode: boolean;
    username: string;
  };
  sync: {
    settings: unknown;
    version: string;
  };
  managed: {
    orgEnabled: boolean;
    allowedHosts: string[];
  };
  session: {
    lastVisited: string | null;
    tempToken: string | null;
  };
}
```

## Migration System

The migration system handles version upgrades gracefully:

```ts
// Define migrations in config.ts
export const customMigrations: Migration[] = [
  {
    version: '1.1.0',
    description: 'Migrate old settings format',
    migrate: async (ctx) => {
      const oldSettings = await ctx.getStorage('sync', 'oldSettings');
      if (oldSettings) {
        return {
          sync: { settings: transformSettings(oldSettings) }
        };
      }
    }
  }
];
```

## Build System

### RSBuild Configuration

The project uses RSBuild with separate environment configurations:

**Web Environment** (UI contexts):
- Popup, Options, Content scripts
- Preact + TailwindCSS
- HTML template injection

**Worker Environment** (Background):
- Service worker bundle
- No DOM dependencies
- Module-based output

### Output Structure

```
dist/
├── manifest.json
├── popup.html
├── options.html
├── popup.js
├── options.js
├── content.js
├── background.js
├── icons/
└── _locales/
```

## Security Considerations

### Content Security Policy

The extension follows CSP best practices:
- No inline scripts
- No eval()
- External resources via web_accessible_resources

### Permissions

Requested permissions are minimal and justified:
- `storage` — For settings persistence
- `tabs` — For content script communication
- `alarms` — For scheduled tasks
- `host_permissions` — Limited to required hosts

## Performance Optimization

### Code Splitting

Each context is built independently:
- Background script: ~50KB (minified)
- Popup: ~70KB (minified + Preact)
- Content script: ~80KB (minified + Preact + UI)

### Lazy Loading

Content script UI components are conditionally rendered to minimize initial load.

## Testing Architecture

### Unit Tests

Located in `__tests__/`, covering:
- Messaging system (`messaging.test.ts`)
- Storage utilities (`storage.test.ts`)
- Migration logic (`migration.test.ts`)
- DOM utilities (`dom.test.ts`)

### Test Runner

Vitest with jsdom environment for DOM testing:

```bash
pnpm test         # Run once
pnpm test:watch   # Watch mode
pnpm test:cov     # Coverage report
```

## Next Steps

- Explore [Core Modules](./core-modules/messaging) in detail
- Learn about [Development Workflow](./development/building)
- Check [API Reference](./api/types) for type definitions
