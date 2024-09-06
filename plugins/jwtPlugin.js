import FastifyJwt from '@fastify/jwt';
import fp from 'fastify-plugin';

export default fp(async (server, options) => {
  const secret = server.secret;

  server.register(FastifyJwt, {
    secret: secret, // Ganti dengan secret yang lebih aman di production
    sign: {
      expiresIn: '24h' // Atur waktu kadaluarsa di sini
    },
    cookie: {
      cookieName: 'refreshToken',
    },
  });

  // Menambahkan dekorator untuk verifikasi JWT
  server.decorate('authenticate', async function (request, reply) {
    let token = null;

    try {
      // Cek token di header Authorization
      const authHeader = request.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' from the start
        server.log.info('Token found in Authorization header:', token);
      } else {
        server.log.debug('No token in Authorization header.');
      }

      // Cek token di cookie jika tidak ada di header
      if (!token) {
        token = request.cookies.token;
        if (token) {
          server.log.info('Token found in Cookie:', token);
        } else {
          server.log.debug('No token in Cookie.');
        }
      }

      // Jika token ditemukan, verifikasi
      if (token) {
        try {
          request.user = await request.server.jwt.verify(token);
          server.log.info('Token verified successfully:', token);
        } catch (err) {
          server.log.error('Token verification failed:', err.message);
          reply.send(err);
          return;
        }
      } else {
        // Token tidak ditemukan
        server.log.warn('Authentication token is missing');
        reply.status(401).send({ message: 'Authentication token is missing' });
        return;
      }
    } catch (err) {
      server.log.error('Internal server error:', err.message);
      reply.status(500).send({ message: 'Internal server error', error: err.message });
    }
  });

  // Menambahkan dekorator untuk pengecekan role
  server.decorate('checkRole', function (role) {
    return async function (request, reply) {
      const user = request.user;
      if (!user || user.role !== role) {
        server.log.warn(`Forbidden access attempt by user ID ${user ? user.id : 'unknown'}, role: ${user ? user.role : 'unknown'}`);
        reply.status(403).send({ message: 'Forbidden' });
      } else {
        server.log.info(`Access granted for user ID ${user.id}, role: ${user.role}`);
      }
    };
  });
});
