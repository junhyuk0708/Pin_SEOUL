<script setup>
import { computed, onMounted, ref } from 'vue'
import { loadDataIndex } from '@/services/dataService'
import MapView from '@/components/map/MapView.vue'

const EXCLUDED_ANALYSIS_CATEGORY = '음식점'

const CATEGORY_COLORS = {
  쇼핑: '#3867f4',
  관광지: '#8b5cf6',
  문화시설: '#ec4899',
  숙박: '#14b8a6',
  축제공연행사: '#f59e0b',
  레포츠: '#ef6c5b',
  여행코스: '#64748b',
}

const allItems = ref([])
const isLoading = ref(true)
const loadError = ref('')

const analysisItems = computed(() =>
  allItems.value.filter((item) => item.category !== EXCLUDED_ANALYSIS_CATEGORY)
)

const categoryStats = computed(() => {
  const counts = new Map()

  analysisItems.value.forEach((item) => {
    counts.set(item.category, (counts.get(item.category) || 0) + 1)
  })

  const sorted = [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)

  const maxCount = sorted[0]?.count || 1
  const total = analysisItems.value.length || 1

  return sorted.map((item) => ({
    ...item,
    percentage: (item.count / total) * 100,
    barWidth: (item.count / maxCount) * 100,
    color: CATEGORY_COLORS[item.category] || '#3867f4',
  }))
})

function extractDistrict(address) {
  if (!address) return null

  const seoulMatch = address.match(/(?:서울특별시|서울시|서울)\s+([가-힣]+구)/)
  if (seoulMatch) return seoulMatch[1]

  const districtMatch = address.match(/([가-힣]+구)/)
  return districtMatch ? districtMatch[1] : null
}

const allDistrictNames = computed(() => {
  const districts = new Set()

  analysisItems.value.forEach((item) => {
    const district = extractDistrict(item.addr)
    if (district) districts.add(district)
  })

  return [...districts]
})

