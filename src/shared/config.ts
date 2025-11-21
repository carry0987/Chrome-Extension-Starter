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
 *
 * @example
 * export const customMigrations: Migration[] = [
 *     {
 *         version: '1.0.0',
 *         description: 'Initial setup - set default values',
 *         migrate: async (context) => {
 *             // Declarative approach - return what to update
 *             return {
 *                 local: {
 *                     darkMode: false,
 *                     username: 'Guest'
 *                 },
 *                 sync: {
 *                     settings: {
 *                         notifications: true
 *                     }
 *                 }
 *             };
 *         }
 *     },
 *     {
 *         version: '1.1.0',
 *         description: 'Migrate old settings structure',
 *         migrate: async (context) => {
 *             // Can read existing values
 *             const oldTheme = await context.getStorage<string>('local', 'theme');
 *
 *             return {
 *                 local: {
 *                     darkMode: oldTheme === 'dark'
 *                 }
 *             };
 *         }
 *     },
 *     {
 *         version: '1.2.0',
 *         description: 'Complex migration with manual storage',
 *         migrate: async (context) => {
 *             // Can also handle storage manually (imperative)
 *             // Just don't return anything
 *             const data = await context.getStorage('sync', 'data');
 *             // ... process data ...
 *             // ... use kv.set() directly if needed ...
 *         }
 *     }
 * ];
 */
export const customMigrations: Migration[] = [
    // Add your migrations here, or leave empty for no migrations
];
