const Minio = require('minio');
require('dotenv').config();

const baseConfig = {
  endPoint: process.env.MINIO_ENDPOINT || 'ippminioback.probolsas.co',
  port: parseInt(process.env.MINIO_PORT) || 443,
  useSSL: process.env.MINIO_USE_SSL === 'true' || true,
};

const minioClientCapturas = new Minio.Client({
  ...baseConfig,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY
});

const minioClientMedia = new Minio.Client({
  ...baseConfig,
  accessKey: process.env.MINIO_MEDIA_ACCESS_KEY || process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_MEDIA_SECRET_KEY || process.env.MINIO_SECRET_KEY
});

module.exports = { minioClientCapturas, minioClientMedia };
