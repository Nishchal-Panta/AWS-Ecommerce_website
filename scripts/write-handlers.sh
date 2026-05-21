#!/bin/bash
set -e
BASE=~/projects/aws-ecommerce/backend/functions

# ── CART ─────────────────────────────────────────────────────────────────
mkdir -p $BASE/cart/src
cat > $BASE/cart/src/handler.ts << 'HEOF'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, response } from "/opt/nodejs/index";

const TABLE = process.env.CARTS_TABLE ?? "ecommerce-carts";
const TTL_DAYS = 7;
type CartItem = { productId: string; name: string; price: number; quantity: number; imageUrl?: string; };

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (event.httpMethod === "OPTIONS") return response(200, {});
    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub ?? null;
    if (!userId) return response(401, { error: "Unauthorized" });
    const ttl = Math.floor(Date.now() / 1000) + TTL_DAYS * 86400;

    if (event.httpMethod === "GET") {
      const result = await ddb.send(new GetCommand({ TableName: TABLE, Key: { userId } }));
      return response(200, result.Item ?? { userId, items: [], updatedAt: new Date().toISOString() });
    }

    if (event.httpMethod === "POST") {
      const body: CartItem = JSON.parse(event.body ?? "{}");
      if (!body.productId || !body.quantity) return response(400, { error: "productId and quantity required" });
      const existing = await ddb.send(new GetCommand({ TableName: TABLE, Key: { userId } }));
      const cart = existing.Item ?? { userId, items: [] as CartItem[] };
      const items: CartItem[] = cart.items ?? [];
      const idx = items.findIndex((i: CartItem) => i.productId === body.productId);
      if (idx >= 0) {
        items[idx].quantity += body.quantity;
        if (items[idx].quantity <= 0) items.splice(idx, 1);
      } else if (body.quantity > 0) {
        items.push(body);
      }
      const updated = { userId, items, updatedAt: new Date().toISOString(), ttl };
      await ddb.send(new PutCommand({ TableName: TABLE, Item: updated }));
      return response(200, updated);
    }

    if (event.httpMethod === "DELETE") {
      await ddb.send(new DeleteCommand({ TableName: TABLE, Key: { userId } }));
      return response(200, { message: "Cart cleared" });
    }

    return response(405, { error: "Method not allowed" });
  } catch (err) {
    console.error("Cart error:", err);
    return response(500, { error: "Internal server error" });
  }
};
HEOF

# ── ORDERS ───────────────────────────────────────────────────────────────
mkdir -p $BASE/orders/src
cat > $BASE/orders/src/handler.ts << 'HEOF'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { sqs, ddb, getDb, getParam, response } from "/opt/nodejs/index";
import { randomUUID } from "crypto";

const CARTS_TABLE = process.env.CARTS_TABLE ?? "ecommerce-carts";
type OrderItem = { productId: string; name: string; price: number; quantity: number; };

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (event.httpMethod === "OPTIONS") return response(200, {});
    const claims = event.requestContext?.authorizer?.jwt?.claims ?? {};
    const userId = claims.sub;
    const email  = claims.email;
    if (!userId) return response(401, { error: "Unauthorized" });
    const db = await getDb();

    if (event.httpMethod === "GET" && !event.pathParameters?.id) {
      const [rows] = await db.execute(
        "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
        [userId]
      );
      return response(200, { orders: rows });
    }

    if (event.httpMethod === "GET" && event.pathParameters?.id) {
      const orderId = event.pathParameters.id;
      const [rows]: any = await db.execute("SELECT * FROM orders WHERE id = ? AND user_id = ?", [orderId, userId]);
      if (!rows.length) return response(404, { error: "Order not found" });
      const [items]: any = await db.execute("SELECT * FROM order_items WHERE order_id = ?", [orderId]);
      return response(200, { ...rows[0], items });
    }

    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body ?? "{}");
      const items: OrderItem[] = body.items;
      if (!items?.length) return response(400, { error: "Order must have at least one item" });
      const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const orderId = randomUUID();
      await db.execute(
        "INSERT INTO orders (id, user_id, status, total, currency) VALUES (?, ?, 'pending', ?, 'USD')",
        [orderId, userId, total]
      );
      for (const item of items) {
        await db.execute(
          "INSERT INTO order_items (id, order_id, product_id, name, price, quantity) VALUES (?, ?, ?, ?, ?, ?)",
          [randomUUID(), orderId, item.productId, item.name, item.price, item.quantity]
        );
      }
      await ddb.send(new DeleteCommand({ TableName: CARTS_TABLE, Key: { userId } }));
      const queueUrl = await getParam("/ecommerce/app/orders_queue_url");
      await sqs.send(new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify({ orderId, userId, email, total, items }),
      }));
      return response(201, { orderId, total, status: "pending" });
    }

    return response(405, { error: "Method not allowed" });
  } catch (err) {
    console.error("Orders error:", err);
    return response(500, { error: "Internal server error" });
  }
};
HEOF

