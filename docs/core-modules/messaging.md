---
sidebar_position: 1
---

# Messaging

The messaging module (`src/shared/lib/messaging.ts`) provides a type-safe, promise-based API for communication between different extension contexts (popup, content, background).

## Overview

Chrome extensions communicate via message passing. This module wraps `chrome.runtime.sendMessage` and `chrome.tabs.sendMessage` with:

- **Type Safety** — Full TypeScript support with generics
- **Async/Await** — Promise-based API (no callbacks)
- **Timeout Support** — Configurable message timeouts
- **Auto Cleanup** — Unsubscribe functions for listeners
- **Error Handling** — Structured error responses

## Creating the Message Bus

```ts
import { createMessenger } from '@/shared/lib/messaging';
import type { MessageMap } from '@/shared/types';

export const bus = createMessenger<MessageMap>();
```

## Defining Message Types

### 1. Define Message Enum

In `shared/constants.ts`:

```ts
export enum MSG {
  CHANGE_BG = 'CHANGE_BG',
  GET_USER = 'GET_USER',
  UPDATE_SETTINGS = 'UPDATE_SETTINGS'
}
```

### 2. Define Message Specifications

Provide type contracts for request/response:

```ts
export const MESSAGE_SPEC = {
  [MSG.CHANGE_BG]: {
    req: {} as { color: string },
    res: {} as { ok: boolean }
  },
  [MSG.GET_USER]: {
    req: {} as { userId: number },
    res: {} as { name: string; email: string }
  },
  [MSG.UPDATE_SETTINGS]: {
    req: {} as { settings: Record<string, any> },
    res: {} as { success: boolean }
  }
} as const;
```

### 3. Build Message Map

In `shared/types.d.ts`:

```ts
export type MessageMap = MessageMapOf<typeof MSG, typeof MESSAGE_SPEC>;
```

## Sending Messages

### Send to Active Tab

Send a message to the currently active tab:

```ts
import { bus } from '@/shared/lib/messaging';
import { MSG } from '@/shared/constants';

// Send from popup or background to content script
const response = await bus.sendToActive(MSG.CHANGE_BG, { color: '#0ea5e9' });
console.log(response); // { ok: true }
```

**Signature**:
```ts
sendToActive<K extends keyof MessageMap>(
  type: K,
  payload?: MessageMap[K]['req'],
  opts?: { timeoutMs?: number }
): Promise<MessageMap[K]['res'] | undefined>
```

### Send to Specific Tab

Send a message to a specific tab by ID:

```ts
const tabId = 123;
const response = await bus.sendToTab(tabId, MSG.GET_USER, { userId: 42 });
console.log(response); // { name: 'John', email: 'john@example.com' }
```

**Signature**:
```ts
sendToTab<K extends keyof MessageMap>(
  tabId: number,
  type: K,
  payload?: MessageMap[K]['req'],
  opts?: { timeoutMs?: number }
): Promise<MessageMap[K]['res']>
```

### With Timeout

Add a timeout to prevent hanging on unresponsive contexts:

```ts
try {
  const response = await bus.sendToActive(
    MSG.CHANGE_BG,
    { color: '#0ea5e9' },
    { timeoutMs: 5000 } // 5 second timeout
  );
} catch (err) {
  console.error('Message timeout or error:', err);
}
```

## Receiving Messages

### Register a Listener

Listen for specific message types with type-safe handlers:

```ts
import { bus } from '@/shared/lib/messaging';
import { MSG } from '@/shared/constants';

// In content script
const unsubscribe = bus.on(MSG.CHANGE_BG, (payload, sender) => {
  // payload is typed as { color: string }
  document.body.style.backgroundColor = payload.color;
  
  // Return response (typed as { ok: boolean })
  return { ok: true };
});

// Cleanup when done
unsubscribe();
```

**Signature**:
```ts
on<K extends keyof MessageMap>(
  type: K,
  handler: (
    payload: MessageMap[K]['req'],
    sender: chrome.runtime.MessageSender
  ) => MessageMap[K]['res'] | Promise<MessageMap[K]['res']>
): () => void
```

### Async Handlers

Handlers can be async:

```ts
bus.on(MSG.GET_USER, async (payload, sender) => {
  const user = await fetchUser(payload.userId);
  return { name: user.name, email: user.email };
});
```

### Multiple Listeners

Multiple listeners can handle the same message type. The first listener to respond wins:

```ts
// Listener 1
bus.on(MSG.CHANGE_BG, (payload) => {
  if (payload.color === 'red') {
    document.body.style.backgroundColor = 'red';
    return { ok: true };
  }
  // Return UNHANDLED to allow other listeners
});

// Listener 2
bus.on(MSG.CHANGE_BG, (payload) => {
  document.body.style.backgroundColor = payload.color;
  return { ok: true };
});
```

