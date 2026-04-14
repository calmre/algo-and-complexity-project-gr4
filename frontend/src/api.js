import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:8000' })

// Add token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const getTasks = (view, date) =>
  api.get('/tasks', { params: { view, date: date?.toISOString() } }).then(r => r.data)

export const getAllTasks = () =>
  api.get('/tasks/all').then(r => r.data)

export const createTask = (task) =>
  api.post('/tasks', task).then(r => r.data)

export const updateTask = (id, data) =>
  api.patch(`/tasks/${id}`, data).then(r => r.data)

export const deleteTask = (id) =>
  api.delete(`/tasks/${id}`).then(r => r.data)

export const getCategories = () =>
  api.get('/categories').then(r => r.data)

export const transcribeVoice = (audioBlob) => {
  const form = new FormData()
  form.append('audio', audioBlob, 'recording.wav')
  return api.post('/voice/transcribe', form).then(r => r.data)
}
