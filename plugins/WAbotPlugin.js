import fp from 'fastify-plugin';
import { Client, Events } from '@mengkodingan/ckptw';

// Fungsi untuk mendapatkan timestamp saat ini
const getCurrentTimestamp = () => new Date().toISOString();

// Fungsi untuk membuat dan meluncurkan client
const createAndLaunchClient = async (name, models) => {
  console.log(`Creating and launching client ${name}`);

  const config = {
    name,
    prefix: '!', // Default prefix
    printQRInTerminal: true,
    readIncommingMsg: true,
    authDir: `./auth/${name}` // Set authDir berdasarkan nama client
  };

  const client = new Client(config);
  let qrCode = null;
  let isReady = false;

  // Setup listeners
  client.ev.on(Events.QR, async (qr) => {
    console.log(`QR Code for client ${name}: ${qr}`);
    qrCode = qr; // Simpan QR Code ke variabel
    await models.Whatsapp.upsert({ name, qrCode }, { where: { name } });
  });

  client.ev.on(Events.ClientReady, async (m) => {
    console.log(`Client ${name} is ready at ${m.user.id}`);
    isReady = true;
    await models.Whatsapp.upsert({
      name,
      isOnline: true,
      phoneNumber: m.user.id,
      qrCode: null, // QR code sudah disimpan sebelumnya
      authDir: config.authDir,
      prefix: config.prefix
    });
  });

  client.ev.on(Events.ClientError, (error) => {
    console.error(`Client ${name} encountered an error: ${error.message}`);
  });

  client.ev.on(Events.MessagesUpsert, async (m, ctx) => {
    if (m.key.fromMe) return;

    const senderNumber = ctx._sender.jid.split("@")[0];
    const senderJid = ctx._sender.jid;
    const senderName= ctx._sender.pushName;
    const isGroup = ctx.isGroup();
    const isPrivate = !isGroup;

    const groupInfo = isGroup && m.key && m.key.remoteJid
      ? ` in group ${m.key.remoteJid.split("@")[0]} (${m.key.remoteJid})`
      : '';

    console.log(`[${getCurrentTimestamp()}] Received message from ${senderNumber} (${senderJid})${groupInfo}: ${m.content || 'No content'}`);
    if (m.content) {
      const input = `
      {
          source: "whatsapp",
          platform: "web",
          UID: ${senderJid},
          date: ${getCurrentTimestamp()},
          text: ${m.content}
      }`;

      try {
          // Check if the message is from the specified group
          const isTargetGroup = isGroup && m.key.remoteJid === '120363281711119500@g.us';
          
          if (isPrivate || isTargetGroup) {
              // const response = await axios.post(`http://localhost:${PORT}/api/chat`, { message: input });
              // const aiResponse = response.data.response;
              
              // Reply to the sender
              // ctx.reply(aiResponse);
              console.log(`Pesan Privat Client :${name} UID: ${senderJid} Name :${senderName} Text:${m.content}`)
          }
      } catch (error) {
          console.error(chalk.red('An error occurred while calling the chat API:'), error);
          if (isPrivate || isTargetGroup) {
              ctx.reply('Sorry, there was an error processing your message.');
          }
      }
  } else if (isPrivate && m.content === "hello") {
      ctx.reply("hi 👋");
  }
  });

  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => {
      if (!isReady) {
        models.Whatsapp.update({ isOnline: false }, { where: { name } });
        console.log(`Client ${name} set to offline due to timeout.`);
      }
      resolve();
    }, 30000); // 30 detik timeout
  });

  await client.launch();
  await timeoutPromise;

  return { name, qrCode }; // Kembalikan objek dengan nama client dan QR Code
};

// Fungsi untuk memuat atau membuat client dari database
const loadOrCreateClients = async (models) => {
  // Load clients with isOnline status as true
  const clients = await models.Whatsapp.findAll({ where: { isOnline: true } });
  const results = [];

  for (const client of clients) {
    console.log(`Re-creating and launching client ${client.name}`);
    const result = await createAndLaunchClient(client.name, models);
    results.push(result);
  }

  return results; // Kembalikan hasil pembuatan dan peluncuran client
};

// Fungsi plugin Fastify
async function waPlugin(server, options) {
  const { localDb } = server;

  // Endpoint POST untuk membuat client baru berdasarkan nama
  server.post('/client', async (request, reply) => {
    const { name } = request.body; // Ambil nama client dari body request

    if (!name) {
      return reply.status(400).send({ message: 'Client name is required' });
    }

    try {
      // Cek apakah client sudah ada di database
      const existingClient = await localDb.Whatsapp.findOne({ where: { name } });
      if (existingClient) {
        return reply.status(400).send({ message: `Client with name ${name} already exists.` });
      }

      // Buat dan luncurkan client serta dapatkan QR Code
      const result = await createAndLaunchClient(name, localDb);

      // Simpan QR Code ke database jika belum ada
      if (result.qrCode) {
        await localDb.Whatsapp.update({ qrCode: result.qrCode }, { where: { name } });
      }

      reply.send({ message: `Client ${name} created and launched successfully`, qrCode: result.qrCode });
    } catch (error) {
      reply.status(400).send({ message: error.message });
    }
  });

  // Endpoint GET untuk mendapatkan daftar semua client
  server.get('/clients', async (request, reply) => {
    try {
      const clients = await localDb.Whatsapp.findAll();
      const clientsList = clients.map(client => ({
        name: client.name,
        id: client.clientId,
        online: client.isOnline,
        phoneNumber: client.phoneNumber
      }));

      reply.send({ clients: clientsList });
    } catch (error) {
      reply.status(500).send({ message: error.message });
    }
  });

  // Endpoint GET untuk mendapatkan QR code berdasarkan nama client
  server.get('/client/:name/qr', async (request, reply) => {
    const { name } = request.params;
    const client = await localDb.Whatsapp.findOne({ where: { name } });

    if (client && client.qrCode) {
      reply.send({ message: `QR Code for client ${name}`, qr: client.qrCode });
    } else {
      reply.status(404).send({ message: `QR Code for client ${name} not found` });
    }
  });

  // Endpoint POST untuk memuat atau membuat client dari database
  server.post('/load-clients', async (request, reply) => {
    console.log("res Load")
    const results = await loadOrCreateClients(server.localDb);
    try {
      // Pastikan localDb ada dan model Whatsapp bisa diakses
      if (!server.localDb || !server,localDb.Whatsapp) {
        throw new Error('Database or model not initialized');
      }

      
      
      reply.send({ message: 'Clients loaded from database successfully', results });
    } catch (error) {
      reply.status(500).send({ message: `Error loading clients: ${error.message}` });
    }
  });
}

// Export plugin sebagai Fastify Plugin
export default fp(waPlugin);
