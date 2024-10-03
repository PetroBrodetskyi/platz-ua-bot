import paypal from "@paypal/checkout-server-sdk";

export const createPayPalPayment = async (amount) => {
  const environment =
    process.env.PAYPAL_ENVIRONMENT === "live"
      ? new paypal.core.LiveEnvironment(
          process.env.PAYPAL_CLIENT_ID,
          process.env.PAYPAL_CLIENT_SECRET
        )
      : new paypal.core.SandboxEnvironment(
          process.env.PAYPAL_CLIENT_ID,
          process.env.PAYPAL_CLIENT_SECRET
        );

  const client = new paypal.core.PayPalHttpClient(environment);

  const request = new paypal.orders.OrdersCreateRequest();
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "EUR",
          value: amount.toString(),
        },
      },
    ],
  });

  try {
    const order = await client.execute(request);
    return order.result.id; // Return the order ID for further processing
  } catch (error) {
    console.error("Error creating PayPal payment:", error);
    throw error; // Rethrow the error to handle it in your main bot logic
  }
};
