// swagger.js
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Job Portal API',
            version: '1.0.0',
            description: '채용 공고 및 지원 관리 API',
        },
    },
    apis: ['./routes/*.js'],  // 경로를 수정하여 모든 라우터 파일을 Swagger 문서화
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = { swaggerSpec, swaggerUi };
