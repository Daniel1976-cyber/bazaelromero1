// Configuración para diferentes ambientes
const CONFIG = {
  development: {
    API_BASE: 'http://localhost:3000/api'
  },
  production: {
    // IMPORTANTE: Cambiar esta URL por tu URL de Railway una vez desplegado
    API_BASE: 'https://tu-proyecto.up.railway.app/api'
  }
};

// Detectar ambiente automáticamente
const ENV = (window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1') ? 'development' : 'production';

// Hacer la configuración globalmente disponible
window.API_CONFIG = CONFIG[ENV];

// Log para debugging
console.log('🚀 Environment:', ENV);
console.log('🔗 API Base:', window.API_CONFIG.API_BASE);