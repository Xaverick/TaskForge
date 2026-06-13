import { useState } from 'react'
import { signup } from '../api/authapi'
import { useNavigate, Link } from 'react-router-dom'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await signup({ email, password })
      navigate('/login')
    } catch {
      alert('Signup failed')
    }
  }

  return (
    <div style={styles.container}>
      <h2>Signup</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
        <button>Signup</button>
      </form>
      <Link to="/login">Back to login</Link>
    </div>
  )
}

const styles = {
  container: { textAlign: 'center', marginTop: '100px' },
  form: { display: 'flex', flexDirection: 'column', gap: '10px', width: '300px', margin: 'auto' }
}
