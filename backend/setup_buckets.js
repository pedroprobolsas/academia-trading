require('dotenv').config();
const { minioClientMedia } = require('./config/minioClient');

const BUCKETS = [
  'academia-trading-audios',
  'academia-trading-imagenes-modulos'
];

const policy = {
  Version: "2012-10-17",
  Statement: [
    {
      Action: ["s3:GetObject"],
      Effect: "Allow",
      Principal: { AWS: ["*"] },
      Resource: BUCKETS.map(b => `arn:aws:s3:::${b}/*`),
    }
  ]
};

async function setup() {
  console.log("Iniciando creación automática de buckets en MinIO...");
  
  for (const bucket of BUCKETS) {
    try {
      const exists = await minioClientMedia.bucketExists(bucket);
      if (!exists) {
        await minioClientMedia.makeBucket(bucket, 'us-east-1');
        console.log(`✅ Bucket creado: ${bucket}`);
      } else {
        console.log(`✅ Bucket ya existía: ${bucket}`);
      }
      
      // Aplicar política de lectura pública para que los estudiantes puedan ver las imágenes/audios
      const bucketPolicy = { ...policy };
      bucketPolicy.Statement[0].Resource = [`arn:aws:s3:::${bucket}/*`];
      await minioClientMedia.setBucketPolicy(bucket, JSON.stringify(bucketPolicy));
      console.log(`✅ Política pública aplicada a: ${bucket}`);
      
    } catch (error) {
      console.error(`❌ Error configurando ${bucket}:`, error.message);
    }
  }
  console.log("\n¡Infraestructura MinIO lista! Ya puedes subir archivos desde el backend.");
}

setup();
