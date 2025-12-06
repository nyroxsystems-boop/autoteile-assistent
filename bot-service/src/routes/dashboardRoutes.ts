import { Router, type Application, type Request, type Response } from "express";
import { getSupabaseClient } from "../services/supabaseService";
import {
  mapOfferRowToDashboardShopOffer,
  mapOrderRowToDashboardOrder
} from "../mappers/dashboardMappers";
import type { DashboardStats, DashboardStatsRange } from "../types/dashboard";

const supabase = getSupabaseClient();

export function createDashboardRouter(): Router {
  const router = Router();

  router.get("/orders", async (_req: Request, res: Response) => {
    console.log("[DashboardAPI] GET /dashboard/orders called");
    console.log("[DashboardAPI] Fetching orders for /dashboard/orders");
    try {
      const statuses = ["collect_part", "oem_lookup", "show_offers", "done", "aborted"];
      console.log("[DashboardAPI] Fetching orders with status in", statuses);

      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .in("status", statuses)
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("[DashboardAPI] Error fetching orders:", ordersError);
        return res
          .status(500)
          .json({ error: "Failed to fetch orders", details: ordersError.message });
      }

      const orderIds = (orders ?? []).map((o: any) => o.id);
      console.log("[DashboardAPI] Orders fetched:", orderIds.length);

      const vehicleByOrderId = new Map<string, any>();
      if (orderIds.length > 0) {
        console.log("[DashboardAPI] Fetching vehicles for orders", orderIds);
        try {
          const { data: vehicles, error: vehiclesError } = await supabase
            .from("vehicles")
            .select("*")
            .in("order_id", orderIds);

          if (vehiclesError) {
            console.error("[DashboardAPI] Error fetching vehicles:", vehiclesError);
            if (
              typeof vehiclesError.message === "string" &&
              vehiclesError.message.toLowerCase().includes("not find the table")
            ) {
              console.warn(
                "[DashboardAPI] Vehicle table not found, continuing without vehicle data",
                vehiclesError.message
              );
            } else {
              // For other vehicle errors, still continue but log.
              console.warn(
                "[DashboardAPI] Vehicle fetch failed, continuing without vehicle data",
                vehiclesError.message
              );
            }
          } else {
            (vehicles ?? []).forEach((v: any) => vehicleByOrderId.set(v.order_id, v));
          }
        } catch (vehicleErr: any) {
          console.warn(
            "[DashboardAPI] Vehicle fetch threw, continuing without vehicle data",
            vehicleErr?.message ?? vehicleErr
          );
        }
      }

      const responseOrders = (orders ?? []).map((row: any) =>
        mapOrderRowToDashboardOrder(row, vehicleByOrderId.get(row.id))
      );

      console.log("[DashboardAPI] Returning", responseOrders.length, "dashboard orders");
      return res.status(200).json(responseOrders);
    } catch (err: any) {
      console.error("[DashboardAPI] Unexpected error in GET /dashboard/orders:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/orders/:id", async (req: Request, res: Response) => {
    const orderId = req.params.id;
    console.log("[DashboardAPI] GET /dashboard/orders/:id called", { orderId });

    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();

      if (orderError) {
        console.error("[DashboardAPI] Error fetching order:", orderError);
        return res
          .status(500)
          .json({ error: "Failed to fetch order", details: orderError.message });
      }

      if (!order) {
        console.warn("[DashboardAPI] Order not found:", orderId);
        return res.status(404).json({ error: "Order not found" });
      }

      let vehicle: any | null = null;
      try {
        const { data: vehicleRow, error: vehicleError } = await supabase
          .from("vehicles")
          .select("*")
          .eq("order_id", orderId)
          .maybeSingle();

        if (vehicleError) {
          if (
            typeof vehicleError.message === "string" &&
            vehicleError.message.toLowerCase().includes("not find the table")
          ) {
            console.warn(
              "[DashboardAPI] Vehicle table not found, continuing without vehicle data",
              vehicleError.message
            );
          } else {
            console.warn(
              "[DashboardAPI] Vehicle fetch failed, continuing without vehicle data",
              vehicleError.message
            );
          }
        } else {
          vehicle = vehicleRow ?? null;
        }
      } catch (vehErr: any) {
        console.warn(
          "[DashboardAPI] Vehicle fetch threw, continuing without vehicle data",
          vehErr?.message ?? vehErr
        );
      }

      const responseOrder = mapOrderRowToDashboardOrder(order, vehicle ?? undefined);

      console.log("[DashboardAPI] Returning order detail for", orderId);
      return res.status(200).json(responseOrder);
    } catch (err: any) {
      console.error("[DashboardAPI] Unexpected error in GET /dashboard/orders/:id:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/orders/:id/offers", async (req: Request, res: Response) => {
    const orderId = req.params.id;
    console.log("[DashboardAPI] GET /dashboard/orders/:id/offers called", { orderId });

    try {
      const { data: offers, error: offersError } = await supabase
        .from("shop_offers")
        .select("*")
        .eq("order_id", orderId)
        .order("base_price", { ascending: true });

      if (offersError) {
        console.error("[DashboardAPI] Error fetching offers:", offersError);
        return res
          .status(500)
          .json({ error: "Failed to fetch offers", details: offersError.message });
      }

      const responseOffers = (offers ?? []).map(mapOfferRowToDashboardShopOffer);

      console.log("[DashboardAPI] Returning", responseOffers.length, "offers for order", orderId);
      return res.status(200).json(responseOffers);
    } catch (err: any) {
      console.error("[DashboardAPI] Unexpected error in GET /dashboard/orders/:id/offers:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/stats", async (req: Request, res: Response) => {
    const rangeParam = (req.query.range as string) || "today";
    const range: DashboardStatsRange =
      rangeParam === "week" || rangeParam === "month" ? (rangeParam as DashboardStatsRange) : "today";

    console.log("[DashboardAPI] GET /dashboard/stats called", { range });

    try {
      const now = new Date();
      let from: Date;

      if (range === "today") {
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (range === "week") {
        const day = now.getDay();
        const diffToMonday = (day + 6) % 7;
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
      } else {
        from = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const fromIso = from.toISOString();
      const toIso = now.toISOString();

      console.log("[DashboardAPI] Stats time range", { fromIso, toIso });

      const { data: ordersInRange, error: ordersInRangeError } = await supabase
        .from("orders")
        .select("id, status, order_data, created_at")
        .gte("created_at", fromIso)
        .lte("created_at", toIso);

      if (ordersInRangeError) {
        console.error("[DashboardAPI] Error fetching orders for stats:", ordersInRangeError);
        return res
          .status(500)
          .json({ error: "Failed to fetch orders for stats", details: ordersInRangeError.message });
      }

      const totalOrders = ordersInRange?.length ?? 0;
      let openOemIssues = 0;
      let abortedOrders = 0;
      let completedOrders = 0;

      (ordersInRange ?? []).forEach((o: any) => {
        const status = o.status;
        if (status === "aborted") abortedOrders++;
        if (status === "done") completedOrders++;

        const orderData = (o.order_data || {}) as any;
        const oemStatus = orderData?.oemStatus as string | undefined;
        if (oemStatus === "not_found" || oemStatus === "multiple_matches") {
          openOemIssues++;
        }
      });

      const { data: inboundMessages, error: inboundMessagesError } = await supabase
        .from("messages")
        .select("id")
        .eq("direction", "in")
        .gte("created_at", fromIso)
        .lte("created_at", toIso);

      if (inboundMessagesError) {
        console.error("[DashboardAPI] Error fetching messages for stats:", inboundMessagesError);
        return res
          .status(500)
          .json({
            error: "Failed to fetch messages for stats",
            details: inboundMessagesError.message
          });
      }

      const inboundMessagesCount = inboundMessages?.length ?? 0;

      const stats: DashboardStats = {
        range,
        totalOrders,
        openOemIssues,
        inboundMessages: inboundMessagesCount,
        abortedOrders,
        completedOrders
      };

      console.log("[DashboardAPI] Returning stats:", stats);
      return res.status(200).json(stats);
    } catch (err: any) {
      console.error("[DashboardAPI] Unexpected error in GET /dashboard/stats:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}

export function registerDashboardRoutes(app: Application) {
  app.use("/dashboard", createDashboardRouter());
}

export default registerDashboardRoutes;
