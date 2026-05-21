import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { PutCommand, GetCommand, DeleteCommand, ScanCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, response } from "./shared";
import { randomUUID } from "crypto";

const TABLE = process.env.PRODUCTS_TABLE ?? "ecommerce-products";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const method = event.httpMethod;
    const id = event.pathParameters?.id;
    if (method === "OPTIONS") return response(200, {});

    if (method === "GET" && !id) {
      const category = event.queryStringParameters?.category;
      if (category) {
        const result = await ddb.send(new QueryCommand({
          TableName: TABLE,
          IndexName: "category-index",
          KeyConditionExpression: "category = :cat",
          ExpressionAttributeValues: { ":cat": category },
        }));
        return response(200, { products: result.Items ?? [] });
      }
      const result = await ddb.send(new ScanCommand({ TableName: TABLE }));
      return response(200, { products: result.Items ?? [] });
    }

    if (method === "GET" && id) {
      const result = await ddb.send(new GetCommand({ TableName: TABLE, Key: { id } }));
      if (!result.Item) return response(404, { error: "Product not found" });
      return response(200, result.Item);
    }

    if (method === "POST") {
      const claims = event.requestContext?.authorizer?.jwt?.claims ?? {};
      const groups: string[] = JSON.parse(claims["cognito:groups"] ?? "[]");
      if (!groups.includes("admin")) return response(403, { error: "Admin only" });
      const body = JSON.parse(event.body ?? "{}");
      if (!body.name || !body.price || !body.category) return response(400, { error: "name, price and category required" });
      const product = {
        id: randomUUID(), name: body.name, description: body.description ?? "",
        price: Number(body.price), category: body.category, imageUrl: body.imageUrl ?? "",
        stock: Number(body.stock ?? 0), active: true,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      await ddb.send(new PutCommand({ TableName: TABLE, Item: product }));
      return response(201, product);
    }

    if (method === "PUT" && id) {
      const claims = event.requestContext?.authorizer?.jwt?.claims ?? {};
      const groups: string[] = JSON.parse(claims["cognito:groups"] ?? "[]");
      if (!groups.includes("admin")) return response(403, { error: "Admin only" });
      const body = JSON.parse(event.body ?? "{}");
      const expr: string[] = [];
      const names: Record<string,string> = {};
      const values: Record<string,unknown> = {};
      for (const [k, v] of Object.entries(body)) {
        if (["id","createdAt"].includes(k)) continue;
        expr.push(`#${k} = :${k}`); names[`#${k}`] = k; values[`:${k}`] = v;
      }
      expr.push("#updatedAt = :updatedAt");
      names["#updatedAt"] = "updatedAt";
      values[":updatedAt"] = new Date().toISOString();
      const result = await ddb.send(new UpdateCommand({
        TableName: TABLE, Key: { id },
        UpdateExpression: `SET ${expr.join(", ")}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: "ALL_NEW",
      }));
      return response(200, result.Attributes);
    }

    if (method === "DELETE" && id) {
      const claims = event.requestContext?.authorizer?.jwt?.claims ?? {};
      const groups: string[] = JSON.parse(claims["cognito:groups"] ?? "[]");
      if (!groups.includes("admin")) return response(403, { error: "Admin only" });
      await ddb.send(new DeleteCommand({ TableName: TABLE, Key: { id } }));
      return response(200, { message: "Product deleted" });
    }

    return response(405, { error: "Method not allowed" });
  } catch (err) {
    console.error("Products error:", err);
    return response(500, { error: "Internal server error" });
  }
};
