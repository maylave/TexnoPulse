import express from 'express'
import {
	createUser,
	deleteUser,
	getUsers,
	login,
	register,
	updateUser
} from '../controllers/userController.js'

const router = express.Router()


router.post('/register', register)
router.post('/login', login)


router.get('/users', getUsers)

router.post('/users', createUser)
router.put('/users/:id', updateUser)
router.delete('/users/:id', deleteUser)

export default router