---
sidebar_position: 2
---

# Messaging API

Programmatic reference for the type-safe messaging utilities implemented in `src/shared/lib/messaging.ts`.

## Overview

The messaging module exposes a single factory, `createMessenger`, that returns three helper functions:

- `sendToTab` — Send a typed message to a specific tab.
- `sendToActive` — Send a typed message to the active tab in the current window.
- `on` — Register a typed listener for incoming messages.

Throughout the documentation, the examples assume the shared instance exported from `src/shared/lib/messaging.ts`:

```ts
import { createMessenger } from '@/shared/lib/messaging';
import type { MessageMap } from '@/shared/types';

export const bus = createMessenger<MessageMap>();
```

## `createMessenger<M>()`

Creates a messenger instance bound to a `MessageMap` type.

```ts
const bus = createMessenger<MessageMap>();
```

**Type Parameters**
- `M` — A record whose keys map to `{ req?: unknown; res?: unknown }` definitions.

**Returns**
An object with `sendToTab`, `sendToActive`, and `on` methods.

---

## `sendToTab`

Send a typed message to a specific tab.

```ts
const response = await bus.sendToTab(tabId, MSG.CHANGE_BG, { color: '#0ea5e9' }, { timeoutMs: 5000 });
```

**Signature**
```ts
sendToTab<
  K extends keyof M & string,
  TRes = M[K] extends { res: infer R } ? R : unknown
>(
  tabId: number,
  type: K,
  payload?: M[K] extends { req: infer P } ? P : undefined,
  opts?: { timeoutMs?: number }
): Promise<TRes>
```

**Parameters**
- `tabId` — Target tab identifier.
- `type` — Enum/string literal declared in `MSG`.
- `payload` — Request payload constrained by `MESSAGE_SPEC`.
- `opts.timeoutMs` — Optional timeout in milliseconds (rejects with `Error('Message timeout')`).

**Returns**
- `Promise<TRes>` resolving to the typed response, or rejecting if the tab errors/ disconnects.

**Errors**
- Rejects with `Error('Message timeout')` if the timeout elapses.
- Rejects with the `chrome.runtime.lastError` message if sending fails.

---

## `sendToActive`

Send a message to the currently active tab in the focused window.

```ts
const result = await bus.sendToActive(MSG.CHANGE_BG, { color: '#0ea5e9' });
```

**Signature**
```ts
sendToActive<
  K extends keyof M & string,
  TRes = M[K] extends { res: infer R } ? R : unknown
>(
  type: K,
  payload?: M[K] extends { req: infer P } ? P : undefined,
  opts?: { timeoutMs?: number }
): Promise<TRes | undefined>
```

**Parameters**
- `type`, `payload`, `opts` — Same as `sendToTab`.

**Returns**
- Resolves to the typed response when the active tab exists and replies.
- Resolves to `undefined` if no active tab is found (e.g., Chrome welcome page).

---

## `on`

Register a listener for a specific message type.

```ts
const unsubscribe = bus.on(MSG.CHANGE_BG, (payload, sender) => {
  document.body.style.backgroundColor = payload.color;
  return { ok: true };
});
```

**Signature**
```ts
on<
  K extends keyof M & string
>(
  type: K,
  handler: (
    payload: M[K] extends { req: infer P } ? Readonly<DeepPartial<P>> : undefined,
    sender: chrome.runtime.MessageSender
  ) => (M[K] extends { res: infer R } ? R : unknown) | Promise<M[K] extends { res: infer R } ? R : unknown>
): () => void
```

**Parameters**
- `type` — Message type to listen for.
- `handler` — Function invoked with typed payload plus `chrome.runtime.MessageSender`.

**Returns**
- Unsubscribe function removing the listener when invoked.

**Handler Behavior**
- Return a value or a promise to respond.
- Throw or reject to send a structured error (converted via `toErrorResponse`).
- Return the private sentinel `UNHANDLED` (only available inside module) to defer handling to other listeners.

---

## Error Handling

All messaging helpers funnel errors into a shared format:

```ts
interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}
```

Use `toErrorResponse` to create custom errors:

```ts
import { toErrorResponse } from '@/shared/lib/error';

bus.on(MSG.GET_USER, async (payload) => {
  if (!payload.userId) {
    throw toErrorResponse('User ID is required', 'INVALID_USER');
  }
});
```

Callers can narrow responses via type guards:

```ts
const res = await bus.sendToActive(MSG.GET_USER, { userId: 1 });

if ('error' in (res as any)) {
  console.error(res.error.message);
} else {
  console.log(res.name);
}
```

---

## Usage Patterns

### React/Preact Integration

```tsx
useEffect(() => {
  const off = bus.on(MSG.CHANGE_BG, (payload) => {
    setColor(payload.color);
    return { ok: true };
  });
  return () => off();
}, []);
```

### Service Worker Messaging

```ts
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const info = await bus.sendToTab(tabId, MSG.GET_PAGE_INFO);
  logger.info('Active page info', info);
});
```

### Timeout Guard

```ts
try {
  await bus.sendToActive(MSG.LONG_TASK, data, { timeoutMs: 3000 });
} catch (err) {
  logger.error('Timed out waiting for LONG_TASK', err);
}
```

---

## Browser APIs Used

- `chrome.runtime.onMessage`
- `chrome.runtime.sendMessage`
- `chrome.tabs.sendMessage`
- `chrome.tabs.query`

The helpers automatically manage listener lifecycles and type inference, allowing you to focus on business logic.
