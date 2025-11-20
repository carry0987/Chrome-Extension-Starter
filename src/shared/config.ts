import { SettingManager } from '@/shared/lib/setting';

// ---- Application-specific Types ---------------------------------------------

/**
 * Example settings interface for your Chrome Extension.
 * Customize this interface to match your extension's needs.
 */
export interface Settings {
    favoriteColor: string;
    likesColor: boolean;
    // Add more settings as needed
}

// ---- Default Settings -------------------------------------------------------

const defaultSettings = (): Settings => ({
    favoriteColor: 'blue',
    likesColor: true
});

// ---- Settings Manager Instance ----------------------------------------------

/**
 * Global settings manager instance.
 * Note: Version management and migrations are handled by background/migration.ts
 */
export const settingsManager = new SettingManager<Settings>(defaultSettings);
