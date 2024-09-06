// src/routes/userRoutes.js
import { getUser, register, updateUser, deleteUser, getAllUsers } from '../controllers/userController.js';
// import { verifyJwt } from '../middleware/authMiddleware.js';

export default async function (server) {
  server.post('/register', register);
  server.get('/users/:id', { onRequest: [server.authenticate] }, getUser);
  server.get('/users', { onRequest: [server.authenticate] },  getAllUsers);
  server.put('/users/:id', { onRequest: [server.authenticate] }, updateUser);
  server.delete('/users/:id', { onRequest: [server.authenticate] }, deleteUser);
}

