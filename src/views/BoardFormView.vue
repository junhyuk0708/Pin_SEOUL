<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { createPost, getPostById, updatePost } from '@/services/boardService'

const props = defineProps({ id: String })
const router = useRouter()
const isEditMode = computed(() => !!props.id)

const title = ref('')
const content = ref('')
const password = ref('')
const errorMessage = ref('')

onMounted(() => {
  if (isEditMode.value) {
    const post = getPostById(props.id)
    if (!post) {
      errorMessage.value = '게시글을 찾을 수 없습니다.'
      return
    }
    title.value = post.title
    content.value = post.content
  }
})

function handleSubmit() {
  errorMessage.value = ''

  try {
    if (isEditMode.value) {
      updatePost(props.id, {
        title: title.value,
        content: content.value,
        password: password.value,
      })
      router.push(`/board/${props.id}`)
    } else {
      const newId = createPost({
        title: title.value,
        content: content.value,
        password: password.value,
      })
      router.push(`/board/${newId}`)
    }
  } catch (error) {
    errorMessage.value = error.message
  }
}
</script>

<template>
  <section class="form-page">
    <div class="form-heading">
      <p>LOCAL COMMUNITY</p>
      <h1>{{ isEditMode ? '게시글 수정' : '게시글 작성' }}</h1>
      <span>
        {{ isEditMode ? '작성한 내용을 수정하고 비밀번호로 확인해주세요.' : '서울에 관한 정보와 경험을 자유롭게 공유해보세요.' }}
      </span>
    </div>

    <form class="post-form" @submit.prevent="handleSubmit">
      <label>
        <span>제목</span>
        <input
          v-model="title"
          type="text"
          required
          maxlength="100"
          placeholder="게시글 제목을 입력해주세요"
        />
      </label>

      <label>
        <span>내용</span>
        <textarea
          v-model="content"
          rows="10"
          required
          placeholder="장소 추천, 여행 후기, 질문 등 서울에 관한 이야기를 작성해주세요."
        ></textarea>
      </label>

      <label>
        <span>비밀번호 {{ isEditMode ? '(수정 확인용)' : '(수정·삭제 시 필요)' }}</span>
        <input
          v-model="password"
          type="password"
          required
          placeholder="비밀번호를 입력해주세요"
        />
      </label>

      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

      <div class="form-actions">
        <button type="button" @click="router.back()">취소</button>
        <button type="submit" class="btn-primary">
          {{ isEditMode ? '수정 완료' : '작성 완료' }}
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.form-page {
  max-width: 780px;
  margin: 18px auto 0;
}

.form-heading {
  margin-bottom: 23px;
}

.form-heading p {
  margin: 0;
  color: var(--primary);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.15em;
}

.form-heading h1 {
  margin: 7px 0 0;
  color: var(--text-primary);
  font-size: 34px;
  letter-spacing: -0.04em;
}

.form-heading span {
  display: block;
  margin-top: 8px;
  color: var(--text-secondary);
  font-size: 13px;
}

.post-form {
  display: flex;
  flex-direction: column;
  gap: 19px;
  padding: 28px;
  border: 1px solid var(--border);
  border-radius: 22px;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

label {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label > span {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 750;
}

input,
textarea {
  width: 100%;
  padding: 11px 12px;
  border: 1px solid var(--border-strong);
  border-radius: 11px;
  background: var(--surface-muted);
  color: var(--text-primary);
  font-size: 13px;
  line-height: 1.6;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

textarea {
  min-height: 230px;
  resize: vertical;
}

input::placeholder,
textarea::placeholder {
  color: var(--text-tertiary);
}

input:focus,
textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(56, 103, 244, 0.1);
  outline: none;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  padding-top: 4px;
}

.form-actions button {
  padding: 9px 16px;
  border: 1px solid var(--border-strong);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12px;
  font-weight: 750;
}

.form-actions .btn-primary {
  border-color: var(--primary);
  background: var(--primary);
  color: var(--primary-contrast);
  box-shadow: var(--shadow-primary);
}

.error {
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(216, 75, 75, 0.08);
  color: var(--danger);
  font-size: 12px;
}

@media (max-width: 560px) {
  .post-form {
    padding: 20px;
    border-radius: 18px;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .form-actions button {
    width: 100%;
  }
}
</style>
