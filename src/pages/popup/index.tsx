import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Badge } from '@/components/tailgrids/core/badge';
import { Button } from '@/components/tailgrids/core/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/components/tailgrids/core/card';
import { type Settings, settingsManager } from '@/shared/config';
import { MSG } from '@/shared/constants';
import { t } from '@/shared/lib/i18n';
import { logger } from '@/shared/lib/logger';
import { bus } from '@/shared/lib/messaging';

// Import styles
import '@/shared/styles.css';

type PopupBadgeColor = 'error' | 'success' | 'blue' | 'warning' | 'purple' | 'orange';

const favoriteColorBadgeMap: Record<string, PopupBadgeColor> = {
    red: 'error',
    green: 'success',
    blue: 'blue',
    yellow: 'warning',
    purple: 'purple',
    orange: 'orange'
};

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
        if (res !== undefined && !res.ok) {
            logger.error('Failed to change background color');
        }
    };

    if (loading) {
        return (
            <div className="min-w-[24rem] bg-background-soft-50 p-4 text-title-50">
                <Card className="border border-base-100 shadow-sm">
                    <CardHeader>
                        <Badge color="primary">{t('popupTitle')}</Badge>
                    </CardHeader>
                    <CardContent className="pb-5">
                        <div className="animate-pulse rounded-xl bg-background-soft-100 px-4 py-8 text-center text-sm text-text-100">
                            {t('loadingSettings')}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const favoriteColor = settings?.favoriteColor ?? 'blue';
    const likesColor = settings?.likesColor ?? false;

    return (
        <div className="min-w-[24rem] bg-background-soft-50 p-4 text-title-50">
            <Card className="overflow-hidden border border-base-100 shadow-md">
                <CardHeader className="space-y-4 pb-1">
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-3">
                            <Badge color="primary">{t('popupTitle')}</Badge>
                            <div>
                                <CardTitle className="text-xl">{t('popupTitle')}</CardTitle>
                                <CardDescription className="mt-2 text-sm">{t('currentURL')}</CardDescription>
                            </div>
                        </div>
                        <Badge color="gray" size="md">
                            {new Date().toLocaleTimeString()}
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4 pb-2">
                    <div className="rounded-2xl border border-base-100 bg-background-soft-50 p-4">
                        <div className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-text-100">
                            {t('currentURL')}
                        </div>
                        <div className="break-all text-sm leading-6 text-title-50">{currentURL || '-'}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-base-100 bg-card-background-50 p-4">
                            <div className="text-xs font-medium uppercase tracking-[0.14em] text-text-100">
                                {t('clickCount')}
                            </div>
                            <div className="mt-2 text-2xl font-semibold text-title-50">{count}</div>
                        </div>

                        <div className="rounded-2xl border border-base-100 bg-card-background-50 p-4">
                            <div className="text-xs font-medium uppercase tracking-[0.14em] text-text-100">
                                {t('likesColor')}
                            </div>
                            <div className="mt-2">
                                <Badge color={likesColor ? 'success' : 'gray'} size="md">
                                    {likesColor ? t('enabled') : t('disabled')}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-base-100 bg-card-background-50 p-4">
                        <div className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-text-100">
                            {t('settings')}
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-sm text-text-100">{t('favoriteColor')}</span>
                            <Badge
                                color={favoriteColorBadgeMap[favoriteColor] ?? 'primary'}
                                size="md"
                                className="capitalize">
                                {t(`color${favoriteColor.charAt(0).toUpperCase() + favoriteColor.slice(1)}`)}
                            </Badge>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex items-center justify-end gap-3 pt-2">
                    <Button type="button" appearance="outline" onClick={changeBackground}>
                        {t('changeBackground')}
                    </Button>
                    <Button type="button" onClick={() => setCount((c) => c + 1)}>
                        {t('clickMe')}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

const root = document.getElementById('root');
if (root) render(<Popup />, root);
