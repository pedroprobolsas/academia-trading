$MINIO_ACCESS_KEY = "PON_AQUI_TU_SECRET_DE_GITHUB"
$MINIO_SECRET_KEY = "PON_AQUI_TU_SECRET_DE_GITHUB"
$MINIO_MEDIA_SECRET_KEY = "INVENTA_UNA_CONTRASENA_AQUI"

Write-Host "Iniciando configuración automática de MinIO en la VPS..." -ForegroundColor Cyan

$script = @"
MINIO_ENDPOINT="https://ippminioback.probolsas.co"
ROOT_USER="$MINIO_ACCESS_KEY"
ROOT_PASSWORD="$MINIO_SECRET_KEY"
MEDIA_USER="academia-trading-minio-media"
MEDIA_PASSWORD="$MINIO_MEDIA_SECRET_KEY"

echo "1. Conectando a MinIO como ROOT..."
docker run --rm -v /root/.mc_temp:/root/.mc minio/mc alias set myminio \$MINIO_ENDPOINT \$ROOT_USER \$ROOT_PASSWORD >/dev/null

echo "2. Creando Buckets..."
docker run --rm -v /root/.mc_temp:/root/.mc minio/mc mb myminio/academia-trading-audios --ignore-existing
docker run --rm -v /root/.mc_temp:/root/.mc minio/mc mb myminio/academia-trading-imagenes-modulos --ignore-existing

echo "3. Configurando política de descarga pública..."
docker run --rm -v /root/.mc_temp:/root/.mc minio/mc anonymous set download myminio/academia-trading-audios
docker run --rm -v /root/.mc_temp:/root/.mc minio/mc anonymous set download myminio/academia-trading-imagenes-modulos

echo "4. Creando usuario restringido..."
docker run --rm -v /root/.mc_temp:/root/.mc minio/mc admin user add myminio \$MEDIA_USER \$MEDIA_PASSWORD >/dev/null

echo "5. Creando y aplicando política..."
cat <<EOF > /tmp/media-policy.json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::academia-trading-audios/*",
        "arn:aws:s3:::academia-trading-audios",
        "arn:aws:s3:::academia-trading-imagenes-modulos/*",
        "arn:aws:s3:::academia-trading-imagenes-modulos"
      ]
    }
  ]
}
EOF

docker run --rm -v /root/.mc_temp:/root/.mc -v /tmp/media-policy.json:/media-policy.json minio/mc admin policy create myminio media-writer /media-policy.json >/dev/null
docker run --rm -v /root/.mc_temp:/root/.mc minio/mc admin policy attach myminio media-writer --user \$MEDIA_USER >/dev/null

echo "6. Prueba de Subida..."
docker run --rm -v /root/.mc_temp:/root/.mc minio/mc alias set mediauser \$MINIO_ENDPOINT \$MEDIA_USER \$MEDIA_PASSWORD >/dev/null
echo "test" > /tmp/test.txt
docker run --rm -v /root/.mc_temp:/root/.mc -v /tmp/test.txt:/test.txt minio/mc cp /test.txt mediauser/academia-trading-audios/ >/dev/null
if [ \$? -eq 0 ]; then
  echo "Exito"
else
  echo "Fallo"
fi

rm -rf /root/.mc_temp /tmp/test.txt /tmp/media-policy.json
echo "Proceso terminado exitosamente."
"@

# PIPE al SSH
$script | ssh root@147.93.44.250 "bash"

Write-Host "¡MinIO configurado automáticamente!" -ForegroundColor Green
