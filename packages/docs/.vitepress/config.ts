import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Habit Tracker',
  description: 'A macOS app that blocks websites when daily habits are not completed',

  // Base path for GitHub Pages deployment
  base: '/habit-tracker/',

  // Map TypeDoc's README.md to index for VitePress
  rewrites: {
    'api/README.md': 'api/index.md',
  },

  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'API', link: '/api/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Setup', link: '/guide/setup' },
            { text: 'Local Domains', link: '/guide/local-domains' },
          ],
        },
        {
          text: 'Architecture',
          items: [
            { text: 'System Design', link: '/guide/architecture' },
          ],
        },
        {
          text: 'Development',
          items: [
            { text: 'Testing', link: '/guide/testing' },
            { text: 'Coding Standards', link: '/guide/coding-standards' },
          ],
        },
        {
          text: 'Operations',
          items: [
            { text: 'Deployment', link: '/guide/deployment' },
            { text: 'Troubleshooting', link: '/guide/troubleshooting' },
          ],
        },
        {
          text: 'Packages',
          items: [
            { text: 'Shared', link: '/guide/shared' },
            { text: 'Backend', link: '/guide/backend' },
            { text: 'Frontend', link: '/guide/frontend' },
            { text: 'Daemon', link: '/guide/daemon' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
          ],
        },
        {
          text: 'Modules',
          items: [
            { text: 'shared', link: '/api/modules/index' },
            { text: 'daemon-client', link: '/api/modules/daemon_client' },
          ],
        },
        {
          text: 'Interfaces',
          collapsed: true,
          items: [
            { text: 'Habit', link: '/api/interfaces/index.Habit' },
            { text: 'HabitLog', link: '/api/interfaces/index.HabitLog' },
            { text: 'AppSettings', link: '/api/interfaces/index.AppSettings' },
            { text: 'DaemonStatus', link: '/api/interfaces/index.DaemonStatus' },
            { text: 'ApiResponse', link: '/api/interfaces/index.ApiResponse' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/PaulBunker/habit-tracker' },
    ],

    search: {
      provider: 'local',
    },

    footer: {
      message: 'Built with VitePress',
    },
  },

  // Allow importing from packages for future aggregation
  vite: {
    resolve: {
      alias: {
        '@packages': '../..',
      },
    },
  },
});
