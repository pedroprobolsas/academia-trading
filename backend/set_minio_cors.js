require('dotenv').config();
const { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  endpoint: `https://${process.env.MINIO_ENDPOINT}`,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY
  },
  forcePathStyle: true // Needed for MinIO
});

const corsRules = {
  CORSRules: [
    {
      AllowedHeaders: ["*"],
      AllowedMethods: ["GET", "PUT", "POST", "HEAD"],
      AllowedOrigins: ["http://localhost:5173", "https://academia.pedrosandoval.com.co"],
      ExposeHeaders: []
    }
  ]
};

const run = async () => {
  try {
    const bucket = process.env.MINIO_BUCKET;
    console.log(`Setting CORS for bucket: ${bucket}...`);
    
    await s3Client.send(new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: corsRules
    }));
    
    console.log("CORS set successfully.");
    
    const getCors = await s3Client.send(new GetBucketCorsCommand({ Bucket: bucket }));
    console.log("Current CORS Configuration:", JSON.stringify(getCors.CORSRules, null, 2));

  } catch (err) {
    console.error("Error setting CORS:", err);
  }
};

run();
