"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const shared_1 = require("./shared");
const crypto_1 = require("crypto");
const handler = async (event) => {
    try {
        if (event.httpMethod === "OPTIONS")
            return (0, shared_1.response)(200, {});
        const claims = event.requestContext?.authorizer?.jwt?.claims ?? {};
        const sub = claims.sub;
        const email = claims.email;
        const given_name = claims.given_name ?? "";
        const family_name = claims.family_name ?? "";
        if (!sub || !email)
            return (0, shared_1.response)(401, { error: "Unauthorized" });
        const db = await (0, shared_1.getDb)();
        if (event.httpMethod === "POST") {
            await db.execute(`INSERT INTO users (id, cognito_sub, email, given_name, family_name)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           email = VALUES(email),
           given_name = VALUES(given_name),
           family_name = VALUES(family_name),
           updated_at = CURRENT_TIMESTAMP`, [(0, crypto_1.randomUUID)(), sub, email, given_name, family_name]);
            return (0, shared_1.response)(200, { message: "User synced" });
        }
        if (event.httpMethod === "GET") {
            const [rows] = await db.execute("SELECT id, email, given_name, family_name, created_at FROM users WHERE cognito_sub = ?", [sub]);
            if (!rows.length)
                return (0, shared_1.response)(404, { error: "User not found - call POST /auth/sync first" });
            return (0, shared_1.response)(200, rows[0]);
        }
        return (0, shared_1.response)(405, { error: "Method not allowed" });
    }
    catch (err) {
        console.error("Auth error:", err);
        return (0, shared_1.response)(500, { error: "Internal server error" });
    }
};
exports.handler = handler;
