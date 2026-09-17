<template>
  <!-- 侧边栏顶部的搜索 + 语言切换(自 SiteNavbar 迁来):iframe 嵌入模式下
       导航栏整体隐藏(custom.css 的 html.embedded 部分),这两项能力经
       sidebar-nav-before 插槽常驻侧边栏,桌面端与移动端抽屉中均可用。
       仅文档页有侧边栏,首页等页面不渲染 -->
  <div class="sidebar-actions">
    <input
      type="text"
      class="search-box"
      readonly
      :placeholder="isZh ? '搜索' : 'Search'"
      aria-label="Search"
      @mousedown.prevent="openSearch"
      @focus="openSearch"
    />
    <div
      :class="['lang-switch', { open: langOpen }]"
      @mouseenter="langOpen = true"
      @mouseleave="langOpen = false"
    >
      <button
        type="button"
        class="lang-switch-trigger"
        :aria-expanded="langOpen"
        @click="langOpen = !langOpen"
      >
        {{ isZh ? '中' : 'Eng' }}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div class="lang-menu" role="menu">
        <a
          v-for="option in langList"
          :key="option.type"
          :class="{ current: currentType === option.type }"
          href="javascript:void(0)"
          @click="switchLang(option.type)"
          >{{ option.text }}</a
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useData, useRouter } from 'vitepress'

const { lang, site } = useData()
const router = useRouter()
const base = site.value.base // '/docs/'

const isZh = computed(() => lang.value?.startsWith('zh'))
const currentType = computed(() => (isZh.value ? 'zh' : 'en'))
const langList = [
  { type: 'zh', text: '简体中文' },
  { type: 'en', text: 'English' }
]
const langOpen = ref(false)

function switchLang(type: string) {
  if (type === currentType.value) return
  langOpen.value = false
  let rest = window.location.pathname.slice(base.length)
  if (isZh.value) rest = rest.replace(/^zh\//, '')
  router.go(base + (type === 'zh' ? 'zh/' : '') + rest)
}

function openSearch() {
  // VitePress 本地搜索内置 Cmd+K 监听,合成该事件唤起搜索弹层
  // (VitePress 自身程序化打开搜索用的同一方式)
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }))
}
</script>

<style scoped>
/* 样式自 SiteNavbar 的 global-nav 迁移:站点为 force-dark,沿用其暗色
   玻璃设计令牌;布局改为侧边栏窄列(桌面端与下方 VPSidebarGroup 的
   内容列宽 calc(var(--vp-sidebar-width) - 64px) 对齐) */
.sidebar-actions {
  --border-1: rgba(178, 193, 217, 0.12);
  --border-2: rgba(178, 193, 217, 0.22);
  --border-3: rgba(178, 193, 217, 0.36);
  --text-1: #edf2f8;
  --text-2: #aebbd0;
  --text-3: #8997ab;
  --primary-4: #9a9cff;
  --primary-5: #7c7eff;
  --fill-1: rgba(255, 255, 255, 0.045);
  --glass-surface-strong: rgba(13, 19, 29, 0.96);
  --glass-blur: 10px;
  --shadow-1: 0 28px 80px rgba(0, 0, 0, 0.32);

  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  /* 与下方侧边栏分组间的分隔线,颜色同分组分隔线 */
  border-bottom: 1px solid var(--vp-c-divider);
}
.embedded .sidebar-actions {
  padding-top: 0;
}


@media (min-width: 960px) {
  .sidebar-actions {
    width: calc(var(--vp-sidebar-width) - 64px);
  }
}

/* 搜索框:暗色玻璃输入框,点击唤起 VitePress 本地搜索 */
.search-box {
  width: 100%;
  height: 36px;
  line-height: 36px;
  padding: 0 0.5rem 0 2rem;
  color: var(--text-1);
  border: 1px solid var(--border-2);
  border-radius: 2rem;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  background:
    var(--fill-1)
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='13'%3E%3Cg stroke-width='2' stroke='%23aaa' fill='none'%3E%3Cpath d='M11.29 11.71l-4-4'/%3E%3Ccircle cx='5' cy='5' r='4'/%3E%3C/g%3E%3C/svg%3E")
    0.6rem
    0.55rem
    no-repeat;
  background-size: 1rem;
  transition: border-color 0.2s ease;
}
.search-box:focus {
  border-color: var(--primary-5);
  outline: none;
}
.search-box::placeholder {
  color: var(--text-3);
}

/* 语言切换:玻璃下拉,触发器为幽灵胶囊(左对齐,下拉向下方展开) */
.lang-switch {
  /* 暂时隐藏 */
  display: none;
  position: relative;
}
.lang-switch-trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 36px;
  padding: 0 13px;
  color: var(--text-2);
  border: 1px solid var(--border-2);
  border-radius: 999px;
  background: transparent;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease;
}
.lang-switch-trigger svg {
  width: 11px;
  height: 11px;
}
.lang-switch:hover .lang-switch-trigger {
  color: var(--text-1);
  border-color: var(--border-3);
}
.lang-menu {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 22;
  display: none;
  width: 132px;
  margin-top: 8px;
  padding: 6px;
  border: 1px solid var(--border-2);
  border-radius: 10px;
  background: var(--glass-surface-strong);
  box-shadow: var(--shadow-1);
  -webkit-backdrop-filter: blur(var(--glass-blur));
  backdrop-filter: blur(var(--glass-blur));
}
/* 透明桥接层:填补 trigger 与弹出层之间 8px 间隙(margin-top 造成的空白
   不属于任何元素,鼠标穿越时会触发容器 mouseleave 导致弹出层关闭) */
.lang-menu::before {
  content: '';
  position: absolute;
  top: -8px;
  left: 0;
  right: 0;
  height: 8px;
}
.lang-switch.open .lang-menu {
  display: block;
}
.lang-menu a {
  display: block;
  padding: 9px 10px;
  color: var(--text-1);
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
}
.lang-menu a:hover {
  background: var(--fill-1);
}
.lang-menu a.current {
  color: var(--primary-4);
}
</style>
