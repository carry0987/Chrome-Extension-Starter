import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingManager } from '@/shared/lib/setting';
import type { Settings } from '@/shared/config';

// Mock chrome.storage API
const mockStorage = {
    sync: {
        get: vi.fn(),
        set: vi.fn()
    }
};

// @ts-ignore - Mock global chrome object
global.chrome = {
    storage: mockStorage
} as any;

interface TestSettings extends Settings {
    theme: string;
    enabled: boolean;
    count: number;
}

const defaultSettings = (): TestSettings => ({
    favoriteColor: 'blue',
    likesColor: true,
    theme: 'dark',
    enabled: true,
    count: 0
});

describe('SettingManager', () => {
    let manager: SettingManager<TestSettings>;

    beforeEach(() => {
        vi.clearAllMocks();
        manager = new SettingManager<TestSettings>(defaultSettings);
    });

    describe('reset()', () => {
        it('should reset settings to defaults', async () => {
            mockStorage.sync.set.mockImplementation((items, callback) => callback?.());

            const result = await manager.reset();

            expect(result).toEqual(defaultSettings());
            expect(mockStorage.sync.set).toHaveBeenCalledWith({ settings: defaultSettings() }, expect.any(Function));
        });
    });

    describe('load()', () => {
        it('should load existing settings when properly stored', async () => {
            const storedSettings = {
                favoriteColor: 'red',
                likesColor: false,
                theme: 'light',
                enabled: false,
                count: 5
            };

            mockStorage.sync.get.mockImplementation((keys, callback) => {
                if (Array.isArray(keys) && keys.includes('settings')) {
                    callback?.({ settings: storedSettings });
                } else {
                    callback?.({ settings: storedSettings });
                }
            });

            const result = await manager.load();

            expect(result).toEqual(storedSettings);
        });

        it('should initialize if settings are missing', async () => {
            mockStorage.sync.get.mockImplementation((keys, callback) => {
                callback?.({}); // No settings stored
            });
            mockStorage.sync.set.mockImplementation((items, callback) => callback?.());

            const result = await manager.load();

            expect(result).toEqual(defaultSettings());
            expect(mockStorage.sync.set).toHaveBeenCalled();
        });

        it('should initialize if settings are corrupted', async () => {
            mockStorage.sync.get.mockImplementation((keys, callback) => {
                callback?.({ settings: 'invalid' }); // Corrupted data (not an object)
            });
            mockStorage.sync.set.mockImplementation((items, callback) => callback?.());

            const result = await manager.load();

            expect(result).toEqual(defaultSettings());
        });

        it('should handle errors gracefully', async () => {
            mockStorage.sync.get.mockImplementation(() => {
                throw new Error('Storage error');
            });
            mockStorage.sync.set.mockImplementation((items, callback) => callback?.());

            const result = await manager.load();

            expect(result).toEqual(defaultSettings());
        });
    });

    describe('save()', () => {
        it('should save settings to sync storage', async () => {
            const newSettings: TestSettings = {
                favoriteColor: 'red',
                likesColor: true,
                theme: 'light',
                enabled: false,
                count: 10
            };
            mockStorage.sync.set.mockImplementation((items, callback) => callback?.());

            await manager.save(newSettings);

            expect(mockStorage.sync.set).toHaveBeenCalledWith({ settings: newSettings }, expect.any(Function));
        });
    });
});
