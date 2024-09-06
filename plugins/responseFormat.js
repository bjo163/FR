import fp from 'fastify-plugin';
import FastJsonStringify from 'fast-json-stringify';

// Definisikan schema untuk format respons
const responseSchema = {
  type: 'object',
  properties: {
    status: { type: 'integer' },
    message: { type: 'string' },
    data: { type: 'object', additionalProperties: true }
  }
};

const errorSchema = {
  type: 'object',
  properties: {
    status: { type: 'integer' },
    message: { type: 'string' },
    error: { type: 'object', additionalProperties: true }
  }
};

const stringifyResponse = FastJsonStringify(responseSchema);
const stringifyError = FastJsonStringify(errorSchema);

export default fp(async (server, opts) => {
  // Menambahkan dekorator untuk format respons
  server.decorateReply('formatResponse', (message, data, code) => {
    return ({
      status: code,
      message: message,
      data: data
    });
  });

  // Menambahkan dekorator untuk format kesalahan
  server.decorateReply('formatError', (message, error, code) => {
    return ({
      status: code,
      message: message,
      error: error
    });
  });
});
