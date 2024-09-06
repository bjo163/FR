// routes/authRoutes.js
import { modelFields } from '../controllers/fieldsConfig.js';

async function authRoutes(server, opts) {
  server.post('/auth', async (request, reply) => {
    const { email, password } = request.body;
    const username = email
    if (!username || !password) {
      return reply.status(400).send({
        code: 400,
        status: 'FAILURE',
        message: 'USERNAME_AND_PASSWORD_ARE_REQUIRED',
        data: null
      });
    }

    try {
      // Authenticate with Odoo and get the user ID (uid)
      const { odoo, uid } = await server.odoo(username, password);

      // Sign the JWT with uid, username, and password
      const token = server.jwt.sign({ uid, username, password });

      // Update the user's record in Odoo, setting the api_key field with the token
      await odoo.update('res.users', uid, { api_key: token });

      // Fetch user data
      const userFields = modelFields['res.users'] || [];
      const userData = await odoo.read('res.users', [uid], userFields);

      const user = userData[0];

      // Fetch company data if company_id is present
      let companyData = {};
      if (user.company_id && user.company_id[0]) {
        const companyFields = modelFields['res.company'] || [];
        const companyDataResponse = await odoo.read('res.company', [user.company_id[0]], companyFields);
        companyData = companyDataResponse[0];
      }

      reply.setCookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Gunakan cookie aman di produksi
        sameSite: 'Strict', // Sesuaikan jika perlu
        maxAge: 3600000 // 1 jam
      });
      reply.send({
        code: 200,
        status: 'SUCCESS',
        message: 'AUTHENTICATION_SUCCESSFUL',
        data: {
          token, // Authentication token
          records: {
            user, // User details
            company: companyData // Company details associated with the user
          },          
        }
      });
    } catch (err) {
      server.log.error('Authentication failed:', err);
      reply.status(401).send({
        code: 401,
        status: 'FAILURE',
        message: 'AUTHENTICATION_FAILED',
        data: null
      });
    }
  });
}

export default authRoutes;