# ── NOTIFY ───────────────────────────────────────────────────────────────
mkdir -p $BASE/notify/src
cat > $BASE/notify/src/handler.ts << 'HEOF'
import { SQSEvent } from "aws-lambda";
import { SendEmailCommand } from "@aws-sdk/client-ses";
import { ses, getParam } from "/opt/nodejs/index";

type OrderMessage = {
  orderId: string; userId: string; email: string;
  total: number; items: { name: string; quantity: number; price: number }[];
};

export const handler = async (event: SQSEvent): Promise<void> => {
  const fromEmail = await getParam("/ecommerce/app/ses_from_email");
  for (const record of event.Records) {
    try {
      const order: OrderMessage = JSON.parse(record.body);
      const itemRows = order.items
        .map(i => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>$${i.price.toFixed(2)}</td></tr>`)
        .join("");
      await ses.send(new SendEmailCommand({
        Source: fromEmail,
        Destination: { ToAddresses: [order.email] },
        Message: {
          Subject: { Data: `Order Confirmed - #${order.orderId.slice(0,8).toUpperCase()}` },
          Body: { Html: { Data: `<h2>Thanks for your order!</h2><p>Order ID: <strong>${order.orderId}</strong></p><table border="1" cellpadding="8" style="border-collapse:collapse"><tr><th>Item</th><th>Qty</th><th>Price</th></tr>${itemRows}</table><p><strong>Total: $${order.total.toFixed(2)}</strong></p>` } },
        },
      }));
      console.log("Email sent for order", order.orderId);
    } catch (err) {
      console.error("Notify error:", record.messageId, err);
      throw err;
    }
  }
};
HEOF

# ── AUTH ─────────────────────────────────────────────────────────────────
mkdir -p $BASE/auth/src
cat > $BASE/auth/src/handler.ts << 'HEOF'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getDb, response } from "/opt/nodejs/index";
import { randomUUID } from "crypto";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (event.httpMethod === "OPTIONS") return response(200, {});
    const claims = event.requestContext?.authorizer?.jwt?.claims ?? {};
    const sub = claims.sub;
    const email = claims.email;
    const given_name  = claims.given_name ?? "";
    const family_name = claims.family_name ?? "";
    if (!sub || !email) return response(401, { error: "Unauthorized" });
    const db = await getDb();

    if (event.httpMethod === "POST") {
      await db.execute(
        `INSERT INTO users (id, cognito_sub, email, given_name, family_name)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           email = VALUES(email),
           given_name = VALUES(given_name),
           family_name = VALUES(family_name),
           updated_at = CURRENT_TIMESTAMP`,
        [randomUUID(), sub, email, given_name, family_name]
      );
      return response(200, { message: "User synced" });
    }

    if (event.httpMethod === "GET") {
      const [rows]: any = await db.execute(
        "SELECT id, email, given_name, family_name, created_at FROM users WHERE cognito_sub = ?",
        [sub]
      );
      if (!rows.length) return response(404, { error: "User not found - call POST /auth/sync first" });
      return response(200, rows[0]);
    }

    return response(405, { error: "Method not allowed" });
  } catch (err) {
    console.error("Auth error:", err);
    return response(500, { error: "Internal server error" });
  }
};
HEOF

echo "All handler files written"
