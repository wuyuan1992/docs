// vdoing 时代相对链接的运行时适配(内容文件保持原语法,不改写)。
//
// 移植自旧版 docs/.vuepress/plugins/auto-complete-url 插件:旧站链接按
// 「源文件目录(去掉数字前缀)」解析,再映射到目标页 permalink。本插件在
// 渲染期做同样的解析,并按新的双语 URL 模型输出最终地址:
//   - 中文页(docs/zh/**)上的链接 -> /zh/<permalink>
//   - 英文页(CI 合并后的 docs/<编号目录>/**)上的链接 -> /<permalink>
//   - 目标仅有另一语言版本时自动回退
//
// 解析失败仅告警并保留原链接,不阻断构建(死链检测仍会兜底)。
// 另:去掉 vdoing 图片语法 ?align=xxx 查询参数。
import type MarkdownIt from 'markdown-it'
import { collectMaps } from '../../scripts/lib/corpus.mjs'

const enMap: Map<string, string> = new Map()
const zhMap: Map<string, string> = new Map()
let mapsReady = false

function ensureMaps() {
  if (mapsReady) return
  const maps = collectMaps()
  for (const [k, v] of maps.enMap) enMap.set(k, v)
  for (const [k, v] of maps.zhMap) zhMap.set(k, v)
  mapsReady = true
}

/** 与资源后缀(含 .md/.pcap 等)的链接交给 VitePress 原生处理 */
const ASSET_RE = /\.[a-z0-9]+([?#]|$)/i

/** 源文件路径 -> 去 数字前缀 后的目录段(旧插件的解析基准) */
function strippedDir(relativePath: string): string[] {
  return relativePath
    .split('/')
    .slice(0, -1)
    .map((seg) => seg.replace(/^\d+-/, ''))
}

function resolveTarget(relativePath: string, href: string): string | null {
  const parts = strippedDir(relativePath)
  for (const seg of href.split('/')) {
    if (seg === '..') parts.pop()
    else if (seg !== '.' && seg !== '') parts.push(seg)
  }
  let url = parts.join('/')
  if (url.startsWith('zh/')) url = url.slice(3)
  if (!url) return null

  const isZhPage = relativePath.startsWith('zh/')
  if (isZhPage) {
    if (zhMap.has(url)) return '/zh/' + url
    if (enMap.has(url)) return '/' + url
  } else {
    if (enMap.has(url)) return '/' + url
    if (zhMap.has(url)) return '/zh/' + url
  }
  return null
}

export function legacyLinks(md: MarkdownIt): void {
  ensureMaps()

  const prevLink = md.renderer.rules.link_open
  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const i = token.attrIndex('href')
    const href = i >= 0 ? token.attrs![i][1] : ''
    const relativePath: string = env?.relativePath || ''

    if (
      relativePath &&
      href &&
      !/^(https?:|mailto:|#|\/\/)/i.test(href) &&
      !href.startsWith('/') && // 绝对链接保持旧站行为(指向根路径英文页)
      !ASSET_RE.test(href)
    ) {
      const qIdx = href.search(/[?#]/)
      const pathPart = qIdx === -1 ? href : href.slice(0, qIdx)
      const rest = qIdx === -1 ? '' : href.slice(qIdx)
      const target = resolveTarget(relativePath, pathPart)
      if (target) {
        token.attrs![i][1] = target + rest
      } else {
        console.warn(`[legacy-links] 未解析链接,保留原样: ${relativePath}: ${href}`)
      }
    }

    return prevLink
      ? prevLink(tokens, idx, options, env, self)
      : self.renderToken(tokens, idx, options)
  }

  const prevImage = md.renderer.rules.image
  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const i = token.attrIndex('src')
    if (i >= 0) {
      // vdoing 的 ?align=center 图片参数在 VitePress 下会破坏资源解析
      token.attrs![i][1] = token.attrs![i][1].replace(/\?align=[\w-]+/, '')
    }
    return prevImage
      ? prevImage(tokens, idx, options, env, self)
      : self.renderToken(tokens, idx, options)
  }
}
