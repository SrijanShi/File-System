import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const authAPI = {
  signup:     (data)          => api.post('/auth/signup', data),
  login:      (data)          => api.post('/auth/login', data),
  logout:     ()              => api.post('/auth/logout'),
  sendOtp:    (data)          => api.post('/auth/otp/send', data),
  verifyOtp:  (data)          => api.post('/auth/otp/verify', data),
}

export const foldersAPI = {
  getRoot:     ()           => api.get('/folders'),
  getFolder:   (id)         => api.get(`/folders/${id}`),
  getChildren: (id)         => api.get(`/folders/${id}/children`),
  create:      (form)       => api.post('/folders', form),
  update:      (id, form)   => api.patch(`/folders/${id}`, form),
  remove:      (id)         => api.delete(`/folders/${id}`),
}

export const imagesAPI = {
  upload:      (form)       => api.post('/images/upload', form),
  getByFolder: (folderId)   => api.get(`/images/folder/${folderId}`),
  remove:      (id)         => api.delete(`/images/${id}`),
}

export default api
