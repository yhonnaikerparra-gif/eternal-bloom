# 🌸 ETERNAL BLOOM — Una historia de amor que crece cada día

> Una aplicación web romántica de producción, completamente funcional, visualmente cinematográfica y autónoma, diseñada para enviar diariamente una carta única de amor a una persona especial a las **5:00 a. m. hora de Colombia (America/Bogota, UTC-5)**.
>
> Cada carta enviada con éxito hace florecer una flor permanente en un jardín 3D. A los 365 días, la cámara asciende cinematográficamente para contemplar el planeta Tierra en el espacio, y a partir de ese momento cada carta enciende una nueva estrella en el cosmos infinito.

---

## 🌟 Características Principales

1. **Jardín Romántico y Cosmos 3D Interactivo (Three.js)**:
   - **Etapa 1 (Día 1)**: Una flor protagonista destacada en el centro del jardín, iluminada suavemente con pétalos flotantes, rocío matinal y balanceo natural con el viento.
   - **Etapa 2 (Días 2 al 364)**: Cada carta enviada correctamente hace brotar exactamente una nueva flor permanente (rosas rojas, peonías rosadas, hortensias azules, flores doradas, lirios y tulipanes), con animación orgánica de crecimiento (brote, tallo y apertura de pétalos).
   - **Etapa 3**: Cámara 3D con perspectiva dinámica que se aleja fluidamente revelando senderos y terrazas conforme crece el número de flores.
   - **Etapa 4 (Hito 365 Días)**: Al confirmarse 365 cartas enviadas, se activa la transición espacial: ascenso atmosférico hacia una Tierra 3D realista con continentes, océanos reflectantes, atmósfera azul y nubes en movimiento, junto a una dedicatoria especial.
   - **Etapa 5 (Días 366+)**: Cada nueva carta crea una estrella viva permanente en el cielo espacial con animación de destello y nacimiento.
   - **Etapa 6 (Universo del Amor)**: Nebulosas rosadas y violetas, polvo cósmico luminoso y galaxias espirales que expanden el universo.
   - **Interacción Total**: Haz clic en cualquier flor o estrella para abrir la carta exacta que le dio origen en un pergamino romántico con sello de cera y caligrafía.

2. **Cielo Animado y Sol Expresivo**:
   - Nubes suaves que se desplazan lentamente por el firmamento.
   - Rayos de sol delicados y tonalidades doradas, rosadas y violetas.
   - Sol animado con carita tierna: ojos que parpadean periódicamente (cada 4-6 segundos), mejillas sonrojadas y sonrisa dulce.
   - Transición día/noche con luna luminosa, luciérnagas y cielo estrellado profundo.

3. **Cartas Diarias de Amor Sin Repetición Jamás**:
   - Más de 100 cartas originales clasificadas en las 14 categorías requeridas (Amor profundo, Ternura y cariño, Gratitud, Promesas, Recuerdos, Admiración, Apoyo en días difíciles, Motivación matutina, Sueños juntos, Amor a distancia, Poéticas, Promesas cotidianas, Celebración e Hitos).
   - Motor de huella digital normalizada (SHA-256) que elimina tildes, signos y espacios para garantizar matemáticamente que ningún mensaje se repita.
   - Soporte opcional para generación poética mediante Google Gemini AI (`gemini-3.8-flash`) vía el SDK oficial `@google/genai`.
   - Si no hay conexión o no se configuran claves de IA, la biblioteca local garantiza años de cartas originales sin fallar.

4. **Programador Autónomo Diario a las 5:00 a. m. (America/Bogota)**:
   - Motor de cron persistente en el backend configurado explícitamente en la zona horaria `America/Bogota`.
   - Idempotencia estricta: índice único en base de datos (`date_key`) y bloqueos concurrentes que impiden enviar dos veces en el mismo día.
   - Recuperación automática de tareas: si el servidor se reinicia después de las 5:00 a. m., detecta la carta pendiente y la procesa.
   - Si el envío falla: se registra el error detallado, se programan reintentos con backoff exponencial y **NO se crea ninguna flor** hasta que el proveedor confirme la entrega real.

5. **Integración Real con Gmail y WhatsApp Business**:
   - **Gmail**: Envío mediante SMTP / Gmail API con plantilla HTML personalizada estilo carta romántica en papel pergamino, sello y tipografía clásica, más texto plano alternativo.
   - **WhatsApp**: Conexión oficial mediante Meta WhatsApp Business Cloud API (`graph.facebook.com/v19.0/`) con soporte para números con código de país, validación de webhooks y seguimiento de IDs de mensajes.
   - Mensajes de prueba aislados desde el panel: permiten verificar las credenciales sin afectar el conteo diario ni crear flores falsas.

