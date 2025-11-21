---
sidebar_position: 3
---

# Storage API

Reference for the typed storage utilities defined in `src/shared/lib/storage.ts`.

## Overview

`createTypedStorage<StorageSchema>()` returns a strongly typed interface to Chrome's storage areas:

- `local`
- `sync`
- `managed` (read-only)
- `session`

The default export in the project is:

```ts
import type { StorageSchema } from '@/shared/types';
import { createTypedStorage } from '@/shared/lib/storage';

export const kv = createTypedStorage<StorageSchema>();
```

All methods respect the schema declared in `shared/types.d.ts`.

---

## API Surface

### `get`

Fetch a single key.

```ts
const theme = await kv.get('sync', 'theme', 'light');
```

**Signatures**
```ts
get<Area extends Areas, Key extends keyof Schema[Area]>(
  area: Area,
  key: Key,
  fallback: Schema[Area][Key]
): Promise<Schema[Area][Key]>;

get<Area extends Areas, Key extends keyof Schema[Area]>(
  area: Area,
  key: Key
): Promise<Schema[Area][Key] | undefined>;
```

**Behavior**
- With fallback: always returns a value (fallback is injected if missing).
- Without fallback: resolves to `undefined` when the key does not exist.

---

### `getAll`

Fetch all keys for a storage area.

```ts
const allSync = await kv.getAll('sync', { settings: {}, version: '0.0.0' });
```

**Signatures**
```ts
getAll<Area extends Areas>(
  area: Area,
  defaults: Partial<Schema[Area]>
): Promise<Schema[Area]>;

getAll<Area extends Areas>(
  area: Area
): Promise<Partial<Schema[Area]>>;
```

**Behavior**
- With defaults: result is fully shaped.
- Without defaults: only the stored keys are returned.

---

### `set`

Persist a single key. Not allowed for `managed` storage.

```ts
await kv.set('local', 'darkMode', true);
```

**Signature**
```ts
set<Area extends Exclude<Areas, 'managed'>, Key extends keyof Schema[Area]>(
  area: Area,
  key: Key,
  value: Schema[Area][Key]
): Promise<void>;
```

**Errors**
- Throws at runtime if attempting to write to `managed`.
- Propagates `chrome.runtime.lastError` messages (quota exceeded, etc.).

---

### `setAll`

Write multiple keys in one call.

```ts
await kv.setAll('sync', {
  version: '1.4.0',
  settings: { theme: 'dark' }
});
```

**Signature**
```ts
setAll<Area extends Exclude<Areas, 'managed'>>(
  area: Area,
  data: Partial<Schema[Area]>
): Promise<void>;
```

---

### `remove`

Delete a key (not available for `managed`).

```ts
await kv.remove('session', 'tempToken');
```

**Signature**
```ts
remove<Area extends Exclude<Areas, 'managed'>, Key extends keyof Schema[Area]>(
  area: Area,
  key: Key
): Promise<void>;
```

---

### `clear`

Clear an entire storage area (not available for `managed`).

```ts
await kv.clear('local');
```

**Signature**
```ts
clear<Area extends Exclude<Areas, 'managed'>>(
  area: Area
): Promise<void>;
```

---

## Storage Areas

| Area    | Read | Write | Syncs | Notes                     |
|---------|------|-------|-------|---------------------------|
| `local` | ✅   | ✅    | ❌    | ~10MB quota               |
| `sync`  | ✅   | ✅    | ✅    | ~100KB quota + per-item   |
| `session` | ✅ | ✅    | ❌    | Cleared with service worker |
| `managed` | ✅ | ❌    | ❌    | Enterprise policies only  |

---

## Type Safety

All methods leverage the `StorageSchema` definition, preventing invalid keys or types at compile time.

```ts
interface StorageSchema {
  local: {
    darkMode: boolean;
  };
}

// ✅ correct type
await kv.set('local', 'darkMode', true);

// ❌ compile error (key typo)
await kv.set('local', 'darkmode', true);

// ❌ compile error (wrong type)
await kv.set('local', 'darkMode', 'yes');
```

---

## Examples

### Settings Helper

```ts
const DEFAULT_SETTINGS = { theme: 'auto', language: 'en' } as const;

export const getSettings = async () => {
  const stored = await kv.get('sync', 'settings');
  return { ...DEFAULT_SETTINGS, ...stored };
};

export const updateSettings = async (updates: Partial<typeof DEFAULT_SETTINGS>) => {
  const current = await getSettings();
  await kv.set('sync', 'settings', { ...current, ...updates });
};
```

### Session Token

```ts
export const getSessionToken = async () => kv.get('session', 'tempToken');

export const setSessionToken = (token: string | null) =>
  token ? kv.set('session', 'tempToken', token) : kv.remove('session', 'tempToken');
```

### Managed Policy Lookup

```ts
export const getOrgPolicy = async () => {
  const enabled = await kv.get('managed', 'orgEnabled', false);
  const hosts = await kv.get('managed', 'allowedHosts', []);
  return { enabled, hosts };
};
```

---

## Error Handling

Wrap calls in try/catch to capture quota and serialization errors:

```ts
try {
  await kv.set('sync', 'settings', largeObject);
} catch (err) {
  if (err instanceof Error && err.message.includes('QUOTA')) {
    notifyUser('Sync storage quota exceeded');
  }
}
```

Use `chrome.runtime.lastError` for detailed messages when mocking:

```ts
if (chrome.runtime.lastError) {
  throw new Error(chrome.runtime.lastError.message);
}
```

---

## Testing Helpers

Mock Chrome storage in Vitest:

```ts
const mockBucket = () => {
  let store: Record<string, unknown> = {};
  return {
    get: vi.fn((keys, cb) => {
      if (Array.isArray(keys)) {
        const result = keys.reduce((acc, key) => ({ ...acc, [key]: store[key] }), {});
        cb(result);
      } else if (typeof keys === 'object') {
        cb({ ...keys, ...store });
      } else {
        cb(store);
      }
    }),
    set: vi.fn((items, cb) => {
      store = { ...store, ...items };
      cb?.();
    }),
    remove: vi.fn((keys, cb) => {
      [].concat(keys as any).forEach((key) => delete store[key]);
      cb?.();
    }),
    clear: vi.fn((cb) => {
      store = {};
      cb?.();
    })
  } as chrome.storage.StorageArea;
};
```

---

## Related Docs

- [Storage Architecture](../core-modules/storage)
- [Migration System](../core-modules/migration)
- [Type Definitions](./types)