const districtStats = computed(() => {
  const counts = new Map()

  analysisItems.value.forEach((item) => {
    const district = extractDistrict(item.addr)
    if (!district) return
    counts.set(district, (counts.get(district) || 0) + 1)
  })

  const sorted = [...counts.entries()]
    .map(([district, count]) => ({ district, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  const maxCount = sorted[0]?.count || 1

  return sorted.map((item, index) => ({
    ...item,
    rank: index + 1,
    barWidth: (item.count / maxCount) * 100,
  }))
})

function parseTourDate(value) {
  const text = String(value || '')
  if (!/^\d{8}$/.test(text)) return null

  const year = Number(text.slice(0, 4))
  const month = Number(text.slice(4, 6)) - 1
  const day = Number(text.slice(6, 8))
  const date = new Date(year, month, day)

  return Number.isNaN(date.getTime()) ? null : date
}

const festivalStats = computed(() => {
  const counts = {
    ongoing: 0,
    upcoming: 0,
    ended: 0,
    unknown: 0,
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  analysisItems.value
    .filter((item) => item.category === '축제공연행사')
    .forEach((item) => {
      const startDate = parseTourDate(item.eventStart)
      const endDate = parseTourDate(item.eventEnd)

      if (!startDate || !endDate) {
        counts.unknown += 1
      } else if (endDate < today) {
        counts.ended += 1
      } else if (startDate > today) {
        counts.upcoming += 1
      } else {
        counts.ongoing += 1
      }
    })

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0)

  return {
    total,
    items: [
      { key: 'ongoing', label: '진행 중', count: counts.ongoing, color: '#16a36a' },
      { key: 'upcoming', label: '예정', count: counts.upcoming, color: '#3867f4' },
      { key: 'ended', label: '종료', count: counts.ended, color: '#94a3b8' },
      { key: 'unknown', label: '날짜 미상', count: counts.unknown, color: '#f59e0b' },
    ],
  }
})

const festivalDonutBackground = computed(() => {
  const total = festivalStats.value.total || 1
  let cursor = 0
  const segments = festivalStats.value.items.map((item) => {
    const start = cursor
    const end = cursor + (item.count / total) * 100
    cursor = end
    return `${item.color} ${start}% ${end}%`
  })

  return `conic-gradient(${segments.join(', ')})`
})

const todayLabel = computed(() =>
  new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date())
)

function formatNumber(value) {
  return Number(value || 0).toLocaleString('ko-KR')
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

onMounted(async () => {
  try {
    allItems.value = await loadDataIndex()
  } catch (error) {
    loadError.value = '지역 데이터를 불러오는 중 문제가 발생했습니다.'
    console.error(error)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <section class="home">
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-copy">
        <p class="hero-eyebrow">
          <span class="eyebrow-dot" aria-hidden="true"></span>
          SEOUL LOCAL DISCOVERY
        </p>

        <h1 id="hero-title">PinSeoul</h1>
        <p class="hero-slogan">서울의 모든 순간을 지도 위에 핀하다.</p>
        <p class="hero-description">
          관광지부터 문화시설, 축제와 숙박까지.<br />
          서울의 지역 정보를 지도와 데이터로 한눈에 발견해보세요.
        </p>

        <div class="hero-actions">
          <button class="hero-button primary" type="button" @click="scrollToSection('map-explorer')">
            <span aria-hidden="true">⌖</span>
            지도 둘러보기
          </button>
          <button class="hero-button secondary" type="button" @click="scrollToSection('data-insights')">
            <span aria-hidden="true">↗</span>
            데이터 분석 보기
          </button>
        </div>

        <div class="hero-stats" aria-label="PinSeoul 데이터 요약">
          <div class="hero-stat">
            <strong>{{ isLoading ? '—' : formatNumber(analysisItems.length) }}</strong>
            <span>분석 장소</span>
          </div>
          <div class="hero-stat">
            <strong>{{ isLoading ? '—' : categoryStats.length }}</strong>
            <span>정보 유형</span>
          </div>
          <div class="hero-stat">
            <strong>{{ isLoading ? '—' : allDistrictNames.length }}</strong>
            <span>서울 자치구</span>
          </div>
        </div>
      </div>

      <div class="hero-visual" aria-hidden="true">
        <div class="visual-orbit orbit-one"></div>
        <div class="visual-orbit orbit-two"></div>
        <div class="seoul-card">
          <div class="seoul-card-top">
            <span>PIN SEOUL MAP</span>
            <span class="live-indicator"><i></i> LIVE DATA</span>
          </div>

          <div class="map-illustration">
            <span class="map-route route-one"></span>
            <span class="map-route route-two"></span>
            <span class="map-pin pin-one"><i></i></span>
            <span class="map-pin pin-two"><i></i></span>
            <span class="map-pin pin-three"><i></i></span>
            <span class="map-pin pin-four"><i></i></span>
            <span class="map-location-label label-one">종로</span>
            <span class="map-location-label label-two">성수</span>
            <span class="map-location-label label-three">강남</span>
          </div>

          <div class="seoul-card-bottom">
            <div>
              <span>서울 지역정보</span>
              <strong>{{ isLoading ? '불러오는 중' : `${formatNumber(analysisItems.length)}개 장소` }}</strong>
            </div>
            <div class="mini-bars">
              <i></i><i></i><i></i><i></i>
            </div>
          </div>
        </div>

        <div class="floating-card floating-card-top">
          <span class="floating-icon">●</span>
          <div>
            <small>오늘의 발견</small>
            <strong>서울을 새롭게</strong>
          </div>
        </div>

        <div class="floating-card floating-card-bottom">
          <strong>{{ isLoading ? '—' : festivalStats.total }}</strong>
          <span>축제·공연 데이터</span>
        </div>
      </div>
    </section>

    <p v-if="loadError" class="status-message error">{{ loadError }}</p>
    <p v-else-if="isLoading" class="status-message loading">서울 지역 데이터를 불러오는 중입니다...</p>

    <section v-else class="category-overview" aria-labelledby="category-overview-title">
      <div class="section-heading compact">
        <div>
          <p class="section-kicker">EXPLORE BY CATEGORY</p>
          <h2 id="category-overview-title">카테고리별 데이터</h2>
        </div>
        <p>음식점 목업을 제외한 공식 관광 데이터 기준</p>
      </div>

      <ul class="category-summary">
        <li v-for="item in categoryStats" :key="item.category">
          <span class="category-dot" :style="{ backgroundColor: item.color }"></span>
          <span>{{ item.category }}</span>
          <strong>{{ formatNumber(item.count) }}</strong>
        </li>
      </ul>
    </section>

    <section id="map-explorer" class="content-section map-explorer" aria-labelledby="map-title">
      <div class="section-heading">
        <div>
          <p class="section-kicker">INTERACTIVE MAP</p>
          <h2 id="map-title">지도에서 서울을 탐색하세요</h2>
        </div>
        <p>원하는 카테고리를 선택하고 마커를 눌러 장소 정보를 확인할 수 있습니다.</p>
      </div>

      <div class="map-card">
        <MapView />
      </div>
    </section>

    <section
      v-if="!isLoading && !loadError"
      id="data-insights"
      class="content-section data-insights"
      aria-labelledby="insights-title"
    >
      <div class="section-heading">
        <div>
          <p class="section-kicker">DATA INSIGHTS</p>
          <h2 id="insights-title">데이터로 보는 서울</h2>
        </div>
        <p>
          한국관광공사 데이터 {{ formatNumber(analysisItems.length) }}건 분석 · 음식점 목업 6건 제외
        </p>
      </div>

      <div class="summary-cards">
        <article class="summary-card">
          <span class="summary-icon blue" aria-hidden="true">⌖</span>
          <div>
            <span>전체 분석 장소</span>
            <strong>{{ formatNumber(analysisItems.length) }}<small>건</small></strong>
          </div>
        </article>

        <article class="summary-card">
          <span class="summary-icon purple" aria-hidden="true">▦</span>
          <div>
            <span>데이터 카테고리</span>
            <strong>{{ categoryStats.length }}<small>개</small></strong>
          </div>
        </article>

        <article class="summary-card">
          <span class="summary-icon teal" aria-hidden="true">◎</span>
          <div>
            <span>주소로 확인된 자치구</span>
            <strong>{{ allDistrictNames.length }}<small>개</small></strong>
          </div>
        </article>

        <article class="summary-card">
          <span class="summary-icon orange" aria-hidden="true">◇</span>
          <div>
            <span>축제·공연·행사</span>
            <strong>{{ formatNumber(festivalStats.total) }}<small>건</small></strong>
          </div>
        </article>
      </div>

      <div class="analysis-grid">
        <article class="chart-card category-chart-card">
          <header class="chart-header">
            <div>
              <p class="chart-label">CATEGORY DISTRIBUTION</p>
              <h3>카테고리별 데이터 분포</h3>
            </div>
            <span class="chart-badge">총 {{ formatNumber(analysisItems.length) }}건</span>
          </header>

          <div class="horizontal-chart">
            <div v-for="item in categoryStats" :key="item.category" class="chart-row">
              <div class="chart-row-meta">
                <span class="chart-category">
                  <i :style="{ backgroundColor: item.color }"></i>
                  {{ item.category }}
                </span>
                <span>
                  <strong>{{ formatNumber(item.count) }}</strong>
                  <small>{{ item.percentage.toFixed(1) }}%</small>
                </span>
              </div>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  :style="{
                    width: `${item.barWidth}%`,
                    background: `linear-gradient(90deg, ${item.color}, ${item.color}cc)`,
                  }"
                ></div>
              </div>
            </div>
          </div>

          <p class="chart-note">
            쇼핑 데이터가 전체의 약 {{ categoryStats[0]?.percentage.toFixed(1) }}%로 가장 큰 비중을
            차지합니다.
          </p>
        </article>

        <article class="chart-card district-chart-card">
          <header class="chart-header">
            <div>
              <p class="chart-label">TOP DISTRICTS</p>
              <h3>지역정보가 많은 자치구</h3>
            </div>
            <span class="chart-badge">상위 8개</span>
          </header>

          <ol class="district-list">
            <li v-for="item in districtStats" :key="item.district">
              <span class="district-rank">{{ item.rank }}</span>
              <div class="district-body">
                <div class="district-meta">
                  <strong>{{ item.district }}</strong>
                  <span>{{ formatNumber(item.count) }}건</span>
                </div>
                <div class="bar-track compact-track">
                  <div class="bar-fill district-fill" :style="{ width: `${item.barWidth}%` }"></div>
                </div>
              </div>
            </li>
          </ol>

          <p class="chart-note">주소에서 서울 자치구를 추출할 수 있는 데이터를 기준으로 집계했습니다.</p>
        </article>

        <article class="chart-card festival-chart-card">
          <header class="chart-header">
            <div>
              <p class="chart-label">FESTIVAL TIMELINE</p>
              <h3>축제·공연 일정 현황</h3>
            </div>
            <span class="chart-badge">{{ todayLabel }} 기준</span>
          </header>

          <div class="festival-content">
            <div
              class="donut-chart"
              :style="{ background: festivalDonutBackground }"
              role="img"
              :aria-label="`축제공연행사 총 ${festivalStats.total}건의 일정 상태`"
            >
              <div class="donut-center">
                <strong>{{ festivalStats.total }}</strong>
                <span>전체 행사</span>
              </div>
            </div>

            <ul class="festival-legend">
              <li v-for="item in festivalStats.items" :key="item.key">
                <span class="legend-dot" :style="{ backgroundColor: item.color }"></span>
                <span>{{ item.label }}</span>
                <strong>{{ item.count }}건</strong>
                <small>
                  {{ festivalStats.total ? ((item.count / festivalStats.total) * 100).toFixed(1) : 0 }}%
                </small>
              </li>
            </ul>

            <div class="festival-highlight">
              <span>현재 확인 가능한 행사</span>
              <strong>
                {{ festivalStats.items[0].count + festivalStats.items[1].count }}건
              </strong>
              <p>진행 중인 행사와 앞으로 시작할 행사를 합한 수치입니다.</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 72px;
}

.hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(360px, 0.95fr);
  min-height: 540px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 32px;
  background:
    radial-gradient(circle at 13% 20%, rgba(56, 103, 244, 0.14), transparent 30%),
    radial-gradient(circle at 85% 18%, rgba(139, 92, 246, 0.15), transparent 34%),
    linear-gradient(135deg, var(--surface) 0%, var(--surface-soft) 68%, var(--surface) 100%);
  box-shadow: var(--shadow-md);
  isolation: isolate;
}

.hero::before,
.hero::after {
  content: '';
  position: absolute;
  z-index: -1;
  border-radius: 50%;
  pointer-events: none;
}

.hero::before {
  width: 300px;
  height: 300px;
  right: -110px;
  top: -130px;
  border: 1px solid rgba(56, 103, 244, 0.18);
  box-shadow:
    0 0 0 42px rgba(56, 103, 244, 0.04),
    0 0 0 84px rgba(139, 92, 246, 0.035);
}

.hero::after {
  width: 180px;
  height: 180px;
  left: 44%;
  bottom: -130px;
  background: rgba(56, 103, 244, 0.08);
  filter: blur(2px);
}

.hero-copy {
  align-self: center;
  padding: 68px 24px 68px 64px;
}

.hero-eyebrow,
.section-kicker,
.chart-label {
  margin: 0;
  color: var(--primary);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.hero-eyebrow {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 20px;
}

.eyebrow-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary);
  box-shadow: 0 0 0 5px rgba(56, 103, 244, 0.13);
}

.hero h1 {
  margin: 0;
  font-size: clamp(58px, 7vw, 86px);
  line-height: 0.95;
  letter-spacing: -0.065em;
  background: linear-gradient(120deg, var(--text-primary) 20%, var(--primary) 66%, var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero-slogan {
  margin: 22px 0 0;
  color: var(--text-primary);
  font-size: clamp(21px, 2.4vw, 30px);
  font-weight: 800;
  letter-spacing: -0.035em;
}

.hero-description {
  margin: 18px 0 0;
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 30px;
}

.hero-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 46px;
  padding: 0 18px;
  border-radius: 13px;
  font-size: 14px;
  font-weight: 750;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.hero-button:hover {
  transform: translateY(-2px);
}

.hero-button.primary {
  border: 1px solid var(--primary);
  background: var(--primary);
  color: var(--primary-contrast);
  box-shadow: var(--shadow-primary);
}

.hero-button.primary:hover {
  background: var(--primary-hover);
}

.hero-button.secondary {
  border: 1px solid var(--border-strong);
  background: var(--surface);
  color: var(--text-primary);
}

.hero-button.secondary:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.hero-stats {
  display: flex;
  gap: 0;
  margin-top: 34px;
}

.hero-stat {
  min-width: 105px;
  padding-right: 22px;
}

.hero-stat + .hero-stat {
  padding-left: 22px;
  border-left: 1px solid var(--border-strong);
}

.hero-stat strong,
.hero-stat span {
  display: block;
}

.hero-stat strong {
  color: var(--text-primary);
  font-size: 24px;
  font-weight: 850;
  letter-spacing: -0.035em;
}

.hero-stat span {
  margin-top: 4px;
  color: var(--text-tertiary);
  font-size: 11px;
  font-weight: 650;
}

.hero-visual {
  position: relative;
  display: grid;
  min-height: 100%;
  place-items: center;
  padding: 60px 54px 60px 24px;
}

.visual-orbit {
  position: absolute;
  border: 1px solid rgba(56, 103, 244, 0.18);
  border-radius: 50%;
}

.orbit-one {
  width: 430px;
  height: 430px;
}

.orbit-two {
  width: 330px;
  height: 330px;
  border-style: dashed;
  animation: orbit-spin 24s linear infinite;
}

.seoul-card {
  position: relative;
  z-index: 2;
  width: min(100%, 390px);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.76);
  box-shadow: 0 28px 70px rgba(44, 68, 129, 0.2);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transform: rotate(2deg);
}

:global(html[data-theme='dark']) .seoul-card {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(20, 27, 44, 0.82);
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.36);
}

.seoul-card-top,
.seoul-card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.seoul-card-top {
  padding: 18px 20px;
  color: var(--text-secondary);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.live-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--success);
}

.live-indicator i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 0 4px rgba(22, 163, 106, 0.12);
}

