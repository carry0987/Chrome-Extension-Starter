---
sidebar_position: 4
---

# Logger

The logger module (`src/shared/lib/logger.ts`) provides a lightweight, structured logging system for debugging and monitoring your Chrome extension.

## Overview

The logger offers:

- **Console-based Logging** — Uses standard console methods
- **Timestamped Messages** — ISO 8601 formatted timestamps
- **Namespace Prefix** — Identifies extension logs
- **Multiple Levels** — debug, info, warn, error
- **Simple API** — Minimal configuration required

## Basic Usage

```ts
import { logger } from '@/shared/lib/logger';

logger.debug('Debug message', { data: 'value' });
logger.info('Info message', 'additional context');
logger.warn('Warning message', error);
logger.error('Error occurred', error);
```

## Log Levels

### debug

For detailed diagnostic information.

```ts
logger.debug('Processing request', { userId: 123, action: 'update' });
// Output: [Chrome-Extension-Starter] 2025-11-22T10:30:00.000Z Processing request { userId: 123, action: 'update' }
```

### info

For general informational messages.

```ts
logger.info('Extension initialized successfully');
// Output: [Chrome-Extension-Starter] 2025-11-22T10:30:01.000Z Extension initialized successfully
```

### warn

For warning messages about potentially harmful situations.

```ts
logger.warn('API rate limit approaching', { remaining: 10 });
// Output: [Chrome-Extension-Starter] 2025-11-22T10:30:02.000Z API rate limit approaching { remaining: 10 }
```

### error

For error messages and exceptions.

```ts
logger.error('Failed to save settings', error);
// Output: [Chrome-Extension-Starter] 2025-11-22T10:30:03.000Z Failed to save settings Error: ...
```

## Usage Examples

### Example 1: Background Service Worker

```ts
// background/runtime.ts
import { logger } from '@/shared/lib/logger';

chrome.runtime.onInstalled.addListener((details) => {
  logger.info('Extension installed', { reason: details.reason });
});

chrome.runtime.onStartup.addListener(() => {
  logger.info('Extension started');
});
```

### Example 2: Message Handling

```ts
// content/index.tsx
import { bus } from '@/shared/lib/messaging';
import { logger } from '@/shared/lib/logger';
import { MSG } from '@/shared/constants';

bus.on(MSG.CHANGE_BG, (payload) => {
  logger.debug('Received CHANGE_BG message', payload);
  
  try {
    document.body.style.backgroundColor = payload.color;
    logger.info('Background color changed', { color: payload.color });
    return { ok: true };
  } catch (err) {
    logger.error('Failed to change background', err);
    return { ok: false };
  }
});
```

### Example 3: Storage Operations

```ts
import { kv } from '@/shared/lib/storage';
import { logger } from '@/shared/lib/logger';

const saveSettings = async (settings: any) => {
  try {
    logger.debug('Saving settings', settings);
    await kv.set('sync', 'settings', settings);
    logger.info('Settings saved successfully');
  } catch (err) {
    logger.error('Failed to save settings', err);
    throw err;
  }
};
```

### Example 4: API Requests

```ts
const fetchUserData = async (userId: number) => {
  logger.debug('Fetching user data', { userId });
  
  try {
    const response = await fetch(`/api/users/${userId}`);
    const data = await response.json();
    logger.info('User data fetched', { userId, dataSize: JSON.stringify(data).length });
    return data;
  } catch (err) {
    logger.error('Failed to fetch user data', { userId, error: err });
    throw err;
  }
};
```

### Example 5: Performance Monitoring

```ts
const measurePerformance = async (taskName: string, task: () => Promise<any>) => {
  const start = performance.now();
  logger.debug(`Starting task: ${taskName}`);
  
  try {
    const result = await task();
    const duration = performance.now() - start;
    logger.info(`Task completed: ${taskName}`, { duration: `${duration.toFixed(2)}ms` });
    return result;
  } catch (err) {
    const duration = performance.now() - start;
    logger.error(`Task failed: ${taskName}`, { duration: `${duration.toFixed(2)}ms`, error: err });
    throw err;
  }
};

// Usage
await measurePerformance('Save settings', () => saveSettings(data));
```

## Best Practices

### 1. Use Appropriate Log Levels

```ts
// ✓ Good: Use debug for detailed diagnostics
logger.debug('Processing item', { id: item.id, status: item.status });

// ✓ Good: Use info for important events
logger.info('User logged in', { userId: user.id });

// ✓ Good: Use warn for recoverable issues
logger.warn('Cache miss, fetching from API', { key: cacheKey });

// ✓ Good: Use error for failures
logger.error('Database connection failed', error);
```

### 2. Include Context

```ts
// ❌ Bad: No context
logger.error('Failed');

// ✓ Good: Includes context
logger.error('Failed to load user profile', { userId: 123, error });
```

### 3. Avoid Sensitive Data

```ts
// ❌ Bad: Logs password
logger.debug('User login', { username, password });

// ✓ Good: Omits sensitive data
logger.debug('User login', { username });
```

