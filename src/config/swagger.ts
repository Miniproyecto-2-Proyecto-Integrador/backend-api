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
  apis:
    process.env.NODE_ENV === "production"
      ? ["./dist/routes/*.js"]
      : ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);