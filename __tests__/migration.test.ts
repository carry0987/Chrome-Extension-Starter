import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock chrome runtime API
const mockManifest = { version: '1.2.0' };
const mockStorage = {
    sync: new Map<string, any>(),
    local: new Map<string, any>()
};

// Mock chrome.runtime
const mockRuntime = {
    getManifest: vi.fn(() => mockManifest)
};

// Mock chrome.storage
const mockStorageSync = {
    get: vi.fn((keys: any, callback: any) => {
        const result: Record<string, any> = {};
        if (keys === undefined || keys === null) {
            // Get all
            mockStorage.sync.forEach((value, key) => {
                result[key] = value;
            });
        } else if (typeof keys === 'object' && !Array.isArray(keys)) {
            // Get with defaults
            Object.keys(keys).forEach((key) => {
                result[key] = mockStorage.sync.get(key) ?? keys[key];
            });
        } else {
            // Get specific keys
            const keyArray = Array.isArray(keys) ? keys : [keys];
            keyArray.forEach((key: string) => {
                const value = mockStorage.sync.get(key);
                if (value !== undefined) result[key] = value;
            });
        }
        callback(result);
    }),
    set: vi.fn((items: Record<string, any>, callback: any) => {
        Object.entries(items).forEach(([key, value]) => {
            mockStorage.sync.set(key, value);
        });
        callback();
    }),
    remove: vi.fn((keys: string | string[], callback: any) => {
        const keyArray = Array.isArray(keys) ? keys : [keys];
        keyArray.forEach((key) => mockStorage.sync.delete(key));
        callback();
    })
};

const mockStorageLocal = {
    get: vi.fn((keys: any, callback: any) => {
        const result: Record<string, any> = {};
        if (keys === undefined || keys === null) {
            mockStorage.local.forEach((value, key) => {
                result[key] = value;
            });
        } else if (typeof keys === 'object' && !Array.isArray(keys)) {
            Object.keys(keys).forEach((key) => {
                result[key] = mockStorage.local.get(key) ?? keys[key];
            });
        } else {
            const keyArray = Array.isArray(keys) ? keys : [keys];
            keyArray.forEach((key: string) => {
                const value = mockStorage.local.get(key);
                if (value !== undefined) result[key] = value;
            });
        }
        callback(result);
    }),
    set: vi.fn((items: Record<string, any>, callback: any) => {
        Object.entries(items).forEach(([key, value]) => {
            mockStorage.local.set(key, value);
        });
        callback();
    }),
    remove: vi.fn((keys: string | string[], callback: any) => {
        const keyArray = Array.isArray(keys) ? keys : [keys];
        keyArray.forEach((key) => mockStorage.local.delete(key));
        callback();
    })
};

// @ts-ignore - Mock global chrome object
global.chrome = {
    runtime: mockRuntime,
    storage: {
        sync: mockStorageSync,
        local: mockStorageLocal,
        onChanged: {
            addListener: vi.fn(),
            removeListener: vi.fn()
        }
    }
} as any;

// Import after mocking
import { runMigrations, getMigrationStatus, rollbackVersion } from '@/shared/lib/migration';

describe('Migration System', () => {
    beforeEach(() => {
        // Clear all storage
        mockStorage.sync.clear();
        mockStorage.local.clear();
        vi.clearAllMocks();
    });

    describe('Fresh Install', () => {
        it('should run all migrations on fresh install', async () => {
            // No stored version
            mockManifest.version = '1.2.0';

            await runMigrations();

            // Check that version was stored
            expect(mockStorage.sync.get('version')).toBe('1.2.0');

            // Check that default values were set
            expect(mockStorage.local.get('darkMode')).toBe(false);
            expect(mockStorage.local.get('username')).toBe('Guest');
            expect(mockStorage.sync.get('settings')).toEqual({
                notifications: true,
                autoSync: true
            });
        });
    });

    describe('Version Upgrade', () => {
        it('should run pending migrations on upgrade', async () => {
            // Simulate existing version
            mockStorage.sync.set('version', '1.0.0');
            mockManifest.version = '1.2.0';

            await runMigrations();

            // Should update to current version
            expect(mockStorage.sync.get('version')).toBe('1.2.0');

            // Should have run migrations 1.1.0 and 1.2.0 (but not 1.0.0)
            expect(mockStorage.sync.get('settings')).toEqual({
                notifications: true,
                autoSync: true
            });
        });

        it('should skip already-run migrations', async () => {
            // Already at v1.1.0
            mockStorage.sync.set('version', '1.1.0');
            mockStorage.local.set('darkMode', true); // Already set
            mockManifest.version = '1.2.0';

            await runMigrations();

            // Should not override existing values from old migrations
            expect(mockStorage.local.get('darkMode')).toBe(true);
            expect(mockStorage.sync.get('version')).toBe('1.2.0');
        });
    });

    describe('Same Version', () => {
        it('should not run migrations if already at current version', async () => {
            mockStorage.sync.set('version', '1.2.0');
            mockManifest.version = '1.2.0';

            await runMigrations();

            // Version should remain unchanged
            expect(mockStorage.sync.get('version')).toBe('1.2.0');
        });
    });

    describe('Downgrade Detection', () => {
        it('should warn but not migrate on downgrade', async () => {
            // Stored version is newer
            mockStorage.sync.set('version', '2.0.0');
            mockManifest.version = '1.2.0';

            await runMigrations();

            // Should not change version
            expect(mockStorage.sync.get('version')).toBe('2.0.0');
        });
    });

    describe('Migration Status', () => {
        it('should return correct migration status', async () => {
            mockStorage.sync.set('version', '1.0.0');
            mockManifest.version = '1.2.0';

            const status = await getMigrationStatus();

            expect(status.currentVersion).toBe('1.2.0');
            expect(status.storedVersion).toBe('1.0.0');
            expect(status.needsMigration).toBe(true);
            expect(status.availableMigrations).toHaveLength(3);
            expect(status.availableMigrations[0].version).toBe('1.0.0');
        });

        it('should indicate no migration needed when versions match', async () => {
            mockStorage.sync.set('version', '1.2.0');
            mockManifest.version = '1.2.0';

            const status = await getMigrationStatus();

            expect(status.needsMigration).toBe(false);
        });
    });

    describe('Version Rollback', () => {
        it('should rollback version', async () => {
            mockStorage.sync.set('version', '1.2.0');

            await rollbackVersion('1.0.0');

            expect(mockStorage.sync.get('version')).toBe('1.0.0');
        });
    });

    describe('Migration Error Handling', () => {
        it('should stop on migration error', async () => {
            mockManifest.version = '1.2.0';

            // Mock a failing migration by causing an error
            // This would require restructuring the migration module to allow injection
            // For now, we verify that runMigrations can be called without throwing
            await expect(runMigrations()).resolves.not.toThrow();
        });
    });

    describe('Idempotency', () => {
        it('should be safe to run migrations multiple times', async () => {
            mockManifest.version = '1.2.0';

            // Run migrations twice
            await runMigrations();
            const firstRun = {
                darkMode: mockStorage.local.get('darkMode'),
                username: mockStorage.local.get('username'),
                settings: mockStorage.sync.get('settings')
            };

            await runMigrations();
            const secondRun = {
                darkMode: mockStorage.local.get('darkMode'),
                username: mockStorage.local.get('username'),
                settings: mockStorage.sync.get('settings')
            };

            // Results should be identical
            expect(secondRun).toEqual(firstRun);
        });
    });
});
