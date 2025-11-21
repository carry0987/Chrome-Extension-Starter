---
sidebar_position: 2
---

# Storage

The storage module (`src/shared/lib/storage.ts`) provides a type-safe wrapper around the Chrome Storage API, supporting all four storage areas: `local`, `sync`, `managed`, and `session`.

## Overview

Chrome Extension Starter's storage system offers:

- **Type Safety** — Schema-driven storage with TypeScript generics
- **Multi-Area Support** — local, sync, managed, and session storage
- **Type Inference** — Automatic type inference from schema
- **Fallback Values** — Optional default values for missing keys
- **Compile-Time Safety** — Prevents writing to read-only areas

## Storage Areas

### Local Storage
- **Quota**: ~10MB
- **Synced**: No
- **Use case**: Large data, device-specific settings

### Sync Storage
- **Quota**: ~100KB
- **Synced**: Yes (across Chrome instances)
- **Use case**: User preferences, settings

### Managed Storage
- **Quota**: Varies
- **Synced**: No
- **Access**: Read-only (set by enterprise policy)
- **Use case**: Organization policies

### Session Storage
- **Quota**: ~10MB
- **Synced**: No
- **Lifecycle**: Cleared when service worker terminates
- **Use case**: Temporary data, auth tokens

## Defining Storage Schema

Define your storage schema in `shared/types.d.ts`:

```typescript
export interface StorageSchema {
  local: {
    darkMode: boolean;
    username: string;
    recentFiles: string[];
  };
  sync: {
    settings: {
      theme: 'light' | 'dark' | 'auto';
      language: string;
    };
    version: string;
  };
  managed: {
    orgEnabled: boolean;
    allowedHosts: string[];
    maxFileSize: number;
  };
  session: {
    lastVisited: string | null;
    tempToken: string | null;
    activeTabId: number;
  };
}
```

## Creating Storage Instance

```typescript
import { createTypedStorage } from '@/shared/lib/storage';
import type { StorageSchema } from '@/shared/types';

// Create typed storage instance
export const kv = createTypedStorage<StorageSchema>();
```

## API Reference

### `get()`

Get a single value from storage.

#### With Fallback (Guaranteed Return)

```typescript
// Returns string (guaranteed, uses fallback if not found)
const username = await kv.get('local', 'username', 'Guest');
```

**Signature**:
```typescript
get<Area, Key>(
  area: Area,
  key: Key,
  fallback: StorageSchema[Area][Key]
): Promise<StorageSchema[Area][Key]>
```

#### Without Fallback (Optional Return)

```typescript
// Returns string | undefined
const username = await kv.get('local', 'username');
if (username) {
  console.log('Username:', username);
}
```

**Signature**:
```typescript
get<Area, Key>(
  area: Area,
  key: Key
): Promise<StorageSchema[Area][Key] | undefined>
```

### `getAll()`

Get all values from a storage area.

#### With Defaults (Full Schema)

```typescript
// Returns complete object with defaults
const allLocal = await kv.getAll('local', {
  darkMode: false,
  username: 'Guest',
  recentFiles: []
});

console.log(allLocal.darkMode); // boolean (guaranteed)
```

**Signature**:
```typescript
getAll<Area>(
  area: Area,
  defaults: Partial<StorageSchema[Area]>
): Promise<StorageSchema[Area]>
```

#### Without Defaults (Partial Schema)

```typescript
// Returns only stored keys
const allLocal = await kv.getAll('local');
console.log(allLocal.darkMode); // boolean | undefined
```

**Signature**:
```typescript
getAll<Area>(
  area: Area
): Promise<Partial<StorageSchema[Area]>>
```

### `set()`

Set a single value in storage.

#### Allowed Areas (local, sync, session)

```typescript
// Write to local storage
await kv.set('local', 'username', 'John Doe');

// Write to sync storage
await kv.set('sync', 'version', '1.2.0');

// Write to session storage
await kv.set('session', 'tempToken', 'abc123');
```

**Signature**:
```typescript
set<Area, Key>(
  area: Exclude<Area, 'managed'>,
  key: Key,
  value: StorageSchema[Area][Key]
): Promise<void>
```

#### Forbidden Area (managed)

```typescript
// ❌ Compile error: managed storage is read-only
await kv.set('managed', 'orgEnabled', true);
```

### `setAll()`

Set multiple values at once.

```typescript
await kv.setAll('local', {
  username: 'John Doe',
  darkMode: true,
  recentFiles: ['file1.txt', 'file2.txt']
});

// Partial updates are allowed
await kv.setAll('sync', {
  version: '1.3.0'
});
```

**Signature**:
```typescript
setAll<Area>(
  area: Exclude<Area, 'managed'>,
  data: Partial<StorageSchema[Area]>
): Promise<void>
```

### `remove()`

Remove a single key from storage.

```typescript
await kv.remove('local', 'username');
await kv.remove('session', 'tempToken');
```

**Signature**:
```typescript
remove<Area, Key>(
  area: Exclude<Area, 'managed'>,
  key: Key
): Promise<void>
```

### `clear()`

Clear all data from a storage area.

```typescript
// Clear all local storage
await kv.clear('local');

// Clear session storage
await kv.clear('session');
```

**Signature**:
```typescript
clear<Area>(
  area: Exclude<Area, 'managed'>
): Promise<void>
```

## Usage Examples

### Example 1: User Preferences

```typescript
import { kv } from '@/shared/lib/storage';

// Get theme with fallback
const theme = await kv.get('sync', 'settings', {
  theme: 'auto',
  language: 'en'
});

// Update theme
await kv.set('sync', 'settings', {
  ...theme,
  theme: 'dark'
});
```

### Example 2: Session Management

