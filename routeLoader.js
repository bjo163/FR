import fs from 'fs';
import path from 'path';

async function loadRoutes(fastify, routesDir) {
  if (!fs.existsSync(routesDir)) {
    console.error(`Routes directory does not exist: ${routesDir}`);
    return;
  }

  const routeFiles = fs.readdirSync(routesDir).filter(file => file.endsWith('.js'));

  for (const file of routeFiles) {
    const filePath = path.join(routesDir, file);
    try {
      const route = await import(filePath);
      await route.default(fastify);
    } catch (err) {
      console.error(`Failed to load route ${filePath}:`, err);
    }
  }
}

export default loadRoutes;
