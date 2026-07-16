#!/bin/bash
# Setup MinIO Buckets and Restricted User for Media

# === CONFIGURACIÓN ===
# Ajusta el Endpoint si es necesario (puede ser localhost:9000 o el dominio público)
MINIO_ENDPOINT="https://ippminioback.probolsas.co" 
MINIO_ROOT_USER="AQUI_TU_ROOT_USER"
MINIO_ROOT_PASSWORD="AQUI_TU_ROOT_PASSWORD"

# Credenciales del nuevo usuario aislado para el Backend
MEDIA_USER="academia-trading-minio-media"
MEDIA_PASSWORD="AQUI_UNA_PASSWORD_FUERTE"
# =====================

echo "1. Conectando a MinIO como ROOT..."
docker run --rm -v $(pwd)/mc-config:/root/.mc minio/mc alias set myminio $MINIO_ENDPOINT $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD

echo "2. Creando Buckets..."
docker run --rm -v $(pwd)/mc-config:/root/.mc minio/mc mb myminio/academia-trading-audios --ignore-existing
docker run --rm -v $(pwd)/mc-config:/root/.mc minio/mc mb myminio/academia-trading-imagenes-modulos --ignore-existing

echo "3. Configurando política de lectura pública (Download)..."
docker run --rm -v $(pwd)/mc-config:/root/.mc minio/mc anonymous set download myminio/academia-trading-audios
docker run --rm -v $(pwd)/mc-config:/root/.mc minio/mc anonymous set download myminio/academia-trading-imagenes-modulos

echo "4. Creando usuario restringido: $MEDIA_USER ..."
docker run --rm -v $(pwd)/mc-config:/root/.mc minio/mc admin user add myminio $MEDIA_USER $MEDIA_PASSWORD

echo "5. Creando Política Estricta de Media..."
cat <<EOF > media-policy.json
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

docker run --rm -v $(pwd)/mc-config:/root/.mc -v $(pwd)/media-policy.json:/media-policy.json minio/mc admin policy create myminio media-writer /media-policy.json
docker run --rm -v $(pwd)/mc-config:/root/.mc minio/mc admin policy attach myminio media-writer --user $MEDIA_USER

echo "6. Prueba de Access Denied (Intento de lectura privada)..."
# Intentar listar un bucket que no pertenece a media (si existe capturas)
docker run --rm -v $(pwd)/mc-config:/root/.mc minio/mc alias set mediauser $MINIO_ENDPOINT $MEDIA_USER $MEDIA_PASSWORD
docker run --rm -v $(pwd)/mc-config:/root/.mc minio/mc ls mediauser/academia-trading-capturas >/dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "✅ Éxito: Access Denied al intentar leer un bucket ajeno (capturas)."
else
  echo "⚠️ Advertencia: Pudo leer un bucket que no debía."
fi

echo "7. Prueba de subida usando el nuevo usuario restringido..."
echo "Prueba de subida" > test-file.txt
docker run --rm -v $(pwd)/mc-config:/root/.mc -v $(pwd)/test-file.txt:/test-file.txt minio/mc cp /test-file.txt mediauser/academia-trading-audios/
if [ $? -eq 0 ]; then
  echo "✅ Éxito: Subida exitosa al bucket de audios."
else
  echo "❌ Error al subir."
fi

# Limpieza
rm test-file.txt media-policy.json
rm -rf mc-config
echo "¡Infraestructura MinIO aprovisionada correctamente!"