.map-illustration {
  position: relative;
  height: 265px;
  overflow: hidden;
  margin: 0 14px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background:
    linear-gradient(rgba(56, 103, 244, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(56, 103, 244, 0.07) 1px, transparent 1px),
    linear-gradient(145deg, var(--surface-muted), var(--primary-soft));
  background-size: 24px 24px, 24px 24px, auto;
}

.map-illustration::before {
  content: '';
  position: absolute;
  width: 205px;
  height: 235px;
  left: 76px;
  top: 15px;
  border: 2px solid rgba(56, 103, 244, 0.18);
  border-radius: 44% 56% 53% 47% / 36% 43% 57% 64%;
  background: rgba(255, 255, 255, 0.24);
  transform: rotate(-8deg);
}

.map-route {
  position: absolute;
  z-index: 1;
  display: block;
  border: 3px dashed rgba(56, 103, 244, 0.36);
  border-top-color: transparent;
  border-right-color: transparent;
  border-radius: 50%;
}

.route-one {
  width: 215px;
  height: 150px;
  left: 50px;
  top: 53px;
  transform: rotate(-12deg);
}

.route-two {
  width: 170px;
  height: 120px;
  right: 38px;
  bottom: 34px;
  transform: rotate(158deg);
}

.map-pin {
  position: absolute;
  z-index: 3;
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 50% 50% 50% 0;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  box-shadow: 0 9px 20px rgba(56, 103, 244, 0.3);
  transform: rotate(-45deg);
}

.map-pin i {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #fff;
}

.pin-one {
  left: 75px;
  top: 55px;
}

.pin-two {
  right: 82px;
  top: 74px;
  transform: rotate(-45deg) scale(0.82);
}

.pin-three {
  left: 155px;
  bottom: 54px;
  transform: rotate(-45deg) scale(1.14);
}

.pin-four {
  right: 52px;
  bottom: 34px;
  transform: rotate(-45deg) scale(0.72);
}

.map-location-label {
  position: absolute;
  z-index: 2;
  padding: 4px 7px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text-secondary);
  font-size: 9px;
  font-weight: 750;
  box-shadow: var(--shadow-sm);
}

