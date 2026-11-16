import swaggerJsdoc from "swagger-jsdoc";

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Mini Proyecto 2 - Backend API",
      version: "1.0.0",
      description:
        "Documentación de la API del sistema de salas de estudio colaborativas.",
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:3000",
        description: process.env.API_URL
          ? "Servidor desplegado"
          : "Servidor local",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Token de Firebase del usuario con sesión iniciada.",
        },
      },
    },
  },
  // The production image contains compiled JavaScript, so it must retain the
  // @swagger comments from TypeScript for swagger-jsdoc to read them.
  apis: ["./dist/routes/*.js"],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
