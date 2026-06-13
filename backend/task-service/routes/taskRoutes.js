import express from 'express'
import {
  createTask,
  getTasks,
  updateTask,
  deleteTask
} from '../Controllers/taskController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { rateLimit } from '../middleware/rateLimit.js'

const router = express.Router()

router.use(authMiddleware)
router.use(rateLimit)


router.post('/', createTask)
router.get('/', getTasks)
router.put('/:id', updateTask)
router.delete('/:id', deleteTask)

export default router
