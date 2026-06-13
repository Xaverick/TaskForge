import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cors from 'cors'
import taskRoutes from './routes/taskRoutes.js'
import redisClient, { connectRedis } from './redis/client.js'

dotenv.config()
const app = express()

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['*']

app.use(cors({
  origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())

// Health/readiness endpoints for K8s probes
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }))

app.get('/ready', (req, res) => {
  const dbState = mongoose.connection.readyState // 1 = connected
  const redisReady = redisClient.isReady

  if (dbState === 1 && redisReady) {
    return res.status(200).json({ status: 'ready' })
  }
  res.status(503).json({ status: 'not ready', dbState, redisReady })
})

app.use('/api/tasks', taskRoutes)

const start = async () => {
  try {
    await connectRedis()
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Task DB connected')

    const server = app.listen(process.env.PORT, () =>
      console.log(`Task service running on ${process.env.PORT}`)
    )

    // Graceful shutdown
    const shutdown = (signal) => {
      console.log(`${signal} received, shutting down gracefully`)
      server.close(async () => {
        await redisClient.quit()
        mongoose.connection.close(false, () => {
          console.log('MongoDB connection closed')
          process.exit(0)
        })
      })

      setTimeout(() => {
        console.error('Forced shutdown after timeout')
        process.exit(1)
      }, 10000)
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))
  } catch (err) {
    console.error('Startup error:', err)
    process.exit(1)
  }
}

start()