.label-one {
  left: 28px;
  top: 103px;
}

.label-two {
  right: 44px;
  top: 126px;
}

.label-three {
  right: 68px;
  bottom: 76px;
}

.seoul-card-bottom {
  padding: 18px 20px 20px;
}

.seoul-card-bottom div:first-child span,
.seoul-card-bottom div:first-child strong {
  display: block;
}

.seoul-card-bottom div:first-child span {
  color: var(--text-tertiary);
  font-size: 10px;
}

.seoul-card-bottom div:first-child strong {
  margin-top: 3px;
  color: var(--text-primary);
  font-size: 17px;
}

.mini-bars {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 30px;
}

.mini-bars i {
  display: block;
  width: 6px;
  border-radius: 4px;
  background: linear-gradient(var(--accent), var(--primary));
}

.mini-bars i:nth-child(1) {
  height: 11px;
}

.mini-bars i:nth-child(2) {
  height: 20px;
}

.mini-bars i:nth-child(3) {
  height: 15px;
}

.mini-bars i:nth-child(4) {
  height: 28px;
}

.floating-card {
  position: absolute;
  z-index: 4;
  border: 1px solid rgba(255, 255, 255, 0.75);
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 17px 40px rgba(44, 68, 129, 0.18);
  backdrop-filter: blur(13px);
  -webkit-backdrop-filter: blur(13px);
}

