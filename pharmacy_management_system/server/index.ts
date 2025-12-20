import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo.js";
import medicinesRouter from "./routes/medicines.js";
import ordersRouter from "./routes/orders.js";
import suppliersRouter from "./routes/suppliers.js";
import inventoryRouter from "./routes/inventory.js";
import usersRouter from "./routes/users.js";
import salesRouter from "./routes/sales.js";
import customersRouter from "./routes/customers.js";
import purchaseOrdersRouter from "./routes/purchase-orders.js";
import prescriptionsRouter from "./routes/prescriptions.js";
import stockAdjustmentsRouter from "./routes/stock-adjustments.js";
import orderFulfillmentRouter from "./routes/order-fulfillment.js";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Request logging middleware
  app.use((req, res, next) => {
    console.log(`📥 Express received: ${req.method} ${req.path}`);
    next();
  });

  // Create API router
  const apiRouter = express.Router();

  // Example API routes
  apiRouter.get("/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  // Health check endpoint with database status
  apiRouter.get("/health", async (_req, res) => {
    try {
      const { pool } = await import("./db.js");
      await pool.query("SELECT NOW()");
      res.json({ 
        status: "healthy", 
        database: "connected",
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(503).json({ 
        status: "unhealthy", 
        database: "disconnected",
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  apiRouter.get("/demo", handleDemo);

  // API routes
  apiRouter.use("/medicines", medicinesRouter);
  apiRouter.use("/orders", ordersRouter);
  apiRouter.use("/suppliers", suppliersRouter);
  apiRouter.use("/inventory", inventoryRouter);
  apiRouter.use("/users", usersRouter);
  apiRouter.use("/sales", salesRouter);
  apiRouter.use("/customers", customersRouter);
  apiRouter.use("/purchase-orders", purchaseOrdersRouter);
  apiRouter.use("/prescriptions", prescriptionsRouter);
  apiRouter.use("/stock-adjustments", stockAdjustmentsRouter);
  apiRouter.use("/order-fulfillment", orderFulfillmentRouter);

  // Mount API router at root (Vite middleware handles /api prefix)
  app.use("/", apiRouter);

  return app;
}
