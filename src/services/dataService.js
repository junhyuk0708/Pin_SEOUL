// src/services/dataService.js
// ASCII 파일명을 사용해 운영체제·압축 프로그램에 따른 한글 경로 인코딩 문제를 방지합니다.

const DATA_FILES = [
  { file: '/data/seoul/seoul_attractions.json', category: '관광지' },
  { file: '/data/seoul/seoul_culture.json', category: '문화시설' },
  { file: '/data/seoul/seoul_leports.json', category: '레포츠' },
  { file: '/data/seoul/seoul_shopping.json', category: '쇼핑' },
  { file: '/data/seoul/seoul_accommodation.json', category: '숙박' },
  { file: '/data/seoul/seoul_courses.json', category: '여행코스' },
  { file: '/data/seoul/seoul_festivals.json', category: '축제공연행사' },
  { file: '/data/seoul/seoul_restaurants_mock.json', category: '맛집' },
]

let cachedIndex = null

function normalizeItem(raw, category) {
  const lat = Number.parseFloat(raw.mapy)
  const lng = Number.parseFloat(raw.mapx)

  return {
    id: raw.contentid,
    title: raw.title || '',
    category,
    addr: [raw.addr1, raw.addr2].filter(Boolean).join(' ').trim(),
    tel: raw.tel || '',
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    image: raw.firstimage || '',
    eventStart: raw.eventstartdate || null,
    eventEnd: raw.eventenddate || null,
    eventPlace: raw.eventplace || null,
  }
}

async function loadOneFile(file, category) {
  const response = await fetch(encodeURI(file), { cache: 'no-cache' })
  const contentType = response.headers.get('content-type') || ''

  if (!response.ok) {
    throw new Error(`${file} 요청 실패 (${response.status})`)
  }

  if (!contentType.includes('application/json')) {
    throw new Error(`${file}이 JSON이 아닌 응답을 반환했습니다.`)
  }

  const json = await response.json()
  if (!Array.isArray(json.items)) {
    throw new Error(`${file}의 items 배열을 찾지 못했습니다.`)
  }

  return json.items.map((item) => normalizeItem(item, category))
}

export async function loadDataIndex() {
  if (cachedIndex) return cachedIndex

  const settled = await Promise.allSettled(
    DATA_FILES.map(({ file, category }) => loadOneFile(file, category))
  )

  const failures = settled.filter((result) => result.status === 'rejected')
  failures.forEach((result) => console.error('[PinSeoul 데이터 오류]', result.reason))

  const loaded = settled
    .filter((result) => result.status === 'fulfilled')
    .flatMap((result) => result.value)

  if (loaded.length === 0) {
    throw new Error('지역 데이터 JSON 파일을 한 건도 불러오지 못했습니다.')
  }

  cachedIndex = loaded
  return cachedIndex
}

export function clearDataCache() {
  cachedIndex = null
}
