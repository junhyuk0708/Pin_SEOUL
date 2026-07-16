# 챗봇 파트 연동 가이드

## 1. 파일 배치

```
localhub/
├─ public/
│  └─ data/
│     └─ seoul/
│        ├─ 서울_관광지.json
│        ├─ 서울_레포츠.json
│        ├─ 서울_문화시설.json
│        ├─ 서울_쇼핑.json
│        ├─ 서울_숙박.json
│        ├─ 서울_여행코스.json
│        ├─ 서울_축제공연행사.json
│        └─ 서울_음식점.json      # ← 아직 없음. 받으면 추가
├─ src/
│  ├─ services/
│  │  ├─ dataService.js          # 새로 추가
│  │  ├─ contextSelector.js      # 새로 추가
│  │  └─ chatService.js          # 새로 추가
│  └─ components/
│     └─ chatbot/
│        └─ ChatWidget.vue       # 새로 추가
└─ netlify/
   └─ functions/
      └─ chat.js                 # 새로 추가
```

JSON 원본 파일은 `public/data/seoul/` 아래에 그대로(수정 없이) 넣으면 됩니다.
공공누리 3유형은 "변경 금지" 조건이 있으므로, 원본 파일 자체는 절대 가공하지 말고
`dataService.js`가 런타임에 필요한 필드만 뽑아 쓰는 방식으로 되어 있습니다.

## 2. 서울_음식점.json 확보되면 할 일

`dataService.js`의 `DATA_FILES` 배열에서 아래 줄 주석만 해제하면 끝:

```js
{ file: '/data/seoul/서울_음식점.json', category: '음식점' },
```

## 3. Netlify Functions 설정

`netlify.toml`이 아직 없다면 프로젝트 루트에 추가 (박지우님 배포 설정과 겹칠 수 있으니 확인):

```toml
[build]
  functions = "netlify/functions"
  publish = "dist"
```

Netlify 대시보드 → Site settings → Environment variables 에 등록:

| Key | Value |
|---|---|
| `OPENAI_API_KEY` | 발급받은 OpenAI API 키 |

**주의**: `VITE_` 접두사를 붙이면 프론트엔드 번들에 노출되니 절대 붙이지 마세요.
로컬 개발 시에는 `netlify dev` 명령으로 Functions까지 함께 띄워서 테스트해야 합니다
(`npm run dev`만으로는 `/.netlify/functions/chat`이 동작하지 않음).

```bash
npm install -g netlify-cli   # 최초 1회
netlify dev
```

## 4. App.vue에 챗봇 위젯 추가

```vue
<script setup>
import ChatWidget from '@/components/chatbot/ChatWidget.vue'
</script>

<template>
  <router-view />
  <ChatWidget />
</template>
```

## 5. 게시판 검색 연동 (박지우님 게시판 구현 후)

`boardService.js`에 게시글 전체를 배열로 반환하는 함수가 있다면
(예: `export function getAllPosts() { return JSON.parse(localStorage.getItem('posts') || '[]') }`)
앱 진입 시점(main.js 또는 App.vue)에서 한 번만 연결해주면 챗봇이 게시글도 검색합니다:

```js
import { registerBoardSource } from '@/services/chatService'
import { getAllPosts } from '@/services/boardService'

registerBoardSource(getAllPosts)
```

연결 안 해도 챗봇 자체는 정상 동작합니다 (게시글 검색만 빠짐).

## 6. 테스트 체크리스트 (README 14번과 대응)

- [ ] 플로팅 버튼으로 챗봇 열고 닫기
- [ ] "홍대 근처 관광지 알려줘" → 관광지 카테고리 답변
- [ ] "이번 달 축제 뭐 있어" → 축제공연행사 답변
- [ ] 전혀 관련 없는 질문(예: "오늘 날씨 어때") → "제공된 데이터에서 찾을 수 없습니다" 응답 확인 (지어내지 않는지)
- [ ] OPENAI_API_KEY 없이 호출 시 500 에러 메시지가 사용자 친화적으로 뜨는지
- [ ] 느린 네트워크에서 15초 타임아웃 후 에러 메시지 뜨는지
- [ ] 모바일 너비에서 채팅창이 화면 밖으로 안 나가는지
