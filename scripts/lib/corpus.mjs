// 语料库工具:收集中英两棵内容树的 URL 映射,供 gen-rewrites / check-urls
// 及 .vitepress/markdown/legacy-links.ts(渲染期链接适配)共用。
// URL 模型:英文页 = permalink 原样;中文页 = permalink 加 /zh/ 前缀。
//
// 注意:本模块会被 esbuild 打包进 VitePress 配置(临时文件),不能用
// import.meta.dirname 推导仓库根;所有入口(dev/build/脚本)均从仓库根启动,
// 用 process.cwd() 定位。
import fs from 'node:fs'
import path from 'node:path'

export const ROOT = process.cwd()

export function parseFrontmatter(file) {
  const m = fs.readFileSync(file, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)
  const out = {}
  if (m) {
    for (const line of m[1].split(/\r?\n/)) {
      const kv = line.match(/^(\w+):\s*(.*)$/)
      if (kv) out[kv[1]] = kv[2].trim().replace(/^['"]|['"]$/g, '')
    }
  }
  return out
}

export function permalinkToUrl(permalink) {
  return permalink.trim().replace(/^\/+|\/+$/g, '')
}

function walkMd(dir, filter = () => true) {
  const result = []
  if (!fs.existsSync(dir)) return result
  for (const name of fs.readdirSync(dir).sort()) {
    if (!filter(name)) continue
    const full = path.join(dir, name)
    if (fs.statSync(full).isDirectory()) result.push(...walkMd(full, filter))
    else if (name.endsWith('.md')) result.push(full)
  }
  return result
}

/**
 * 英文源树:CI 合并后位于 docs/<编号目录>,本地提交态回退到 translate/translated
 */
export function enTreeRoot() {
  return fs.existsSync(path.join(ROOT, 'docs/01-about'))
    ? path.join(ROOT, 'docs')
    : path.join(ROOT, 'translate/translated')
}

/**
 * @returns {{ enMap: Map<string,string>, zhMap: Map<string,string> }}
 *   url(无前后斜杠,如 'about/overview') -> srcDir 相对源文件路径
 */
export function collectMaps() {
  const enMap = new Map()
  const zhMap = new Map()

  const fill = (map, treeRoot, prefix) => {
    for (const file of walkMd(treeRoot)) {
      const rel = prefix + path.relative(treeRoot, file).split(path.sep).join('/')
      if (rel === 'README.md' || rel === 'index.md' || rel.endsWith('/README.md')) continue
      const { permalink } = parseFrontmatter(file)
      if (!permalink) continue
      const url = permalinkToUrl(permalink)
      if (url && !map.has(url)) map.set(url, rel)
    }
  }

  const docsRoot = path.join(ROOT, 'docs')
  if (fs.existsSync(path.join(docsRoot, '01-about'))) {
    // CI 构建态:英文树已合并到 docs/ 下,只取编号分区目录(排除 zh/、public/)
    for (const name of fs.readdirSync(docsRoot)) {
      if (/^\d+-/.test(name)) fill(enMap, path.join(docsRoot, name), `${name}/`)
    }
  } else {
    fill(enMap, path.join(ROOT, 'translate/translated'), '')
  }
  fill(zhMap, path.join(docsRoot, 'zh'), 'zh/')

  // downloadFile.json 声明的 CI 下载页面
  const jsonPath = path.join(ROOT, 'downloadFile.json')
  if (fs.existsSync(jsonPath)) {
    for (const { output, meta } of JSON.parse(fs.readFileSync(jsonPath, 'utf8'))) {
      const rel = output.replace(/^\.\//, '').replace(/^docs\//, '')
      const url = permalinkToUrl(meta.permalink)
      ;(rel.startsWith('zh/') ? zhMap : enMap).set(url, rel)
    }
  }

  return { enMap, zhMap }
}
