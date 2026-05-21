import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, response } from "./shared";

const TABLE = process.env.CARTS_TABLE ?? "ecommerce-carts";
const TTL_DAYS = 7;
type CartItem = { productId: string; name: string; price: number; quantity: number; imageUrl?: string; };

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const method = event.requestContext.http.method;
    if (method === "OPTIONS") return response(200, {});
    const userId = (event.requestContext as any).authorizer?.jwt?.claims?.sub as string ?? null;
    if (!userId) return response(401, { error: "Unauthorized" });
    const ttl = Math.floor(Date.now() / 1000) + TTL_DAYS * 86400;

    if (method === "GET") {
      const result = await ddb.send(new GetCommand({ TableName: TABLE, Key: { userId } }));
      return response(200, result.Item ?? { userId, items: [], updatedAt: new Date().toISOString() });
    }
    if (method === "POST") {
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
    if (method === "DELETE") {
      await ddb.send(new DeleteCommand({ TableName: TABLE, Key: { userId } }));
      return response(200, { message: "Cart cleared" });
    }
    return response(405, { error: "Method not allowed" });
  } catch (err) {
    console.error("Cart error:", err);
    return response(500, { error: "Internal server error" });
  }
};
