import { settingsManager, type Settings } from '@/shared/config';
import { ToggleInput } from '@/shared/components';
import { logger } from '@/shared/lib/logger';
import { t } from '@/shared/lib/i18n';
import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';

// Import styles
import '@/shared/styles.css';

const Options = () => {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                // Ensure settings are initialized
                await settingsManager.update();
                const loadedSettings = await settingsManager.load();
                setSettings(loadedSettings);
            } catch (error) {
                logger.error('Failed to load settings:', error);
                setStatus(`❌ ${t('failedToLoad')}`);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const saveOptions = async () => {
        if (!settings) return;

        try {
            await settingsManager.save(settings);
            setStatus(`✅ ${t('saved')}`);
            const id = window.setTimeout(() => setStatus(''), 1200);
            void id;
        } catch (error) {
            logger.error('Failed to save settings:', error);
            setStatus(`❌ ${t('failedToSave')}`);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-surface dark:bg-(--color-surface-dark) text-gray-900 dark:text-gray-100 flex items-center justify-center p-6">
                <div className="text-center">{t('loadingSettings')}</div>
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="min-h-screen bg-surface dark:bg-(--color-surface-dark) text-gray-900 dark:text-gray-100 flex items-center justify-center p-6">
                <div className="text-center text-red-500">{t('failedToLoad')}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface dark:bg-(--color-surface-dark) text-gray-900 dark:text-gray-100 flex items-center justify-center p-6">
            <div className="w-full max-w-md card space-y-6">
                <header>
                    <h1 className="card-header">{t('optionsTitle')}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage your extension preferences.</p>
                </header>

                <section className="space-y-4">
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">
                            {t('favoriteColor')}
                        </label>
                        <select
                            className="input"
                            value={settings.favoriteColor}
                            onChange={(e) => setSettings({ ...settings, favoriteColor: e.currentTarget.value })}>
                            <option value="red">{t('colorRed')}</option>
                            <option value="green">{t('colorGreen')}</option>
                            <option value="blue">{t('colorBlue')}</option>
                            <option value="yellow">{t('colorYellow')}</option>
                            <option value="purple">{t('colorPurple')}</option>
                            <option value="orange">{t('colorOrange')}</option>
                        </select>
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                        <ToggleInput
                            label={t('likesColor')}
                            checked={settings.likesColor}
                            onChange={(checked) => setSettings({ ...settings, likesColor: checked })}
                        />
                    </label>
                </section>

                <footer className="flex justify-end items-center gap-3 pt-2">
                    <div className="text-sm text-green-600 dark:text-green-400 h-5">{status}</div>
                    <button onClick={saveOptions} className="btn-primary">
                        {t('save')}
                    </button>
                </footer>
            </div>
        </div>
    );
};

render(<Options />, document.getElementById('root')!);
