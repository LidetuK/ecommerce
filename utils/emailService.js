const nodemailer = require("nodemailer")
const logger = require("./logger")

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT === "465",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    logger.error("Email service error:", error)
  } else {
    logger.info("Email server is ready to take our messages")
  }
})

// Send email function
const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    }

    const info = await transporter.sendMail(mailOptions)
    logger.info(`Email sent: ${info.messageId}`)
    return info
  } catch (error) {
    logger.error("Error sending email:", error)
    throw new Error("Email could not be sent")
  }
}

// Email templates
const emailTemplates = {
  welcome: (name) => ({
    subject: "Welcome to Victoria Kids Baby Shop",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Victoria Kids Baby Shop!</h2>
        <p>Hello ${name},</p>
        <p>Thank you for creating an account with us. We're excited to have you as a customer!</p>
        <p>Browse our collection of high-quality baby products and enjoy your shopping experience.</p>
        <p>If you have any questions, feel free to contact our customer support.</p>
        <p>Best regards,<br>The Victoria Kids Team</p>
      </div>
    `,
  }),

  passwordReset: (resetUrl) => ({
    subject: "Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Please click the link below to set a new password:</p>
        <p><a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
        <p>Best regards,<br>The Victoria Kids Team</p>
      </div>
    `,
  }),

  orderConfirmation: (order) => ({
    subject: `Order Confirmation #${order.order_number}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Thank You for Your Order!</h2>
        <p>Hello ${order.user_name},</p>
        <p>Your order #${order.order_number} has been received and is being processed.</p>
        <h3>Order Summary:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background-color: #f2f2f2;">
            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Product</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Quantity</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Price</th>
          </tr>
          ${order.items
            .map(
              (item) => `
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${item.quantity}</td>
              <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">${item.price.toFixed(2)}</td>
            </tr>
          `,
            )
            .join("")}
          <tr>
            <td colspan="2" style="padding: 8px; text-align: right; border: 1px solid #ddd;"><strong>Subtotal:</strong></td>
            <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">${order.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 8px; text-align: right; border: 1px solid #ddd;"><strong>Shipping:</strong></td>
            <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">${order.shipping_cost.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 8px; text-align: right; border: 1px solid #ddd;"><strong>Tax:</strong></td>
            <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">${order.tax.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 8px; text-align: right; border: 1px solid #ddd;"><strong>Total:</strong></td>
            <td style="padding: 8px; text-align: right; border: 1px solid #ddd;"><strong>${order.total.toFixed(2)}</strong></td>
          </tr>
        </table>
        <h3>Shipping Address:</h3>
        <p>
          ${order.shipping_address.street}<br>
          ${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.zip}<br>
          ${order.shipping_address.country}
        </p>
        <p>We'll notify you when your order ships.</p>
        <p>Best regards,<br>The Victoria Kids Team</p>
      </div>
    `,
  }),

  shippingConfirmation: (order) => ({
    subject: `Your Order #${order.order_number} Has Shipped`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your Order Has Shipped!</h2>
        <p>Hello ${order.user_name},</p>
        <p>Great news! Your order #${order.order_number} has been shipped and is on its way to you.</p>
        <p>You can track your package using the following tracking number: <strong>${order.tracking_number}</strong></p>
        <p>Estimated delivery date: <strong>${order.estimated_delivery}</strong></p>
        <p>Thank you for shopping with Victoria Kids!</p>
        <p>Best regards,<br>The Victoria Kids Team</p>
      </div>
    `,
  }),

  newsletter: (campaign) => ({
    subject: campaign.subject,
    html: campaign.content,
  }),
}

module.exports = {
  sendEmail,
  emailTemplates,
}
