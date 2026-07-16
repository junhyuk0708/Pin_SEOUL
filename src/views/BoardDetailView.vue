<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { deletePost, getPostById } from '@/services/boardService'

const props = defineProps({ id: String })
const router = useRouter()

const post = ref(null)
const notFound = ref(false)
const showDeleteModal = ref(false)
const deletePassword = ref('')
const deleteError = ref('')

onMounted(() => {
  const found = getPostById(props.id)
  if (!found) {
    notFound.value = true
    return
  }
  post.value = found
})

function goEdit() {
  router.push(`/board/${props.id}/edit`)
}

function confirmDelete() {
  deleteError.value = ''
  try {
    deletePost(props.id, deletePassword.value)
    router.push('/board')
  } catch (error) {
    deleteError.value = error.message
  }
}
</script>

<template>
  <section class="detail-page">
    <div v-if="notFound" class="empty-card">
      <strong>게시글을 찾을 수 없습니다.</strong>
      <button type="button" @click="router.push('/board')">게시판으로 돌아가기</button>
    </div>

    <article v-else-if="post" class="post-detail">
      <div class="post-heading">
        <span>LOCAL STORY</span>
        <h1>{{ post.title }}</h1>
        <p class="post-meta">
          작성일 {{ new Date(post.createdAt).toLocaleString('ko-KR') }}
          <span v-if="post.updatedAt !== post.createdAt">· 수정됨</span>
        </p>
      </div>

      <p class="post-content">{{ post.content }}</p>

      <div class="post-actions">
        <button type="button" @click="router.push('/board')">목록</button>
        <div>
          <button type="button" @click="goEdit">수정</button>
          <button type="button" class="danger" @click="showDeleteModal = true">삭제</button>
        </div>
      </div>
    </article>

    <div v-if="showDeleteModal" class="modal-backdrop" @click.self="showDeleteModal = false">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
        <h3 id="delete-modal-title">비밀번호 확인</h3>
        <p>글 작성 시 입력한 비밀번호를 입력해주세요.</p>
        <input
          v-model="deletePassword"
          type="password"
          placeholder="비밀번호"
          @keyup.enter="confirmDelete"
        />
        <p v-if="deleteError" class="error">{{ deleteError }}</p>
        <div class="modal-actions">
          <button type="button" @click="showDeleteModal = false">취소</button>
          <button type="button" class="danger solid" @click="confirmDelete">삭제</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.detail-page {
  max-width: 860px;
  margin: 18px auto 0;
}

.post-detail {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 22px;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.post-heading {
  padding: 28px 30px 24px;
  border-bottom: 1px solid var(--border);
  background:
    radial-gradient(circle at 90% 0%, rgba(139, 92, 246, 0.11), transparent 32%),
    var(--surface-muted);
}

.post-heading > span {
  color: var(--primary);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.15em;
}

.post-heading h1 {
  margin: 9px 0 0;
  color: var(--text-primary);
  font-size: 29px;
  line-height: 1.35;
  letter-spacing: -0.035em;
}

.post-meta {
  margin: 11px 0 0;
  color: var(--text-tertiary);
  font-size: 11px;
}

.post-content {
  min-height: 220px;
  margin: 0;
  padding: 30px;
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.85;
  white-space: pre-wrap;
  word-break: break-word;
}

.post-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 30px;
  border-top: 1px solid var(--border);
}

.post-actions > div {
  display: flex;
  gap: 8px;
}

.post-actions button,
.modal-actions button,
.empty-card button {
  padding: 8px 14px;
  border: 1px solid var(--border-strong);
  border-radius: 9px;
  background: var(--surface);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
}

.post-actions button:hover,
.modal-actions button:hover,
.empty-card button:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.danger {
  border-color: rgba(216, 75, 75, 0.28) !important;
  color: var(--danger) !important;
}

.danger.solid {
  background: var(--danger);
  color: #fff !important;
}

.empty-card {
  display: flex;
  min-height: 260px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 15px;
  border: 1px dashed var(--border-strong);
  border-radius: 20px;
  background: var(--surface);
  color: var(--text-primary);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(4, 8, 18, 0.58);
  backdrop-filter: blur(5px);
}

.modal {
  width: min(100%, 340px);
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--surface);
  box-shadow: var(--shadow-md);
}

.modal h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 18px;
}

.modal > p:not(.error) {
  margin: 8px 0 0;
  color: var(--text-secondary);
  font-size: 12px;
}

.modal input {
  width: 100%;
  margin: 17px 0 0;
  padding: 10px 11px;
  border: 1px solid var(--border-strong);
  border-radius: 10px;
  background: var(--surface-muted);
  color: var(--text-primary);
}

.modal input::placeholder {
  color: var(--text-tertiary);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
}

.error {
  margin: 8px 0 0;
  color: var(--danger);
  font-size: 11px;
}

@media (max-width: 560px) {
  .post-heading,
  .post-content,
  .post-actions {
    padding-right: 20px;
    padding-left: 20px;
  }

  .post-actions {
    align-items: stretch;
    flex-direction: column-reverse;
  }

  .post-actions > div {
    justify-content: flex-end;
  }
}
</style>
