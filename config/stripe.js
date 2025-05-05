const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
const logger = require("../utils/logger")

// Create a payment intent
const createPaymentIntent = async (amount, currency = "usd", metadata = {}) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata,
    })

    return paymentIntent
  } catch (error) {
    logger.error("Error creating payment intent:", error)
    throw new Error(`Payment processing error: ${error.message}`)
  }
}

// Verify webhook signature
const verifyWebhookSignature = (req) => {
  const signature = req.headers["stripe-signature"]

  try {
    const event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET)

    return event
  } catch (error) {
    logger.error("Webhook signature verification failed:", error)
    throw new Error(`Webhook signature verification failed: ${error.message}`)
  }
}

module.exports = {
  stripe,
  createPaymentIntent,
  verifyWebhookSignature,
}
