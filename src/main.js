import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { registerBoardSource } from './services/chatService'
import { getAllPosts } from './services/boardService'

// 챗봇이 게시글도 검색할 수 있도록 게시판 서비스 연결
registerBoardSource(getAllPosts)

createApp(App).use(router).mount('#app')
