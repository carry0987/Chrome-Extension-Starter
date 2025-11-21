---
sidebar_position: 3
---

# Debugging

Learn effective debugging techniques for Chrome extensions across different contexts.

## Overview

Chrome extensions run in multiple isolated contexts, each requiring different debugging approaches:

- **Background Service Worker** — Background tasks and lifecycle
- **Content Scripts** — Injected into web pages
- **Popup/Options Pages** — Extension UI pages

## Debugging Background Service Worker

### Access DevTools

1. Navigate to `chrome://extensions/`
2. Ensure **Developer mode** is enabled
3. Find your extension
4. Click **Inspect views: background page** (or **service worker**)

### Console Logging

```ts showLineNumbers title="src/background/runtime.ts"
import { logger } from '@/shared/lib/logger';

chrome.runtime.onInstalled.addListener((details) => {
  logger.info('Extension installed', { reason: details.reason, version: details.previousVersion });
});

chrome.runtime.onStartup.addListener(() => {
  logger.info('Extension started');
});
```

### Breakpoints

1. Open background service worker DevTools
2. Go to **Sources** tab
3. Find your script (`static/js/background.js`)
4. Click line numbers to set breakpoints
5. Reload extension to trigger breakpoints

### Network Requests

Monitor API calls in the **Network** tab:

```ts showLineNumbers title="src/background/index.ts"
const fetchData = async () => {
  const response = await fetch('https://api.example.com/data');
  const data = await response.json();
  logger.info('Data fetched', data);
};
```

**Network tab shows**:
- Request/response headers
- Payload data
- Timing information
- Status codes

### Storage Inspection

View Chrome Storage in **Application** tab:

1. Open background DevTools
2. Navigate to **Application** → **Storage**
3. Expand **Chrome Storage** → **Local/Sync**
4. View and edit stored data

## Debugging Content Scripts

### Access DevTools

Content scripts run in the context of web pages:

1. Open the webpage where content script is injected
2. Right-click → **Inspect**
3. Content script logs appear in Console
4. Filter by extension name: `[Chrome-Extension-Starter]`

### Console Logging

```ts showLineNumbers title="src/content/index.tsx"
import { logger } from '@/shared/lib/logger';

logger.info('Content script loaded');

bus.on(MSG.CHANGE_BG, (payload) => {
  logger.debug('Received message', payload);
  document.body.style.backgroundColor = payload.color;
  return { ok: true };
});
```

### Breakpoints

1. Open DevTools on the webpage
2. Go to **Sources** tab
3. Find content script under **Content scripts** → `chrome-extension://[id]`
4. Set breakpoints in `content.js`

### DOM Inspection

Inspect injected elements:

```ts showLineNumbers title="src/content/index.tsx"
const overlay = mount('ces-overlay');
logger.info('Overlay mounted', overlay);
```

**Elements tab shows**:
- Injected DOM structure
- Applied styles
- Event listeners

### Message Flow Debugging

Debug message passing:

```ts showLineNumbers title="src/content/index.tsx"
bus.on(MSG.CHANGE_BG, (payload, sender) => {
  logger.debug('Message received from', sender.tab?.id, 'with payload', payload);
  
  try {
    document.body.style.backgroundColor = payload.color;
    logger.info('Background changed successfully');
    return { ok: true };
  } catch (err) {
    logger.error('Failed to change background', err);
    return { ok: false };
  }
});
```

## Debugging Popup/Options Pages

### Access DevTools

**Popup**:
1. Right-click extension icon in toolbar
2. Click **Inspect popup**

**Options**:
1. Right-click extension icon → **Options**
2. Right-click options page → **Inspect**

### Console Logging

```ts showLineNumbers title="src/pages/popup/index.tsx"
import { logger } from '@/shared/lib/logger';

const Popup = () => {
  const handleClick = async () => {
    logger.debug('Button clicked');
    const result = await bus.sendToActive(MSG.CHANGE_BG, { color: '#0ea5e9' });
    logger.info('Message sent, result:', result);
  };

  return <button onClick={handleClick}>Change Background</button>;
};
```

### Component Inspection

Use React DevTools:

