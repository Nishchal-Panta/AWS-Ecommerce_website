"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const shared_1 = require("./shared");
const crypto_1 = require("crypto");
const TABLE = process.env.PRODUCTS_TABLE ?? "ecommerce-products";
const handler = async (event) => {
    try {
        const method = event.requestContext.http.method;
        const id = event.pathParameters?.id;
        if (method === "OPTIONS")
            return (0, shared_1.response)(200, {});
        if (method === "GET" && !id) {
            const category = event.queryStringParameters?.category;
            if (category) {
                const result = await shared_1.ddb.send(new lib_dynamodb_1.QueryCommand({
                    TableName: TABLE,
                    IndexName: "category-index",
                    KeyConditionExpression: "category = :cat",
                    ExpressionAttributeValues: { ":cat": category },
                }));
                return (0, shared_1.response)(200, { products: result.Items ?? [] });
            }
            const result = await shared_1.ddb.send(new lib_dynamodb_1.ScanCommand({ TableName: TABLE }));
            return (0, shared_1.response)(200, { products: result.Items ?? [] });
        }
        if (method === "GET" && id) {
            const result = await shared_1.ddb.send(new lib_dynamodb_1.GetCommand({ TableName: TABLE, Key: { id } }));
            if (!result.Item)
                return (0, shared_1.response)(404, { error: "Product not found" });
            return (0, shared_1.response)(200, result.Item);
        }
        if (method === "POST") {
            const claims = event.requestContext.authorizer?.jwt?.claims ?? {};
            const groups = JSON.parse(claims["cognito:groups"] ?? "[]");
            if (!groups.includes("admin"))
                return (0, shared_1.response)(403, { error: "Admin only" });
            const body = JSON.parse(event.body ?? "{}");
            if (!body.name || !body.price || !body.category)
                return (0, shared_1.response)(400, { error: "name, price and category required" });
            const product = {
                id: (0, crypto_1.randomUUID)(), name: body.name, description: body.description ?? "",
                price: Number(body.price), category: body.category, imageUrl: body.imageUrl ?? "",
                stock: Number(body.stock ?? 0), active: true,
                createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
            };
            await shared_1.ddb.send(new lib_dynamodb_1.PutCommand({ TableName: TABLE, Item: product }));
            return (0, shared_1.response)(201, product);
        }
        if (method === "PUT" && id) {
            const claims = event.requestContext.authorizer?.jwt?.claims ?? {};
            const groups = JSON.parse(claims["cognito:groups"] ?? "[]");
            if (!groups.includes("admin"))
                return (0, shared_1.response)(403, { error: "Admin only" });
            const body = JSON.parse(event.body ?? "{}");
            const expr = [];
            const names = {};
            const values = {};
            for (const [k, v] of Object.entries(body)) {
                if (["id", "createdAt"].includes(k))
                    continue;
                expr.push(`#${k} = :${k}`);
                names[`#${k}`] = k;
                values[`:${k}`] = v;
            }
            expr.push("#updatedAt = :updatedAt");
            names["#updatedAt"] = "updatedAt";
            values[":updatedAt"] = new Date().toISOString();
            const result = await shared_1.ddb.send(new lib_dynamodb_1.UpdateCommand({
                TableName: TABLE, Key: { id },
                UpdateExpression: `SET ${expr.join(", ")}`,
                ExpressionAttributeNames: names,
                ExpressionAttributeValues: values,
                ReturnValues: "ALL_NEW",
            }));
            return (0, shared_1.response)(200, result.Attributes);
        }
        if (method === "DELETE" && id) {
            const claims = event.requestContext.authorizer?.jwt?.claims ?? {};
            const groups = JSON.parse(claims["cognito:groups"] ?? "[]");
            if (!groups.includes("admin"))
                return (0, shared_1.response)(403, { error: "Admin only" });
            await shared_1.ddb.send(new lib_dynamodb_1.DeleteCommand({ TableName: TABLE, Key: { id } }));
            return (0, shared_1.response)(200, { message: "Product deleted" });
        }
        return (0, shared_1.response)(405, { error: "Method not allowed" });
    }
    catch (err) {
        console.error("Products error:", err);
        return (0, shared_1.response)(500, { error: "Internal server error" });
    }
};
exports.handler = handler;
