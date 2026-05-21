import { SQSEvent } from "aws-lambda";
import { SendEmailCommand } from "@aws-sdk/client-ses";
import { ses, getParam } from "./shared";

type OrderMessage = {
  orderId: string; userId: string; email: string;
  total: number; items: { name: string; quantity: number; price: number }[];
};

export const handler = async (event: SQSEvent): Promise<void> => {
  const fromEmail = await getParam("/ecommerce/app/ses_from_email");
  for (const record of event.Records) {
    try {
      const order: OrderMessage = JSON.parse(record.body);
      const itemRows = order.items
        .map(i => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>$${i.price.toFixed(2)}</td></tr>`)
        .join("");
      await ses.send(new SendEmailCommand({
        Source: fromEmail,
        Destination: { ToAddresses: [order.email] },
        Message: {
          Subject: { Data: `Order Confirmed - #${order.orderId.slice(0,8).toUpperCase()}` },
          Body: { Html: { Data: `<h2>Thanks for your order!</h2><p>Order ID: <strong>${order.orderId}</strong></p><table border="1" cellpadding="8" style="border-collapse:collapse"><tr><th>Item</th><th>Qty</th><th>Price</th></tr>${itemRows}</table><p><strong>Total: $${order.total.toFixed(2)}</strong></p>` } },
        },
      }));
      console.log("Email sent for order", order.orderId);
    } catch (err) {
      console.error("Notify error:", record.messageId, err);
      throw err;
    }
  }
};
