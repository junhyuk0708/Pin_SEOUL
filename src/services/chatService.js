import { loadDataIndex } from './dataService'
import { selectRelevantContext, selectRelevantPosts } from './contextSelector'

const CHAT_ENDPOINT = '/.netlify/functions/chat'
const MAX_HISTORY_MESSAGES = 6

let getAllPosts = () => []
export function registerBoardSource(fn) {
  getAllPosts = fn
}

export async function sendChatMessage(question, history = []) {
  const normalizedQuestion = question?.trim()
  if (!normalizedQuestion) throw new Error('질문을 입력해주세요.')

  const dataIndex = await loadDataIndex()
  const relevantData = selectRelevantContext(normalizedQuestion, dataIndex, { limit: 6 })

  let relevantPosts = []
  try {
    relevantPosts = selectRelevantPosts(normalizedQuestion, getAllPosts(), { limit: 3 })
  } catch (error) {
    console.warn('게시글 검색 실패:', error)
  }

  const context = [
    ...relevantData.map((item) => ({
      type: 'poi',
      title: item.title,
      category: item.category,
      addr: item.addr,
      tel: item.tel,
      eventStart: item.eventStart,
      eventEnd: item.eventEnd,
      eventPlace: item.eventPlace,
    })),
    ...relevantPosts.map((post) => ({
      type: 'post',
      title: post.title,
      content: (post.content || '').slice(0, 200),
    })),
  ]

  // UI가 현재 질문을 이미 history에 추가한 경우 중복 전송하지 않습니다.
  const priorHistory = history
    .filter((message, index, array) => {
      const isLast = index === array.length - 1
      return !(isLast && message.role === 'user' && message.content?.trim() === normalizedQuestion)
    })
    .slice(-MAX_HISTORY_MESSAGES)
    .map((message) => ({ role: message.role, content: message.content }))

  let response
  try {
    response = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: normalizedQuestion,
        context,
        history: priorHistory,
      }),
    })
  } catch {
    throw new Error('네트워크 연결을 확인해주세요.')
  }

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error(
      '챗봇 서버 함수를 찾지 못했습니다. 로컬에서는 npm run dev 대신 netlify dev를 사용하고, 배포 환경에서는 netlify/functions/chat.js가 포함됐는지 확인해주세요.'
    )
  }

  const payload = await response.json()
  if (!response.ok) {
    throw new Error(payload.error || '챗봇 응답을 가져오지 못했습니다.')
  }

  if (!payload.answer) {
    throw new Error('챗봇 응답 형식이 올바르지 않습니다.')
  }

  return payload.answer
}
