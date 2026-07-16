<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import ChatWidget from '@/components/chatbot/ChatWidget.vue'

const THEME_STORAGE_KEY = 'pinseoul-theme'
const isDarkMode = ref(false)

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
  isDarkMode.value = theme === 'dark'
}

function toggleTheme() {
  const nextTheme = isDarkMode.value ? 'light' : 'dark'
  applyTheme(nextTheme)
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
}

onMounted(() => {
  const currentTheme = document.documentElement.dataset.theme || 'light'
  applyTheme(currentTheme)
})
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="header-inner">
        <RouterLink to="/" class="logo" aria-label="PinSeoul 홈으로 이동">
          <span class="logo-pin" aria-hidden="true"></span>
          <span>PinSeoul</span>
        </RouterLink>

        <div class="header-actions">
          <nav class="app-nav" aria-label="주요 메뉴">
            <RouterLink to="/">홈</RouterLink>
            <RouterLink to="/board">게시판</RouterLink>
          </nav>

          <button
            class="theme-toggle"
            type="button"
            :aria-label="isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'"
            :title="isDarkMode ? '라이트 모드' : '다크 모드'"
            @click="toggleTheme"
          >
            <span class="theme-icon" aria-hidden="true">{{ isDarkMode ? '☀' : '☾' }}</span>
            <span class="theme-label">{{ isDarkMode ? '라이트' : '다크' }}</span>
          </button>
        </div>
      </div>
    </header>

    <main class="app-main">
      <RouterView />
    </main>

    <footer class="app-footer">
      <p>
        이 서비스는 한국관광공사 Tour API(TourAPI 4.0)의 데이터를 활용하였습니다.
      </p>
      <p>
        출처: 한국관광공사 (data.go.kr/data/15101578/openapi.do) · 라이선스: 공공누리 제3유형
      </p>
    </footer>

    <ChatWidget />
  </div>
</template>

<style>
:root {
  --page-bg: #f5f7fb;
  --surface: #ffffff;
  --surface-soft: #eef3ff;
  --surface-muted: #f8faff;
  --surface-strong: #e5ecff;
  --text-primary: #172033;
  --text-secondary: #627087;
  --text-tertiary: #8b96a8;
  --border: #e3e8f1;
  --border-strong: #d4dceb;
  --primary: #3867f4;
  --primary-hover: #2754d7;
  --primary-soft: #e8eeff;
  --primary-contrast: #ffffff;
  --accent: #8b5cf6;
  --success: #16a36a;
  --warning: #f59e0b;
  --danger: #d84b4b;
  --chart-track: #e9edf5;
  --header-bg: rgba(255, 255, 255, 0.88);
  --shadow-sm: 0 8px 24px rgba(31, 52, 97, 0.08);
  --shadow-md: 0 20px 54px rgba(31, 52, 97, 0.13);
  --shadow-primary: 0 14px 30px rgba(56, 103, 244, 0.24);
  color-scheme: light;
}

:root[data-theme='dark'] {
  --page-bg: #0b1020;
  --surface: #141b2c;
  --surface-soft: #1a2540;
  --surface-muted: #101827;
  --surface-strong: #223154;
  --text-primary: #f3f6fb;
  --text-secondary: #b1bdd0;
  --text-tertiary: #8794a9;
  --border: #27334a;
  --border-strong: #34415b;
  --primary: #7da2ff;
  --primary-hover: #9ab7ff;
  --primary-soft: #1d2c50;
  --primary-contrast: #081126;
  --accent: #b899ff;
  --success: #4bd7a2;
  --warning: #f8bd56;
  --danger: #ff8383;
  --chart-track: #253149;
  --header-bg: rgba(11, 16, 32, 0.88);
  --shadow-sm: 0 8px 24px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 20px 54px rgba(0, 0, 0, 0.34);
  --shadow-primary: 0 14px 30px rgba(69, 111, 221, 0.28);
  color-scheme: dark;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
  background: var(--page-bg);
}

body {
  margin: 0;
  min-width: 320px;
  font-family: -apple-system, BlinkMacSystemFont, 'Pretendard', 'Noto Sans KR', 'Malgun Gothic',
    sans-serif;
  background: var(--page-bg);
  color: var(--text-primary);
  transition:
    background-color 0.25s ease,
    color 0.25s ease;
}

button,
input,
textarea {
  font: inherit;
}

button,
a {
  -webkit-tap-highlight-color: transparent;
}

button:focus-visible,
a:focus-visible,
input:focus-visible,
textarea:focus-visible {
  outline: 3px solid rgba(56, 103, 244, 0.32);
  outline-offset: 2px;
}

.app-shell {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid var(--border);
  background: var(--header-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.header-inner {
  width: min(1180px, calc(100% - 32px));
  min-height: 64px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.logo {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: var(--text-primary);
  font-size: 19px;
  font-weight: 800;
  letter-spacing: -0.02em;
  text-decoration: none;
}

.logo-pin {
  position: relative;
  display: grid;
  width: 27px;
  height: 27px;
  place-items: center;
  overflow: hidden;
  border-radius: 9px 9px 12px 9px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  font-size: 8px;
  transform: rotate(45deg);
  box-shadow: 0 7px 15px rgba(56, 103, 244, 0.25);
}

.logo-pin::after {
  content: '';
  position: absolute;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #fff;
}

.logo-pin::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: inherit;
}

.header-actions,
.app-nav {
  display: flex;
  align-items: center;
}

.header-actions {
  gap: 18px;
}

.app-nav {
  gap: 4px;
}

.app-nav a {
  padding: 9px 12px;
  border-radius: 10px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.app-nav a:hover {
  background: var(--surface-soft);
  color: var(--text-primary);
}

.app-nav a.router-link-exact-active {
  background: var(--primary-soft);
  color: var(--primary);
}

.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 38px;
  padding: 7px 11px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text-secondary);
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.theme-toggle:hover {
  transform: translateY(-1px);
  border-color: var(--primary);
  color: var(--primary);
}

.theme-icon {
  display: grid;
  width: 22px;
  height: 22px;
  place-items: center;
  border-radius: 50%;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 15px;
  line-height: 1;
}

.theme-label {
  font-size: 12px;
  font-weight: 700;
}

.app-main {
  flex: 1;
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 32px 0 96px;
}

.app-footer {
  padding: 22px 16px;
  border-top: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-tertiary);
  text-align: center;
  font-size: 11px;
  line-height: 1.6;
}

.app-footer p {
  margin: 0;
}

@media (max-width: 640px) {
  .header-inner,
  .app-main {
    width: min(100% - 24px, 1180px);
  }

  .header-inner {
    min-height: 58px;
  }

  .logo {
    font-size: 17px;
  }

  .header-actions {
    gap: 8px;
  }

  .app-nav a {
    padding: 8px;
    font-size: 13px;
  }

  .theme-toggle {
    width: 38px;
    min-width: 38px;
    padding: 7px;
    justify-content: center;
  }

  .theme-label {
    display: none;
  }

  .app-main {
    padding-top: 20px;
  }
}
</style>
