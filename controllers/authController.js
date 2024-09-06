import bcrypt from 'bcrypt';

export async function login(request, reply) {
  const { email, password } = request.body;

  if (!email || !password) {
    return reply.status(400).send({ message: 'Email and password are required' });
  }

  try {
    // Temukan pengguna berdasarkan email
    const user = await request.server.localDb.User.findOne({ where: { email } });

    if (!user) {
      return reply.status(401).send({ message: 'Invalid credentials' });
    }

    // Periksa apakah password yang diberikan cocok dengan password yang di-hash
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return reply.status(401).send({ message: 'Invalid credentials' });
    }

    // Periksa apakah pengguna sudah online
    if (user.isOnline) {
      return reply.status(400).send({ message: 'User already logged in' });
    }

    // Buat token JWT
    const token = request.server.jwt.sign({ id: user.id, role: user.role });

    // Tentukan tanggal kadaluarsa token
    const tokenExpiry = new Date(Date.now() + 3600000); // 1 jam ke depan
    await request.server.localDb.User.update(
      { token, tokenExpiry, isOnline: true },
      { where: { id: user.id } }
    );

    // Set token di cookie HTTP-only
    reply.setCookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Gunakan cookie aman di produksi
      sameSite: 'Strict', // Sesuaikan jika perlu
      maxAge: 3600000 // 1 jam
    });

    // Kirim respons dengan token
    return reply.send({ token });
  } catch (error) {
    console.error('Error logging in:', error);
    return reply.status(500).send({ message: 'Internal server error' });
  }
}


export async function logout(request, reply) {
  // Ambil token dari header atau cookie
  const token = request.headers['authorization']?.split(' ')[1] || request.cookies.token;

  if (!token) {
    return reply.status(400).send({ message: 'No token provided' });
  }

  try {
    // Ambil user ID dari token
    // Misalkan kita simpan userId dalam token atau database
    const user = await request.server.localDb.User.findOne({ where: { token } });

    if (!user) {
      return reply.status(404).send({ message: 'User not found or token invalid' });
    }

    // Update status pengguna menjadi offline dan hapus token
    await user.update({ isOnline: false, token: null, tokenExpiry: null });

    // Hapus cookie token
    reply.clearCookie('token');

    return reply.send({ message: 'Logout successful' });
  } catch (error) {
    console.error('Error logging out:', error);
    return reply.status(500).send({ message: 'Internal server error' });
  }
}


export async function refresh(request, reply) {
  try {
    const refreshToken = request.cookies.refreshToken;

    if (!refreshToken) {
      return reply.status(401).send({ message: 'Refresh token required' });
    }

    // Verifikasi refresh token
    const { id, role } = await reply.jwtVerify(refreshToken);

    // Buat token akses baru
    const newToken = await reply.jwtSign({ id, role });

    // Kirim respons dengan token akses baru
    return reply.send({ token: newToken });
  } catch (error) {
    console.error('Error refreshing token:', error);
    return reply.status(401).send({ message: 'Invalid refresh token' });
  }

}