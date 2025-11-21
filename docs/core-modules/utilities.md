---
sidebar_position: 5
---

# Other Utilities

Chrome Extension Starter includes several additional utility modules that simplify common tasks in extension development.

## DOM Utilities

**Location**: `src/shared/lib/dom.ts`

Helper functions for safe DOM manipulation in content scripts.

### `mount(id?)`

Create or retrieve a mount point for UI elements.

**Parameters**:
- `id?: string` — Element ID (default: `'ces-root'`)

**Returns**: `HTMLElement`

**Usage**:
```typescript
import { mount } from '@/shared/lib/dom';
import { render } from 'preact';

// Create mount point
const el = mount('ces-overlay');

// Render UI
render(<MyComponent />, el);
```

**How it works**:
1. Looks for existing element by ID
2. Creates new div if not found
3. Appends to document.body
4. Returns the element

**Example**: Multiple mount points
```typescript
const overlay = mount('ces-overlay');
const sidebar = mount('ces-sidebar');

render(<Overlay />, overlay);
render(<Sidebar />, sidebar);
```

---

## Internationalization (i18n)

**Location**: `src/shared/lib/i18n.ts`

Utilities for multi-language support using Chrome's i18n API.

### `t(key, ...substitutions)`

Get localized message from `_locales/` directory.

**Parameters**:
- `key: string` — Message key
- `...substitutions: string[]` — Optional placeholders

**Returns**: `string`

**Usage**:
```typescript
import { t } from '@/shared/lib/i18n';

// Simple message
const title = t('extName');

// Message with substitution
const greeting = t('welcomeMessage', 'John');
```

### Defining Messages

Create message files in `public/_locales/{locale}/messages.json`:

**English** (`public/_locales/en/messages.json`):
```json
{
  "extName": {
    "message": "Chrome Extension Starter"
  },
  "extDescription": {
    "message": "A modern Chrome extension template"
  },
  "welcomeMessage": {
    "message": "Welcome, $USER$!",
    "placeholders": {
      "user": {
        "content": "$1",
        "example": "John"
      }
    }
  },
  "backgroundChanged": {
    "message": "Background changed to $COLOR$",
    "placeholders": {
      "color": {
        "content": "$1",
        "example": "#0ea5e9"
      }
    }
  }
}
```

**Japanese** (`public/_locales/ja/messages.json`):
```json
{
  "extName": {
    "message": "Chrome拡張機能スターター"
  },
  "welcomeMessage": {
    "message": "ようこそ、$USER$さん！",
    "placeholders": {
      "user": {
        "content": "$1"
      }
    }
  }
}
```

### Usage in UI

```tsx
import { t } from '@/shared/lib/i18n';

const Popup = () => {
  return (
    <div>
      <h1>{t('extName')}</h1>
      <p>{t('extDescription')}</p>
      <p>{t('welcomeMessage', 'Alice')}</p>
    </div>
  );
};
```

### Usage in Content Scripts

```typescript
import { t } from '@/shared/lib/i18n';

bus.on(MSG.CHANGE_BG, (payload) => {
  const message = t('backgroundChanged', payload.color);
  showNotification(message);
  return { ok: true };
});
```

---

## Error Handling

**Location**: `src/shared/lib/error.ts`

Utilities for structured error handling.

### `toErrorResponse(error, code?, details?)`

Convert errors to structured format for messaging.

**Parameters**:
- `error: Error | string` — Error instance or message
- `code?: string` — Optional error code
- `details?: unknown` — Additional context

**Returns**: `ErrorResponse`

**Usage**:
```typescript
import { toErrorResponse } from '@/shared/lib/error';

try {
  await riskyOperation();
} catch (err) {
  const errorResponse = toErrorResponse(err, 'OPERATION_FAILED');
  console.error(errorResponse);
  // {
  //   error: {
  //     message: 'Operation failed',
  //     code: 'OPERATION_FAILED',
  //     details: undefined
  //   }
  // }
}
```

**In Message Handlers**:
```typescript
bus.on(MSG.GET_USER, async (payload) => {
  if (!payload.userId) {
    throw toErrorResponse('User ID is required', 'INVALID_INPUT');
  }
  
  try {
    const user = await fetchUser(payload.userId);
    return user;
  } catch (err) {
    throw toErrorResponse(err, 'FETCH_FAILED', { userId: payload.userId });
  }
});
```

---

## Settings Management

**Location**: `src/shared/lib/setting.ts`

Utilities for managing extension settings with defaults and validation.

### Features

- Default value support
- Type-safe settings schema
- Storage area selection (sync/local)
- Validation helpers

### Example Implementation

