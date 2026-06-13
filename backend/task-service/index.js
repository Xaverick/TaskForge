import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cors from 'cors'
import taskRoutes from './routes/taskRoutes.js'

dotenv.config()
const app = express()

app.use(cors(
  {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
))

app.use(express.json())
app.use('/api/tasks', taskRoutes)


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Task DB connected')
    app.listen(process.env.PORT, () =>
      console.log(`Task service running on ${process.env.PORT}`)
    )
  })
  .catch(console.error)
clearImmediate