# 1. Crear directorio remoto
Write-Host "Creando directorio remoto en la VPS..."
ssh root@147.93.44.250 "mkdir -p /root/academia-trading"

# 2. Subir archivos
Write-Host "Subiendo archivos (docker-compose.yml, schema.sql, .env)..."
scp .\docker-compose.yml .\schema.sql .\.env root@147.93.44.250:/root/academia-trading/

# 3. Desplegar con Docker Compose (sin Swarm)
Write-Host "Desplegando contenedor con Docker Compose..."
ssh root@147.93.44.250 "cd /root/academia-trading && docker-compose up -d"

# 4. Validar que el puerto no haya quedado expuesto globalmente y esperar a que levante
Write-Host "Esperando 10 segundos para que el contenedor levante..."
Start-Sleep -Seconds 10
Write-Host "Validando puertos 5444 (academia) y 5432 (probolsas) en la VPS..."
ssh root@147.93.44.250 "ss -tlnp | grep -E '5432|5444'"

# 5. Cargar el DDL a la base de datos (se usa exec para meter el script)
Write-Host "Inyectando esquema de DB..."
# Buscamos el ID del contenedor exacto de la réplica (academia_trading_db.1)
ssh root@147.93.44.250 "CONTAINER_ID=`$(docker ps -q -f name=academia_trading_db.1) && if [ -n `"`$CONTAINER_ID`" ]; then docker exec -i `$CONTAINER_ID psql -U academia_admin -d academia_trading_db < /root/academia-trading/schema.sql; else echo 'El contenedor no existe o no ha levantado.'; fi"

# 6. Levantar túnel SSH en background
Write-Host "Levantando túnel SSH en background (Host: 5433 -> VPS: 5444)..."
Start-Process -FilePath "ssh" -ArgumentList "-L 5433:127.0.0.1:5444 root@147.93.44.250 -N" -WindowStyle Hidden
Write-Host "¡Todo listo! El túnel SSH está corriendo de fondo en el puerto local 5433 apuntando a la base de datos academia_trading_db."
