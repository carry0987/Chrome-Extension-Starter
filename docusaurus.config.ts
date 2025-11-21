import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
    title: 'Chrome-Extension-Starter',
    tagline: 'Chrome Extension Starter, using TypeScript, Preact, TailwindCSS, Vitest and RSBuild.',
    favicon: 'img/favicon.ico',

    // Set the production url of your site here
    url: 'https://carry0987.github.io',
    // Set the /<baseUrl>/ pathname under which your site is served
    // For GitHub pages deployment, it is often '/<projectName>/'
    baseUrl: '/Chrome-Extension-Starter/',

    // GitHub pages deployment config.
    // If you aren't using GitHub pages, you don't need these.
    organizationName: 'carry0987', // Usually your GitHub org/user name.
    projectName: 'Chrome-Extension-Starter', // Usually your repo name.

    // The broken links detection is only available for a production build
    onBrokenLinks: 'throw',

    // Global markdown configuration
    markdown: {
        hooks: {
            onBrokenMarkdownLinks: 'warn',
            onBrokenMarkdownImages: 'ignore',
        }
    },

    // Even if you don't use internationalization, you can use this field to set
    // useful metadata like html lang. For example, if your site is Chinese, you
    // may want to replace "en" with "zh-Hans".
    i18n: {
        defaultLocale: 'en',
        locales: ['en'],
    },

    presets: [
        [
            '@docusaurus/preset-classic',
            {
                sitemap: {
                    changefreq: 'weekly',
                    priority: 0.5,
                },
                docs: {
                    sidebarPath: './sidebars.ts',
                    showLastUpdateAuthor: true,
                    showLastUpdateTime: true,
                    // Remove this to remove the "edit this page" links.
                    editUrl:
                        'https://github.com/carry0987/Chrome-Extension-Starter/tree/gh-pages/',
                },
                theme: {
                    customCss: './src/css/custom.css',
                },
            } satisfies Preset.Options,
        ],
    ],

    themeConfig: {
        navbar: {
            hideOnScroll: true,
            title: 'Chrome-Extension-Starter',
            items: [
                {
                    to: 'docs',
                    activeBasePath: 'docs',
                    position: 'left',
                    label: 'Document',
                },
                // {
                //     to: 'docs/examples/hello-world',
                //     activeBasePath: 'docs/examples',
                //     label: 'Examples',
                //     position: 'left',
                // },
                {
                    href: 'https://chromewebstore.google.com/detail/ifmlochoiniognoocigfjcmakkdbhofi?utm_source=item-share-cb',
                    label: 'Extension',
                    position: 'right',
                },
                {
                    href: 'https://github.com/carry0987/Chrome-Extension-Starter',
                    label: 'GitHub',
                    position: 'right',
                },
            ],
        },
        footer: {
            style: 'dark',
            copyright: `Copyright © ${new Date().getFullYear()} carry0987. Built with Docusaurus.`,
        },
        colorMode: {
            defaultMode: 'light',
            disableSwitch: false,
            respectPrefersColorScheme: true,
        },
        prism: {
            theme: prismThemes.oneDark,
            darkTheme: prismThemes.oneDark,
            additionalLanguages: ['tsx', 'css', 'json', 'bash'],
        },
        liveCodeBlock: {
            /**
             * The position of the live playground, above or under the editor
             * Possible values: "top" | "bottom"
             */
            playgroundPosition: 'bottom',
        }
    } satisfies Preset.ThemeConfig,
    themes: ['@docusaurus/theme-live-codeblock']
};

export default config;
