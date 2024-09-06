export async function verifyJwt(request, reply) {
  
  try {
    // Verifikasi token
    request.server.log.info('aaa')
    const decodedToken = await request.jwtVerify();
    request.server.log.info('aaa',request.jwtVerify())
    const { id } = decodedToken;

    // Ambil pengguna dari database
    const user = await request.server.localDb.User.findByPk(id);

    if (!user) {
      reply.status(401).send({ message: 'Unauthorized', error: 'User not found' });
      return;
    }

    // Periksa apakah token telah kadaluarsa
    const now = new Date();
    if (user.tokenExpiry && user.tokenExpiry < now) {
      // Token expired, generate a new one
      const newToken = request.server.jwt.sign({ id: user.id, role: user.role });
      const decodedNewToken = request.server.jwt.decode(newToken);
      const newTokenExpiry = new Date(decodedNewToken.exp * 1000); // Convert from seconds to milliseconds

      // Update user with new token expiry date
      await user.update({ tokenExpiry: newTokenExpiry, isOnline: true });
      console.log(({ message: 'Token expired, new token generated', token: newToken }))
      // Send new token to the client
      reply.send({
        message: 'Token expired, new token generated',
        token: newToken
      });
      return;
    }

    // Token is still valid
    return;
  } catch (err) {
    request.server.log.info('aaa',err)
    reply.status(401).send({ message: 'Unauthorized', error: err.message });
  }
}

export function checkRole(role) {
  return async function (request, reply) {
    const user = request.user;
    if (user.role !== role) {
      reply.forbidden('Forbidden');
    }
  };
}
