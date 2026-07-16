<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { getAllPosts } from '@/services/boardService'

const posts = ref([])

onMounted(() => {
  posts.value = getAllPosts().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})
</script>

<template>
  <section class="board-page">
    <div class="board-header">
      <div>
        <p class="board-kicker">LOCAL COMMUNITY</p>
        <h1>게시판</h1>
        <p>서울의 장소와 여행 정보를 자유롭게 나눠보세요.</p>
      </div>
      <RouterLink to="/board/new" class="btn-primary">글쓰기</RouterLink>
    </div>

    <div v-if="posts.length === 0" class="empty-card">
      <span aria-hidden="true">✎</span>
      <strong>아직 게시글이 없습니다.</strong>
      <p>첫 번째 서울 이야기를 남겨보세요.</p>
    </div>

    <ul v-else class="post-list">
      <li v-for="post in posts" :key="post.id">
        <RouterLink :to="`/board/${post.id}`">
          <div>
            <span class="post-title">{{ post.title }}</span>
            <span class="post-preview">{{ post.content }}</span>
          </div>
          <span class="post-date">{{ new Date(post.createdAt).toLocaleDateString('ko-KR') }}</span>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.board-page {
  max-width: 900px;
  margin: 18px auto 0;
}

.board-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.board-kicker {
  margin: 0;
  color: var(--primary);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.15em;
}

.board-header h1 {
  margin: 7px 0 0;
  color: var(--text-primary);
  font-size: 34px;
  letter-spacing: -0.04em;
}

.board-header p:not(.board-kicker) {
  margin: 8px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.btn-primary {
  flex: 0 0 auto;
  padding: 10px 17px;
  border: 1px solid var(--primary);
  border-radius: 11px;
  background: var(--primary);
  color: var(--primary-contrast);
  text-decoration: none;
  font-size: 13px;
  font-weight: 750;
  box-shadow: var(--shadow-primary);
}

.empty-card {
  display: flex;
  min-height: 260px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  border: 1px dashed var(--border-strong);
  border-radius: 20px;
  background: var(--surface);
  color: var(--text-secondary);
  text-align: center;
}

.empty-card > span {
  display: grid;
  width: 52px;
  height: 52px;
  place-items: center;
  margin-bottom: 14px;
  border-radius: 16px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 22px;
}

.empty-card strong {
  color: var(--text-primary);
  font-size: 15px;
}

.empty-card p {
  margin: 7px 0 0;
  font-size: 12px;
}

.post-list {
  overflow: hidden;
  padding: 0;
  margin: 0;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  list-style: none;
}

.post-list li + li {
  border-top: 1px solid var(--border);
}

.post-list a {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 18px 20px;
  color: var(--text-primary);
  text-decoration: none;
  transition: background-color 0.18s ease;
}

.post-list a:hover {
  background: var(--surface-muted);
}

.post-list a > div {
  min-width: 0;
}

.post-title,
.post-preview {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-title {
  font-size: 14px;
  font-weight: 750;
}

.post-preview {
  margin-top: 6px;
  color: var(--text-tertiary);
  font-size: 11px;
}

.post-date {
  flex: 0 0 auto;
  color: var(--text-tertiary);
  font-size: 11px;
}

@media (max-width: 560px) {
  .board-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .post-list a {
    align-items: flex-start;
    flex-direction: column;
    gap: 9px;
  }
}
</style>
