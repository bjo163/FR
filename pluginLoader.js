import fs from 'fs';
import path from 'path';

async function loadPlugins(fastify, pluginsDir) {
  if (!fs.existsSync(pluginsDir)) {
    console.error(`Plugins directory does not exist: ${pluginsDir}`);
    return;
  }

  const pluginFiles = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));

  for (const file of pluginFiles) {
    const filePath = path.join(pluginsDir, file);
    try {
      const plugin = await import(filePath);
      await fastify.register(plugin.default);
    } catch (err) {
      console.error(`Failed to load plugin ${filePath}:`, err);
    }
  }
}

export default loadPlugins;
