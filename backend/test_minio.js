const axios = require('axios');
const FormData = require('form-data');
const db = require('./config/db');

const baseURL = 'http://127.0.0.1:3001';

(async () => {
  try {
    console.log('\n--- 1. Limpieza y Creación de Usuario ---');
    await db.query("DELETE FROM usuarios WHERE email = 'miniotest@example.com'");
    
    // Registrar usuario A
    await axios.post(`${baseURL}/auth/registro`, {
      email: "miniotest@example.com", password: "123", nombre_completo: "Minio Tester"
    });
    
    // Login
    const loginRes = await axios.post(`${baseURL}/auth/login`, {
      email: "miniotest@example.com", password: "123"
    });
    const token = loginRes.data.token;
    
    // Crear Plan
    await axios.post(`${baseURL}/planes-trading`, {
      instrumentos_permitidos: ["Vol75"],
      riesgo_maximo_operacion: 1.0,
      setups_autorizados: ["bmsb"],
      regla_stop_diario: 3.0,
      condiciones_no_operar: "No operar"
    }, { headers: { Authorization: `Bearer ${token}` } });
    
    // Crear Operación
    const opRes = await axios.post(`${baseURL}/operaciones`, {
      fecha_operacion: new Date(), instrumento: "Vol75", direccion: "compra",
      setup_usado: "bmsb", riesgo_porcentaje: 1.0, respeto_entrada: true,
      respeto_stop: true, respeto_take_profit: true, origen_senal: "senal_plan",
      movio_stop: false, sobreoperacion: false
    }, { headers: { Authorization: `Bearer ${token}` } });
    
    const opId = opRes.data.operacion_id;
    console.log(`Operación Creada: ${opId}`);

    console.log('\n--- 2. Subiendo Archivo a Backend (multipart/form-data) ---');
    const form = new FormData();
    // Archivo simulado (buffer de texto)
    form.append('imagen', Buffer.from('Testing Server-to-Server MinIO Upload!'), {
      filename: 'test_upload.png',
      contentType: 'image/png'
    });

    const uploadRes = await axios.post(`${baseURL}/operaciones/${opId}/captura`, form, {
      headers: { 
        ...form.getHeaders(),
        Authorization: `Bearer ${token}` 
      }
    });

    console.log(`Status Backend: ${uploadRes.status}`);
    console.log('Respuesta Backend:', uploadRes.data);

    if (uploadRes.data.object_name) {
      console.log('¡Éxito! El Backend reporta subida a MinIO.');
    }

    console.log('\n--- 3. Obteniendo URL de lectura (GET /captura-url) ---');
    const readRes = await axios.get(`${baseURL}/operaciones/${opId}/captura-url`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const presignedUrl = readRes.data.presigned_url;
    console.log(`URL Firmada obtenida: ${presignedUrl}`);
    
    console.log('\n--- 4. Probando descarga directa con Axios (simulando navegador) ---');
    try {
      const downloadRes = await axios.get(presignedUrl);
      console.log(`Status de descarga directa MinIO: ${downloadRes.status}`);
      console.log(`Tipo de contenido recibido: ${downloadRes.headers['content-type']}`);
      console.log(`Tamaño del archivo recibido: ${downloadRes.data.length} bytes`);
      console.log('¡Lectura exitosa sin AccessDenied!');
    } catch (err) {
      console.error('Error descargando desde MinIO:', err.response ? err.response.status : err.message);
      throw new Error('AccessDenied o URL inválida');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error en Test MinIO (Server-to-Server):', error.response ? error.response.data : error.message);
    process.exit(1);
  }
})();
