// import axios from 'axios'

// const AUTH_BASE_URL = `${import.meta.env.VITE_AUTH_SERVICE_URL}/auth` || 'http://localhost:4000/auth'

// export const signup = (data) =>
//   axios.post(`${AUTH_BASE_URL}/signup`, data)

// export const login = (data) =>
//   axios.post(`${AUTH_BASE_URL}/login`, data)


import axios from 'axios'

// SAME ORIGIN — goes to frontend LB → backend LB
const AUTH_BASE_URL = '/api/auth'

export const signup = (data) =>
  axios.post(`${AUTH_BASE_URL}/signup`, data)

export const login = (data) =>
  axios.post(`${AUTH_BASE_URL}/login`, data)
