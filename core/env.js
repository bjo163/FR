import fastifyEnv from "@fastify/env";
import fastifyPlugin from "fastify-plugin";

async function configPlugin(server, options, done) {
  const schema = {
    type: "object",
    required: ["HTTP_PORT", "HTTP_HOST"],
    properties: {
      HTTP_PORT: {
        type: "number",
        default: 3000,
      },
      HTTP_HOST: {
        type: "string",
        default: "0.0.0.0",
      },
      GOOGLE_API_KEY: {
        type: "string",
        default: "0000",
      },
      GOOGLE_CX: {
        type: "string",
        default: "0000",
      },
    },
  };

  const configOptions = {
    // decorate the Fastify server instance with `config` key
    // such as `fastify.config('PORT')
    confKey: "config",
    // schema to validate
    schema: schema,
    // source for the configuration data
    data: process.env,
    // will read .env in root folder
    dotenv: true,
    // will remove the additional properties
    // from the data object which creates an
    // explicit schema
    removeAdditional: true,
  };

  return fastifyEnv(server, configOptions, done);
}

export default fastifyPlugin(configPlugin);