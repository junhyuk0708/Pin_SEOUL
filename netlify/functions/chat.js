// netlify/functions/chat.js
// OpenAI API 키는 여기(서버 환경변수)에서만 사용됨 — 프론트엔드 코드에는 절대 노출 안 됨.
// Netlify 배포 시 Site settings > Environment variables 에 OPENAI_API_KEY 등록 필요.

const OPENAI_TIMEOUT_MS = 15000
const MODEL = 'gpt-5-mini' // 강사님이 배포한 API 키에서 허용된 모델

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: '허용되지 않은 요청 방식입니다.' })
  }

  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return jsonResponse(400, { error: '잘못된 요청 형식입니다.' })
  }

  const { question, context = [], history = [] } = payload

  if (!question || typeof question !== 'string' || !question.trim()) {
    return jsonResponse(400, { error: '질문이 비어 있습니다.' })
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY 환경변수가 설정되지 않았습니다.')
    return jsonResponse(500, { error: '서버 설정 오류입니다. 관리자에게 문의해주세요.' })
  }

  const systemPrompt = buildSystemPrompt(context)

  const messages = [
    { role: 'system', content: systemPrompt },
    ...sanitizeHistory(history),
    { role: 'user', content: question },
  ]

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS)

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_completion_tokens: 2000,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errText = await response.text()
      console.error('OpenAI API error:', response.status, errText)
      return jsonResponse(502, { error: 'AI 응답 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' })
    }

    const data = await response.json()
    console.log('OpenAI raw response:', JSON.stringify(data, null, 2))
    const answer = data.choices?.[0]?.message?.content?.trim() || '답변을 생성하지 못했습니다.'

    return jsonResponse(200, { answer })
  } catch (err) {
    clearTimeout(timeoutId)

    if (err.name === 'AbortError') {
      return jsonResponse(504, { error: '응답 시간이 초과되었습니다. 다시 시도해주세요.' })
    }
    console.error('Netlify function error:', err)
    return jsonResponse(500, { error: '서버 오류가 발생했습니다.' })
  }
}

function buildSystemPrompt(context) {
  return [
    '당신은 LocalHub 서비스의 서울 지역정보 안내 챗봇입니다.',
    '아래 [제공 데이터]에 있는 정보만 근거로 답변하세요.',
    '[제공 데이터]에 없는 내용은 "제공된 데이터에서 찾을 수 없습니다"라고 솔직히 답하고, 절대 정보를 지어내지 마세요.',
    '답변은 간결하고 친절한 한국어로, 3~4문장 이내로 작성하세요.',
    '',
    '[제공 데이터]',
    JSON.stringify(context),
  ].join('\n')
}

/** history는 클라이언트가 보낸 값이므로 role/content 외 필드는 무시하고 형식만 검증 */
function sanitizeHistory(history) {
  if (!Array.isArray(history)) return []
  return history
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }))
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}
