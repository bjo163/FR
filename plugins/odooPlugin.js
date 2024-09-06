// plugins/odooPlugin.js
import fp from 'fastify-plugin';
import Odoo from 'odoo-await';

async function odooAuthPlugin(server, opts) {
  server.log.info('Odoo authentication plugin is initializing...');

  // Decorate the server instance with a new method for Odoo authentication
  server.decorate('odoo', async (username, password) => {
    try {
      const odoo = new Odoo({
        baseUrl: "http://zenix.id",
        port: 8069,
        db: 'PDD-001',
        username: username,
        password: password,
      });

      // Connect to Odoo and get the UID
      const uid = await odoo.connect();

      server.log.info(`User authenticated successfully with UID: ${uid}`);

      // Return the Odoo instance and the user ID for further operations
      return { odoo, uid };
    } catch (error) {
      server.log.error('Failed to authenticate with Odoo:', error);
      throw new Error('Odoo authentication failed');
    }
  });
}

export default fp(odooAuthPlugin, {
  name: 'odooAuthPlugin',
});
