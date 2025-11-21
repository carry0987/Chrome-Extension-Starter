---
sidebar_position: 2
---

# Testing

Chrome Extension Starter uses Vitest for fast, modern unit testing with full TypeScript support.

## Overview

**Testing Stack**:
- **Vitest** — Fast unit test runner
- **@testing-library/preact** — Component testing utilities
- **jsdom** — DOM environment for testing
- **@vitest/coverage-v8** — Code coverage reports

## Running Tests

### Basic Commands

```bash
# Run all tests once
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage report
pnpm test:cov
```

### Watch Mode

Watch mode automatically reruns tests when files change:

```bash
pnpm test:watch
```

**Features**:
- Auto-detect changed files
- Only rerun affected tests
- Interactive CLI for filtering tests
- Press `a` to run all tests
- Press `q` to quit

## Test Structure

Tests are located in `__tests__/` directory:

```
__tests__/
├── dom.test.ts         # DOM utilities tests
├── i18n.test.ts        # i18n function tests
├── logger.test.ts      # Logger tests
├── messaging.test.ts   # Messaging system tests
├── migration.test.ts   # Migration system tests
├── setting.test.ts     # Settings tests
├── storage.test.ts     # Storage utilities tests
└── utils.test.ts       # General utilities tests
```

## Writing Tests

### Basic Test

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '@/shared/lib/utils';

describe('myFunction', () => {
  it('should return expected value', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });

  it('should handle edge cases', () => {
    expect(myFunction('')).toBe('');
    expect(myFunction(null)).toBeNull();
  });
});
```

### Async Tests

```typescript
import { describe, it, expect } from 'vitest';
import { fetchData } from '@/shared/lib/api';

describe('fetchData', () => {
  it('should fetch data successfully', async () => {
    const data = await fetchData();
    expect(data).toBeDefined();
    expect(data.status).toBe('success');
  });

  it('should handle errors', async () => {
    await expect(fetchData('invalid')).rejects.toThrow('Invalid input');
  });
});
```

### Component Tests

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { MyComponent } from '@/shared/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const { user } = render(<MyComponent onClick={handleClick} />);
    const button = screen.getByRole('button');
    await user.click(button);
    expect(handleClick).toHaveBeenCalled();
  });
});
```

## Mocking

### Mock Chrome API

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Background script', () => {
  beforeEach(() => {
    // Mock chrome.storage API
    global.chrome = {
      storage: {
        local: {
          get: vi.fn((keys, callback) => {
            callback({ theme: 'dark' });
          }),
          set: vi.fn((items, callback) => {
            callback?.();
          })
        }
      }
    } as any;
  });

  it('should save settings', async () => {
    await saveSettings({ theme: 'dark' });
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      { theme: 'dark' },
      expect.any(Function)
    );
  });
});
```

### Mock Modules

```typescript
import { describe, it, expect, vi } from 'vitest';

// Mock entire module
vi.mock('@/shared/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn()
  }
}));

import { logger } from '@/shared/lib/logger';
import { myFunction } from '@/shared/lib/utils';

describe('myFunction', () => {
  it('should log info', () => {
    myFunction();
    expect(logger.info).toHaveBeenCalledWith('Function called');
  });
});
```

### Mock Functions

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('Callback handling', () => {
  it('should call callback with result', async () => {
    const callback = vi.fn();
    await processData(callback);
    
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith({ success: true });
  });
});
```

## Testing Core Modules

### Testing Messaging

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMessenger } from '@/shared/lib/messaging';
import type { MessageMap } from '@/shared/types';

describe('Messaging', () => {
  let sendMessageMock: any;
  
  beforeEach(() => {
    sendMessageMock = vi.fn((msg, callback) => {
      callback({ ok: true });
    });
    
    global.chrome = {
      runtime: { sendMessage: sendMessageMock },
      tabs: {
        query: vi.fn((query, callback) => {
          callback([{ id: 1 }]);
        }),
        sendMessage: vi.fn((tabId, msg, callback) => {
          callback({ ok: true });
        })
      }
    } as any;
  });

  it('should send message to active tab', async () => {
    const bus = createMessenger<MessageMap>();
    const result = await bus.sendToActive('CHANGE_BG', { color: 'red' });
    
    expect(result).toEqual({ ok: true });
    expect(chrome.tabs.sendMessage).toHaveBeenCalled();
  });
});
```

### Testing Storage

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createTypedStorage } from '@/shared/lib/storage';
import type { StorageSchema } from '@/shared/types';

describe('Storage', () => {
  let mockStorage: Record<string, any>;
  
  beforeEach(() => {
    mockStorage = {};
    
    global.chrome = {
      storage: {
        local: {
          get: vi.fn((keys, callback) => {
            const result = Array.isArray(keys)
              ? keys.reduce((acc, key) => {
                  acc[key] = mockStorage[key];
                  return acc;
                }, {})
              : mockStorage;
            callback(result);
          }),
          set: vi.fn((items, callback) => {
            Object.assign(mockStorage, items);
            callback?.();
          })
        }
      }
    } as any;
  });

  it('should get value with fallback', async () => {
    const kv = createTypedStorage<StorageSchema>();
    const value = await kv.get('local', 'username', 'Guest');
    expect(value).toBe('Guest');
  });

  it('should set value', async () => {
    const kv = createTypedStorage<StorageSchema>();
    await kv.set('local', 'username', 'John');
    expect(mockStorage.username).toBe('John');
  });
});
```

