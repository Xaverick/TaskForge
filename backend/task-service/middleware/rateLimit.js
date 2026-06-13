import redisClient from '../redis/client.js'

const WINDOW_SECONDS = 60
const MAX_REQUESTS = 100

export const rateLimit = async (req, res, next) => {
  const key = `rate:${req.userId}`

  const current = await redisClient.incr(key)

  if (current === 1) {
    await redisClient.expire(key, WINDOW_SECONDS)
  }

  if (current > MAX_REQUESTS) {
    return res.status(429).json({
      message: 'Too many requests. Please slow down.'
    })
  }

  next()
}
