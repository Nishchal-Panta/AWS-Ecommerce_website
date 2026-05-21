import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { sqs, ddb, getDb, getParam, response } from "./shared";
import { randomUUID } from "crypto";

const CARTS_TABLE = process.env.CARTS_TABLE ?? "ecommerce-carts";
type OrderItem = { productId: string; name: string; price: number; quantity: number; };

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const method = event.requestContext.http.method;
    if (method === "OPTIONS") return response(200, {});
    const claims = (event.requestContext as any).authorizer?.jwt?.claims ?? {};
    const userId = claims.sub as string;
    const email  = claims.email as string;
    if (!userId) return response(401, { error: "Unauthorized" });
    const db = await getDb();
    const id = event.pathParameters?.id;

    if (method === "GET" && !id) {
      const [rows] = await db.execute("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC", [userId]);
      return response(200, { orders: rows });
    }
    if (method === "GET" && id) {
      const [rows]: any = await db.execute("SELECT * FROM orders WHERE id = ? AND user_id = ?", [id, userId]);
      if (!rows.length) return response(404, { error: "Order not found" });
      const [items]: any = await db.execute("SELECT * FROM order_items WHERE order_id = ?", [id]);
      return response(200, { ...rows[0], items });
    }
    if (method === "POST") {
      const body = JSON.parse(event.body ?? "{}");
      const items: OrderItem[] = body.items;
      if (!items?.length) return response(400, { error: "Order must have at least one item" });
      const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
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