## Error Handling

### Structured Errors

The messaging system automatically converts errors to structured responses:

```ts
bus.on(MSG.GET_USER, async (payload) => {
  throw new Error('User not found');
});

// Caller receives:
// {
//   error: {
//     message: 'User not found',
//     code: undefined,
//     details: undefined
//   }
// }
```

### Custom Error Responses

Use the `toErrorResponse` utility for custom errors:

```ts
import { toErrorResponse } from '@/shared/lib/error';

bus.on(MSG.GET_USER, async (payload) => {
  if (!payload.userId) {
    throw toErrorResponse('Invalid user ID', 'INVALID_USER_ID');
  }
  // ...
});
```

## Usage Examples

### Example 1: Change Page Background (Popup → Content)

**Popup** (`pages/popup/index.tsx`):
```tsx
import { bus } from '@/shared/lib/messaging';
import { MSG } from '@/shared/constants';

const Popup = () => {
  const changeColor = async (color: string) => {
    const result = await bus.sendToActive(MSG.CHANGE_BG, { color });
    if (result?.ok) {
      console.log('Background changed successfully');
    }
  };

  return (
    <div>
      <button onClick={() => changeColor('#0ea5e9')}>Blue</button>
      <button onClick={() => changeColor('#ef4444')}>Red</button>
    </div>
  );
};
```

**Content Script** (`content/index.tsx`):
```ts
import { bus } from '@/shared/lib/messaging';
import { MSG } from '@/shared/constants';

bus.on(MSG.CHANGE_BG, (payload) => {
  document.body.style.backgroundColor = payload.color;
  return { ok: true };
});
```

### Example 2: Fetch User Data (Background → Content)

**Background** (`background/runtime.ts`):
```ts
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const user = await bus.sendToTab(activeInfo.tabId, MSG.GET_USER, { userId: 1 });
  console.log('Current user:', user);
});
```

**Content Script**:
```ts
bus.on(MSG.GET_USER, async (payload) => {
  const response = await fetch(`/api/users/${payload.userId}`);
  const user = await response.json();
  return { name: user.name, email: user.email };
});
```

## Advanced Patterns

### Conditional Listeners

Unsubscribe based on conditions:

```ts
const unsubscribe = bus.on(MSG.CHANGE_BG, (payload) => {
  if (someCondition) {
    unsubscribe(); // Stop listening
  }
  return { ok: true };
});
```

### Cleanup in React/Preact

```tsx
import { useEffect } from 'preact/hooks';

const MyComponent = () => {
  useEffect(() => {
    const off = bus.on(MSG.CHANGE_BG, (payload) => {
      // Handle message
      return { ok: true };
    });

    return () => off(); // Cleanup on unmount
  }, []);

  return <div>...</div>;
};
```

## API Reference

### `createMessenger<M>()`

Creates a type-safe message bus.

**Type Parameters**:
- `M` — Message map type

**Returns**: Messenger instance with `sendToTab`, `sendToActive`, and `on` methods

### `sendToTab(tabId, type, payload?, opts?)`

Send a message to a specific tab.

**Parameters**:
- `tabId: number` — Target tab ID
- `type: string` — Message type
- `payload?: any` — Message payload
- `opts?: { timeoutMs?: number }` — Optional timeout

**Returns**: `Promise<Response>`

### `sendToActive(type, payload?, opts?)`

Send a message to the active tab.

**Parameters**:
- `type: string` — Message type
- `payload?: any` — Message payload
- `opts?: { timeoutMs?: number }` — Optional timeout

**Returns**: `Promise<Response | undefined>`

### `on(type, handler)`

Register a message listener.

**Parameters**:
- `type: string` — Message type to listen for
- `handler: (payload, sender) => Response | Promise<Response>` — Handler function

**Returns**: `() => void` — Unsubscribe function

## Best Practices

1. **Always define message specs** — Use `MESSAGE_SPEC` for type safety
2. **Use enums for message types** — Avoid magic strings
3. **Handle errors gracefully** — Use try/catch with timeouts
4. **Clean up listeners** — Call unsubscribe when done
5. **Avoid heavy payloads** — Keep messages lightweight
6. **Use async handlers** — For long-running operations

## Troubleshooting

### Messages Not Received

- Ensure listener is registered before sender executes
- Check content script injection in manifest
- Verify message type matches exactly

### Timeout Errors

- Increase timeout value
- Check if receiver context is alive
- Verify handler is returning a response

### Type Errors

- Ensure `MESSAGE_SPEC` is properly defined
- Check payload matches request type
- Verify response type matches specification

## Next Steps

- Learn about [Storage](./storage) for persisting data
- Explore [Migration](./migration) for version upgrades
- Check [API Reference](../api/messaging-api) for detailed types