1. Install [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
2. Open popup DevTools
3. Access **Components** tab
4. Inspect component state and props

### Network Requests

Monitor API calls in popup:

```ts
const fetchSettings = async () => {
  logger.debug('Fetching settings from API');
  const response = await fetch('/api/settings');
  const data = await response.json();
  logger.info('Settings fetched', data);
  return data;
};
```

## Common Debugging Patterns

### Log Message Flow

Track messages across contexts:

```ts showLineNumbers title="src/pages/popup/index.tsx"
logger.info('[POPUP] Sending CHANGE_BG message');
await bus.sendToActive(MSG.CHANGE_BG, { color: 'red' });
```

```ts showLineNumbers title="src/content/index.tsx"
bus.on(MSG.CHANGE_BG, (payload) => {
  logger.info('[CONTENT] Received CHANGE_BG message', payload);
  return { ok: true };
});
```

### Conditional Breakpoints

Set breakpoints that only trigger when conditions are met:

1. Right-click on breakpoint
2. Select **Edit breakpoint**
3. Add condition: `payload.color === 'red'`

### Performance Profiling

Measure execution time:

```ts
const measurePerformance = async (fn: () => Promise<any>, label: string) => {
  const start = performance.now();
  logger.debug(`[PERF] Starting: ${label}`);
  
  try {
    const result = await fn();
    const duration = performance.now() - start;
    logger.info(`[PERF] Completed: ${label} in ${duration.toFixed(2)}ms`);
    return result;
  } catch (err) {
    const duration = performance.now() - start;
    logger.error(`[PERF] Failed: ${label} after ${duration.toFixed(2)}ms`, err);
    throw err;
  }
};

// Usage
await measurePerformance(
  () => bus.sendToActive(MSG.CHANGE_BG, { color: 'blue' }),
  'Send CHANGE_BG message'
);
```

### Error Boundary Logging

Catch and log component errors:

```tsx
import { Component } from 'preact';
import { logger } from '@/shared/lib/logger';

class ErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: any) {
    logger.error('Component error caught', { error, errorInfo });
  }

  render() {
    return this.props.children;
  }
}

// Usage
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

## Chrome DevTools Tips

### Console Filtering

Filter console logs:
- Click **Default levels** dropdown
- Select desired levels (Info, Warnings, Errors)
- Use filter box: `[Chrome-Extension-Starter]`

### Preserve Logs

Keep logs when popup closes:
1. Open popup DevTools
2. Check **Preserve log** in Console tab
3. Logs persist after popup closes

### Source Maps

Enable source maps for debugging TypeScript:

```ts showLineNumbers title="rsbuild.config.ts"
export default defineConfig({
  output: {
    sourceMap: {
      js: 'source-map'  // Enable for development
    }
  }
});
```

**Benefits**:
- Debug original TypeScript code
- Set breakpoints in `.ts` files
- Better error stack traces

## Debugging Tools

### Logger Module

Use the built-in logger for structured logging:

```ts
import { logger } from '@/shared/lib/logger';

// Debug level (detailed)
logger.debug('Processing request', { userId: 123, action: 'update' });

// Info level (important events)
logger.info('User logged in', { userId: 123 });

// Warning level (potential issues)
logger.warn('API rate limit approaching', { remaining: 10 });

// Error level (failures)
logger.error('Failed to save settings', error);
```

### Chrome Storage Inspector

View storage in real-time:

```ts
// Add to background script
chrome.storage.onChanged.addListener((changes, areaName) => {
  logger.info('Storage changed', { area: areaName, changes });
});
```

### Message Debugger

Log all messages:

```ts
// In content script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  logger.debug('Message received', { type: msg.type, payload: msg.payload, sender });
  return false; // Allow other listeners to handle
});
```

## Remote Debugging

### Chrome Remote Debugging

Debug extensions on remote devices:

1. Enable USB debugging on Android device
2. Connect via USB
3. Open `chrome://inspect/#devices`
4. Click **Inspect** on target device

### Logging to External Service

Send logs to a remote service for debugging:

```ts
const sendToRemote = async (log: any) => {
  if (process.env.NODE_ENV === 'development') {
    await fetch('http://localhost:3000/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log)
    });
  }
};

// Enhanced logger
export const logger = {
  error: (...args: unknown[]) => {
    console.error('[Chrome-Extension-Starter]', ...args);
    sendToRemote({ level: 'error', message: args });
  }
};
```

## Troubleshooting Common Issues

### Service Worker Inactive

**Problem**: Background service worker is inactive/sleeping

**Solution**:
1. Click **Inspect views: service worker** to wake it up
2. Add `chrome.runtime.onStartup` listener to log startup
3. Check if service worker terminates too quickly

### Content Script Not Injecting

**Problem**: Content script doesn't run on certain pages

**Debug**:
```ts
// Check if content script loaded
console.log('[Content Script] Loaded on', window.location.href);

// Verify match patterns
logger.info('Match patterns', chrome.runtime.getManifest().content_scripts);
```

**Check**:
- URL matches `manifest.json` patterns
- Page is not a restricted URL (chrome://, edge://)

### Messages Not Received

**Problem**: Messages sent but not received

**Debug**:
```ts
// Sender
logger.info('[SENDER] Sending message', { type: MSG.CHANGE_BG, payload });
const result = await bus.sendToActive(MSG.CHANGE_BG, payload);
logger.info('[SENDER] Response received', result);

// Receiver
bus.on(MSG.CHANGE_BG, (payload, sender) => {
  logger.info('[RECEIVER] Message received', { payload, sender });
  return { ok: true };
});
```

**Check**:
- Listener is registered before sender executes
- Content script is injected
- No errors in console

### Storage Not Persisting

**Problem**: Data not saved to Chrome Storage

**Debug**:
```ts
await kv.set('sync', 'theme', 'dark');
logger.info('Theme saved');

const theme = await kv.get('sync', 'theme');
logger.info('Theme retrieved', theme);

// Listen for changes
chrome.storage.onChanged.addListener((changes, area) => {
  logger.info('Storage changed', { area, changes });
});
```

**Check**:
- Storage quota not exceeded
- Correct storage area (sync vs local)
- `storage` permission in manifest

## Best Practices

1. **Use structured logging** — Include context with every log
2. **Enable source maps** — Debug TypeScript instead of compiled JS
3. **Log message flow** — Track messages across contexts
4. **Check for errors** — Always handle errors in async code
5. **Preserve logs** — Enable "Preserve log" in DevTools
6. **Use descriptive labels** — Make logs searchable

## Next Steps

- Learn about [Building](./building) for production
- Explore [Testing](./testing) strategies
- Read about [Packaging](./packaging) for distribution