:global(html[data-theme='dark']) .floating-card {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(20, 27, 44, 0.88);
  box-shadow: 0 17px 40px rgba(0, 0, 0, 0.3);
}

.floating-card-top {
  top: 105px;
  left: 5px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 16px;
  animation: floating 4.6s ease-in-out infinite;
}

.floating-icon {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 10px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 8px;
}

.floating-card-top small,
.floating-card-top strong {
  display: block;
}

.floating-card-top small {
  color: var(--text-tertiary);
  font-size: 9px;
}

.floating-card-top strong {
  margin-top: 2px;
  color: var(--text-primary);
  font-size: 12px;
}

.floating-card-bottom {
  right: 22px;
  bottom: 85px;
  padding: 13px 17px;
  border-radius: 16px;
  animation: floating 5.2s ease-in-out 0.6s infinite;
}

.floating-card-bottom strong,
.floating-card-bottom span {
  display: block;
}

.floating-card-bottom strong {
  color: var(--primary);
  font-size: 22px;
}

.floating-card-bottom span {
  margin-top: 1px;
  color: var(--text-tertiary);
  font-size: 9px;
  font-weight: 700;
}

.status-message {
  margin: -36px 0 0;
  padding: 16px 18px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface);
  color: var(--text-secondary);
  font-size: 13px;
  text-align: center;
}

