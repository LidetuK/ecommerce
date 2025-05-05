const pool = require("../config/db")
const asyncHandler = require("../utils/asyncHandler")
const { stripe, verifyWebhookSignature } = require("../config/stripe")
const logger = require("../utils/logger")

// @desc    Create payment session
// @route   POST /api/payments/create-session
// @access  Private
const createPaymentSession = asyncHandler(async (req, res) => {
  const { order_id } = req.body

  // Get order details
  const [orders] = await pool.query("SELECT * FROM orders WHERE id = ? AND user_id = ?", [order_id, req.user.id])

  if (orders.length === 0) {
    res.status(404)
    throw new Error("Order not found")
  }

  const order = orders[0]

  // Get order items
  const [items] = await pool.query(
    `
    SELECT oi.*, p.name, p.description
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `,
    [order_id],
  )

  // Create line items for Stripe
  const lineItems = items.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: item.name,
        description: item.description ? item.description.substring(0, 500) : undefined,
      },
      unit_amount: Math.round(item.price * 100), // Convert to cents
    },
    quantity: item.quantity,
  }))

  // Add shipping and tax as line items
  if (order.shipping_cost > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Shipping",
        },
        unit_amount: Math.round(order.shipping_cost * 100),
      },
      quantity: 1,
    })
  }

  if (order.tax > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Tax",
        },
        unit_amount: Math.round(order.tax * 100),
      },
      quantity: 1,
    })
  }

  // Create Stripe session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
    customer_email: req.user.email,
    client_reference_id: order.order_number,
    metadata: {
      order_id: order.id,
      order_number: order.order_number,
    },
  })

  // Update order with session ID
  await pool.query("UPDATE orders SET payment_session_id = ? WHERE id = ?", [session.id, order_id])

  res.json({
    sessionId: session.id,
    url: session.url,
  })
})

// @desc    Handle Stripe webhook
// @route   POST /api/payments/webhook
// @access  Public
const handleWebhook = asyncHandler(async (req, res) => {
  let event

  try {
    event = verifyWebhookSignature(req)
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`)
    return
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object

      // Update order payment status
      if (session.metadata && session.metadata.order_id) {
        await pool.query("UPDATE orders SET payment_status = ?, payment_intent_id = ? WHERE id = ?", [
          "paid",
          session.payment_intent,
          session.metadata.order_id,
        ])

        logger.info(`Payment completed for order ${session.metadata.order_number}`)
      }
      break

    case "payment_intent.payment_failed":
      const paymentIntent = event.data.object
      logger.error(`Payment failed: ${paymentIntent.last_payment_error?.message}`)
      break

    default:
      // Unexpected event type
      logger.info(`Unhandled event type ${event.type}`)
  }

  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true })
})

// @desc    Get payment status
// @route   GET /api/payments/status/:paymentId
// @access  Private
const getPaymentStatus = asyncHandler(async (req, res) => {
  const { paymentId } = req.params

  // Get order by payment intent or session ID
  const [orders] = await pool.query(
    `
    SELECT * FROM orders 
    WHERE (payment_intent_id = ? OR payment_session_id = ?) AND user_id = ?
  `,
    [paymentId, paymentId, req.user.id],
  )

  if (orders.length === 0) {
    res.status(404)
    throw new Error("Payment not found")
  }

  const order = orders[0]

  res.json({
    order_id: order.id,
    order_number: order.order_number,
    payment_status: order.payment_status,
    total: order.total,
  })
})

module.exports = {
  createPaymentSession,
  handleWebhook,
  getPaymentStatus,
}
