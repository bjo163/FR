import { modelFields } from './fieldsConfig.js';

/**
 * Handles the 'Read' operation to retrieve records from Odoo.
 * This function supports filtering, field selection, ordering, pagination, and counting.
 *
 * @param {Object} request - The request object containing query parameters and user information.
 * @param {Object} reply - The reply object used to send the response back to the client.
 */
export async function Read(request, reply) {
  try {
    const { model, query = '[]', fields = '[]', id } = request.query;
    const order = request.query.order || 'id desc'; // Set default order to 'id desc'

    if (!modelFields[model]) {
      // If the model is not found in modelFields, return an error response
      return reply.status(400).send({
        code: 400,
        status: 'FAILURE',
        message: 'INVALID_MODEL',
        data: null
      });
    }

    const validFields = await modelFields[model];
    const requestedFields = fields && fields !== '[]' ? JSON.parse(fields) : validFields;
    request.server.log.info('Using fields:', requestedFields);

    // Retrieve Odoo client from the request server
    const { odoo } = request.server;
    const user = request.user; // Use user credentials from the request for authentication

    const odooClient = await odoo(user.username, user.password);

    let domain = JSON.parse(query); // Default domain from query parameter

    if (id) {
      // Handle single or multiple IDs
      const idArray = id.split(',').map(id => parseInt(id));
      domain = [['id', 'in', idArray]];
    }

    const searchParams = {
      domain, // Apply ID filter if provided
      fields: requestedFields, // Fields to include in the response
      order // Sorting order for the results (default to 'id desc')
    };

    const records = await odooClient.odoo.searchRead(model, searchParams.domain, searchParams.fields, searchParams);

    request.server.log.info('Search :', records);
    reply.send({
      code: 200,
      status: 'SUCCESS',
      message: 'READ_OPERATION_SUCCESSFUL',
      data: records,
    });
  } catch (err) {
    // Log and return an error response if the operation fails
    request.server.log.error('Search Read failed:', err);
    reply.status(500).send({
      code: 500,
      status: 'FAILURE',
      message: err.message || 'SEARCH_READ_FAILED',
      data: null
    });
  }
}
