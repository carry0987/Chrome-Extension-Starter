---
sidebar_position: 3
---

# Migration

The migration module (`src/shared/lib/migration.ts`) provides a robust system for managing storage schema changes across extension versions, ensuring seamless upgrades for users.

## Overview

The migration system allows you to:

- **Version-based Migrations** — Run transformations when upgrading
- **Automatic Execution** — Runs on install/update events
- **Storage Transformation** — Update data schema safely
- **Version Tracking** — Store current version in sync storage
- **Rollback Safety** — Skip already-applied migrations

## Architecture

### Migration Flow

```
Extension Update
      ↓
onInstalled Event
      ↓
Compare Versions (stored vs current)
      ↓
Run Pending Migrations (in order)
      ↓
Update Stored Version
```

## Defining Migrations

### Migration Interface

```ts
export interface Migration {
  version: Version;           // Target version (e.g., "1.1.0")
  description: string;        // Human-readable description
  migrate: MigrationFn;       // Transformation function
}

export type MigrationFn = (
  context: MigrationContext
) => Promise<void | MigrationResult>;
```

### Migration Context

The migration function receives a context object:

```ts
export interface MigrationContext {
  currentVersion: Version;    // Current extension version
  storedVersion: Version | null;  // Previously stored version
  
  // Read single storage value
  getStorage: <T = unknown>(
    area: 'sync' | 'local',
    key: string
  ) => Promise<T | undefined>;
  
  // Read all storage values
  getAllStorage: (
    area: 'sync' | 'local'
  ) => Promise<Record<string, unknown>>;
}
```

### Migration Result

Return storage updates to apply:

```ts
export interface MigrationResult {
  sync?: Record<string, any>;   // Updates for sync storage
  local?: Record<string, any>;  // Updates for local storage
}
```

## Configuration

Define migrations in `src/shared/config.ts`:

```ts
import type { Migration } from '@/shared/lib/migration';

export const customMigrations: Migration[] = [
  {
    version: '1.1.0',
    description: 'Migrate old settings format to new structure',
    migrate: async (ctx) => {
      const oldSettings = await ctx.getStorage('sync', 'oldSettings');
      if (oldSettings) {
        return {
          sync: {
            settings: transformSettings(oldSettings)
          }
        };
      }
    }
  },
  {
    version: '1.2.0',
    description: 'Add default language preference',
    migrate: async (ctx) => {
      const settings = await ctx.getStorage('sync', 'settings');
      if (settings && !settings.language) {
        return {
          sync: {
            settings: { ...settings, language: 'en' }
          }
        };
      }
    }
  },
  {
    version: '1.3.0',
    description: 'Migrate local cache to new format',
    migrate: async (ctx) => {
      const cache = await ctx.getStorage('local', 'cache');
      if (cache) {
        return {
          local: {
            cache: {
              version: 2,
              data: cache.items || [],
              timestamp: Date.now()
            }
          }
        };
      }
    }
  }
];
```

## Running Migrations

### Automatic Execution

Migrations run automatically on extension install/update:

```ts
// In background/runtime.ts
import { runMigrations } from '@/shared/lib/migration';
import { logger } from '@/shared/lib/logger';

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install' || details.reason === 'update') {
    try {
      await runMigrations();
      logger.info('Migrations completed successfully');
    } catch (err) {
      logger.error('Migration failed:', err);
    }
  }
});
```

### Manual Execution

You can also run migrations manually:

```ts
import { runMigrations } from '@/shared/lib/migration';

await runMigrations();
```

## Migration Examples

### Example 1: Rename Keys

```ts
{
  version: '1.1.0',
  description: 'Rename "theme" to "appearance"',
  migrate: async (ctx) => {
    const theme = await ctx.getStorage('sync', 'theme');
    if (theme !== undefined) {
      return {
        sync: {
          appearance: theme,
          theme: undefined  // Remove old key
        }
      };
    }
  }
}
```

### Example 2: Transform Data Structure

