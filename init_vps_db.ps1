$VPS_IP = "147.93.44.250"
$DB_PASS = "AcademiaDbPassword2026!"

Write-Host "1. Creando archivo SQL localmente..."
"CREATE USER academia_admin WITH PASSWORD '$DB_PASS';" | Out-File -Encoding utf8 setup.sql
"CREATE DATABASE academia_trading_db OWNER academia_admin;" | Out-File -Encoding utf8 -Append setup.sql

Write-Host "2. Subiendo archivos al VPS..."
scp setup.sql schema.sql backend/add_index.sql root@${VPS_IP}:/root/academia-trading/

Write-Host "3. Creando DB y Usuario en Postgres compartido..."
ssh root@${VPS_IP} "cat /root/academia-trading/setup.sql | docker exec -i postgres_postgres.1.ue80zi4dpna3fqs96p19kyi76 psql -U postgres"

Write-Host "4. Inyectando el esquema oficial..."
ssh root@${VPS_IP} "cat /root/academia-trading/schema.sql | docker exec -i postgres_postgres.1.ue80zi4dpna3fqs96p19kyi76 psql -U academia_admin -d academia_trading_db"
ssh root@${VPS_IP} "cat /root/academia-trading/add_index.sql | docker exec -i postgres_postgres.1.ue80zi4dpna3fqs96p19kyi76 psql -U academia_admin -d academia_trading_db"

Write-Host "¡Inicialización Completada!"
