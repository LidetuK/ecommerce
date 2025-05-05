const admin = require("firebase-admin")
const { v4: uuidv4 } = require("uuid")

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
})

const bucket = admin.storage().bucket()

// Upload file to Firebase Storage
const uploadFile = async (file, folder = "products") => {
  try {
    if (!file) return null

    const fileName = `${folder}/${uuidv4()}-${file.originalname}`
    const fileUpload = bucket.file(fileName)

    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    })

    return new Promise((resolve, reject) => {
      blobStream.on("error", (error) => {
        reject(error)
      })

      blobStream.on("finish", async () => {
        // Make the file public
        await fileUpload.makePublic()

        // Get the public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`
        resolve(publicUrl)
      })

      blobStream.end(file.buffer)
    })
  } catch (error) {
    throw new Error(`Error uploading file: ${error.message}`)
  }
}

// Delete file from Firebase Storage
const deleteFile = async (fileUrl) => {
  try {
    if (!fileUrl) return

    const fileName = fileUrl.split(`${bucket.name}/`)[1]
    if (!fileName) return

    await bucket.file(fileName).delete()
  } catch (error) {
    throw new Error(`Error deleting file: ${error.message}`)
  }
}

module.exports = {
  uploadFile,
  deleteFile,
}
