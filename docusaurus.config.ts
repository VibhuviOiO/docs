import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Infinite Operations',
  tagline: 'Experience The Operations',
  favicon: 'img/favicon.ico',
  url: 'https://vibhuvioio.com',
  baseUrl: '/docs/',
  organizationName: 'VibhuviOiO',
  projectName: 'docs',
  trailingSlash: false,
  deploymentBranch: 'gh-pages',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'VibhuviOiO',
      hideOnScroll: true,
      logo: {
        alt: 'VibhuviOiO Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          to: '/products',
          label: 'Products',
          position: 'left',
        },
        {
          href: 'https://vibhuvioio.com',
          label: 'Home',
          position: 'right',
        },
        {
          href: 'https://github.com/VibhuviOiO/docs',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Infrastructure',
              to: '/Infrastructure/ansible',
            },
            {
              label: 'Databases',
              to: '/Databases/NoSQL/mongodb',
            },
            {
              label: 'Elastic Stack',
              to: '/ElasticStack',
            },
          ],
        },
        {
          title: 'Products',
          items: [
            {
              label: 'Docker Registry UI',
              href: 'https://vibhuvioio.com/docker-registry-ui/',
            },
            {
              label: 'LDAP Manager',
              href: 'https://vibhuvioio.com/ldap-manager/',
            },
            {
              label: 'Suchaka Status Page',
              href: 'https://github.com/VibhuviOiO/suchaka',
            },
            {
              label: 'All Products',
              to: '/products',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/VibhuviOiO',
            },
            {
              label: 'Main Website',
              href: 'https://vibhuvioio.com',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} VibhuviOiO. Open Source Infrastructure Tools.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};
export default config;
