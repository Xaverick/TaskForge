import { useState } from 'react'
import { login } from '../api/authapi'
import { useNavigate, Link } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await login({ email, password })
      localStorage.setItem('token', res.data.token)
      navigate('/tasks')
    } catch {
      alert('Invalid credentials')
    }
  }

  return (
    <div style={styles.container}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
        <button>Login</button>
      </form>
      <Link to="/signup">Create account</Link>
    </div>
  )
}

const styles = {
  container: { textAlign: 'center', marginTop: '100px' },
  form: { display: 'flex', flexDirection: 'column', gap: '10px', width: '300px', margin: 'auto' }
}
