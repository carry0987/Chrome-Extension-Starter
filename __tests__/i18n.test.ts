import { describe, it, expect, vi, beforeEach } from 'vitest';
import { t, getLocale, getAcceptLanguages, detectUserLanguage } from '@/shared/lib/i18n';

// Mock chrome.i18n API
const mockChrome = {
    i18n: {
        getMessage: vi.fn(),
        getUILanguage: vi.fn(),
        getAcceptLanguages: vi.fn()
    }
};

// @ts-ignore
global.chrome = mockChrome as any;

describe('i18n', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('t() - getMessage', () => {
        it('should get message without substitutions', () => {
            mockChrome.i18n.getMessage.mockReturnValue('Extension Popup');

            const result = t('popupTitle');

            expect(result).toBe('Extension Popup');
            expect(mockChrome.i18n.getMessage).toHaveBeenCalledWith('popupTitle', undefined);
        });

        it('should get message with single substitution', () => {
            mockChrome.i18n.getMessage.mockReturnValue('Background set to blue');

            const result = t('backgroundChanged', 'blue');

            expect(result).toBe('Background set to blue');
            expect(mockChrome.i18n.getMessage).toHaveBeenCalledWith('backgroundChanged', 'blue');
        });

        it('should get message with multiple substitutions', () => {
            mockChrome.i18n.getMessage.mockReturnValue('User alice has 5 items');

            const result = t('userItems', ['alice', '5']);

            expect(result).toBe('User alice has 5 items');
            expect(mockChrome.i18n.getMessage).toHaveBeenCalledWith('userItems', ['alice', '5']);
        });

        it('should return empty string for non-existent message', () => {
            mockChrome.i18n.getMessage.mockReturnValue('');

            const result = t('nonExistentKey');

            expect(result).toBe('');
        });
    });

    describe('getLocale()', () => {
        it('should return current UI language', () => {
            mockChrome.i18n.getUILanguage.mockReturnValue('en');

            const result = getLocale();

            expect(result).toBe('en');
            expect(mockChrome.i18n.getUILanguage).toHaveBeenCalled();
        });

        it('should handle different locales', () => {
            const locales = ['en', 'zh_TW', 'zh_CN', 'ja', 'fr', 'de'];

            locales.forEach((locale) => {
                mockChrome.i18n.getUILanguage.mockReturnValue(locale);
                expect(getLocale()).toBe(locale);
            });
        });
    });

    describe('getAcceptLanguages()', () => {
        it('should return array of accept languages', async () => {
            const languages = ['en-US', 'en', 'zh-TW'];
            mockChrome.i18n.getAcceptLanguages.mockImplementation((callback) => {
                callback(languages);
            });

            const result = await getAcceptLanguages();

            expect(result).toEqual(languages);
            expect(mockChrome.i18n.getAcceptLanguages).toHaveBeenCalled();
        });

        it('should handle empty languages array', async () => {
            mockChrome.i18n.getAcceptLanguages.mockImplementation((callback) => {
                callback([]);
            });

            const result = await getAcceptLanguages();

            expect(result).toEqual([]);
        });

        it('should return promise', () => {
            mockChrome.i18n.getAcceptLanguages.mockImplementation((callback) => {
                callback(['en']);
            });

            const result = getAcceptLanguages();

            expect(result).toBeInstanceOf(Promise);
        });
    });

    describe('detectUserLanguage()', () => {
        it('should return first accept language', async () => {
            mockChrome.i18n.getAcceptLanguages.mockImplementation((callback) => {
                callback(['zh-TW', 'en-US', 'en']);
            });

            const result = await detectUserLanguage();

            expect(result).toBe('zh-TW');
        });

        it('should fallback to UI language when no accept languages', async () => {
            mockChrome.i18n.getAcceptLanguages.mockImplementation((callback) => {
                callback([]);
            });
            mockChrome.i18n.getUILanguage.mockReturnValue('en');

            const result = await detectUserLanguage();

            expect(result).toBe('en');
        });

        it('should use UI language as ultimate fallback', async () => {
            mockChrome.i18n.getAcceptLanguages.mockImplementation((callback) => {
                callback([]);
            });
            mockChrome.i18n.getUILanguage.mockReturnValue('ja');

            const result = await detectUserLanguage();

            expect(result).toBe('ja');
        });
    });

    describe('Integration scenarios', () => {
        it('should work with typical extension startup flow', async () => {
            // Setup mocks for a typical startup
            mockChrome.i18n.getUILanguage.mockReturnValue('zh_TW');
            mockChrome.i18n.getAcceptLanguages.mockImplementation((callback) => {
                callback(['zh-TW', 'zh-CN', 'en-US']);
            });
            mockChrome.i18n.getMessage.mockImplementation((key) => {
                const messages: Record<string, string> = {
                    popupTitle: '擴充功能彈出視窗',
                    optionsTitle: '擴充功能選項',
                    loadingSettings: '載入設定中...'
                };
                return messages[key] || '';
            });

            // Test the flow
            const locale = getLocale();
            const languages = await getAcceptLanguages();
            const detectedLang = await detectUserLanguage();

            expect(locale).toBe('zh_TW');
            expect(languages).toEqual(['zh-TW', 'zh-CN', 'en-US']);
            expect(detectedLang).toBe('zh-TW');

            // Test translations
            expect(t('popupTitle')).toBe('擴充功能彈出視窗');
            expect(t('optionsTitle')).toBe('擴充功能選項');
            expect(t('loadingSettings')).toBe('載入設定中...');
        });

        it('should handle English locale', async () => {
            mockChrome.i18n.getUILanguage.mockReturnValue('en');
            mockChrome.i18n.getAcceptLanguages.mockImplementation((callback) => {
                callback(['en-US', 'en']);
            });
            mockChrome.i18n.getMessage.mockImplementation((key) => {
                const messages: Record<string, string> = {
                    popupTitle: 'Extension Popup',
                    save: 'Save',
                    cancel: 'Cancel'
                };
                return messages[key] || '';
            });

            expect(getLocale()).toBe('en');
            expect(t('popupTitle')).toBe('Extension Popup');
            expect(t('save')).toBe('Save');
        });
    });
});
