// src/services/boardService.js
// 익명 게시판 CRUD. 회원가입/로그인 없이 비밀번호로만 수정·삭제 권한 확인.
// README 경고대로 비밀번호는 암호화하지 않음 (교육용 요구사항).

const STORAGE_KEY = 'localhub_posts'

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    console.error('게시글 로드 실패:', e)
    return []
  }
}

function writeAll(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
}

/** 챗봇 데이터 선별 로직에서도 사용 (title/content만 노출, 비밀번호는 제외) */
export function getAllPosts() {
  return readAll().map(({ password, ...rest }) => rest)
}

export function getPostById(id) {
  const post = readAll().find((p) => p.id === id)
  if (!post) return null
  const { password, ...rest } = post
  return rest
}

export function createPost({ title, content, password }) {
  if (!title?.trim() || !content?.trim() || !password?.trim()) {
    throw new Error('제목, 내용, 비밀번호를 모두 입력해주세요.')
  }
  const posts = readAll()
  const now = new Date().toISOString()
  const newPost = {
    id: crypto.randomUUID(),
    title: title.trim(),
    content: content.trim(),
    password,
    createdAt: now,
    updatedAt: now,
  }
  posts.unshift(newPost)
  writeAll(posts)
  return newPost.id
}

/** 비밀번호 일치 여부만 확인 (실제 값은 반환하지 않음) */
export function verifyPassword(id, password) {
  const post = readAll().find((p) => p.id === id)
  if (!post) throw new Error('게시글을 찾을 수 없습니다.')
  return post.password === password
}

export function updatePost(id, { title, content, password }) {
  const posts = readAll()
  const idx = posts.findIndex((p) => p.id === id)
  if (idx === -1) throw new Error('게시글을 찾을 수 없습니다.')
  if (posts[idx].password !== password) throw new Error('비밀번호가 일치하지 않습니다.')

  posts[idx] = {
    ...posts[idx],
    title: title.trim(),
    content: content.trim(),
    updatedAt: new Date().toISOString(),
  }
  writeAll(posts)
}

export function deletePost(id, password) {
  const posts = readAll()
  const target = posts.find((p) => p.id === id)
  if (!target) throw new Error('게시글을 찾을 수 없습니다.')
  if (target.password !== password) throw new Error('비밀번호가 일치하지 않습니다.')

  writeAll(posts.filter((p) => p.id !== id))
}
