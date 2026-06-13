import { useEffect, useState } from 'react'
import { getTasks, createTask, deleteTask, updateTask } from '../api/taskApi'
import { useNavigate } from 'react-router-dom'

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const navigate = useNavigate()

  const fetchTasks = async () => {
    const res = await getTasks()
    setTasks(res.data)
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const addTask = async () => {
    if (!title) return
    await createTask({ title })
    setTitle('')
    fetchTasks()
  }

  const toggleTask = async (task) => {
    await updateTask(task._id, { completed: !task.completed })
    fetchTasks()
  }

  const removeTask = async (id) => {
    await deleteTask(id)
    fetchTasks()
  }

  const logout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div style={styles.container}>
      <h2>My Tasks</h2>

      <div>
        <input
          placeholder="New task"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <button onClick={addTask}>Add</button>
      </div>

      <ul style={styles.list}>
        {tasks.map(task => (
          <li key={task._id} style={styles.item}>
            <span
              onClick={() => toggleTask(task)}
              style={{
                textDecoration: task.completed ? 'line-through' : 'none',
                cursor: 'pointer'
              }}
            >
              {task.title}
            </span>
            <button onClick={() => removeTask(task._id)}>❌</button>
          </li>
        ))}
      </ul>

      <button onClick={logout}>Logout</button>
    </div>
  )
}

const styles = {
  container: { width: '400px', margin: '50px auto', textAlign: 'center' },
  list: { listStyle: 'none', padding: 0 },
  item: { display: 'flex', justifyContent: 'space-between', margin: '10px 0' }
}
