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
 * @example
 * export const customMigrations: Migration[] = [
 *     {
 *         version: '1.0.0',
 *         description: 'Initial setup',
 *         migrate: async () => {
 *             // Your migration logic here
 *         }
 *     },
 *     {
 *         version: '1.1.0',
 *         description: 'Add new feature',
 *         migrate: async () => {
 *             // Your migration logic here
 *         }
 *     }
 * ];
 */
export const customMigrations: Migration[] = [
    // Add your migrations here, or leave empty for no migrations
];
