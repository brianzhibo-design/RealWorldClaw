import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'RealWorldClaw',
  description: 'Give Your AI a Body — Modular Hardware + 3D Printing = AI in the Physical World',

  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/getting-started/introduction' },
          { text: 'Modules', link: '/modules/overview' },
          { text: 'API', link: '/api/authentication' },
          { text: 'CLI', link: '/cli/rwc-status' },
        ],
        sidebar: {
          '/getting-started/': [
            {
              text: 'Getting Started',
              items: [
                { text: 'Introduction', link: '/getting-started/introduction' },
                { text: 'Quick Start', link: '/getting-started/quick-start' },
                { text: 'Installation', link: '/getting-started/installation' },
                { text: 'Your First Module', link: '/getting-started/your-first-module' },
              ],
            },
          ],
          '/modules/': [
            {
              text: 'Modules',
              items: [
                { text: 'Overview', link: '/modules/overview' },
                { text: 'Core Module', link: '/modules/core' },
                { text: 'Power Module', link: '/modules/power' },
                { text: 'Display Module', link: '/modules/display' },
                { text: 'Audio Module', link: '/modules/audio' },
                { text: 'Servo Module', link: '/modules/servo' },
                { text: 'Sensor Module', link: '/modules/sensor' },
                { text: 'RWC Bus Standard', link: '/modules/rwc-bus' },
              ],
            },
          ],
          '/guides/': [
            {
              text: 'Guides',
              items: [
                { text: 'Designing for 3D Printing', link: '/guides/3d-printing' },
                { text: 'Firmware Development', link: '/guides/firmware' },
                { text: 'Creating Custom Modules', link: '/guides/custom-modules' },
                { text: 'Maker Network Guide', link: '/guides/maker-network' },
              ],
            },
          ],
          '/api/': [
            {
              text: 'API Reference',
              items: [
                { text: 'Authentication', link: '/api/authentication' },
                { text: 'Components', link: '/api/components' },
                { text: 'Orders', link: '/api/orders' },
                { text: 'Makers', link: '/api/makers' },
                { text: 'Designs', link: '/api/designs' },
                { text: 'Printers', link: '/api/printers' },
              ],
            },
          ],
          '/cli/': [
            {
              text: 'CLI Reference',
              items: [
                { text: 'rwc status', link: '/cli/rwc-status' },
                { text: 'rwc modules', link: '/cli/rwc-modules' },
                { text: 'rwc printer', link: '/cli/rwc-printer' },
                { text: 'rwc print', link: '/cli/rwc-print' },
                { text: 'rwc orders', link: '/cli/rwc-orders' },
                { text: 'rwc maker', link: '/cli/rwc-maker' },
              ],
            },
          ],
          '/community/': [
            {
              text: 'Community',
              items: [
                { text: 'Contributing', link: '/community/contributing' },
                { text: 'Code of Conduct', link: '/community/code-of-conduct' },
                { text: 'Roadmap', link: '/community/roadmap' },
              ],
            },
          ],
        },
      },
    },
    zh: {
      label: '中文',
      lang: 'zh-CN',
      link: '/zh/',
      themeConfig: {
        nav: [
          { text: '指南', link: '/zh/getting-started/introduction' },
          { text: '模块', link: '/zh/modules/overview' },
          { text: 'API', link: '/zh/api/authentication' },
          { text: 'CLI', link: '/zh/cli/rwc-status' },
        ],
        sidebar: {
          '/zh/getting-started/': [
            {
              text: '快速入门',
              items: [
                { text: '项目介绍', link: '/zh/getting-started/introduction' },
                { text: '快速开始', link: '/zh/getting-started/quick-start' },
                { text: '安装配置', link: '/zh/getting-started/installation' },
                { text: '第一个模块', link: '/zh/getting-started/your-first-module' },
              ],
            },
          ],
          '/zh/modules/': [
            {
              text: '模块系统',
              items: [
                { text: '概览', link: '/zh/modules/overview' },
                { text: '核心模块', link: '/zh/modules/core' },
                { text: '电源模块', link: '/zh/modules/power' },
                { text: '显示模块', link: '/zh/modules/display' },
                { text: '音频模块', link: '/zh/modules/audio' },
                { text: '舵机模块', link: '/zh/modules/servo' },
                { text: '传感器模块', link: '/zh/modules/sensor' },
                { text: 'RWC 总线标准', link: '/zh/modules/rwc-bus' },
              ],
            },
          ],
          '/zh/guides/': [
            {
              text: '开发指南',
              items: [
                { text: '3D打印设计', link: '/zh/guides/3d-printing' },
                { text: '固件开发', link: '/zh/guides/firmware' },
                { text: '创建自定义模块', link: '/zh/guides/custom-modules' },
                { text: 'Maker 网络指南', link: '/zh/guides/maker-network' },
              ],
            },
          ],
          '/zh/api/': [
            {
              text: 'API 参考',
              items: [
                { text: '认证', link: '/zh/api/authentication' },
                { text: '组件', link: '/zh/api/components' },
                { text: '订单', link: '/zh/api/orders' },
                { text: '制造商', link: '/zh/api/makers' },
                { text: '设计', link: '/zh/api/designs' },
                { text: '打印机', link: '/zh/api/printers' },
              ],
            },
          ],
          '/zh/cli/': [
            {
              text: 'CLI 参考',
              items: [
                { text: 'rwc status', link: '/zh/cli/rwc-status' },
                { text: 'rwc modules', link: '/zh/cli/rwc-modules' },
                { text: 'rwc printer', link: '/zh/cli/rwc-printer' },
                { text: 'rwc print', link: '/zh/cli/rwc-print' },
                { text: 'rwc orders', link: '/zh/cli/rwc-orders' },
                { text: 'rwc maker', link: '/zh/cli/rwc-maker' },
              ],
            },
          ],
          '/zh/community/': [
            {
              text: '社区',
              items: [
                { text: '贡献指南', link: '/zh/community/contributing' },
                { text: '行为准则', link: '/zh/community/code-of-conduct' },
                { text: '路线图', link: '/zh/community/roadmap' },
              ],
            },
          ],
        },
      },
    },
  },

  themeConfig: {
    logo: '/logo.svg',
    search: {
      provider: 'local',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/brianzhibo-design/RealWorldClaw' },
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025-present RealWorldClaw',
    },
  },

  appearance: 'dark',
})