### Testing Migration

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { runMigrations } from '@/shared/lib/migration';
import { kv } from '@/shared/lib/storage';

describe('Migration', () => {
  beforeEach(async () => {
    await kv.clear('sync');
    await kv.clear('local');
  });

  it('should run pending migrations', async () => {
    await kv.set('sync', 'version', '1.0.0');
    await kv.set('sync', 'oldSettings', { theme: 'dark' });
    
    await runMigrations();
    
    const newSettings = await kv.get('sync', 'settings');
    expect(newSettings).toBeDefined();
    expect(newSettings.theme).toBe('dark');
  });

  it('should skip already-applied migrations', async () => {
    await kv.set('sync', 'version', '1.3.0');
    await runMigrations();
    
    const version = await kv.get('sync', 'version');
    expect(version).toBe('1.3.0');
  });
});
```

## Coverage Reports

### Generate Coverage

```bash
pnpm test:cov
```

**Output**:
```
--------------------|---------|----------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------|---------|----------|---------|---------|-------------------
All files           |   85.5  |   78.2   |   90.1  |   85.5  |
 messaging.ts       |   92.3  |   85.7   |   100   |   92.3  | 45-48
 storage.ts         |   88.5  |   75.0   |   88.8  |   88.5  | 67,89-92
 migration.ts       |   80.0  |   71.4   |   83.3  |   80.0  | 123-130,145
--------------------|---------|----------|---------|---------|-------------------
```

### Coverage Thresholds

Set minimum coverage in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80
      }
    }
  }
});
```

### View HTML Report

After running `pnpm test:cov`, open:

```
coverage/index.html
```

## Best Practices

### 1. Test File Naming

```
✓ component.test.ts
✓ utils.test.ts
✓ messaging.test.tsx
✗ component.spec.ts  (not configured)
✗ test-utils.ts      (won't be detected)
```

### 2. Use Descriptive Test Names

```typescript
// ✓ Good
it('should return user data when valid ID is provided', async () => {
  // ...
});

// ✗ Bad
it('works', () => {
  // ...
});
```

### 3. Arrange-Act-Assert Pattern

```typescript
it('should update settings', async () => {
  // Arrange
  const initialSettings = { theme: 'light' };
  await kv.set('sync', 'settings', initialSettings);
  
  // Act
  await updateSettings({ theme: 'dark' });
  
  // Assert
  const updatedSettings = await kv.get('sync', 'settings');
  expect(updatedSettings.theme).toBe('dark');
});
```

### 4. Clean Up After Tests

```typescript
import { afterEach, beforeEach } from 'vitest';

beforeEach(() => {
  // Set up test environment
});

afterEach(() => {
  // Clean up
  vi.clearAllMocks();
});
```

### 5. Test Edge Cases

```typescript
describe('parseVersion', () => {
  it('should parse valid version', () => {
    expect(parseVersion('1.2.3')).toEqual([1, 2, 3]);
  });

  it('should handle missing patch', () => {
    expect(parseVersion('1.2')).toEqual([1, 2, 0]);
  });

  it('should handle invalid input', () => {
    expect(parseVersion('invalid')).toEqual([0, 0, 0]);
  });
});
```

### 6. Avoid Test Interdependence

```typescript
// ✓ Good: Each test is independent
describe('Storage', () => {
  it('should set value', async () => {
    await kv.set('local', 'key', 'value1');
    expect(await kv.get('local', 'key')).toBe('value1');
  });

  it('should update value', async () => {
    await kv.set('local', 'key', 'value2');
    expect(await kv.get('local', 'key')).toBe('value2');
  });
});

// ✗ Bad: Second test depends on first
describe('Storage', () => {
  it('should set value', async () => {
    await kv.set('local', 'key', 'value1');
  });

  it('should read previously set value', async () => {
    expect(await kv.get('local', 'key')).toBe('value1'); // Fragile!
  });
});
```

## Debugging Tests

### VS Code Integration

Add launch configuration in `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["test"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Debug Single Test

```typescript
import { describe, it } from 'vitest';

describe.only('Focus this suite', () => {
  it.only('Focus this test', () => {
    // Only this test will run
  });
});
```

### Debug Output

```typescript
import { describe, it } from 'vitest';

it('should debug values', () => {
  const result = myFunction();
  console.log('Result:', result);  // Visible in test output
  expect(result).toBeDefined();
});
```

## Continuous Integration

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test:cov
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

## Troubleshooting

### Tests Not Running

**Check test file pattern**:
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    include: ['__tests__/**/*.test.{ts,tsx}']
  }
});
```

### Import Errors

**Configure path aliases**:
```typescript
// vitest.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

### Mock Not Working

**Ensure mock is hoisted**:
```typescript
// Mock before imports
vi.mock('@/shared/lib/logger');

import { logger } from '@/shared/lib/logger';
```

## Next Steps

- Learn about [Debugging](/development/debugging) techniques
- Explore [Packaging](/development/packaging) for distribution
- Read about [CI/CD](/development/cicd) workflows
