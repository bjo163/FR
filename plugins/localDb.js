import fp from 'fastify-plugin';
import { Sequelize, DataTypes } from 'sequelize';
import path from 'path';
import fs from 'fs';
import { fileURLToPath, URL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setAllUsersOffline(models) {
  try {
    await models.User.update({ isOnline: false }, {
      where: {
        isOnline: true
      }
    });
    console.log('Updated all users to offline status.');
  } catch (error) {
    console.error('Error updating user statuses:', error.message);
  }
}

async function localDb(server, options) {
  server.log.info('Initializing localDb plugin...');
  try {
    const sequelize = new Sequelize({
      dialect: 'postgres',
      host: '103.193.179.189',
      port: 5432,
      database: 'zenix',
      username: 'zenix',
      password: 'Youknowm@2024',
      logging: false
    });

    const models = {};
    const modelsDir = path.join(__dirname, '../models');

    const files = fs.readdirSync(modelsDir);
    for (const file of files) {
      if (file.endsWith('.js') && file !== 'index.js') {
        const modelPath = path.join(modelsDir, file);
        server.log.info(`Loading model from: ${modelPath}`);
        const modelURL = new URL(path.relative(__dirname, modelPath), import.meta.url).href;
        const model = (await import(modelURL)).default;
        const modelName = path.basename(file, '.js');
        const modelInstance = model(sequelize);
        models[modelName] = modelInstance;
      }
    }

    // Setup associations
    Object.keys(models).forEach(modelName => {
      if (models[modelName].associate) {
        models[modelName].associate(models);
      }
    });
 await sequelize.sync({ alter: true });
    // Update users to offline status
    await setAllUsersOffline(models);
  

    server.decorate('localDb', {
      sequelize,
      ...models,
      Sequelize,
    });

    server.get('/api/v1/models', (request, reply) => {
      const modelDetails = Object.keys(server.localDb).filter(key => key !== 'sequelize' && key !== 'Sequelize').map(modelName => {
        const model = server.localDb[modelName];
        const attributes = model.rawAttributes;
        const fields = Object.keys(attributes).map(field => ({
          field: field,
          type: attributes[field].type.key,
          allowNull: attributes[field].allowNull,
          defaultValue: attributes[field].defaultValue
        }));
        return {
          modelName: modelName,
          fields: fields
        };
      });

      reply.send({ models: modelDetails });
    });

    server.log.info('Local DB plugin initialized and models registered.');
  } catch (error) {
    server.log.error(`Error setting up database: ${error.message}`);
    throw error;
  }
}


export default fp(localDb, {
  name: 'localDb'
});
