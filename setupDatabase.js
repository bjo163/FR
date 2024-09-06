import User from './models/User.js';

async function setupDatabase(sequelize) {
  // Sinkronisasi model dengan database
  await sequelize.sync({ force: true }); // Menghapus data lama dan membuat tabel baru

  // Cek apakah superadmin sudah ada
  const adminExists = await User(sequelize).findOne({ where: { username: 'superadmin' } });
  if (!adminExists) {
    await User(sequelize).create({
      username: 'superadmin',
      password: 'supersecurepassword', // Gunakan password yang lebih aman di produksi
      role: 'admin',
    });
  }
}

export default setupDatabase;
