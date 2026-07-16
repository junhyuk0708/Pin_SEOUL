// src/services/contextSelector.js
// 사용자 질문과 관련된 데이터만 선별 (전체 JSON을 매번 프롬프트에 넣지 않기 위함)
// 임베딩/벡터DB 없이 "카테고리 키워드 매칭 + 텍스트 포함 여부" 로 가볍게 구현.
// 3일짜리 프로젝트 규모에는 이 정도 정확도로 충분하고, 토큰 비용도 예측 가능해짐.

const CATEGORY_KEYWORDS = {
  관광지: ['관광', '명소', '가볼만한', '여행지', '구경', '볼거리', '공원'],
  문화시설: ['박물관', '미술관', '전시', '공연장', '문화시설', '갤러리'],
  레포츠: ['레포츠', '액티비티', '체험', '스포츠', '운동'],
  쇼핑: ['쇼핑', '시장', '백화점', '아울렛', '살 곳', '살곳'],
  숙박: ['숙박', '호텔', '게스트하우스', '잘 곳', '잘곳', '묵을'],
  여행코스: ['코스', '루트', '여행코스', '일정 짜'],
  축제공연행사: ['축제', '공연', '행사', '페스티벌'],
  맛집: ['맛집', '음식점', '식당', '먹을', '맛있는', '메뉴'], // 데이터 확보되면 자동으로 매칭됨
}

/** 질문에서 어떤 카테고리를 묻는지 키워드로 추정. 여러 개 매칭될 수도, 0개일 수도 있음. */
function detectCategories(question) {
  return Object.entries(CATEGORY_KEYWORDS)
    .filter(([, keywords]) => keywords.some((kw) => question.includes(kw)))
    .map(([category]) => category)
}

/** 아주 단순한 토큰화: 조사/구두점 제거 후 2글자 이상 어절만 사용 */
function tokenize(question) {
  return question
    .replace(/[?!.,~]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
}

/**
 * @param {string} question 사용자 질문
 * @param {Array} index dataService.loadDataIndex() 결과
 * @param {{ limit?: number }} options
 * @returns {Array} 관련도 높은 순으로 정렬된 상위 N개 항목
 */
export function selectRelevantContext(question, index, { limit = 6 } = {}) {
  const categories = detectCategories(question)
  const tokens = tokenize(question)

  const candidates = categories.length > 0
    ? index.filter((item) => categories.includes(item.category))
    : index

  const scored = candidates
    .map((item) => {
      let score = 0
      const haystack = `${item.title} ${item.addr}`
      tokens.forEach((t) => {
        if (haystack.includes(t)) score += 1
      })
      if (categories.includes(item.category)) score += 1
      return { item, score }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item }) => item)

  // 텍스트 매칭이 하나도 없어도 카테고리 의도는 있는 경우
  // (완전히 빈 컨텍스트를 AI에게 넘기지 않기 위해 카테고리 상위 N개라도 반환)
  if (scored.length === 0 && categories.length > 0) {
    return candidates.slice(0, limit)
  }

  return scored
}

/** 게시글 배열에서도 동일한 방식으로 관련 글만 선별 (boardService의 posts 배열을 그대로 넣으면 됨) */
export function selectRelevantPosts(question, posts, { limit = 3 } = {}) {
  const tokens = tokenize(question)
  if (tokens.length === 0) return []

  return posts
    .map((post) => {
      const haystack = `${post.title} ${post.content}`
      const score = tokens.reduce((acc, t) => acc + (haystack.includes(t) ? 1 : 0), 0)
      return { post, score }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ post }) => post)
}
