const swaggerJsdoc = require('swagger-jsdoc');

const port = process.env.PORT || 3003;

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SAE S4 - Main Brain API',
      version: '1.0.0',
      description: 'Documentation du microservice agrégateur / brain.'
    },
    servers: [
      {
        url: `http://localhost:${port}`
      }
    ]
  },
  apis: ['./routes/*.js']
};

module.exports = swaggerJsdoc(options);
