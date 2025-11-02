import dotenv from "dotenv"
dotenv.config()

export const config = {
  database: {
    url: process.env.DB_URI,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: "7d",
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
}

export default config