```ts
{
  version: '1.2.0',
  description: 'Convert settings array to object',
  migrate: async (ctx) => {
    const settings = await ctx.getStorage<string[]>('sync', 'settings');
    if (Array.isArray(settings)) {
      const newSettings = settings.reduce((acc, item, idx) => {
        acc[`setting_${idx}`] = item;
        return acc;
      }, {});
      
      return {
        sync: {
          settings: newSettings
        }
      };
    }
  }
}
```

### Example 3: Add Default Values

```ts
{
  version: '1.3.0',
  description: 'Add default notification settings',
  migrate: async (ctx) => {
    const settings = await ctx.getStorage('sync', 'settings');
    if (settings && !settings.notifications) {
      return {
        sync: {
          settings: {
            ...settings,
            notifications: {
              enabled: true,
              sound: true,
              frequency: 'daily'
            }
          }
        }
      };
    }
  }
}
```

### Example 4: Clean Up Old Data

```ts
{
  version: '1.4.0',
  description: 'Remove deprecated cache entries',
  migrate: async (ctx) => {
    const allLocal = await ctx.getAllStorage('local');
    const cleaned = Object.entries(allLocal).reduce((acc, [key, value]) => {
      if (!key.startsWith('deprecated_')) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
    
    return { local: cleaned };
  }
}
```

### Example 5: Conditional Migration

```ts
{
  version: '1.5.0',
  description: 'Migrate only if feature was enabled',
  migrate: async (ctx) => {
    const featureEnabled = await ctx.getStorage('local', 'featureEnabled');
    if (featureEnabled) {
      const oldData = await ctx.getStorage('local', 'featureData');
      return {
        local: {
          newFeatureData: transformFeatureData(oldData)
        }
      };
    }
    // Return nothing if feature was not enabled
  }
}
```

## Version Comparison

The migration system uses semantic versioning for comparison:

```ts
// Versions are compared as [major, minor, patch]
"1.0.0" < "1.0.1" < "1.1.0" < "2.0.0"
```

### Handling Pre-release Versions

The system supports basic semver:

```ts
parseVersion("1.2.3") // [1, 2, 3]
parseVersion("2.0") // [2, 0, 0]
parseVersion("1.0.0-beta") // [1, 0, 0] (suffix ignored)
```

## Best Practices

### 1. Version Your Migrations

Always specify the target version:

```ts
{
  version: '1.2.0',  // ✓ Clear target version
  description: 'Add feature X',
  migrate: async (ctx) => { /* ... */ }
}
```

### 2. Provide Clear Descriptions

```ts
{
  version: '1.3.0',
  description: 'Migrate user preferences from array to object format',  // ✓ Clear
  migrate: async (ctx) => { /* ... */ }
}
```

### 3. Handle Missing Data

Always check if data exists before transforming:

```ts
migrate: async (ctx) => {
  const data = await ctx.getStorage('sync', 'myData');
  if (!data) {
    return; // ✓ Safe: no-op if data doesn't exist
  }
  // Transform data...
}
```

### 4. Return Undefined for Keys to Delete

```ts
return {
  sync: {
    oldKey: undefined,  // ✓ Removes the key
    newKey: value
  }
};
```

### 5. Test Migrations

Test migration logic before deployment:

```ts
// In __tests__/migration.test.ts
import { describe, it, expect } from 'vitest';
import { customMigrations } from '@/shared/config';

describe('Migrations', () => {
  it('should transform settings correctly', async () => {
    const migration = customMigrations.find(m => m.version === '1.1.0');
    const ctx = {
      currentVersion: '1.1.0',
      storedVersion: '1.0.0',
      getStorage: async () => ({ oldFormat: true }),
      getAllStorage: async () => ({})
    };
    
    const result = await migration.migrate(ctx);
    expect(result.sync.settings).toBeDefined();
  });
});
```

### 6. Keep Migrations Idempotent

Migrations should be safe to run multiple times:

```ts
migrate: async (ctx) => {
  const settings = await ctx.getStorage('sync', 'settings');
  
  // ✓ Check if already migrated
  if (settings?.version === 2) {
    return; // Already migrated, skip
  }
  
  return {
    sync: {
      settings: {
        ...settings,
        version: 2,
        newField: 'value'
      }
    }
  };
}
```

