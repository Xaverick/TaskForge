// import axios from 'axios'

// const TASK_BASE_URL = `${import.meta.env.VITE_TASK_SERVICE_URL}/tasks` || 'http://localhost:5000/tasks'

// const taskApi = axios.create({
//   baseURL: TASK_BASE_URL
// })

// taskApi.interceptors.request.use((config) => {
//   const token = localStorage.getItem('token')
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`
//   }
//   return config
// })

// export const getTasks = () => taskApi.get('/')
// export const createTask = (data) => taskApi.post('/', data)
// export const deleteTask = (id) => taskApi.delete(`/${id}`)
// export const updateTask = (id, data) => taskApi.put(`/${id}`, data)


import axios from 'axios'

// SAME ORIGIN — goes to frontend LB → backend LB
const taskApi = axios.create({
  baseURL: '/api/tasks'
})

taskApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const getTasks = () => taskApi.get('/')
export const createTask = (data) => taskApi.post('/', data)
export const deleteTask = (id) => taskApi.delete(`/${id}`)
export const updateTask = (id, data) => taskApi.put(`/${id}`, data)
