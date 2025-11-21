---
sidebar_position: 1
---

# Type Definitions

Complete type reference for Chrome Extension Starter's shared types and interfaces.

## Core Types

### Message Types

#### `Message<T, P>`

Generic message structure for extension communication.

```typescript
export type Message<T extends string = string, P = unknown> = {
  type: T;
  payload?: P;
};
```

**Type Parameters**:
- `T` — Message type string (default: `string`)
- `P` — Payload type (default: `unknown`)

**Properties**:
- `type: T` — Message identifier
- `payload?: P` — Optional message data

**Example**:
```typescript
const message: Message<'CHANGE_BG', { color: string }> = {
  type: 'CHANGE_BG',
  payload: { color: '#0ea5e9' }
};
```

---

#### `MessageMap`

Type-safe message map defining all extension messages.

```typescript
export type MessageMap = MessageMapOf<typeof MSG, typeof MESSAGE_SPEC>;
```

**Built from**:
- `MSG` enum (message types)
- `MESSAGE_SPEC` (request/response contracts)

**Example**:
```typescript
type MessageMap = {
  CHANGE_BG: {
    req: { color: string };
    res: { ok: boolean };
  };
  GET_USER: {
    req: { userId: number };
    res: { name: string; email: string };
  };
};
```

---

#### `MessageMapOf<T, O>`

Utility type for merging message types with specifications.

```typescript
export type MessageMapOf<
  T extends Record<string, string>,
  O extends Partial<{ [K in keyof T]: { req?: any; res?: any } }>
> = {
  [K in keyof T]: O[K] extends object ? O[K] : { req?: unknown; res?: unknown };
};
```

**Type Parameters**:
- `T` — Message type enum
- `O` — Message specifications object

---

#### `ErrorResponse`

Structured error response for messaging.

```typescript
export interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}
```

**Properties**:
- `error.message: string` — Error message
- `error.code?: string` — Optional error code
- `error.details?: unknown` — Additional error context

**Example**:
```typescript
const errorResponse: ErrorResponse = {
  error: {
    message: 'User not found',
    code: 'USER_NOT_FOUND',
    details: { userId: 123 }
  }
};
```

---

### Storage Types

#### `StorageSchema`

Defines the complete storage schema for all storage areas.

