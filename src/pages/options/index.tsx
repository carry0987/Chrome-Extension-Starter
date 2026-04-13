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
import {
    Select,
    SelectContent,
    SelectDescription,
    SelectIndicator,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
} from '@/components/tailgrids/core/select';
import { TabContent, TabList, TabRoot, TabTrigger } from '@/components/tailgrids/core/tabs';
import { Toggle } from '@/components/tailgrids/core/toggle';
import { type Settings, settingsManager } from '@/shared/config';
import { t } from '@/shared/lib/i18n';
import { logger } from '@/shared/lib/logger';

// Import styles
import '@/shared/styles.css';

type SaveStatus = 'idle' | 'success' | 'error';

type OptionsBadgeColor = 'error' | 'success' | 'blue' | 'warning' | 'purple' | 'orange';

const favoriteColorBadgeMap: Record<string, OptionsBadgeColor> = {
    red: 'error',
    green: 'success',
    blue: 'blue',
    yellow: 'warning',
    purple: 'purple',
    orange: 'orange'
};

const favoriteColorOptions = [
    { id: 'red', label: 'colorRed' },
    { id: 'green', label: 'colorGreen' },
    { id: 'blue', label: 'colorBlue' },
    { id: 'yellow', label: 'colorYellow' },
    { id: 'purple', label: 'colorPurple' },
    { id: 'orange', label: 'colorOrange' }
] as const;

const Options = () => {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [status, setStatus] = useState<SaveStatus>('idle');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const loadedSettings = await settingsManager.load();
                setSettings(loadedSettings);
            } catch (error) {
                logger.error('Failed to load settings:', error);
                setStatus('error');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const saveOptions = async () => {
        if (!settings) return;

        try {
            await settingsManager.save(settings);
            setStatus('success');
            const id = window.setTimeout(() => setStatus('idle'), 1200);
            void id;
        } catch (error) {
            logger.error('Failed to save settings:', error);
            setStatus('error');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background-soft-50 p-6 text-title-50">
                <div className="mx-auto flex min-h-full max-w-xl items-center justify-center">
                    <Card className="border border-base-100 shadow-sm">
                        <CardContent className="py-10">
                            <div className="animate-pulse rounded-2xl bg-background-soft-100 px-8 py-10 text-center text-sm text-text-100">
                                {t('loadingSettings')}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="min-h-screen bg-background-soft-50 p-6 text-title-50">
                <div className="mx-auto flex min-h-full max-w-xl items-center justify-center">
                    <Card className="border border-alert-danger-border bg-alert-danger-background shadow-sm">
                        <CardContent className="py-10 text-center">
                            <Badge color="error" size="md">
                                {t('failedToLoad')}
                            </Badge>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const favoriteColor = settings.favoriteColor;
    const favoriteColorLabel =
        favoriteColorOptions.find((option) => option.id === favoriteColor)?.label ?? favoriteColorOptions[0].label;

    return (
        <div className="min-h-screen bg-background-soft-50 p-6 text-title-50">
            <div className="mx-auto flex min-h-full max-w-2xl items-center justify-center">
                <Card className="border border-base-100 shadow-md">
                    <CardHeader className="space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-3">
                                <Badge color="primary">{t('optionsTitle')}</Badge>
                                <div>
                                    <CardTitle>{t('optionsTitle')}</CardTitle>
                                    <CardDescription className="mt-2 text-sm">
                                        {t('optionsDescription')}
                                    </CardDescription>
                                </div>
                            </div>

                            {status !== 'idle' && (
                                <Badge color={status === 'success' ? 'success' : 'error'} size="md">
                                    {status === 'success' ? t('saved') : t('failedToSave')}
                                </Badge>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="pb-2">
                        <TabRoot defaultValue="appearance" className="overflow-visible bg-card-background-50 shadow-sm">
                            <TabList>
                                <TabTrigger value="appearance" badge={1}>
                                    {t('appearanceTab')}
                                </TabTrigger>
                                <TabTrigger value="behavior" badge={1}>
                                    {t('behaviorTab')}
                                </TabTrigger>
                            </TabList>

                            <TabContent value="appearance" className="space-y-4">
                                <div className="flex items-center justify-between gap-3 rounded-2xl border border-base-100 bg-background-soft-50 p-4">
                                    <div>
                                        <div className="text-sm font-medium text-input-label-text">
                                            {t('favoriteColor')}
                                        </div>
                                        <div className="mt-1 text-sm text-text-100">
                                            {t('favoriteColorDescription')}
                                        </div>
                                    </div>

                                    <Badge
                                        color={favoriteColorBadgeMap[favoriteColor] ?? 'primary'}
                                        size="md"
                                        className="capitalize">
                                        {t(`color${favoriteColor.charAt(0).toUpperCase() + favoriteColor.slice(1)}`)}
                                    </Badge>
                                </div>

                                <Select
                                    value={favoriteColor}
                                    onChange={(value) => setSettings({ ...settings, favoriteColor: value })}>
                                    <SelectLabel>{t('favoriteColor')}</SelectLabel>
                                    <SelectDescription>{t('favoriteColorDescription')}</SelectDescription>
                                    <SelectTrigger>
                                        <SelectValue>{t(favoriteColorLabel)}</SelectValue>
                                        <SelectIndicator />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {favoriteColorOptions.map((option) => (
                                            <SelectItem key={option.id} id={option.id} textValue={t(option.label)}>
                                                {t(option.label)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </TabContent>

                            <TabContent value="behavior" className="space-y-4">
                                <div className="rounded-2xl border border-base-100 bg-background-soft-50 p-5">
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div>
                                            <div className="text-sm font-medium text-input-label-text">
                                                {t('likesColor')}
                                            </div>
                                            <div className="mt-1 text-sm text-text-100">
                                                {t('likesColorDescription')}
                                            </div>
                                        </div>

                                        <Toggle
                                            size="md"
                                            checked={settings.likesColor}
                                            onChange={(event) =>
                                                setSettings({
                                                    ...settings,
                                                    likesColor: event.currentTarget.checked
                                                })
                                            }
                                            label={settings.likesColor ? t('enabled') : t('disabled')}
                                        />
                                    </div>
                                </div>
                            </TabContent>
                        </TabRoot>
                    </CardContent>

                    <CardFooter className="flex items-center justify-end gap-3 pt-2">
                        <Button type="button" onClick={saveOptions}>
                            {t('save')}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

const root = document.getElementById('root');
if (root) render(<Options />, root);
