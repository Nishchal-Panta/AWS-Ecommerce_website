"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const shared_1 = require("./shared");
const TABLE = process.env.CARTS_TABLE ?? "ecommerce-carts";
const TTL_DAYS = 7;
const handler = async (event) => {
    try {
        if (event.httpMethod === "OPTIONS")
            return (0, shared_1.response)(200, {});
        const userId = event.requestContext?.authorizer?.jwt?.claims?.sub ?? null;
        if (!userId)
            return (0, shared_1.response)(401, { error: "Unauthorized" });
        const ttl = Math.floor(Date.now() / 1000) + TTL_DAYS * 86400;
        if (event.httpMethod === "GET") {
            const result = await shared_1.ddb.send(new lib_dynamodb_1.GetCommand({ TableName: TABLE, Key: { userId } }));
            return (0, shared_1.response)(200, result.Item ?? { userId, items: [], updatedAt: new Date().toISOString() });
        }
        if (event.httpMethod === "POST") {
            const body = JSON.parse(event.body ?? "{}");
            if (!body.productId || !body.quantity)
                return (0, shared_1.response)(400, { error: "productId and quantity required" });
            const existing = await shared_1.ddb.send(new lib_dynamodb_1.GetCommand({ TableName: TABLE, Key: { userId } }));
            const cart = existing.Item ?? { userId, items: [] };
            const items = cart.items ?? [];
            const idx = items.findIndex((i) => i.productId === body.productId);
            if (idx >= 0) {
                items[idx].quantity += body.quantity;
                if (items[idx].quantity <= 0)
                    items.splice(idx, 1);
            }
            else if (body.quantity > 0) {
                items.push(body);
            }
            const updated = { userId, items, updatedAt: new Date().toISOString(), ttl };
            await shared_1.ddb.send(new lib_dynamodb_1.PutCommand({ TableName: TABLE, Item: updated }));
            return (0, shared_1.response)(200, updated);
        }
        if (event.httpMethod === "DELETE") {
            await shared_1.ddb.send(new lib_dynamodb_1.DeleteCommand({ TableName: TABLE, Key: { userId } }));
            return (0, shared_1.response)(200, { message: "Cart cleared" });
        }
        return (0, shared_1.response)(405, { error: "Method not allowed" });
    }
    catch (err) {
        console.error("Cart error:", err);
        return (0, shared_1.response)(500, { error: "Internal server error" });
    }
};
exports.handler = handler;
