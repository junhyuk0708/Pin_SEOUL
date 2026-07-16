// src/services/dataService.js
// 서울 지역 공공데이터(TourAPI 4.0) 로드 및 정규화
// 원본 파일은 public/data/seoul/ 아래에 위치한다고 가정 (프로젝트 구조에 맞게 경로 조정)

const DATA_FILES = [
  { file: '/data/seoul/서울_관광지.json', category: '관광지' },
  { file: '/data/seoul/서울_문화시설.json', category: '문화시설' },
  { file: '/data/seoul/서울_레포츠.json', category: '레포츠' },
  { file: '/data/seoul/서울_쇼핑.json', category: '쇼핑' },
  { file: '/data/seoul/서울_숙박.json', category: '숙박' },
  { file: '/data/seoul/서울_여행코스.json', category: '여행코스' },
  { file: '/data/seoul/서울_축제공연행사.json', category: '축제공연행사' },
  // TODO: 서울_음식점.json (진짜 TourAPI 데이터) 받으면 아래 두 줄을 교체할 것
  // 지금은 화면/챗봇 개발 테스트용 목업 데이터(서울_음식점_MOCK.json)를 임시로 연결해둠.
  // 목업 데이터는 실제 공공데이터가 아니므로 최종 제출 전 반드시 교체 필요.
  { file: '/data/seoul/서울_음식점_MOCK.json', category: '음식점' },
  // { file: '/data/seoul/서울_음식점.json', category: '음식점' },
]

let cachedIndex = null

/**
 * TourAPI 원본 item을 챗봇/지도에서 쓰기 쉬운 형태로 정규화.
 * 원본 필드를 변형하지 않고 "추려서" 새 객체를 만드는 것이므로
 * 공공누리 3유형(변경금지) 조건과 충돌하지 않음 — 원본 파일 자체는 그대로 유지.
 */
function normalizeItem(raw, category) {
  return {
    id: raw.contentid,
    title: raw.title || '',
    category,
    addr: [raw.addr1, raw.addr2].filter(Boolean).join(' ').trim(),
    tel: raw.tel || '',
    lat: raw.mapy ? parseFloat(raw.mapy) : null,
    lng: raw.mapx ? parseFloat(raw.mapx) : null,
    image: raw.firstimage || '',
    // 축제공연행사 전용 필드 (다른 카테고리는 null)
    eventStart: raw.eventstartdate || null,
    eventEnd: raw.eventenddate || null,
    eventPlace: raw.eventplace || null,
  }
}

/**
 * 전체 데이터 인덱스를 로드(최초 1회만 fetch, 이후 캐시 재사용).
 * 지도 컴포넌트(이영준님 파트)에서도 동일 함수를 재사용할 수 있음.
 */
export async function loadDataIndex() {
  if (cachedIndex) return cachedIndex

  const results = await Promise.all(
    DATA_FILES.map(async ({ file, category }) => {
      const res = await fetch(file)
      if (!res.ok) {
        console.error(`데이터 로드 실패: ${file} (${res.status})`)
        return []
      }
      const json = await res.json()
      return (json.items || []).map((item) => normalizeItem(item, category))
    })
  )

  cachedIndex = results.flat()
  return cachedIndex
}

/** 캐시 무효화 (테스트/디버깅용) */
export function clearDataCache() {
  cachedIndex = null
}
