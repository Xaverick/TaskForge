import { createClient } from 'redis'

const redisClient = createClient({
  url: process.env.REDIS_URL
})

redisClient.on('error', err => console.error('Redis Error', err))
redisClient.on('connect', () => console.log('Redis connected'))
redisClient.on('reconnecting', () => console.log('Redis reconnecting...'))

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect()
  }
}

export default redisClient