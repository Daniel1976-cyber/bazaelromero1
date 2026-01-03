# 🚀 Deploy Backend en Railway - Guía Completa

Esta guía te explica cómo desplegar el backend de Bazar El Romero en Railway de forma gratuita.

## 📋 Prerequisites

- ✅ Repositorio de GitHub creado y actualizado
- ✅ Cuenta de Railway (gratuita)
- ✅ GitHub conectado a Railway

## 🎯 Paso 1: Conectar GitHub a Railway

1. **Ir a Railway.app**
   - Visita [https://railway.app](https://railway.app)
   - Haz clic en "Login" y selecciona "Login with GitHub"

2. **Autorizar Railway**
   - Conecta tu cuenta de GitHub
   - Permite los permisos necesarios

## 🎯 Paso 2: Crear Nuevo Proyecto

1. **Nuevo Proyecto**
   - En el dashboard de Railway, haz clic en "New Project"
   - Selecciona "Deploy from GitHub repo"

2. **Seleccionar Repositorio**
   - Busca tu repositorio `bazar-el-romero`
   - **IMPORTANTE**: Railway va a detectar automáticamente la estructura del proyecto

## 🎯 Paso 3: Configurar Deploy del Backend

Railway detectará automáticamente que es un proyecto Node.js y desplegará el backend. Pero necesitamos hacer algunos ajustes:

### 3.1 Configurar el Root Directory

1. **Ir a Settings del proyecto**
   - En tu proyecto de Railway, ve a "Settings"
   - Busca "Root Directory"
   - Cambiar a: `backend`

### 3.2 Verificar Build Command
- Railway debería detectar automáticamente:
  - **Build Command**: `npm install`
  - **Start Command**: `npm start`

Si no los detecta automáticamente, configúralos manualmente:
- **Build Command**: `cd backend && npm install`
- **Start Command**: `cd backend && npm start`

## 🎯 Paso 4: Configurar Variables de Entorno

En Railway, ve a la sección "Variables" y agrega estas variables:

```env
# Obligatorio para producción
JWT_SECRET=tu_jwt_secret_muy_largo_y_seguro_aqui_mínimo_64_caracteres

# URLs permitidas (cambiar por tu dominio de frontend)
ALLOWED_ORIGINS=http://localhost:8080,https://tu-frontend-url.vercel.app,https://tu-dominio.com

# Puerto (Railway lo configura automáticamente)
PORT=3000

# Configuración de Node.js
NODE_ENV=production
```

### 🔧 Generar JWT_SECRET Seguro

Puedes generar un JWT_SECRET desde la terminal:

```bash
# En tu terminal local
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copia el resultado y úsalo como `JWT_SECRET`.

## 🎯 Paso 5: Obtener URL del Backend

1. **Ir a la sección "Deployments"**
2. **Hacer clic en el deployment más reciente**
3. **Buscar la URL generada** (algo como: `https://tu-proyecto.up.railway.app`)

¡Anota esta URL! La necesitarás para el frontend.

## 🎯 Paso 6: Actualizar Frontend para Producción

### 6.1 Crear archivo de configuración

Crea un archivo `frontend/config.js`:

```javascript
// Configuración para diferentes ambientes
const CONFIG = {
  development: {
    API_BASE: 'http://localhost:3000/api'
  },
  production: {
    API_BASE: 'https://tu-proyecto.up.railway.app/api'
  }
};

// Detectar ambiente automáticamente
const ENV = window.location.hostname === 'localhost' ? 'development' : 'production';
window.API_CONFIG = CONFIG[ENV];
```

### 6.2 Actualizar index.html

En `frontend/index.html`, busca la línea:

```javascript
API_BASE = 'http://localhost:3000/api';
```

Y reemplázala por:

```javascript
API_BASE = window.API_CONFIG.API_BASE;
```

### 6.3 Actualizar cargarprodustos.html

Haz lo mismo en `frontend/cargarprodustos.html`.

## 🎯 Paso 7: Deploy del Frontend

Ahora puedes deployar el frontend en cualquier servicio:

### Opción A: Netlify (Recomendado)
1. Ve a [Netlify](https://netlify.com)
2. "New site from Git"
3. Conecta tu repositorio
4. Build command: (vacío)
5. Publish directory: `frontend`
6. En Site settings > Environment variables, agrega:
   - `API_BASE = https://tu-proyecto.up.railway.app/api`

### Opción B: Vercel
1. Ve a [Vercel](https://vercel.com)
2. "New Project"
3. Importa tu repositorio
4. Framework Preset: "Other"
5. Root Directory: `frontend`
6. Build Command: (vacío)

## 🎯 Paso 8: Configurar Dominio Personalizado (Opcional)

### Para el Backend (Railway):
1. En Railway, ve a Settings > Domains
2. Agregar dominio personalizado
3. Configurar DNS según las instrucciones

### Para el Frontend (Netlify/Vercel):
- Usar el dominio gratuito proporcionado
- O configurar dominio personalizado en los settings

## 🎯 Paso 9: Actualizar ALLOWED_ORIGINS

Una vez que tengas las URLs de producción, actualiza la variable `ALLOWED_ORIGINS` en Railway:

```
ALLOWED_ORIGINS=https://tu-frontend-url.netlify.app,https://tu-dominio.com
```

## 🎯 Paso 10: Probar el Deployment

### Backend:
- Ve a: `https://tu-proyecto.up.railway.app/api/products`
- Deberías ver un array JSON con los productos

### Frontend:
- Ve a tu URL de Netlify/Vercel
- La tienda debería cargar y mostrar productos
- Prueba agregar productos al carrito
- Verifica que el panel admin funcione

## 🔧 Comandos Útiles para Railway

```bash
# Ver logs en tiempo real
railway logs

# Conectar Railway CLI
npm install -g @railway/cli
railway login
railway link

# Ver variables de entorno
railway variables

# Redeploy
railway up
```

## 📊 Monitoreo y Logs

1. **En Railway Dashboard:**
   - Ve a la sección "Deployments" para ver el estado
   - "Logs" para ver logs en tiempo real
   - "Metrics" para ver uso de recursos

2. **Alertas:**
   - Railway envía emails si hay problemas
   - Puedes configurar webhooks para notificaciones

## 🛡️ Configuración de Producción

### Variables de Entorno Obligatorias:
- ✅ `JWT_SECRET` (mínimo 64 caracteres)
- ✅ `ALLOWED_ORIGINS` (URLs de tu frontend)
- ✅ `NODE_ENV=production`

### Variables Opcionales:
- `PORT` (Railway lo configura automáticamente)
- `DATABASE_URL` (si decides usar base de datos)

## 🚨 Troubleshooting

### Error: "Application failed to start"
- Verificar que el Start Command sea correcto: `npm start`
- Revisar logs en Railway para más detalles

### Error: "CORS policy"
- Verificar que `ALLOWED_ORIGINS` incluya la URL de tu frontend
- No incluir trailing slashes en las URLs

### Error: "Cannot read properties of undefined"
- Verificar que todas las variables de entorno estén configuradas
- Reiniciar el deployment después de agregar variables

## 💡 Tips Adicionales

1. **Dominio Gratuito**: Railway da un subdominio gratis, pero puedes usar tu propio dominio
2. **SSL Automático**: Railway proporciona HTTPS automático
3. **Escalado**: El plan gratuito es suficiente para empezar
4. **Base de Datos**: Si necesitas base de datos, Railway tiene addons gratuitos

## 🎯 Resultado Final

Después de completar esta guía tendrás:

- ✅ Backend desplegado en Railway con URL pública
- ✅ Frontend desplegado en Netlify/Vercel
- ✅ API endpoints funcionando correctamente
- ✅ Variables de entorno configuradas
- ✅ CORS configurado para producción
- ✅ Monitoreo y logs disponibles

¡Tu aplicación estará funcionando en la nube de forma profesional! 🚀