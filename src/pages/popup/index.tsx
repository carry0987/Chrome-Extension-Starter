import { bus } from '@/shared/lib/messaging';
import { logger } from '@/shared/lib/logger';
import { t } from '@/shared/lib/i18n';
import { MSG } from '@/shared/constants';
import { settingsManager, type Settings } from '@/shared/config';
import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';

// Import styles
import '@/shared/styles.css';

const Popup = () => {
    const [count, setCount] = useState(0);
    const [currentURL, setCurrentURL] = useState<string>('');
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        chrome.action.setBadgeText({ text: count.toString() });
        chrome.action.setBadgeBackgroundColor({ color: '#2563eb' });
    }, [count]);

    useEffect(() => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            setCurrentURL(tabs[0]?.url ?? '');
        });
    }, []);

    useEffect(() => {
        (async () => {
            try {
                await settingsManager.update();
                const loadedSettings = await settingsManager.load();
                setSettings(loadedSettings);
            } catch (error) {
                logger.error('Failed to load settings:', error);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const changeBackground = async () => {
        // Use the favorite color from settings
        const color = settings?.favoriteColor ?? 'blue';
        // Convert color name to hex for better compatibility
        const colorMap: Record<string, string> = {
            red: '#ef4444',
            green: '#22c55e',
            blue: '#3b82f6',
            yellow: '#eab308',
            purple: '#a855f7',
            orange: '#f97316'
        };

        const res = await bus.sendToActive(MSG.CHANGE_BG, { color: colorMap[color] || '#3b82f6' });
        if (!res?.ok) {
            logger.error('Failed to change background color');
        }
    };

    if (loading) {
        return (
            <div className="min-w-[360px] bg-white dark:bg-(--color-surface-dark) text-gray-900 dark:text-gray-100 p-5">
                <div className="text-center text-sm text-gray-500">{t('loadingSettings')}</div>
            </div>
        );
    }

    return (
        <div className="min-w-[360px] bg-white dark:bg-(--color-surface-dark) text-gray-900 dark:text-gray-100 p-5 space-y-4">
            <header className="flex items-center justify-between">
                <h1 className="text-lg font-semibold">{t('popupTitle')}</h1>
                <span className="text-sm text-gray-500 dark:text-gray-400">{new Date().toLocaleTimeString()}</span>
            </header>

            <section className="space-y-2">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">{t('currentURL')}:</span>{' '}
                    <span className="break-all">{currentURL}</span>
                </div>
                <div className="text-sm">
                    <span className="font-medium">{t('clickCount')}:</span> {count}
                </div>

                {settings && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-sm font-medium mb-2">{t('settings')}:</div>
                        <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-600 dark:text-gray-400">{t('favoriteColor')}:</span>
                                <span className="font-medium capitalize">
                                    {t(
                                        `color${settings.favoriteColor.charAt(0).toUpperCase() + settings.favoriteColor.slice(1)}`
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-600 dark:text-gray-400">{t('likesColor')}:</span>
                                <span className="font-medium">{settings.likesColor ? '✅' : '❌'}</span>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            <section className="flex justify-end gap-2">
                <button onClick={() => setCount((c) => c + 1)} className="btn-primary">
                    {t('clickMe')}
                </button>
                <button onClick={changeBackground} className="btn-secondary" title={t('changeBackground')}>
                    {t('changeBackground')}
                </button>
            </section>
        </div>
    );
};

render(<Popup />, document.getElementById('root')!);
