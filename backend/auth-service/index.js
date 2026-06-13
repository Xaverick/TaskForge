import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import authRoutes from './routes/authRoutes.js'
import cors from 'cors'

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
app.use('/api/auth', authRoutes)

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Auth DB connected')
    app.listen(process.env.PORT, () =>
      console.log(`Auth service running on ${process.env.PORT}`)
    )
  })
  .catch(console.error)
