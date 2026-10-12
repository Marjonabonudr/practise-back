const SwaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Algoritm Amaliyot Monitoringi API', // Loyihaning haqiqiy nomi
            version: '1.0.0',
            description: 'Algoritm o‘quv markazi o‘quvchilarini kompaniyalarga amaliyotga joylashtirish tizimi API hujjatlari',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Local test server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./routes/*.js'], // Routes papkasidagi barcha fayllarni o'qiydi
}

const swaggerSpec = SwaggerJsDoc(options);

const setupSwagger = (app) => {
    // app.js va route manzillariga mos kelishi uchun /api-docs qildik
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log('Swagger UI tayyor: http://localhost:3000/api-docs');
};

module.exports = setupSwagger;
