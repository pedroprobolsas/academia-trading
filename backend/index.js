require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const perfilRiesgoRoutes = require('./routes/perfilRiesgoRoutes');
const moduloRoutes = require('./routes/moduloRoutes');
const planTradingRoutes = require('./routes/planTradingRoutes');
const journalRoutes = require('./routes/journalRoutes');
const metricasRoutes = require('./routes/metricasRoutes');
const certificacionRoutes = require('./routes/certificacionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const progresoRoutes = require('./routes/progresoRoutes');

const app = express();

// Configuración de CORS
app.use(cors({
  origin: ['http://localhost:5173', 'https://academia.pedrosandoval.com.co'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/auth', authRoutes);
app.use('/perfiles-riesgo', perfilRiesgoRoutes);
app.use('/modulos', moduloRoutes);
app.use('/planes-trading', planTradingRoutes);
app.use('/operaciones', journalRoutes);
app.use('/metricas', metricasRoutes);
app.use('/certificaciones', certificacionRoutes);
app.use('/admin', adminRoutes);
app.use('/progreso', progresoRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('API Academia de Trading funcionando');
});

// Error handling middleware (basic)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