### 7. Log Migration Progress

```ts
import { logger } from '@/shared/lib/logger';

migrate: async (ctx) => {
  logger.info('Starting migration 1.2.0...');
  const result = await transformData(ctx);
  logger.info('Migration 1.2.0 completed');
  return result;
}
```

## Advanced Patterns

### Conditional Execution

Run migrations based on stored version:

```ts
migrate: async (ctx) => {
  // Only run if upgrading from v1.x.x
  if (ctx.storedVersion?.startsWith('1.')) {
    const oldData = await ctx.getStorage('local', 'v1Data');
    return {
      local: { v2Data: transform(oldData) }
    };
  }
}
```

### Batch Operations

Update multiple storage areas:

```ts
migrate: async (ctx) => {
  const [syncData, localData] = await Promise.all([
    ctx.getStorage('sync', 'settings'),
    ctx.getStorage('local', 'cache')
  ]);
  
  return {
    sync: { settings: transformSync(syncData) },
    local: { cache: transformLocal(localData) }
  };
}
```

### Multi-Step Migrations

Break complex migrations into smaller steps:

```ts
// Migration 1.1.0: Step 1
{
  version: '1.1.0',
  description: 'Prepare data for new format',
  migrate: async (ctx) => {
    const data = await ctx.getStorage('sync', 'data');
    return {
      sync: {
        data: { ...data, _migrationStep: 1 }
      }
    };
  }
},
// Migration 1.1.1: Step 2
{
  version: '1.1.1',
  description: 'Complete migration to new format',
  migrate: async (ctx) => {
    const data = await ctx.getStorage('sync', 'data');
    if (data._migrationStep === 1) {
      return {
        sync: {
          data: finalTransform(data)
        }
      };
    }
  }
}
```

## API Reference

### `runMigrations()`

Execute all pending migrations.

**Returns**: `Promise<void>`

**Throws**: Error if migration fails

```ts
import { runMigrations } from '@/shared/lib/migration';

await runMigrations();
```

### `compareVersions(a, b)`

Compare two semantic versions.

**Parameters**:
- `a: Version` — First version
- `b: Version` — Second version

**Returns**: `-1 | 0 | 1`

```ts
import { compareVersions } from '@/shared/lib/migration';

compareVersions('1.0.0', '1.1.0'); // -1
compareVersions('2.0.0', '2.0.0'); // 0
compareVersions('1.5.0', '1.2.0'); // 1
```

### `parseVersion(version)`

Parse version string to number array.

**Parameters**:
- `version: Version` — Version string

**Returns**: `number[]`

```ts
import { parseVersion } from '@/shared/lib/migration';

parseVersion('1.2.3'); // [1, 2, 3]
parseVersion('2.0');   // [2, 0, 0]
```

## Troubleshooting

### Migration Not Running

- Check extension version in `package.json`
- Verify `onInstalled` listener is registered
- Check browser console for errors

### Data Loss

- Always test migrations locally first
- Keep old data during migration
- Only delete after confirming new data is valid

### Version Comparison Issues

- Use semantic versioning (x.y.z)
- Ensure version strings are consistent
- Check stored version in sync storage

## Testing Migrations

```ts
// __tests__/migration.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { runMigrations } from '@/shared/lib/migration';
import { kv } from '@/shared/lib/storage';

describe('Migration System', () => {
  beforeEach(async () => {
    await kv.clear('sync');
    await kv.clear('local');
  });

  it('should run migrations in order', async () => {
    await kv.set('sync', 'version', '1.0.0');
    await runMigrations();
    const version = await kv.get('sync', 'version');
    expect(version).toBe('1.3.0'); // Current version
  });

  it('should skip already-applied migrations', async () => {
    await kv.set('sync', 'version', '1.2.0');
    await runMigrations();
    // Only 1.3.0 migration should run
  });
});
```

## Next Steps

- Learn about [Storage](./storage) for data persistence
- Explore [Messaging](./messaging) for communication
- Check [Development Guide](../development/building) for workflow