.status-message.error {
  border-color: rgba(216, 75, 75, 0.25);
  background: rgba(216, 75, 75, 0.08);
  color: var(--danger);
}

.category-overview,
.content-section {
  scroll-margin-top: 86px;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 30px;
  margin-bottom: 22px;
}

.section-heading.compact {
  align-items: center;
}

.section-heading h2 {
  margin: 7px 0 0;
  color: var(--text-primary);
  font-size: clamp(25px, 3vw, 34px);
  letter-spacing: -0.04em;
}

.section-heading > p {
  max-width: 490px;
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.65;
  text-align: right;
}

.category-summary {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.category-summary li {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
  padding: 14px 13px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface);
  color: var(--text-secondary);
  font-size: 12px;
  box-shadow: var(--shadow-sm);
}

.category-summary li > span:nth-child(2) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-summary strong {
  margin-left: auto;
  color: var(--text-primary);
  font-size: 12px;
}

.category-dot {
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.map-card {
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: var(--surface);
  box-shadow: var(--shadow-md);
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 112px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease;
}

.summary-card:hover {
  transform: translateY(-3px);
  border-color: var(--border-strong);
}

.summary-icon {
  display: grid;
  flex: 0 0 auto;
  width: 46px;
  height: 46px;
  place-items: center;
  border-radius: 14px;
  font-size: 20px;
  font-weight: 800;
}

.summary-icon.blue {
  background: rgba(56, 103, 244, 0.12);
  color: #3867f4;
}

.summary-icon.purple {
  background: rgba(139, 92, 246, 0.12);
  color: #8b5cf6;
}

.summary-icon.teal {
  background: rgba(20, 184, 166, 0.12);
  color: #14b8a6;
}

.summary-icon.orange {
  background: rgba(245, 158, 11, 0.13);
  color: #f59e0b;
}

.summary-card span:not(.summary-icon),
.summary-card strong {
  display: block;
}

.summary-card span:not(.summary-icon) {
  color: var(--text-tertiary);
  font-size: 11px;
  font-weight: 650;
}

.summary-card strong {
  margin-top: 4px;
  color: var(--text-primary);
  font-size: 25px;
  letter-spacing: -0.035em;
}

.summary-card strong small {
  margin-left: 3px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 650;
}

.analysis-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(330px, 0.75fr);
  gap: 16px;
  margin-top: 16px;
}

