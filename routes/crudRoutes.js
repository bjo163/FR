// src/routes/crudRoutes.js
import { Read } from '../controllers/crudController.js';

export default async function (server) {
  server.get('/read', { onRequest: [server.authenticate] }, Read);

  // Tambahkan route CRUD lainnya di sini
}