```typescript
// Store temporary token on login
await kv.set('session', 'tempToken', 'eyJhbGc...');

// Retrieve token
const token = await kv.get('session', 'tempToken');
if (token) {
  // Make authenticated request
  await fetch('/api/data', {
    headers: { Authorization: `Bearer ${token}` }
  });
}

// Clear token on logout
await kv.remove('session', 'tempToken');
```

### Example 3: Recent Files List

```typescript
// Add file to recent files
const recentFiles = await kv.get('local', 'recentFiles', []);
const updated = [newFile, ...recentFiles].slice(0, 10); // Keep last 10

await kv.set('local', 'recentFiles', updated);
```

### Example 4: Enterprise Policies (Managed Storage)

```typescript
// Read organization settings (read-only)
const orgEnabled = await kv.get('managed', 'orgEnabled', false);
const allowedHosts = await kv.get('managed', 'allowedHosts', []);

if (orgEnabled) {
  // Apply enterprise policies
  console.log('Allowed hosts:', allowedHosts);
}

// ❌ Cannot write to managed storage
// await kv.set('managed', 'orgEnabled', true); // Compile error
```

### Example 5: Bulk Operations

```typescript
// Save multiple settings at once
await kv.setAll('local', {
  darkMode: true,
  username: 'Jane',
  recentFiles: ['doc1.txt', 'doc2.txt']
});

// Retrieve all local storage
const allSettings = await kv.getAll('local', {
  darkMode: false,
  username: 'Guest',
  recentFiles: []
});

console.log(allSettings);
// {
//   darkMode: true,
//   username: 'Jane',
//   recentFiles: ['doc1.txt', 'doc2.txt']
// }
```

## Storage Listeners

Listen for storage changes across all contexts:

```typescript
chrome.storage.onChanged.addListener((changes, areaName) => {
  console.log(`Storage area "${areaName}" changed:`, changes);
  
  if (areaName === 'sync' && changes.settings) {
    const { oldValue, newValue } = changes.settings;
    console.log('Settings changed from', oldValue, 'to', newValue);
  }
});
```

### Typed Storage Listener Helper

```typescript
const watchStorage = <Area extends keyof StorageSchema>(
  area: Area,
  callback: (changes: Record<string, chrome.storage.StorageChange>) => void
) => {
  const listener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
    if (areaName === area) {
      callback(changes);
    }
  };
  
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
};

// Usage
const unwatch = watchStorage('sync', (changes) => {
  if (changes.version) {
    console.log('Version updated:', changes.version.newValue);
  }
});
```

## Advanced Patterns

### Atomic Updates

Safely update nested objects:

```typescript
const updateSettings = async (updates: Partial<{ theme: string; language: string }>) => {
  const current = await kv.get('sync', 'settings', { theme: 'auto', language: 'en' });
  await kv.set('sync', 'settings', { ...current, ...updates });
};

await updateSettings({ theme: 'dark' });
```

### Lazy Initialization

```typescript
const getOrInit = async <A extends keyof StorageSchema, K extends keyof StorageSchema[A]>(
  area: A,
  key: K,
  initializer: () => StorageSchema[A][K]
): Promise<StorageSchema[A][K]> => {
  const value = await kv.get(area, key);
  if (value === undefined && area !== 'managed') {
    const initial = initializer();
    await kv.set(area as any, key, initial);
    return initial;
  }
  return value ?? initializer();
};

// Usage
const username = await getOrInit('local', 'username', () => 'Guest');
```

### Migration Helper

Combine with migration system:

```typescript
import { kv } from '@/shared/lib/storage';

export const migrateSettings = async () => {
  const oldFormat = await kv.get('sync', 'oldSettings' as any);
  if (oldFormat) {
    await kv.set('sync', 'settings', transformToNewFormat(oldFormat));
    await kv.remove('sync', 'oldSettings' as any);
  }
};
```

## Storage Quotas

### Checking Used Space

```typescript
chrome.storage.local.getBytesInUse(null, (bytes) => {
  console.log('Local storage used:', bytes, 'bytes');
});

chrome.storage.sync.getBytesInUse(null, (bytes) => {
  console.log('Sync storage used:', bytes, 'bytes');
});
```

### Quota Limits

| Area | Quota | Max Items | Max Item Size |
|------|-------|-----------|---------------|
| local | ~10MB | Unlimited | ~5MB |
| sync | ~100KB | ~512 | ~8KB |
| session | ~10MB | Unlimited | ~5MB |
| managed | Varies | Varies | Varies |

## Best Practices

1. **Use sync for user preferences** — Syncs across devices
2. **Use local for large data** — Higher quota, no sync overhead
3. **Use session for temporary data** — Auto-cleaned, no persistence
4. **Provide fallbacks** — Always supply default values
5. **Batch updates** — Use `setAll()` instead of multiple `set()` calls
6. **Handle quota errors** — Catch `QUOTA_BYTES_PER_ITEM` errors
7. **Type your schema** — Define complete schema in `types.d.ts`

## Error Handling

```typescript
try {
  await kv.set('sync', 'settings', largeObject);
} catch (err) {
  if (err.message.includes('QUOTA')) {
    console.error('Storage quota exceeded');
    // Fallback to local storage or cleanup
  }
}
```

## Troubleshooting

### Value Not Persisting

- Check storage area (session is ephemeral)
- Verify quota not exceeded
- Ensure key name matches schema

### Type Errors

- Update `StorageSchema` interface
- Check area name spelling
- Verify value type matches schema

### Sync Not Working

- Ensure user is signed in to Chrome
- Check sync storage quota (~100KB)
- Verify network connectivity

## Next Steps

- Learn about [Migration](/core-modules/migration) for version upgrades
- Explore [Messaging](/core-modules/messaging) for cross-context communication
- Check [API Reference](/api/storage-api) for detailed types
