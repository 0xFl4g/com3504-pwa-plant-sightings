const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Plant Sightings API',
      version: '1.0.0',
      description: 'API documentation for the Plant Sightings application',
    },
    servers: [
      {
        url: process.env.BASE_URL || 'http://localhost:3000',
      },
    ],
    components: {
      schemas: {
        Sighting: {
          type: 'object',
          required: ['_id', 'identification'],
          properties: {
            _id: {
              type: 'string',
              description: 'The auto-generated ID of the sighting',
            },
            identification: {
              type: 'string',
              description: 'The plant identification',
            },
            dateTime: {
              type: 'string',
              format: 'date-time',
              description: 'The date and time of the sighting',
            },
            username: {
              type: 'string',
              description: 'The user who reported the sighting',
            },
            locationCoordinate: {
              type: 'string',
              description: 'The geographical coordinates of the sighting',
            },
            locationName: {
              type: 'string',
              description: 'The name of the location of the sighting',
            },
            photo: {
              type: 'string',
              description: 'URL of the sighting photo',
            },
            hasFlowers: {
              type: 'boolean',
              description: 'Whether the plant has flowers',
            },
            hasLeaves: {
              type: 'boolean',
              description: 'Whether the plant has leaves',
            },
            hasFruitsOrSeeds: {
              type: 'boolean',
              description: 'Whether the plant has fruits or seeds',
            },
            additionalInformation: {
              type: 'string',
              description: 'Any additional information',
            },
          },
          example: {
            _id: '60b6c0f4f8d3e024ec8b4567',
            identification: 'Rosa rubiginosa',
            dateTime: '2021-06-01T12:00:00Z',
            username: 'john_doe',
            locationCoordinate: '53.3811,-1.4701',
            locationName: 'Sheffield, UK',
            photo: 'http://example.com/photo.jpg',
            hasFlowers: true,
            hasLeaves: true,
            hasFruitsOrSeeds: false,
            additionalInformation: 'Found in the park near the fountain.',
          },
        },
        Comment: {
          type: 'object',
          required: ['_id', 'text', 'username', 'plantSighting', 'dateTime'],
          properties: {
            _id: {
              type: 'string',
              description: 'The auto-generated ID of the comment',
            },
            text: {
              type: 'string',
              description: 'The comment text',
            },
            username: {
              type: 'string',
              description: 'The username of the commenter',
            },
            plantSighting: {
              type: 'string',
              description: 'The ID of the related plant sighting',
            },
            dateTime: {
              type: 'string',
              format: 'date-time',
              description: 'The date and time of the comment',
            },
          },
          example: {
            _id: '60b6c0f4f8d3e024ec8b4568',
            text: 'Beautiful sighting!',
            username: 'jane_doe',
            plantSighting: '60b6c0f4f8d3e024ec8b4567',
            dateTime: '2021-06-01T12:30:00Z',
          },
        },
        DBpediaPlant: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'The name of the plant',
            },
            abstract: {
              type: 'string',
              description: 'A brief description of the plant',
            },
            imageLink: {
              type: 'string',
              description: 'URL of an image of the plant',
            },
          },
          example: {
            name: 'Rosa rubiginosa',
            abstract: 'Rosa rubiginosa, commonly known as sweet briar, is a species of rose.',
            imageLink: 'http://example.com/rosa_rubiginosa.jpg',
          },
        },
      },
    },
  },
  apis: ['./routes/*.js'], // Path to the API routes
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs,
};
