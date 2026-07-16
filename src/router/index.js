import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import BoardListView from '@/views/BoardListView.vue'
import BoardDetailView from '@/views/BoardDetailView.vue'
import BoardFormView from '@/views/BoardFormView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/board', name: 'board-list', component: BoardListView },
    { path: '/board/new', name: 'board-new', component: BoardFormView },
    { path: '/board/:id', name: 'board-detail', component: BoardDetailView, props: true },
    { path: '/board/:id/edit', name: 'board-edit', component: BoardFormView, props: true },
  ],
})

export default router
