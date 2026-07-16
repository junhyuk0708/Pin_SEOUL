<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { loadDataIndex } from '@/services/dataService'

const KAKAO_KEY = import.meta.env.VITE_KAKAO_MAP_APP_KEY

const mapEl = ref(null)
const allItems = ref([])
const activeCategory = ref('전체')
const categories = ref(['전체'])
const selectedItem = ref(null)
const loadFailed = ref(false)

let mapInstance = null
let markers = []

const visibleItemCount = computed(
  () =>
    allItems.value.filter(
      (item) =>
        item.lat &&
        item.lng &&
        (activeCategory.value === '전체' || item.category === activeCategory.value)
    ).length
)

function loadKakaoScript() {
  return new Promise((resolve, reject) => {
    if (window.kakao && window.kakao.maps) {
      resolve()
      return
    }

    if (!KAKAO_KEY) {
      reject(new Error('VITE_KAKAO_MAP_APP_KEY가 설정되지 않았습니다.'))
      return
    }

    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false`
    script.onload = () => window.kakao.maps.load(resolve)
    script.onerror = reject
    document.head.appendChild(script)
  })
}

function clearMarkers() {
  markers.forEach((marker) => marker.setMap(null))
  markers = []
}

function renderMarkers() {
  if (!mapInstance) return

  clearMarkers()
  selectedItem.value = null

  const items = allItems.value.filter(
    (item) =>
      item.lat &&
      item.lng &&
      (activeCategory.value === '전체' || item.category === activeCategory.value)
  )

  items.forEach((item) => {
    const position = new window.kakao.maps.LatLng(item.lat, item.lng)
    const marker = new window.kakao.maps.Marker({ position, map: mapInstance })

    window.kakao.maps.event.addListener(marker, 'click', () => {
      selectedItem.value = item
    })

    markers.push(marker)
  })
}

function selectCategory(category) {
  activeCategory.value = category
}

watch(activeCategory, renderMarkers)

onMounted(async () => {
  try {
    allItems.value = await loadDataIndex()
    categories.value = ['전체', ...new Set(allItems.value.map((item) => item.category))]
  } catch (error) {
    console.error('지역 데이터 로드 실패:', error)
  }

  try {
    await loadKakaoScript()
    mapInstance = new window.kakao.maps.Map(mapEl.value, {
      center: new window.kakao.maps.LatLng(37.5665, 126.978),
      level: 8,
    })
    renderMarkers()
  } catch (error) {
    console.error('카카오맵 로드 실패:', error)
    loadFailed.value = true
  }
})
</script>

<template>
  <div class="map-section">
    <div class="map-toolbar">
      <div class="map-filters" aria-label="지도 카테고리 필터">
        <button
          v-for="category in categories"
          :key="category"
          :class="['filter-btn', { active: activeCategory === category }]"
          type="button"
          @click="selectCategory(category)"
        >
          {{ category }}
        </button>
      </div>

      <p class="map-count">
        <span aria-hidden="true">●</span>
        {{ visibleItemCount.toLocaleString('ko-KR') }}개 장소 표시
      </p>
    </div>

    <p v-if="loadFailed" class="map-error">
      지도를 불러오지 못했습니다. VITE_KAKAO_MAP_APP_KEY 환경변수와 카카오 개발자
      콘솔의 허용 도메인 등록 여부를 확인해주세요.
    </p>
    <div v-else ref="mapEl" class="map-canvas"></div>

    <div v-if="selectedItem" class="place-popup">
      <div class="place-popup-header">
        <div>
          <span class="category-tag">{{ selectedItem.category }}</span>
          <strong>{{ selectedItem.title }}</strong>
        </div>
        <button type="button" aria-label="장소 정보 닫기" @click="selectedItem = null">✕</button>
      </div>

      <div class="place-details">
        <p v-if="selectedItem.addr">
          <span aria-hidden="true">⌖</span>
          {{ selectedItem.addr }}
        </p>
        <p v-if="selectedItem.tel">
          <span aria-hidden="true">☎</span>
          {{ selectedItem.tel }}
        </p>
        <p v-if="selectedItem.eventStart">
          <span aria-hidden="true">◇</span>
          {{ selectedItem.eventStart }} ~ {{ selectedItem.eventEnd }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-section {
  min-width: 0;
}

.map-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.map-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.filter-btn {
  min-height: 34px;
  padding: 7px 12px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    background-color 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}

.filter-btn:hover {
  transform: translateY(-1px);
  border-color: var(--primary);
  color: var(--primary);
}

.filter-btn.active {
  border-color: var(--primary);
  background: var(--primary);
  color: var(--primary-contrast);
  box-shadow: 0 8px 18px rgba(56, 103, 244, 0.2);
}

.map-count {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 7px;
  margin: 8px 0 0;
  color: var(--text-tertiary);
  font-size: 10px;
  font-weight: 700;
}

.map-count span {
  color: var(--success);
  font-size: 7px;
  box-shadow: 0 0 0 4px rgba(22, 163, 106, 0.1);
  border-radius: 50%;
}

.map-canvas {
  width: 100%;
  height: 520px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--surface-muted);
}

.map-error {
  margin: 0;
  padding: 70px 20px;
  border: 1px solid rgba(216, 75, 75, 0.22);
  border-radius: 18px;
  background: rgba(216, 75, 75, 0.07);
  color: var(--danger);
  font-size: 13px;
  line-height: 1.7;
  text-align: center;
}

.place-popup {
  margin-top: 14px;
  padding: 17px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface-muted);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
}

.place-popup-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.place-popup-header > div {
  min-width: 0;
}

.place-popup-header strong {
  display: block;
  margin-top: 7px;
  font-size: 16px;
  line-height: 1.4;
}

.place-popup-header button {
  display: grid;
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--surface);
  color: var(--text-secondary);
  cursor: pointer;
}

.category-tag {
  display: inline-flex;
  padding: 4px 8px;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 10px;
  font-weight: 800;
}

.place-details {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin-top: 13px;
}

.place-details p {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  margin: 0;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.place-details p span {
  color: var(--primary);
  font-weight: 800;
}

@media (max-width: 720px) {
  .map-toolbar {
    flex-direction: column;
  }

  .map-count {
    margin-top: 0;
  }

  .map-canvas {
    height: 430px;
    border-radius: 14px;
  }
}

@media (max-width: 480px) {
  .filter-btn {
    padding: 6px 9px;
    font-size: 10px;
  }

  .map-canvas {
    height: 380px;
  }
}
</style>
