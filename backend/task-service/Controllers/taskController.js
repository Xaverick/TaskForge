import Task from '../models/Task.js'
import redisClient from '../redis/client.js'

export const createTask = async (req, res) => {
  const task = await Task.create({
    ...req.body,
    userId: req.userId
  })

  await redisClient.del(`tasks:${req.userId}`)
  res.status(201).json(task)
}

export const getTasks = async (req, res) => {
  const cacheKey = `tasks:${req.userId}`

  const cached = await redisClient.get(cacheKey)
  if (cached) {
    return res.json(JSON.parse(cached))
  }

  const tasks = await Task.find({ userId: req.userId })
  await redisClient.set(cacheKey, JSON.stringify(tasks), { EX: 60 })

  res.json(tasks)
}

export const updateTask = async (req, res) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    req.body,
    { new: true }
  )

  await redisClient.del(`tasks:${req.userId}`)
  res.json(task)
}

export const deleteTask = async (req, res) => {
  await Task.findOneAndDelete({
    _id: req.params.id,
    userId: req.userId
  })

  await redisClient.del(`tasks:${req.userId}`)
  res.json({ message: 'Deleted' })
}
