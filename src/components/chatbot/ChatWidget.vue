<template>
  <div class="chat-widget">
    <button
      class="chat-fab"
      type="button"
      @click="isOpen = !isOpen"
      :aria-label="isOpen ? '챗봇 닫기' : '챗봇 열기'"
    >
      {{ isOpen ? '✕' : '💬' }}
    </button>

    <div v-if="isOpen" class="chat-panel">
      <header class="chat-header">
        <div>
          <span class="chat-status" aria-hidden="true"></span>
          <span>PinSeoul AI</span>
        </div>
        <button type="button" class="chat-close" @click="isOpen = false" aria-label="닫기">✕</button>
      </header>

      <div ref="messageListEl" class="chat-messages">
        <div v-if="messages.length === 0" class="chat-empty">
          <span class="chat-empty-icon" aria-hidden="true">⌖</span>
          <strong>서울에서 어디로 가볼까요?</strong>
          <p>관광지, 문화시설, 축제와 게시글에 대해 물어보세요.</p>
        </div>

        <div v-for="(msg, i) in messages" :key="i" :class="['chat-bubble', msg.role]">
          {{ msg.content }}
        </div>

        <div v-if="isLoading" class="chat-bubble assistant loading">답변 작성 중...</div>
        <p v-if="errorMessage" class="chat-error">{{ errorMessage }}</p>
      </div>

      <form class="chat-input-row" @submit.prevent="handleSubmit">
        <input
          v-model="draft"
          type="text"
          placeholder="예) 홍대 근처 가볼 만한 곳 추천해줘"
          :disabled="isLoading"
        />
        <button type="submit" :disabled="isLoading || !draft.trim()">전송</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { nextTick, ref } from 'vue'
import { sendChatMessage } from '@/services/chatService'

const isOpen = ref(false)
const draft = ref('')
const messages = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const messageListEl = ref(null)

async function scrollToBottom() {
  await nextTick()
  if (messageListEl.value) {
    messageListEl.value.scrollTop = messageListEl.value.scrollHeight
  }
}

async function handleSubmit() {
  const question = draft.value.trim()
  if (!question || isLoading.value) return

  errorMessage.value = ''
  messages.value.push({ role: 'user', content: question })
  draft.value = ''
  isLoading.value = true
  await scrollToBottom()

  try {
    const answer = await sendChatMessage(question, messages.value)
    messages.value.push({ role: 'assistant', content: answer })
  } catch (error) {
    errorMessage.value =
      error.message || '챗봇 응답 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  } finally {
    isLoading.value = false
    await scrollToBottom()
  }
}
</script>

<style scoped>
.chat-widget {
  position: fixed;
  right: 22px;
  bottom: 22px;
  z-index: 1000;
}

.chat-fab {
  width: 58px;
  height: 58px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 19px 19px 19px 7px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: #fff;
  font-size: 21px;
  cursor: pointer;
  box-shadow: 0 14px 32px rgba(56, 103, 244, 0.34);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.chat-fab:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 18px 38px rgba(56, 103, 244, 0.4);
}

.chat-panel {
  position: fixed;
  right: 22px;
  bottom: 94px;
  display: flex;
  width: 350px;
  max-width: calc(100vw - 44px);
  height: 480px;
  max-height: calc(100vh - 140px);
  overflow: hidden;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--surface);
  box-shadow: var(--shadow-md);
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 17px;
  border-bottom: 1px solid var(--border);
  background:
    radial-gradient(circle at 85% 10%, rgba(139, 92, 246, 0.16), transparent 34%),
    var(--surface);
  color: var(--text-primary);
  font-weight: 800;
}

.chat-header > div {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--success);
  box-shadow: 0 0 0 5px rgba(22, 163, 106, 0.11);
}

.chat-close {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--surface-muted);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12px;
}

.chat-messages {
  display: flex;
  flex: 1;
  overflow-y: auto;
  flex-direction: column;
  gap: 9px;
  padding: 16px;
  background: var(--surface-muted);
}

.chat-empty {
  display: flex;
  align-items: center;
  flex-direction: column;
  margin: auto 0;
  padding: 28px 18px;
  color: var(--text-secondary);
  text-align: center;
}

.chat-empty-icon {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  margin-bottom: 13px;
  border-radius: 15px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 22px;
}

.chat-empty strong {
  color: var(--text-primary);
  font-size: 15px;
}

.chat-empty p {
  margin: 7px 0 0;
  font-size: 12px;
  line-height: 1.6;
}

.chat-bubble {
  max-width: 82%;
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: 13px;
  font-size: 13px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}

.chat-bubble.user {
  align-self: flex-end;
  border-color: var(--primary);
  border-bottom-right-radius: 4px;
  background: var(--primary);
  color: var(--primary-contrast);
}

.chat-bubble.assistant {
  align-self: flex-start;
  border-bottom-left-radius: 4px;
  background: var(--surface);
  color: var(--text-primary);
}

.chat-bubble.loading {
  opacity: 0.65;
}

.chat-error {
  margin: 0;
  padding: 8px 10px;
  border-radius: 9px;
  background: rgba(216, 75, 75, 0.08);
  color: var(--danger);
  font-size: 12px;
}

.chat-input-row {
  display: flex;
  gap: 8px;
  padding: 11px;
  border-top: 1px solid var(--border);
  background: var(--surface);
}

.chat-input-row input {
  min-width: 0;
  flex: 1;
  padding: 10px 11px;
  border: 1px solid var(--border-strong);
  border-radius: 10px;
  background: var(--surface-muted);
  color: var(--text-primary);
  font-size: 12px;
}

.chat-input-row input::placeholder {
  color: var(--text-tertiary);
}

.chat-input-row button {
  padding: 9px 14px;
  border: 1px solid var(--primary);
  border-radius: 10px;
  background: var(--primary);
  color: var(--primary-contrast);
  cursor: pointer;
  font-size: 12px;
  font-weight: 750;
}

.chat-input-row button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 430px) {
  .chat-panel {
    right: 10px;
    left: 10px;
    width: auto;
  }

  .chat-widget {
    right: 12px;
    bottom: 12px;
  }

  .chat-fab {
    width: 54px;
    height: 54px;
  }
}
</style>
