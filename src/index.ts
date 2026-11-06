import express from "express";
import cors from "cors";
import firestoreRoutes from "./routes/firestore.routes";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://frontend-mp2-delta.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
  })
);
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const PORT = process.env.PORT || 3000;

// Ruta principal
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend API funcionando correctamente",
  });
});

// Rutas de Firestore
app.use("/api", firestoreRoutes);

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});