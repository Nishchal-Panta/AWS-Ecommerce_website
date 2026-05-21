import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getDb, response } from "./shared";
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
