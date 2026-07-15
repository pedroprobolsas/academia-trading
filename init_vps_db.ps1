# init_vps_db.ps1
$VPS_IP = "147.93.44.250"
$DB_PASS = "AcademiaDbPassword2026!" # Usa la misma del entorno local para simplificar, o cámbiala

Write-Host "1. Subiendo el esquema de la base de datos a la VPS..."
scp .\schema.sql .\backend\add_index.sql root@${VPS_IP}:/root/academia-trading/

Write-Host "2. Creando usuario y base de datos en el Postgres compartido..."
ssh root@${VPS_IP} "docker exec -i postgres_postgres.1.ue80zi4dpna3fqs96p19kyi76 psql -U postgres -c `"CREATE USER academia_admin WITH PASSWORD '$DB_PASS';`""
ssh root@${VPS_IP} "docker exec -i postgres_postgres.1.ue80zi4dpna3fqs96p19kyi76 psql -U postgres -c `"CREATE DATABASE academia_trading_db OWNER academia_admin;`""

Write-Host "3. Inyectando el esquema y las migraciones..."
ssh root@${VPS_IP} "docker exec -i postgres_postgres.1.ue80zi4dpna3fqs96p19kyi76 psql -U academia_admin -d academia_trading_db < /root/academia-trading/schema.sql"
ssh root@${VPS_IP} "docker exec -i postgres_postgres.1.ue80zi4dpna3fqs96p19kyi76 psql -U academia_admin -d academia_trading_db < /root/academia-trading/add_index.sql"

Write-Host "¡Base de datos lista en el entorno compartido!"