### 4. Structure Your Logs

```ts
// ✓ Good: Structured data for easy parsing
logger.info('API request completed', {
  endpoint: '/api/users',
  method: 'GET',
  status: 200,
  duration: 123
});
```

## Advanced Usage

### Custom Logger Factory

Create loggers for specific modules:

```ts
const createModuleLogger = (moduleName: string) => {
  const prefix = `[${moduleName}]`;
  return {
    debug: (...args: unknown[]) => logger.debug(prefix, ...args),
    info: (...args: unknown[]) => logger.info(prefix, ...args),
    warn: (...args: unknown[]) => logger.warn(prefix, ...args),
    error: (...args: unknown[]) => logger.error(prefix, ...args)
  };
};

// Usage
const storageLogger = createModuleLogger('Storage');
storageLogger.info('Saving data'); 
// Output: [Chrome-Extension-Starter] 2025-11-22T10:30:00.000Z [Storage] Saving data
```

### Conditional Logging

Log only in development:

```ts
const isDev = process.env.NODE_ENV === 'development';

const debugLog = (...args: unknown[]) => {
  if (isDev) {
    logger.debug(...args);
  }
};

debugLog('This only logs in development');
```

### Performance Wrapper

```ts
const withLogging = <T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T => {
  return ((...args: any[]) => {
    logger.debug(`Calling ${name}`, { args });
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        return result
          .then((r) => {
            logger.debug(`${name} succeeded`, { result: r });
            return r;
          })
          .catch((e) => {
            logger.error(`${name} failed`, e);
            throw e;
          });
      }
      logger.debug(`${name} succeeded`, { result });
      return result;
    } catch (e) {
      logger.error(`${name} failed`, e);
      throw e;
    }
  }) as T;
};

// Usage
const saveSettings = withLogging(
  async (settings: any) => {
    await kv.set('sync', 'settings', settings);
  },
  'saveSettings'
);
```

## Output Format

Each log message follows this format:

```
[Namespace] Timestamp ...args
```

**Example**:
```
[Chrome-Extension-Starter] 2025-11-22T10:30:00.000Z User logged in { userId: 123 }
```

## Browser Console

Logs appear in different browser contexts:

### Background Service Worker
Open DevTools for the service worker:
1. Go to `chrome://extensions/`
2. Click "Inspect views: background page"
3. Check Console tab

### Content Script
Open DevTools for the web page:
1. Right-click page → Inspect
2. Check Console tab
3. Filter by `[Chrome-Extension-Starter]`

### Popup/Options
Open DevTools for the popup/options page:
1. Right-click popup → Inspect popup
2. Check Console tab

## Customization

### Change Namespace

Edit `src/shared/lib/logger.ts`:

```ts
const NS = '[My-Extension]'; // Change this
```

### Add Custom Levels

```ts
export const logger = {
  debug: (...a: unknown[]) => log('debug', ...a),
  info: (...a: unknown[]) => log('info', ...a),
  warn: (...a: unknown[]) => log('warn', ...a),
  error: (...a: unknown[]) => log('error', ...a),
  
  // Add custom level
  trace: (...a: unknown[]) => log('debug', '[TRACE]', ...a),
  fatal: (...a: unknown[]) => log('error', '[FATAL]', ...a)
};
```

### Remote Logging

Send logs to a remote service:

```ts
const log = (level: Level, ...args: unknown[]) => {
  const time = new Date().toISOString();
  console[level]?.(NS, time, ...args);
  
  // Send to remote logging service
  if (level === 'error' || level === 'warn') {
    sendToRemote({ level, time, message: args });
  }
};

const sendToRemote = async (logData: any) => {
  try {
    await fetch('https://logs.example.com/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    });
  } catch (err) {
    // Don't log this error to avoid infinite loop
  }
};
```

## Testing

Mock the logger in tests:

```ts
// __tests__/setup.ts
import { vi } from 'vitest';

vi.mock('@/shared/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));
```

Test log calls:

```ts
import { describe, it, expect, vi } from 'vitest';
import { logger } from '@/shared/lib/logger';

describe('My Feature', () => {
  it('should log errors', async () => {
    await myFunction();
    expect(logger.error).toHaveBeenCalledWith('Expected error message', expect.any(Error));
  });
});
```

## API Reference

### `logger.debug(...args)`

Log debug information.

**Parameters**: `...args: unknown[]` — Data to log

**Returns**: `void`

### `logger.info(...args)`

Log informational messages.

**Parameters**: `...args: unknown[]` — Data to log

**Returns**: `void`

### `logger.warn(...args)`

Log warnings.

**Parameters**: `...args: unknown[]` — Data to log

**Returns**: `void`

### `logger.error(...args)`

Log errors.

**Parameters**: `...args: unknown[]` — Data to log

**Returns**: `void`

## Next Steps

- Learn about [Messaging](./messaging) for communication
- Explore [Storage](./storage) for data persistence
- Check [Development Guide](../development/testing) for testing tips
