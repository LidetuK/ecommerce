const pool = require("../config/db")
const asyncHandler = require("../utils/asyncHandler")
const { sendEmail, emailTemplates } = require("../utils/emailService")
const logger = require("../utils/logger")

// @desc    Subscribe to newsletter
// @route   POST /api/newsletter/subscribe
// @access  Public
const subscribeToNewsletter = asyncHandler(async (req, res) => {
  const { email, name, source = "Website" } = req.body

  // Check if already subscribed
  const [existingSubscribers] = await pool.query("SELECT * FROM newsletter_subscribers WHERE email = ?", [email])

  if (existingSubscribers.length > 0) {
    // If unsubscribed before, update status to active
    if (existingSubscribers[0].status === "unsubscribed") {
      await pool.query("UPDATE newsletter_subscribers SET status = ?, name = ?, source = ? WHERE id = ?", [
        "active",
        name || existingSubscribers[0].name,
        source,
        existingSubscribers[0].id,
      ])

      res.json({ message: "Successfully resubscribed to newsletter" })
    } else {
      res.status(400)
      throw new Error("Email already subscribed to newsletter")
    }
  } else {
    // Add new subscriber
    const [result] = await pool.query(
      "INSERT INTO newsletter_subscribers (email, name, status, source) VALUES (?, ?, ?, ?)",
      [email, name, "active", source],
    )

    if (result.affectedRows === 1) {
      // Send welcome email
      try {
        await sendEmail({
          to: email,
          subject: "Welcome to Victoria Kids Newsletter",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Thank You for Subscribing!</h2>
              <p>Hello ${name || "there"},</p>
              <p>Thank you for subscribing to our newsletter. You'll now receive updates on our latest products, promotions, and more!</p>
              <p>Best regards,<br>The Victoria Kids Team</p>
            </div>
          `,
        })
      } catch (error) {
        logger.error("Error sending newsletter welcome email:", error)
        // Continue even if email fails
      }

      res.status(201).json({ message: "Successfully subscribed to newsletter" })
    } else {
      res.status(400)
      throw new Error("Failed to subscribe to newsletter")
    }
  }
})

// @desc    Unsubscribe from newsletter
// @route   POST /api/newsletter/unsubscribe
// @access  Public
const unsubscribeFromNewsletter = asyncHandler(async (req, res) => {
  const { email } = req.body

  // Check if subscribed
  const [existingSubscribers] = await pool.query("SELECT * FROM newsletter_subscribers WHERE email = ?", [email])

  if (existingSubscribers.length === 0) {
    res.status(404)
    throw new Error("Email not found in newsletter subscribers")
  }

  // Update status to unsubscribed
  await pool.query("UPDATE newsletter_subscribers SET status = ? WHERE email = ?", ["unsubscribed", email])

  res.json({ message: "Successfully unsubscribed from newsletter" })
})

// @desc    Get all newsletter subscribers (admin)
// @route   GET /api/admin/newsletter/subscribers
// @access  Private/Admin
const getAllSubscribers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, search, sort = "newest" } = req.query

  // Build query conditions
  const conditions = ["1=1"] // Always true condition to start with
  const params = []

  if (status) {
    conditions.push("status = ?")
    params.push(status)
  }

  if (search) {
    conditions.push("(email LIKE ? OR name LIKE ?)")
    params.push(`%${search}%`, `%${search}%`)
  }

  // Build sort order
  let sortOrder
  switch (sort) {
    case "oldest":
      sortOrder = "date_subscribed ASC"
      break
    case "email_asc":
      sortOrder = "email ASC"
      break
    case "email_desc":
      sortOrder = "email DESC"
      break
    case "newest":
    default:
      sortOrder = "date_subscribed DESC"
  }

  // Calculate pagination
  const offset = (page - 1) * limit

  // Get total count for pagination
  const countQuery = `
    SELECT COUNT(*) as total
    FROM newsletter_subscribers
    WHERE ${conditions.join(" AND ")}
  `

  const [countResult] = await pool.query(countQuery, params)
  const total = countResult[0].total
  const totalPages = Math.ceil(total / limit)

  // Get subscribers
  const query = `
    SELECT *
    FROM newsletter_subscribers
    WHERE ${conditions.join(" AND ")}
    ORDER BY ${sortOrder}
    LIMIT ? OFFSET ?
  `

  const [subscribers] = await pool.query(query, [...params, Number.parseInt(limit), offset])

  res.json({
    subscribers,
    page: Number.parseInt(page),
    pages: totalPages,
    total,
  })
})

// @desc    Create and send newsletter campaign
// @route   POST /api/admin/newsletter/campaign
// @access  Private/Admin
const createCampaign = asyncHandler(async (req, res) => {
  const { name, subject, content } = req.body

  // Start a transaction
  const connection = await pool.getConnection()
  await connection.beginTransaction()

  try {
    // Create campaign
    const [result] = await connection.query(
      "INSERT INTO newsletter_campaigns (name, subject, content, status) VALUES (?, ?, ?, ?)",
      [name, subject, content, "draft"],
    )

    const campaignId = result.insertId

    // Get active subscribers
    const [subscribers] = await connection.query("SELECT * FROM newsletter_subscribers WHERE status = ?", ["active"])

    // Send campaign to all active subscribers
    let sentCount = 0
    for (const subscriber of subscribers) {
      try {
        await sendEmail({
          to: subscriber.email,
          subject,
          html: content,
        })
        sentCount++
      } catch (error) {
        logger.error(`Error sending campaign to ${subscriber.email}:`, error)
        // Continue with other subscribers even if one fails
      }
    }

    // Update campaign status and stats
    await connection.query(
      "UPDATE newsletter_campaigns SET status = ?, sent_date = NOW(), recipients = ? WHERE id = ?",
      ["sent", sentCount, campaignId],
    )

    // Commit transaction
    await connection.commit()

    res.status(201).json({
      message: "Campaign created and sent successfully",
      sent_to: sentCount,
      total_subscribers: subscribers.length,
    })
  } catch (error) {
    // Rollback transaction on error
    await connection.rollback()
    logger.error("Error creating campaign:", error)
    res.status(500)
    throw new Error("Failed to create and send campaign")
  } finally {
    connection.release()
  }
})

module.exports = {
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
  getAllSubscribers,
  createCampaign,
}