```typescript
// Define settings schema
interface Settings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'auto',
  language: 'en',
  notifications: true
};

// Get settings with defaults
export const getSettings = async (): Promise<Settings> => {
  const stored = await kv.get('sync', 'settings');
  return { ...DEFAULT_SETTINGS, ...stored };
};

// Update settings
export const updateSettings = async (updates: Partial<Settings>): Promise<void> => {
  const current = await getSettings();
  const newSettings = { ...current, ...updates };
  await kv.set('sync', 'settings', newSettings);
};

// Validate theme
export const isValidTheme = (theme: string): theme is Settings['theme'] => {
  return ['light', 'dark', 'auto'].includes(theme);
};
```

**Usage**:
```typescript
import { getSettings, updateSettings } from '@/shared/lib/setting';

// Get current settings
const settings = await getSettings();
console.log(settings.theme); // 'auto'

// Update theme
await updateSettings({ theme: 'dark' });
```

---

## Utility Functions

**Location**: `src/shared/lib/utils.ts`

General-purpose utility functions.

### Common Patterns

```typescript
// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

// Throttle function
export const throttle = <T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Sleep helper
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Retry helper
export const retry = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (err) {
    if (retries === 0) throw err;
    await sleep(delay);
    return retry(fn, retries - 1, delay);
  }
};
```

**Usage**:
```typescript
import { debounce, retry, sleep } from '@/shared/lib/utils';

// Debounced search
const debouncedSearch = debounce(async (query: string) => {
  const results = await fetch(`/api/search?q=${query}`);
  displayResults(results);
}, 300);

// Retry failed requests
const fetchWithRetry = async () => {
  return retry(
    async () => {
      const res = await fetch('/api/data');
      if (!res.ok) throw new Error('Request failed');
      return res.json();
    },
    3,  // 3 retries
    1000 // 1 second delay
  );
};
```

---

## Constants

**Location**: `src/shared/constants.ts`

Global constants and configuration.

### FLAGS

Feature flags for conditional behavior:

```typescript
export const FLAGS = {
  ENABLE_OVERLAY: true,
  ENABLE_ANALYTICS: false,
  DEBUG_MODE: process.env.NODE_ENV === 'development'
} as const;
```

**Usage**:
```typescript
import { FLAGS } from '@/shared/constants';

if (FLAGS.ENABLE_OVERLAY) {
  mountOverlay();
}
```

### ALARMS

Alarm identifiers for scheduled tasks:

```typescript
export const ALARMS = {
  POLL: 'poll',
  DAILY_CLEANUP: 'daily_cleanup',
  SYNC_DATA: 'sync_data'
} as const;
```

**Usage**:
```typescript
import { ALARMS } from '@/shared/constants';

chrome.alarms.create(ALARMS.POLL, { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARMS.POLL) {
    pollData();
  }
});
```

### RESTRICTED

URL patterns to avoid:

```typescript
export const RESTRICTED = {
  schemes: ['chrome', 'chrome-extension', 'chrome-untrusted', 'devtools', 'edge', 'about'],
  hosts: [
    /^(?:https?:\/\/)?chrome\.google\.com\/webstore\/?/i,
    /^(?:https?:\/\/)?microsoftedge\.microsoft\.com\/addons\/?/i
  ]
} as const;
```

**Usage**:
```typescript
import { RESTRICTED } from '@/shared/constants';

const isRestricted = (url: string): boolean => {
  const urlObj = new URL(url);
  
  // Check scheme
  if (RESTRICTED.schemes.includes(urlObj.protocol.replace(':', ''))) {
    return true;
  }
  
  // Check host patterns
  return RESTRICTED.hosts.some((pattern) => pattern.test(url));
};

// In content script injection
chrome.tabs.query({}, (tabs) => {
  tabs.forEach((tab) => {
    if (tab.url && !isRestricted(tab.url)) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    }
  });
});
```

---

## Best Practices

### 1. Use Type Definitions

Always import types for better IDE support:

```typescript
import type { StorageSchema } from '@/shared/types';
import type { MessageMap } from '@/shared/types';
```

### 2. Centralize Constants

Keep all magic values in `constants.ts`:

```typescript
// ✓ Good
import { ALARMS } from '@/shared/constants';
chrome.alarms.create(ALARMS.POLL, { periodInMinutes: 5 });

// ❌ Bad
chrome.alarms.create('poll', { periodInMinutes: 5 });
```

### 3. Create Utility Wrappers

Wrap common patterns in reusable utilities:

```typescript
// utils.ts
export const queryActiveTab = async (): Promise<chrome.tabs.Tab | undefined> => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
};

// Usage
const activeTab = await queryActiveTab();
```

### 4. Document Utility Functions

```typescript
/**
 * Debounces a function call
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
) => {
  // Implementation...
};
```

## Next Steps

- Learn about [Development Workflow](/development/building)
- Explore [Testing](/development/testing) utilities
- Check [API Reference](/api/types) for type definitions
