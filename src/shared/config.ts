import { SettingManager } from '@/shared/lib/setting';
import { type Migration } from '@/shared/lib/migration';

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

// ---- Custom Migrations ------------------------------------------------------

/**
 * Define your custom migrations here in chronological order.
 * Each migration should be idempotent (safe to run multiple times).
 *
 * If no migrations are defined (empty array), the migration system will only
 * track the version without running any migration logic.
 *
 * Migration functions receive a context object with:
 * - currentVersion: The version being migrated to
 * - storedVersion: The previously stored version (null for fresh install)
 * - getStorage: Helper to read current storage values
 *
 * Migration functions should return an object with storage updates:
 * - sync: Object with keys/values to update in sync storage
 * - local: Object with keys/values to update in local storage
 *
 * Or return void/undefined to handle storage updates manually.
 */
export const customMigrations: Migration[] = [
    // Add your migrations here, or leave empty for no migrations
];
