import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { getDb, response } from "./shared";
import { randomUUID } from "crypto";

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const method = event.requestContext.http.method;
    if (method === "OPTIONS") return response(200, {});
    const claims = (event.requestContext as any).authorizer?.jwt?.claims ?? {};
    const sub = claims.sub as string;
    const email = claims.email as string;
    const given_name  = (claims.given_name  as string) ?? "";
    const family_name = (claims.family_name as string) ?? "";
    if (!sub || !email) return response(401, { error: "Unauthorized" });
    const db = await getDb();

    if (method === "POST") {
      await db.execute(
        `INSERT INTO users (id, cognito_sub, email, given_name, family_name)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           email=VALUES(email), given_name=VALUES(given_name),
           family_name=VALUES(family_name), updated_at=CURRENT_TIMESTAMP`,
        [randomUUID(), sub, email, given_name, family_name]
      );
      return response(200, { message: "User synced" });
    }
    if (method === "GET") {
      const [rows]: any = await db.execute(
        "SELECT id, email, given_name, family_name, created_at FROM users WHERE cognito_sub = ?", [sub]
      );
      if (!rows.length) return response(404, { error: "User not found" });
      return response(200, rows[0]);
    }
    return response(405, { error: "Method not allowed" });
  } catch (err) {
    console.error("Auth error:", err);
    return response(500, { error: "Internal server error" });
  }
};
