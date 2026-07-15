param (
    [Parameter(Mandatory=$true)]
    [string]$Email
)

$VPS_IP = "147.93.44.250"
Write-Host "Creando comando SQL..."
"UPDATE usuarios SET rol = 'admin' WHERE email = '$Email';" | Out-File -Encoding utf8 admin.sql

Write-Host "Enviando comando al servidor..."
scp admin.sql root@${VPS_IP}:/root/academia-trading/

Write-Host "Ejecutando ascenso a Admin..."
ssh root@${VPS_IP} "cat /root/academia-trading/admin.sql | docker exec -i postgres_postgres.1.ue80zi4dpna3fqs96p19kyi76 psql -U academia_admin -d academia_trading_db"

Write-Host "¡Listo!"
