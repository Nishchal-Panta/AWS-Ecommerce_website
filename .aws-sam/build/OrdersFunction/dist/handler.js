"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_sqs_1 = require("@aws-sdk/client-sqs");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const shared_1 = require("./shared");
const crypto_1 = require("crypto");
const CARTS_TABLE = process.env.CARTS_TABLE ?? "ecommerce-carts";
const handler = async (event) => {
    try {
        const method = event.requestContext.http.method;
        if (method === "OPTIONS")
            return (0, shared_1.response)(200, {});
        const claims = event.requestContext.authorizer?.jwt?.claims ?? {};
        const userId = claims.sub;
        const email = claims.email;
        if (!userId)
            return (0, shared_1.response)(401, { error: "Unauthorized" });
        const db = await (0, shared_1.getDb)();
        const id = event.pathParameters?.id;
        if (method === "GET" && !id) {
            const [rows] = await db.execute("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC", [userId]);
            return (0, shared_1.response)(200, { orders: rows });
        }
        if (method === "GET" && id) {
            const [rows] = await db.execute("SELECT * FROM orders WHERE id = ? AND user_id = ?", [id, userId]);
            if (!rows.length)
                return (0, shared_1.response)(404, { error: "Order not found" });
            const [items] = await db.execute("SELECT * FROM order_items WHERE order_id = ?", [id]);
            return (0, shared_1.response)(200, { ...rows[0], items });
        }
        if (method === "POST") {
            const body = JSON.parse(event.body ?? "{}");
            const items = body.items;
            if (!items?.length)
                return (0, shared_1.response)(400, { error: "Order must have at least one item" });
            const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
            const orderId = (0, crypto_1.randomUUID)();
            await db.execute("INSERT INTO orders (id, user_id, status, total, currency) VALUES (?, ?, 'pending', ?, 'USD')", [orderId, userId, total]);
            for (const item of items) {
                await db.execute("INSERT INTO order_items (id, order_id, product_id, name, price, quantity) VALUES (?, ?, ?, ?, ?, ?)", [(0, crypto_1.randomUUID)(), orderId, item.productId, item.name, item.price, item.quantity]);
            }
            await shared_1.ddb.send(new lib_dynamodb_1.DeleteCommand({ TableName: CARTS_TABLE, Key: { userId } }));
            const queueUrl = await (0, shared_1.getParam)("/ecommerce/app/orders_queue_url");
            await shared_1.sqs.send(new client_sqs_1.SendMessageCommand({
                QueueUrl: queueUrl,
                MessageBody: JSON.stringify({ orderId, userId, email, total, items }),
            }));
            return (0, shared_1.response)(201, { orderId, total, status: "pending" });
        }
        return (0, shared_1.response)(405, { error: "Method not allowed" });
    }
    catch (err) {
        console.error("Orders error:", err);
        return (0, shared_1.response)(500, { error: "Internal server error" });
    }
};
exports.handler = handler;