6. **Panel de Administración Privado y Seguro**:
   - Autenticado mediante JWT y contraseña encriptada con bcrypt.
   - Configuración del destinatario (nombre, apodo, correo, número de WhatsApp, canal principal).
   - Telemetría en tiempo real del programador horario (cuenta regresiva hasta las 5:00 a. m., estado del último intento).
   - Redacción manual de cartas con validación de no-duplicados.
   - **Simulador de Etapas (Time Travel Preview)**: Permite previsualizar en tiempo real el Día 1, Día 30, Día 365 (La Tierra en el espacio) y Día 500 (Cosmos) sin tocar los datos de producción.

---

## 🛠️ Estructura del Proyecto

```
eternal-bloom/
├── package.json               # Monorrepo npm con scripts unificados
├── tsconfig.json              # Configuración TypeScript global
├── .env.example               # Plantilla de variables de entorno (sin secretos)
├── .env                       # Variables locales de configuración
├── Dockerfile                 # Contenedor listo para despliegue en la nube
├── docker-compose.yml         # Orquestación con persistencia de base de datos
├── start.bat                  # Script de inicio rápido en Windows (Producción)
├── start-dev.bat              # Script de desarrollo con recarga en vivo
├── server/                    # Backend en Node.js + Express + TypeScript
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── config/            # Zona horaria America/Bogota, puertos y claves
│   │   ├── db/                # SQLite con Better-SQLite3, WAL mode y migraciones
│   │   ├── services/
│   │   │   ├── letterLibrary.ts  # Biblioteca de más de 100 cartas originales
│   │   │   ├── letterEngine.ts   # Normalización, huella SHA-256 e integración con Gemini
│   │   │   ├── gardenService.ts  # Algoritmo de colocación espiral y cálculo de hitos
│   │   │   ├── gmailService.ts   # Plantilla HTML romántica y envío SMTP/Gmail
│   │   │   ├── whatsappService.ts# Integración oficial Meta Cloud API
│   │   │   ├── dispatcher.ts     # Flujo idempotente de despacho diario
│   │   │   └── scheduler.ts      # Cron diario a las 05:00 a. m. y recuperación
│   │   ├── routes/            # Endpoints REST (auth, letters, garden, admin, webhooks)
│   │   └── index.ts           # Servidor Express principal
│   └── tests/                 # Batería de pruebas automatizadas Vitest
│       ├── nonRepetition.test.ts     # Detección de duplicados y huella SHA-256
│       ├── gardenProgression.test.ts # Progresión de flores, hito 365 y estrellas
│       ├── dispatcher.test.ts        # Idempotencia y modo prueba sin flores
│       └── scheduler.test.ts         # Cálculo horario 5:00 AM America/Bogota
└── client/                    # Frontend en React 19 + Three.js + Tailwind CSS + Vite
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── 3d/
        │   ├── RomanticScene.ts  # Controlador maestro 3D, cámara dinámica y raycaster
        │   ├── GardenManager.ts  # Terreno, flores detalladas, pétalos y luciérnagas
        │   ├── SkyManager.ts     # Nubes, sol con carita sonriente y ciclo día/noche
        │   └── SpaceManager.ts   # Planeta Tierra, estrellas vivas y nebulosas
        ├── components/
        │   ├── LetterModal.tsx    # Tarjeta de carta en pergamino con sello de cera
        │   ├── HistoryDrawer.tsx  # Cajón de búsqueda y archivo cronológico de cartas
        │   ├── AdminPanel.tsx     # Panel privado con configuración, logs y simulador
        │   ├── MilestoneBanner.tsx# Dedicatoria especial del día 365
        │   └── AudioPlayer.tsx    # Sintetizador Web Audio de melodía romántica
        ├── services/api.ts        # Cliente tipado para consumo de la API
        └── App.tsx                # Aplicación principal
```

---

## 🚀 Puesta en Marcha

### 1. Requisitos Previos
- **Node.js**: v20 o superior (v22 LTS instalado en el entorno).
- **npm**: v10 o superior.

### 2. Instalación de Dependencias
Las dependencias ya se encuentran instaladas en el entorno. Si se clona el proyecto en otra máquina:
```bash
npm install
```

### 3. Configuración Inicial (`.env`)
Edita el archivo `.env` en la raíz del proyecto para definir tus canales de mensajería:

