import { kv } from '@/shared/lib/storage';
import { logger } from '@/shared/lib/logger';

// Migration function type
type MigrationFn = () => Promise<void>;

// Version format: "x.y.z"
type Version = string;

interface Migration {
    version: Version;
    description: string;
    migrate: MigrationFn;
}

/**
 * Parse version string to comparable number array
 * @example parseVersion("1.2.3") => [1, 2, 3]
 */
const parseVersion = (version: Version): number[] => {
    return version.split('.').map((n) => parseInt(n, 10) || 0);
};

/**
 * Compare two versions
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
const compareVersions = (a: Version, b: Version): number => {
    const aParts = parseVersion(a);
    const bParts = parseVersion(b);
    const maxLen = Math.max(aParts.length, bParts.length);

    for (let i = 0; i < maxLen; i++) {
        const aVal = aParts[i] || 0;
        const bVal = bParts[i] || 0;
        if (aVal < bVal) return -1;
        if (aVal > bVal) return 1;
    }
    return 0;
};

/**
 * Define all migrations here in chronological order
 * Each migration should be idempotent (safe to run multiple times)
 */
const migrations: Migration[] = [
    {
        version: '1.0.0',
        description: 'Initial version - set default values',
        migrate: async () => {
            // Set initial default values if not exist
            const darkMode = await kv.get('local', 'darkMode');
            if (darkMode === undefined) {
                await kv.set('local', 'darkMode', false);
                logger.info('[migration] Set default darkMode to false');
            }

            const username = await kv.get('local', 'username');
            if (username === undefined) {
                await kv.set('local', 'username', 'Guest');
                logger.info('[migration] Set default username to Guest');
            }
        }
    },
    {
        version: '1.1.0',
        description: 'Add settings structure',
        migrate: async () => {
            // Example: migrate old flat settings to new nested structure
            const settings = await kv.get('sync', 'settings');
            if (settings === undefined) {
                await kv.set('sync', 'settings', {
                    notifications: true,
                    autoSync: true
                });
                logger.info('[migration] Initialized settings structure');
            }
        }
    },
    {
        version: '1.2.0',
        description: 'Clean up deprecated storage keys',
        migrate: async () => {
            // Example: remove old keys that are no longer used
            // await kv.remove('local', 'oldDeprecatedKey' as any);
            logger.info('[migration] Cleaned up deprecated keys for v1.2.0');
        }
    }

    // Add more migrations as your extension evolves
    // Always increment version and add new migration at the end
];

/**
 * Get current stored version
 */
const getStoredVersion = async (): Promise<Version | null> => {
    return (await kv.get('sync', 'version')) || null;
};

/**
 * Get current extension version from manifest
 */
const getCurrentVersion = (): Version => {
    return chrome.runtime.getManifest().version;
};

/**
 * Run all pending migrations
 */
export const runMigrations = async (): Promise<void> => {
    const currentVersion = getCurrentVersion();
    const storedVersion = await getStoredVersion();

    logger.info(`[migration] Current version: ${currentVersion}, Stored version: ${storedVersion || 'none'}`);

    // If no stored version, this is a fresh install
    if (!storedVersion) {
        logger.info('[migration] Fresh install detected');

        // Run all migrations up to current version
        for (const migration of migrations) {
            if (compareVersions(migration.version, currentVersion) <= 0) {
                try {
                    logger.info(`[migration] Running: ${migration.version} - ${migration.description}`);
                    await migration.migrate();
                } catch (error) {
                    logger.error(`[migration] Failed at ${migration.version}:`, error);
                    throw error; // Stop migration on error
                }
            }
        }

        // Store current version
        await kv.set('sync', 'version', currentVersion);
        logger.info(`[migration] Completed fresh install migrations, version set to ${currentVersion}`);
        return;
    }

    // If stored version is same as current, no migration needed
    if (compareVersions(storedVersion, currentVersion) === 0) {
        logger.info('[migration] Already at current version, no migration needed');
        return;
    }

    // If stored version is newer than current (downgrade), warn but don't migrate
    if (compareVersions(storedVersion, currentVersion) > 0) {
        logger.warn(
            `[migration] Stored version (${storedVersion}) is newer than current (${currentVersion}). Possible downgrade detected.`
        );
        return;
    }

    // Run pending migrations (stored version < current version)
    logger.info(`[migration] Upgrade detected: ${storedVersion} → ${currentVersion}`);

    for (const migration of migrations) {
        // Skip migrations that were already run (version <= stored)
        if (compareVersions(migration.version, storedVersion) <= 0) {
            continue;
        }

        // Skip migrations that are beyond current version
        if (compareVersions(migration.version, currentVersion) > 0) {
            continue;
        }

        // Run this migration
        try {
            logger.info(`[migration] Running: ${migration.version} - ${migration.description}`);
            await migration.migrate();
        } catch (error) {
            logger.error(`[migration] Failed at ${migration.version}:`, error);
            throw error; // Stop migration on error
        }
    }

    // Update stored version
    await kv.set('sync', 'version', currentVersion);
    logger.info(`[migration] All migrations completed, version updated to ${currentVersion}`);
};

/**
 * Rollback to a specific version (for emergency use only)
 * Note: This only updates the version number, actual data rollback
 * needs to be implemented manually
 */
export const rollbackVersion = async (targetVersion: Version): Promise<void> => {
    logger.warn(`[migration] Rolling back version to ${targetVersion}`);
    await kv.set('sync', 'version', targetVersion);
    logger.info('[migration] Version rolled back. Note: Data was not restored.');
};

/**
 * Get migration status information
 */
export const getMigrationStatus = async () => {
    const currentVersion = getCurrentVersion();
    const storedVersion = await getStoredVersion();

    return {
        currentVersion,
        storedVersion,
        needsMigration: storedVersion ? compareVersions(storedVersion, currentVersion) < 0 : false,
        availableMigrations: migrations.map((m) => ({
            version: m.version,
            description: m.description
        }))
    };
};