```typescript
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

**Storage Areas**:

**`local`** — Local storage (large quota, no sync)
- `darkMode: boolean` — Dark mode preference
- `username: string` — User's name

**`sync`** — Synced storage (across devices)
- `settings: unknown` — User settings object
- `version: string` — Extension version

**`managed`** — Managed storage (read-only, enterprise)
- `orgEnabled: boolean` — Organization feature flag
- `allowedHosts: string[]` — Whitelisted hosts

**`session`** — Session storage (ephemeral)
- `lastVisited: string | null` — Last visited URL
- `tempToken: string | null` — Temporary auth token

**Customization**:
```typescript
// Extend schema in types.d.ts
export interface StorageSchema {
  local: {
    darkMode: boolean;
    username: string;
    // Add your keys
    recentFiles: string[];
    cacheExpiry: number;
  };
  sync: {
    settings: MySettings;  // Replace 'unknown'
    version: string;
    premium: boolean;      // Add feature flags
  };
}
```

---

### Migration Types

#### `Version`

Semantic version string.

```typescript
export type Version = string;
```

**Format**: `"x.y.z"` (e.g., `"1.2.3"`)

**Example**:
```typescript
const version: Version = '1.3.0';
```

---

#### `Migration`

Migration definition interface.

```typescript
export interface Migration {
  version: Version;
  description: string;
  migrate: MigrationFn;
}
```

**Properties**:
- `version: Version` — Target version for this migration
- `description: string` — Human-readable description
- `migrate: MigrationFn` — Migration function

**Example**:
```typescript
const migration: Migration = {
  version: '1.1.0',
  description: 'Migrate settings to new format',
  migrate: async (ctx) => {
    const oldSettings = await ctx.getStorage('sync', 'oldSettings');
    return {
      sync: { settings: transform(oldSettings) }
    };
  }
};
```

---

#### `MigrationFn`

Migration function type.

```typescript
export type MigrationFn = (
  context: MigrationContext
) => Promise<void | MigrationResult>;
```

**Parameters**:
- `context: MigrationContext` — Migration context object

**Returns**: `Promise<void | MigrationResult>`
- `void` — No storage updates
- `MigrationResult` — Storage updates to apply

---

#### `MigrationContext`

Context provided to migration functions.

```typescript
export interface MigrationContext {
  currentVersion: Version;
  storedVersion: Version | null;
  getStorage: <T = unknown>(
    area: 'sync' | 'local',
    key: string
  ) => Promise<T | undefined>;
  getAllStorage: (
    area: 'sync' | 'local'
  ) => Promise<Record<string, unknown>>;
}
```

**Properties**:
- `currentVersion: Version` — Current extension version
- `storedVersion: Version | null` — Previously stored version
- `getStorage<T>()` — Get single storage value
- `getAllStorage()` — Get all values from area

**Example**:
```typescript
const migrate: MigrationFn = async (ctx) => {
  console.log('Migrating from', ctx.storedVersion, 'to', ctx.currentVersion);
  
  const oldData = await ctx.getStorage('sync', 'oldKey');
  const allLocal = await ctx.getAllStorage('local');
  
  return {
    sync: { newKey: transform(oldData) }
  };
};
```

---

#### `MigrationResult`

Result object defining storage updates.

```typescript
export interface MigrationResult {
  sync?: Record<string, any>;
  local?: Record<string, any>;
}
```

**Properties**:
- `sync?: Record<string, any>` — Updates for sync storage
- `local?: Record<string, any>` — Updates for local storage

**Example**:
```typescript
const result: MigrationResult = {
  sync: {
    settings: newSettings,
    version: '1.1.0'
  },
  local: {
    cache: newCache
  }
};
```

---

## Utility Types

### `DeepPartial<T>`

Recursively makes all properties optional.

```typescript
type DeepPartial<T> = T extends Function
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T | undefined;
```

**Usage**:
```typescript
interface Settings {
  theme: {
    mode: 'light' | 'dark';
    accent: string;
  };
  notifications: boolean;
}

type PartialSettings = DeepPartial<Settings>;
// {
//   theme?: {
//     mode?: 'light' | 'dark';
//     accent?: string;
//   };
//   notifications?: boolean;
// }
```

---

### `StrictPartial<T>`

Makes properties optional but not undefined.

```typescript
type StrictPartial<T> = { [K in keyof T]?: T[K] };
```

**Usage**:
```typescript
interface User {
  id: number;
  name: string;
}

type PartialUser = StrictPartial<User>;
// { id?: number; name?: string }
```

---

### `ValueOf<T, K>`

Extract value type from object property.

```typescript
type ValueOf<T, K extends keyof T> = T[K];
```

**Usage**:
```typescript
interface StorageSchema {
  local: { theme: string };
  sync: { version: string };
}

type LocalTheme = ValueOf<StorageSchema['local'], 'theme'>;
// string
```

---

## Enum Types

### `MSG`

Message type enumeration.

```typescript
export enum MSG {
  CHANGE_BG = 'CHANGE_BG'
}
```

**Usage**:
```typescript
import { MSG } from '@/shared/constants';

await bus.sendToActive(MSG.CHANGE_BG, { color: 'red' });
```

---

## Constant Types

### `FLAGS`

Feature flags object.

```typescript
export const FLAGS = {
  ENABLE_OVERLAY: true
} as const;

export type Flags = typeof FLAGS;
```

**Type**:
```typescript
type Flags = {
  readonly ENABLE_OVERLAY: true;
}
```

---

### `ALARMS`

Alarm identifiers.

```typescript
export const ALARMS = {
  POLL: 'poll',
  DAILY_CLEANUP: 'daily_cleanup'
} as const;

