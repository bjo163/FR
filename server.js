import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import AutoLoad from '@fastify/autoload';
import FastifyVite from '@fastify/vite';
import { renderToString } from 'react-dom/server';
import fastifyPrintRoutes from 'fastify-print-routes';
import { randomBytes } from 'crypto';
import fastJson from 'fast-json-stringify';
import fileUtilsPlugin from './core/fileUtils.js'; // Sesuaikan dengan path yang benar
//Bot Wa

// Dapatkan __dirname dengan menggunakan import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



async function main(dev) {


  // Jika secret tidak ada atau perlu diupdate

  const server = Fastify({
    bodyLimit: 10485760,
    logger: {
      transport: {
        target: '@fastify/one-line-logger'
      }
    }
  });


  await server.register(fileUtilsPlugin);

  // Register fastifyPrintRoutes plugin to log all routes
  await server.register(fastifyPrintRoutes);

  await server.register(FastifyVite, {
    root: import.meta.url,
    dev: dev || process.argv.includes('--dev'),
    createRenderFunction({ createApp }) {
      return () => {
        return {
          element: renderToString(createApp())
        };
      };
    }
  });

  // await server.register(FastifyVite, { 
  //   root: import.meta.url, 
  //   renderer: '@fastify/react',
  // })
  server.get('/', (req, reply) => {
    return reply.html();
  });

  await server.vite.ready();


const registerPluginsAndRoutes = async (server) => {

  server.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    options: {}
  });

  // Autoload routes
  server.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    options: { prefix: '/api/v1/' }
  });
};

  await registerPluginsAndRoutes(server);

  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = await main(process.argv.includes('--dev'));
 
  await server.listen({ port: 5001, host: '0.0.0.0' });
 
}
