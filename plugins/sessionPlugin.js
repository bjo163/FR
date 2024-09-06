// plugins/sessionPlugin.js
import fp from 'fastify-plugin';
import FastifyCookie from '@fastify/cookie';
import FastifySession from '@fastify/session';




async function sessionPlugin(server, opts) {
  // Menghasilkan secret untuk sesi
  const secret = server.secret

 
  server.register(FastifyCookie);


  server.register(FastifySession, {
    secret: secret , // Menggunakan secret yang dihasilkan
    cookie: { expires: 1800000, secure: false }, // Atur ke true jika menggunakan HTTPS
    // saveUninitialized: false,
    // resave: false
  });


}

export default fp(sessionPlugin, {
  name: 'sessionPlugin',
  dependencies: ['localDb'] // Pastikan localDb plugin dimuat sebelum sessionPlugin
});
