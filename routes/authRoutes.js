import { login, logout,refresh } from '../controllers/authController.js';

const loginSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string' },
      password: { type: 'string' }
    }
  }
};



export default async function (server) {
  server.post('/login', { schema: loginSchema }, login);

  server.get('/logout',  logout);

  server.post('/refresh',  refresh);

  server.get('/protected', { onRequest: [server.authenticate, server.checkRole('admin')] }, async (request, reply) => {
    return { message: 'This is a protected route' };
  });
}
