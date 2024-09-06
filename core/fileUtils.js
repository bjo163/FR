import fp from 'fastify-plugin';
import fs from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';
import { fileURLToPath } from 'url';

// Mendapatkan path direktori dari URL modul
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path untuk file db.json
const dbFilePath = path.join(__dirname, 'db.json');

// Fungsi untuk memeriksa apakah file ada
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Fungsi untuk memastikan file db.json ada, jika tidak, buat file baru
async function ensureDbFile() {
  if (!await fileExists(dbFilePath)) {
    try {
      await fs.writeFile(dbFilePath, JSON.stringify({}), 'utf8');
    } catch (error) {
      console.error('Error creating db file:', error);
    }
  }
}

// Fungsi untuk membaca data dari file JSON secara asinkron
async function readLocalDb() {
  try {
    await ensureDbFile(); // Pastikan file ada sebelum membacanya
    const data = await fs.readFile(dbFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading from file:', error);
    return {}; // Kembalikan objek kosong jika terjadi kesalahan
  }
}

// Fungsi untuk menulis data ke file JSON secara asinkron
async function writeLocalDb(data) {
  try {
    await ensureDbFile(); // Pastikan file ada sebelum menulis
    await fs.writeFile(dbFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing to file:', error);
  }
}

// Fungsi untuk menghasilkan secret
function generateSecret() {
  return randomBytes(32).toString('hex');
}

// Fungsi untuk memastikan secret ada dan memperbaruinya jika perlu
async function ensureSecret(server) {
  let localDb = {};

  try {
    localDb = await readLocalDb();
  } catch (err) {
    console.error('Error reading db.json:', err);
    // Jika terjadi error saat membaca file, buat objek kosong
  }

  if (!localDb.secret || new Date(localDb.secretTimestamp) < new Date()) {
    // Generate secret baru dan simpan ke db.json
    localDb.secret = generateSecret();
    localDb.secretTimestamp = new Date().toISOString(); // Simpan timestamp jika perlu
    await writeLocalDb(localDb);
    console.log('Secret baru dihasilkan dan disimpan.');
  }

  server.decorate('secret', localDb.secret);
}

// Fungsi untuk menambahkan endpoint /secret


// Plugin Fastify
async function fileUtilsPlugin(server, opts) {
  // Pastikan secret ada
  await ensureSecret(server);
  
  // Mendekorasi server dengan utilitas
  server.decorate('readLocalDb', readLocalDb);
  server.decorate('writeLocalDb', writeLocalDb);
  server.decorate('generateSecret', generateSecret);
  
}

export default fp(fileUtilsPlugin, {
  name: 'fileUtilsPlugin'
});