```env
# Zona horaria (05:00 a. m. hora colombiana)
TIMEZONE=America/Bogota
CRON_SCHEDULE="0 5 * * *"

# Contraseña de acceso al panel de control (puedes cambiarla)
ADMIN_PASSWORD=amor-eterno-2026
JWT_SECRET=tu-clave-secreta-aleatoria

# Configuración de Gmail (Recomendado)
GMAIL_USER=tu-correo@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
GMAIL_SENDER_NAME="ETERNAL BLOOM"

# Configuración de WhatsApp (Opcional)
WHATSAPP_TOKEN=EAAB...
WHATSAPP_PHONE_NUMBER_ID=123456789012345

# Google Gemini API (Opcional para cartas con IA)
GEMINI_API_KEY=
```

#### ¿Cómo obtener una Contraseña de Aplicación de Gmail?
1. Ingresa a tu cuenta de Google: [https://myaccount.google.com/](https://myaccount.google.com/)
2. Ve a **Seguridad** y asegúrate de tener activada la **Verificación en 2 pasos**.
3. En la barra de búsqueda de tu cuenta de Google escribe: **Contraseñas de aplicaciones**.
4. Crea una contraseña con el nombre `Eternal Bloom`.
5. Copia el código de 16 letras generado y colócalo en `GMAIL_APP_PASSWORD`.

---

## 🏃‍♂️ Ejecución

### Modo Producción (Recomendado)
Compila el frontend y el backend, y levanta el servidor unificado:
```bash
npm run build
npm start
```
O simplemente haz doble clic en `start.bat`.

Abre tu navegador en:
```
http://localhost:3001
```

### Modo Desarrollo (Hot-Reload)
Para editar código con recarga en vivo de cliente y servidor:
```bash
npm run dev
```
O ejecuta `start-dev.bat`.

---

## 🧪 Pruebas Automatizadas

El proyecto cuenta con una suite completa de pruebas unitarias y de integración que verifican los puntos críticos solicitados:
1. Huella digital normalizada y no-repetición de mensajes.
2. Formato estricto de fechas en la zona horaria `America/Bogota`.
3. Idempotencia: múltiples ejecuciones en el mismo día no duplican envíos.
4. Generación estricta de flores (1 flor por envío confirmado, 0 flores en pruebas o fallos).
5. Hitos del día 365 (transición a la Tierra en el espacio) y día 366+ (estrellas cósmicas).
6. Integridad referencial de la base de datos SQLite en modo WAL.

Para ejecutar todas las pruebas:
```bash
npm test
```

Resultado verificado:
```
✓ tests/gardenProgression.test.ts (4 tests)
✓ tests/nonRepetition.test.ts (3 tests)
✓ tests/scheduler.test.ts (1 test)
✓ tests/dispatcher.test.ts (3 tests)

Test Files  4 passed (4)
     Tests  11 passed (11)
```

---

## ☁️ Despliegue Autónomo 24/7 (Para que envíe con el PC apagado)

Para que la aplicación continúe enviando las cartas diariamente a las 5:00 a. m. de Colombia incluso si tu ordenador está apagado, debes desplegar el backend en un servidor en la nube permanente:

### Opción A: Despliegue en Render / Railway / Fly.io (Gratis o Bajo Costo)
1. Sube este repositorio a tu cuenta de GitHub.
2. En [Render.com](https://render.com) o [Railway.app](https://railway.app), crea un nuevo **Web Service**.
3. Conecta el repositorio.
4. Configura:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Agrega las variables de entorno de tu archivo `.env` (`TIMEZONE=America/Bogota`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `ADMIN_PASSWORD`).
6. El servicio permanecerá activo 24/7 y ejecutará automáticamente la tarea programada a las 5:00 a. m. hora de Colombia.

### Opción B: Despliegue en un VPS con Docker
1. Copia la carpeta del proyecto a tu servidor Linux.
2. Ejecuta:
```bash
docker compose up -d --build
```
3. El contenedor arrancará automáticamente y se reiniciará si el servidor se reinicia (`restart: always`).

---

## 🔒 Seguridad y Privacidad
- El frontend no almacena credenciales ni tokens de administración.
- El panel de administración está protegido con contraseñas cifradas mediante `bcrypt` y sesiones firmadas con `JWT`.
- Las consultas a la base de datos están parametrizadas contra inyecciones SQL.
- El archivo `.env` está en `.gitignore` para prevenir fugas accidentales de secretos.
