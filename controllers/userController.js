const bcrypt = require("bcryptjs")
const pool = require("../config/db")
const asyncHandler = require("../utils/asyncHandler")

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const [rows] = await pool.query("SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?", [
    req.user.id,
  ])

  if (rows.length === 0) {
    res.status(404)
    throw new Error("User not found")
  }

  res.json(rows[0])
})

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body

  // Get user
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [req.user.id])

  if (rows.length === 0) {
    res.status(404)
    throw new Error("User not found")
  }

  const user = rows[0]

  // Check if email is already taken by another user
  if (email && email !== user.email) {
    const [existingUsers] = await pool.query("SELECT * FROM users WHERE email = ? AND id != ?", [email, req.user.id])

    if (existingUsers.length > 0) {
      res.status(400)
      throw new Error("Email already in use")
    }
  }

  // Update user fields
  const updatedUser = {
    name: name || user.name,
    email: email || user.email,
    phone: phone || user.phone,
  }

  // If password is provided, hash it
  if (password) {
    const salt = await bcrypt.genSalt(10)
    updatedUser.password = await bcrypt.hash(password, salt)
  }

  // Update user in database
  await pool.query(
    "UPDATE users SET name = ?, email = ?, phone = ? " + (password ? ", password = ? " : "") + "WHERE id = ?",
    password
      ? [updatedUser.name, updatedUser.email, updatedUser.phone, updatedUser.password, req.user.id]
      : [updatedUser.name, updatedUser.email, updatedUser.phone, req.user.id],
  )

  // Return updated user (without password)
  res.json({
    id: req.user.id,
    name: updatedUser.name,
    email: updatedUser.email,
    phone: updatedUser.phone,
    role: user.role,
  })
})

// @desc    Get user addresses
// @route   GET /api/users/addresses
// @access  Private
const getUserAddresses = asyncHandler(async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM user_addresses WHERE user_id = ?", [req.user.id])

  res.json(rows)
})

// @desc    Add new address
// @route   POST /api/users/addresses
// @access  Private
const addUserAddress = asyncHandler(async (req, res) => {
  const { street, city, state, zip, country, is_default } = req.body

  // If this address is set as default, unset any existing default
  if (is_default) {
    await pool.query("UPDATE user_addresses SET is_default = 0 WHERE user_id = ?", [req.user.id])
  }

  // Add new address
  const [result] = await pool.query(
    "INSERT INTO user_addresses (user_id, street, city, state, zip, country, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [req.user.id, street, city, state, zip, country, is_default ? 1 : 0],
  )

  if (result.affectedRows === 1) {
    const [newAddress] = await pool.query("SELECT * FROM user_addresses WHERE id = ?", [result.insertId])

    res.status(201).json(newAddress[0])
  } else {
    res.status(400)
    throw new Error("Invalid address data")
  }
})

// @desc    Update address
// @route   PUT /api/users/addresses/:id
// @access  Private
const updateUserAddress = asyncHandler(async (req, res) => {
  const { street, city, state, zip, country, is_default } = req.body
  const addressId = req.params.id

  // Check if address belongs to user
  const [existingAddress] = await pool.query("SELECT * FROM user_addresses WHERE id = ? AND user_id = ?", [
    addressId,
    req.user.id,
  ])

  if (existingAddress.length === 0) {
    res.status(404)
    throw new Error("Address not found")
  }

  // If this address is set as default, unset any existing default
  if (is_default) {
    await pool.query("UPDATE user_addresses SET is_default = 0 WHERE user_id = ?", [req.user.id])
  }

  // Update address
  await pool.query(
    "UPDATE user_addresses SET street = ?, city = ?, state = ?, zip = ?, country = ?, is_default = ? WHERE id = ?",
    [street, city, state, zip, country, is_default ? 1 : 0, addressId],
  )

  // Get updated address
  const [updatedAddress] = await pool.query("SELECT * FROM user_addresses WHERE id = ?", [addressId])

  res.json(updatedAddress[0])
})

// @desc    Delete address
// @route   DELETE /api/users/addresses/:id
// @access  Private
const deleteUserAddress = asyncHandler(async (req, res) => {
  const addressId = req.params.id

  // Check if address belongs to user
  const [existingAddress] = await pool.query("SELECT * FROM user_addresses WHERE id = ? AND user_id = ?", [
    addressId,
    req.user.id,
  ])

  if (existingAddress.length === 0) {
    res.status(404)
    throw new Error("Address not found")
  }

  // Delete address
  await pool.query("DELETE FROM user_addresses WHERE id = ?", [addressId])

  res.json({ message: "Address removed" })
})

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
}
