// file: plugins/whatsapp-process-callback.js

import fp from 'fastify-plugin';
import axios from 'axios'; // Import axios

// Fungsi plugin
async function whatsappProcessCallback(fastify, options) {
  fastify.post('/whatsapp-process-callback', async (request, reply) => {
    const { dataType, data, sessionId } = request.body;

    if (dataType === 'message') {
      const { message } = data;
      const { _data } = message;

      // Formatkan waktu
      const formattedTime = new Date(_data.t * 1000).toISOString(); // Menyesuaikan dengan format yang diperlukan

      // Formatkan data untuk prompt
      const prompt = `From: ${_data.from}\nTo: ${_data.to}\nMessage: ${_data.body}\nIs New Message: ${_data.isNewMsg}`;
      const prompt_data = JSON.stringify({
        source: "qss",
        platform: "WhatsApp",
        UID: _data.from,
        date: formattedTime,
        text: _data.body
      });

      // Data untuk dikirim
      const dataToSend = {
        message: _data.body,
        uid: _data.from,
        // system_instruction: "process message", // Atur sesuai kebutuhan
        // conversation_history: conversation_history // Jika diperlukan
      };

      try {
        // Cek apakah sessionId ada sebagai uid di model Agent
        const agent = await fastify.localDb.Agent.findOne({
          where: { uid: sessionId }
        });

        if (agent) {
          // Jika sessionId ditemukan, kirim data ke AI Agent
          console.log('get',agent)
          const aiResponse = await axios.post(`http://localhost:5001/api/v1/agents/whatsapp/${sessionId}/chat`, dataToSend, {
            headers: {
              'Content-Type': 'application/json'
            }
          });

          console.log('AI Response:', aiResponse.data);

          // Kirim hasilnya ke client melalui curl API
          const clientResponse = await axios.post(`http://zenix.id:5002/client/sendMessage/${sessionId}`, {
            chatId: _data.from,
            contentType: "string",
            content: aiResponse.data.response || "No content received from AI"
          }, {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key' : '210491',
            }
          });

          console.log('Client Response:', clientResponse.data);

        } else {
          console.log('Agent not found for the given sessionId:', sessionId);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    } else {
      // Logging untuk tipe data lain jika ada
      console.log('Received Non-Message Data:');
      console.log(JSON.stringify(request.body, null, 2));
    }

    // Kirim respons
    return { status: 'Message processed successfully' };
  });
}

export default fp(whatsappProcessCallback);
