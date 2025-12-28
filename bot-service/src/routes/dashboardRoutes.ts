import { Router, type Application, type Request, type Response } from "express";
import * as wawi from "../services/inventreeAdapter";
import {
  mapOfferRowToDashboardShopOffer,
  mapOrderRowToDashboardOrder,
  mapMessageRowToDashboardMessage
} from "../mappers/dashboardMappers";
import { logger } from "../utils/logger";
import { authMiddleware } from "../middleware/authMiddleware";
import * as analytics from "../services/analyticsService";

export function createDashboardRouter(): Router {
  const router = Router();

  // Apply auth to all dashboard routes
  router.use(authMiddleware);

  router.get("/orders", async (_req: Request, res: Response) => {
    try {
      const orders = await wawi.listOrders();
      // For each order, find vehicle if it exists
      const mapped = await Promise.all(orders.map(async (o) => {
        const vehicle = await wawi.getVehicleForOrder(o.id);
        return mapOrderRowToDashboardOrder(o, vehicle);
      }));
      return res.status(200).json(mapped);
    } catch (err: any) {
      logger.error("Dashboard error fetching orders", { error: err.message });
      return res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  router.get("/orders/:id", async (req: Request, res: Response) => {
    try {
      const order = await wawi.getOrderById(req.params.id);
      if (!order) return res.status(404).json({ error: "Order not found" });
      const vehicle = await wawi.getVehicleForOrder(order.id);
      const mapped = mapOrderRowToDashboardOrder(order, vehicle);
      return res.status(200).json(mapped);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  router.get("/orders/:id/messages", async (req: Request, res: Response) => {
    try {
      const orderId = req.params.id;
      // Wawi-Adapter listMessagesByOrderId (needs to be added)
      // using dynamic property access if not typed yet or add to interface
      const msgs = await (wawi as any).listMessagesByOrderId(orderId);
      const mapped = msgs.map((m: any) => mapMessageRowToDashboardMessage(m));
      return res.status(200).json(mapped);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to fetch messages" });
    }
  });


  router.get("/stats", async (req: Request, res: Response) => {
    try {
      const orders = await wawi.listOrders();
      const stats = {
        ordersNew: orders.filter(o => o.status === 'new').length,
        ordersInProgress: orders.filter(o => o.status !== 'new' && o.status !== 'done' && o.status !== 'aborted').length,
        invoicesDraft: 0,
        invoicesIssued: 0,
        revenueToday: 1250.50, // Mocked
        lastSync: new Date().toISOString(),

        // Optional arrays empty for now (safe)
        revenueHistory: [
          { date: '2025-01-01', revenue: 1200, orders: 5 },
          { date: '2025-01-02', revenue: 850, orders: 3 },
          { date: '2025-01-03', revenue: 2100, orders: 8 }
        ],
        topCustomers: [],
        activities: []
      };
      return res.status(200).json(stats);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  router.get('/merchant/settings/:merchantId', async (req: Request, res: Response) => {
    const settings = await wawi.getMerchantSettings(req.params.merchantId);
    return res.status(200).json(settings);
  });

  router.get("/suppliers", async (_req: Request, res: Response) => {
    try {
      const suppliers = await wawi.listSuppliers();
      return res.status(200).json(suppliers);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to fetch suppliers" });
    }
  });

  router.get("/offers", async (_req: Request, res: Response) => {
    try {
      const offers = await wawi.listOffers();
      return res.status(200).json(offers);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to fetch offers" });
    }
  });

  router.get("/analytics/forensics", async (_req: Request, res: Response) => {
    try {
      const stats = await analytics.getForensics();
      return res.status(200).json(stats);
    } catch (err: any) {
      logger.error("Analytics Error", err);
      return res.status(500).json({ error: "Failed to calc forensics" });
    }
  });

  router.get("/analytics/conversion", async (_req: Request, res: Response) => {
    try {
      const stats = await analytics.getConversion();
      return res.status(200).json(stats);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to calc conversion" });
    }
  });

  return router;
}

export function registerDashboardRoutes(app: Application) {
  app.use("/api/dashboard", createDashboardRouter());
}

export default registerDashboardRoutes;
