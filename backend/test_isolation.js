const minioClient = require('./config/minioClient');

(async () => {
  try {
    console.log('--- Iniciando Prueba de Aislamiento de MinIO ---');
    console.log('Intentando listar objetos en el bucket ajeno: sgm-probolsas');
    
    const stream = minioClient.listObjectsV2('sgm-probolsas', '', true);
    
    stream.on('data', function(obj) {
      console.log('PELIGRO: Acceso concedido al objeto:', obj.name);
    });
    
    stream.on('error', function(err) {
      console.log('\n¡ÉXITO DEL TEST DE SEGURIDAD!');
      console.log('El API rechazó la solicitud. Error exacto recibido:');
      console.log(err);
      process.exit(0);
    });

    stream.on('end', function() {
      console.log('\nStream finalizado sin errores (esto no debería pasar si está bien aislado).');
    });

  } catch (err) {
    console.error('Excepción general capturada:', err);
  }
})();