.chart-card {
  min-width: 0;
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: 22px;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.festival-chart-card {
  grid-column: 1 / -1;
}

.chart-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.chart-header h3 {
  margin: 6px 0 0;
  color: var(--text-primary);
  font-size: 18px;
  letter-spacing: -0.025em;
}

.chart-badge {
  flex: 0 0 auto;
  padding: 7px 10px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface-muted);
  color: var(--text-secondary);
  font-size: 10px;
  font-weight: 700;
}

.horizontal-chart {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chart-row-meta,
.district-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.chart-row-meta {
  margin-bottom: 7px;
  color: var(--text-secondary);
  font-size: 12px;
}

.chart-category {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  font-weight: 700;
}

.chart-category i {
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.chart-row-meta > span:last-child {
  display: flex;
  align-items: baseline;
  gap: 7px;
}

.chart-row-meta strong {
  color: var(--text-primary);
}

.chart-row-meta small {
  min-width: 38px;
  color: var(--text-tertiary);
  text-align: right;
}

.bar-track {
  position: relative;
  height: 9px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--chart-track);
}

.bar-fill {
  height: 100%;
  min-width: 2px;
  border-radius: inherit;
  transition: width 0.65s ease;
}

.chart-note {
  margin: 22px 0 0;
  padding-top: 15px;
  border-top: 1px dashed var(--border);
  color: var(--text-tertiary);
  font-size: 10px;
  line-height: 1.6;
}

.district-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.district-list li {
  display: flex;
  align-items: center;
  gap: 11px;
}

.district-rank {
  display: grid;
  flex: 0 0 auto;
  width: 25px;
  height: 25px;
  place-items: center;
  border-radius: 8px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 10px;
  font-weight: 800;
}

.district-body {
  flex: 1;
  min-width: 0;
}

.district-meta {
  margin-bottom: 6px;
  font-size: 11px;
}

.district-meta strong {
  color: var(--text-primary);
  font-size: 12px;
}

.district-meta span {
  color: var(--text-tertiary);
}

.compact-track {
  height: 6px;
}

.district-fill {
  background: linear-gradient(90deg, var(--primary), var(--accent));
}

.festival-content {
  display: grid;
  grid-template-columns: 220px minmax(260px, 1fr) minmax(250px, 0.8fr);
  align-items: center;
  gap: 34px;
}

.donut-chart {
  position: relative;
  display: grid;
  width: 190px;
  height: 190px;
  margin: 0 auto;
  place-items: center;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.22);
}

.donut-chart::before {
  content: '';
  position: absolute;
  width: 116px;
  height: 116px;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--surface);
  box-shadow: 0 8px 24px rgba(31, 52, 97, 0.09);
}

.donut-center {
  position: relative;
  z-index: 1;
  text-align: center;
}

.donut-center strong,
.donut-center span {
  display: block;
}

.donut-center strong {
  color: var(--text-primary);
  font-size: 31px;
  letter-spacing: -0.04em;
}

.donut-center span {
  margin-top: 2px;
  color: var(--text-tertiary);
  font-size: 10px;
  font-weight: 700;
}