export type AlarmName = typeof ALARMS[keyof typeof ALARMS];
```

**Type**:
```typescript
type AlarmName = 'poll' | 'daily_cleanup';
```

---

### `RESTRICTED`

Restricted URL patterns.

```typescript
export const RESTRICTED = {
  schemes: ['chrome', 'chrome-extension', 'chrome-untrusted', 'devtools', 'edge', 'about'],
  hosts: [
    /^(?:https?:\/\/)?chrome\.google\.com\/webstore\/?/i,
    /^(?:https?:\/\/)?microsoftedge\.microsoft\.com\/addons\/?/i
  ]
} as const;

export type RestrictedScheme = typeof RESTRICTED.schemes[number];
```

**Type**:
```typescript
type RestrictedScheme = 'chrome' | 'chrome-extension' | 'chrome-untrusted' | 'devtools' | 'edge' | 'about';
```

---

## Type Guards

### Example Type Guards

```typescript
// Check if value is ErrorResponse
export function isErrorResponse(value: any): value is ErrorResponse {
  return (
    value &&
    typeof value === 'object' &&
    'error' in value &&
    typeof value.error.message === 'string'
  );
}

// Check if message has payload
export function hasPayload<T extends string, P>(
  msg: Message<T, P>
): msg is Message<T, P> & { payload: P } {
  return msg.payload !== undefined;
}

// Check if version is valid
export function isValidVersion(version: string): version is Version {
  return /^\d+\.\d+\.\d+$/.test(version);
}
```

**Usage**:
```typescript
const response = await fetchData();

if (isErrorResponse(response)) {
  console.error(response.error.message);
} else {
  console.log('Success:', response);
}
```

---

## Extending Types

### Custom Message Types

```typescript
// In shared/constants.ts
export enum MSG {
  CHANGE_BG = 'CHANGE_BG',
  GET_USER = 'GET_USER',
  // Add your message types
  NOTIFY = 'NOTIFY',
  SAVE_SETTINGS = 'SAVE_SETTINGS'
}

export const MESSAGE_SPEC = {
  [MSG.CHANGE_BG]: {
    req: {} as { color: string },
    res: {} as { ok: boolean }
  },
  // Add specifications
  [MSG.NOTIFY]: {
    req: {} as { title: string; message: string },
    res: {} as { shown: boolean }
  },
  [MSG.SAVE_SETTINGS]: {
    req: {} as { settings: Record<string, any> },
    res: {} as { saved: boolean }
  }
} as const;
```

### Custom Storage Schema

```typescript
// In shared/types.d.ts
export interface StorageSchema {
  local: {
    darkMode: boolean;
    username: string;
    // Add your local keys
    favorites: string[];
    lastSync: number;
  };
  sync: {
    settings: MyAppSettings;  // Custom type
    version: string;
    // Add your sync keys
    isPremium: boolean;
  };
  managed: {
    orgEnabled: boolean;
    allowedHosts: string[];
    // Add your managed keys
    maxUploadSize: number;
  };
  session: {
    lastVisited: string | null;
    tempToken: string | null;
    // Add your session keys
    activeWorkspace: string | null;
  };
}

// Define custom settings type
export interface MyAppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'ja' | 'zh_TW';
  notifications: {
    enabled: boolean;
    sound: boolean;
    frequency: 'instant' | 'hourly' | 'daily';
  };
}
```

---

## Best Practices

1. **Always define message specs** — Add all messages to `MESSAGE_SPEC`
2. **Use strict types** — Avoid `any` and `unknown` when possible
3. **Document custom types** — Add JSDoc comments
4. **Extend schemas properly** — Update `StorageSchema` for new keys
5. **Use type guards** — Validate runtime types
6. **Export types** — Make types available across modules

## Next Steps

- Explore [Messaging API](/api/messaging-api) for detailed function signatures
- Check [Storage API](/api/storage-api) for storage utilities
- Learn about [Core Modules](/core-modules/messaging) usage
