# 🎬 Luki Play OTT — Plataforma de Streaming

Plataforma OTT completa con autenticación de dos factores (contraseña + OTP por correo).

## Prerrequisitos

- [Git](https://git-scm.com/download/win)
- [Node.js 20 LTS](https://nodejs.org/)

## Instalación y ejecución en Windows

### Terminal 1 — Backend (API)

```powershell
git clone https://github.com/Sofilu1537/Luki-Play-OTT.git
cd Luki-Play-OTT\backend
copy .env.example .env
npm install
npm run start:dev
```

Cuando veas `Auth service running on port 3000` el backend está listo.

### Terminal 2 — Frontend (App visual)

Abre OTRA ventana de PowerShell:

```powershell
cd Luki-Play-OTT\frontend
npm install
npx expo start --web
```

### URLs disponibles

| Servicio | URL |
|---|---|
| App visual | http://localhost:8081 |
| API Backend | http://localhost:3000 |
| Swagger docs | http://localhost:3000/api/docs |

### Flujo de prueba

1. Abre http://localhost:8081 en tu navegador
2. Ingresa número de contrato y contraseña:
   - **Número de contrato:** `CONTRACT-001` (o `CONTRACT-002`, `CONTRACT-003`)
   - **Contraseña:** `password123`
3. Aparece la pantalla de OTP
4. Revisa los logs del backend en Terminal 1 — busca una línea como:
   ```
   [MockOtpService] [MOCK] OTP 123456 sent to juan@example.com ...
   ```
   En desarrollo, el código OTP siempre es **`123456`**
5. Ingresa el código `123456` → accedes al catálogo

## Con Docker (opcional)

```powershell
docker compose up --build
```

## Estructura del proyecto

- `frontend/` — App Expo/React Native (web + móvil)
- `backend/` — API NestJS (auth, OTP, JWT)
- `docker-compose.yml` — Orquestación de servicios