.festival-legend {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 11px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.festival-legend li {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 13px 14px;
  border: 1px solid var(--border);
  border-radius: 13px;
  background: var(--surface-muted);
  color: var(--text-secondary);
  font-size: 11px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.festival-legend strong {
  color: var(--text-primary);
  font-size: 12px;
}

.festival-legend small {
  grid-column: 2 / 4;
  color: var(--text-tertiary);
  font-size: 9px;
}

.festival-highlight {
  padding: 24px;
  border: 1px solid rgba(56, 103, 244, 0.2);
  border-radius: 18px;
  background:
    radial-gradient(circle at 92% 8%, rgba(139, 92, 246, 0.13), transparent 35%),
    var(--primary-soft);
}

.festival-highlight span,
.festival-highlight strong {
  display: block;
}

.festival-highlight span {
  color: var(--primary);
  font-size: 11px;
  font-weight: 800;
}

.festival-highlight strong {
  margin-top: 9px;
  color: var(--text-primary);
  font-size: 34px;
  letter-spacing: -0.04em;
}

.festival-highlight p {
  margin: 8px 0 0;
  color: var(--text-secondary);
  font-size: 11px;
  line-height: 1.65;
}

@keyframes orbit-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes floating {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-9px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .orbit-two,
  .floating-card {
    animation: none;
  }

  .hero-button,
  .summary-card,
  .bar-fill {
    transition: none;
  }
}

@media (max-width: 1050px) {
  .hero {
    grid-template-columns: minmax(0, 1fr) minmax(330px, 0.85fr);
  }

  .hero-copy {
    padding-left: 44px;
  }

  .hero-visual {
    padding-right: 34px;
  }

  .category-summary {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .summary-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .festival-content {
    grid-template-columns: 190px 1fr;
  }

  .festival-highlight {
    grid-column: 1 / -1;
  }
}

@media (max-width: 820px) {
  .home {
    gap: 58px;
  }

  .hero {
    grid-template-columns: 1fr;
  }

  .hero-copy {
    padding: 52px 36px 24px;
  }

  .hero-visual {
    min-height: 410px;
    padding: 22px 42px 58px;
  }

  .orbit-one {
    width: 370px;
    height: 370px;
  }

  .orbit-two {
    width: 285px;
    height: 285px;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .section-heading > p {
    max-width: none;
    text-align: left;
  }

  .analysis-grid {
    grid-template-columns: 1fr;
  }

  .festival-chart-card {
    grid-column: auto;
  }
}

@media (max-width: 620px) {
  .home {
    gap: 48px;
  }

  .hero {
    min-height: auto;
    border-radius: 24px;
  }

  .hero-copy {
    padding: 42px 24px 18px;
  }

  .hero h1 {
    font-size: 55px;
  }

  .hero-slogan {
    font-size: 21px;
  }

  .hero-description br {
    display: none;
  }

  .hero-actions {
    flex-direction: column;
  }

  .hero-button {
    width: 100%;
  }

  .hero-stat {
    min-width: 0;
    flex: 1;
    padding-right: 10px;
  }

  .hero-stat + .hero-stat {
    padding-left: 10px;
  }

  .hero-stat strong {
    font-size: 20px;
  }

  .hero-stat span {
    font-size: 9px;
  }

  .hero-visual {
    min-height: 350px;
    padding: 14px 18px 48px;
  }

  .seoul-card {
    width: min(90%, 350px);
  }

  .map-illustration {
    height: 215px;
  }

  .map-illustration::before {
    width: 175px;
    height: 190px;
    left: 66px;
  }

  .floating-card-top {
    top: 38px;
    left: 4px;
  }

  .floating-card-bottom {
    right: 8px;
    bottom: 30px;
  }

  .category-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .map-card {
    padding: 12px;
    border-radius: 18px;
  }

  .summary-cards {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .summary-card {
    min-height: 104px;
    padding: 15px;
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .summary-icon {
    width: 38px;
    height: 38px;
    border-radius: 11px;
    font-size: 17px;
  }

  .summary-card strong {
    font-size: 21px;
  }

  .chart-card {
    padding: 19px;
    border-radius: 18px;
  }

  .chart-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .festival-content {
    grid-template-columns: 1fr;
    gap: 25px;
  }

  .festival-highlight {
    grid-column: auto;
  }

  .festival-legend {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 400px) {
  .category-summary,
  .summary-cards,
  .festival-legend {
    grid-template-columns: 1fr;
  }

  .floating-card-top {
    display: none;
  }
}
</style>
