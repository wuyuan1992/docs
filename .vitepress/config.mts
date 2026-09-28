import { defineConfig } from 'vitepress'
import footnote from 'markdown-it-footnote'
import taskLists from 'markdown-it-task-lists'
import container from 'markdown-it-container'
import { withMermaid } from 'vitepress-plugin-mermaid'
import rewrites from './rewrites.generated.json'
import { sidebar } from './sidebar'
import { legacyCodeTabs } from './markdown/legacy-code-tabs'
import { legacyLinks } from './markdown/legacy-links'

const GITHUB_DOCS = 'https://github.com/deepflowio/docs'

export default withMermaid(
  defineConfig({
    lang: 'en-US',
    title: 'DeepFlow',
    description:
      'DeepFlow leverages eBPF and Wasm to achieve zero-code and full-stack observability, enabling continuous innovation in cloud-native and AI applications.',

    srcDir: 'docs',
    // 产物输出到仓库根 dist(默认是 .vitepress/dist),与 Dockerfile 的 COPY ./dist
    // 及 df-help 企业版 CI 的 mv ./docs/dist/* 对齐
    outDir: 'dist',
    base: '/docs/',
    // 旧站仅有暗色模式:强制暗色。注意 appearance 是根级配置项,
    // 放在 themeConfig 下不会生效(源码读 userConfig.appearance)
    appearance: 'force-dark',
    cleanUrls: true,
    lastUpdated: true,
    sitemap: { hostname: 'https://deepflow.io' },

    // URL 模型(与迁移前线上一致):
    //   英文页(CI 时由 translate/translated 合并进 docs/)位于根路径 clean URL;
    //   中文页位于 /zh/ 前缀下。映射由 scripts/gen-rewrites.mjs 生成。
    rewrites: rewrites as Record<string, string>,

    locales: {
      root: {
        label: 'English',
        lang: 'en-US',
        description:
          'DeepFlow leverages eBPF and Wasm to achieve zero-code and full-stack observability, enabling continuous innovation in cloud-native and AI applications.',
        themeConfig: {
          nav: [
            { text: 'Quick Start', link: '/guide/quick-start/5w-method' },
            { text: 'Features', link: '/features/l7-protocols/overview' },
            { text: 'Release Notes', link: '/release-notes/release-7.2-ce' }
          ]
        }
      },
      zh: {
        label: '简体中文',
        lang: 'zh-CN',
        description:
          'DeepFlow 旨在为复杂的云原生和 AI 应用提供深度可观测性。DeepFlow 基于 eBPF 实现了应用性能指标、分布式追踪、持续性能剖析等观测信号的零侵扰(Zero Code)采集,并结合智能标签(SmartEncoding)技术实现了所有观测信号的全栈(Full Stack)关联和高效存取。',
        themeConfig: {
          nav: [
            { text: '快速开始', link: '/zh/guide/quick-start/5w-method' },
            { text: '功能特性', link: '/zh/features/l7-protocols/overview' },
            { text: '版本发布', link: '/zh/release-notes/release-7.2-ce' }
          ],
          outline: { level: [2, 3], label: '本页目录' },
          lastUpdated: { text: '上次更新' },
          docFooter: { prev: '上一篇', next: '下一篇' },
          returnToTopLabel: '回到顶部',
          sidebarMenuLabel: '菜单',
          darkModeSwitchLabel: '主题',
          lightModeSwitchTitle: '切换到浅色模式',
          darkModeSwitchTitle: '切换到深色模式',
          // 中文内容为源文件,英文为 CI 生成的机器翻译,只开放中文侧的编辑入口
          editLink: {
            pattern: `${GITHUB_DOCS}/edit/main/docs/:path`,
            text: '编辑此页'
          }
        }
      }
    },

    head: [
      ['link', { rel: 'icon', href: '/img/favicon.ico' }],
      ['meta', { name: 'theme-color', content: '#0a72ef' }],
      // 以 iframe 方式打开时标记 embedded,配合样式隐藏导航栏和页脚
      // (参考 eaf3930,内联在 head 中于首帧前执行,无闪烁)
      [
        'script',
        {},
        "if (window.self !== window.top) document.documentElement.classList.add('embedded');"
      ]
    ],

    markdown: {
      lineNumbers: true,
      config: (md) => {
        // vdoing 时代语法的运行时适配(内容文件保持原样,不改写)
        md.use(legacyCodeTabs)
        md.use(legacyLinks)
        md.use(footnote)
        md.use(taskLists)
        // 自定义容器示例:通过 markdown-it-container 注册(2.0 起可改为声明式
        // markdown.container.customContainers)
        md.use(container, 'success', {
          render: (tokens, idx) =>
            tokens[idx].nesting === 1
              ? '<div class="tip custom-block"><p class="custom-block-title">SUCCESS</p>\n'
              : '</div>\n'
        })
      }
    },

    // mermaid 由插件客户端代码动态 import,逃过 Vite 依赖扫描,未预构建时
    // 其内部对 dayjs(UMD)的 ESM 具名导入会在 dev 下报错,强制预构建修复
    vite: {
      optimizeDeps: {
        include: ['mermaid', 'dayjs']
      }
    },

    themeConfig: {
      logo: '/img/logo.png',
      socialLinks: [{ icon: 'github', link: 'https://github.com/deepflowio/deepflow' }],
      sidebar,

      search: {
        provider: 'local',
        options: {
          // MiniSearch 默认按空白分词,中文整句无法命中,改用 Intl.Segmenter 分词
          miniSearch: {
            options: {
              tokenize: (text: string) =>
                [...new Intl.Segmenter('zh-CN', { granularity: 'word' }).segment(text)].map(
                  (s) => s.segment
                )
            }
          }
        }
      }
    }
  })
)
