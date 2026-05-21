"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_ses_1 = require("@aws-sdk/client-ses");
const shared_1 = require("./shared");
const handler = async (event) => {
    const fromEmail = await (0, shared_1.getParam)("/ecommerce/app/ses_from_email");
    for (const record of event.Records) {
        try {
            const order = JSON.parse(record.body);
            const itemRows = order.items
                .map(i => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>$${i.price.toFixed(2)}</td></tr>`)
                .join("");
            await shared_1.ses.send(new client_ses_1.SendEmailCommand({
                Source: fromEmail,
                Destination: { ToAddresses: [order.email] },
                Message: {
                    Subject: { Data: `Order Confirmed - #${order.orderId.slice(0, 8).toUpperCase()}` },
                    Body: { Html: { Data: `<h2>Thanks for your order!</h2><p>Order ID: <strong>${order.orderId}</strong></p><table border="1" cellpadding="8" style="border-collapse:collapse"><tr><th>Item</th><th>Qty</th><th>Price</th></tr>${itemRows}</table><p><strong>Total: $${order.total.toFixed(2)}</strong></p>` } },
                },
            }));
            console.log("Email sent for order", order.orderId);
        }
        catch (err) {
            console.error("Notify error:", record.messageId, err);
            throw err;
        }
    }
};
exports.handler = handler;
