# AWS Amplify Deployment Guide

Esta guía explica cómo desplegar tus apps Next.js (client y admin) a AWS Amplify usando el método más simple.

## 📋 Prerequisitos

- Cuenta AWS activa
- Repositorio GitHub conectado
- Acceso a AWS Console

---

## 🚀 Método 1: Amplify Hosting con GitHub (Recomendado - Sin CLI)

### Paso 1: Crear App Client en Amplify

1. Ve a [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click en **"New app"** → **"Host web app"**
3. Selecciona **GitHub** como provider
4. Autoriza AWS Amplify a acceder a tu GitHub
5. Selecciona tu repositorio y branch (`main`)
6. App name: `arreglatodo-client`

### Paso 2: Configurar Build Settings para Client

Amplify detectará automáticamente `apps/client/amplify.yml`. Si no, configura manualmente:

**Build settings:**
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - corepack enable
        - corepack prepare pnpm@latest --activate
        - cd ../..
        - pnpm install --frozen-lockfile
    build:
      commands:
        - pnpm build --filter client
  artifacts:
    baseDirectory: apps/client/.next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - apps/client/.next/cache/**/*
```

**Root directory:** (dejar vacío - raíz del repo)

### Paso 3: Configurar Variables de Entorno para Client

En Amplify Console → App settings → Environment variables:

```bash
NEXT_PUBLIC_API_URL=https://tu-api-url.com/api
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
NODE_ENV=production
```

### Paso 4: Crear App Admin en Amplify

Repite los pasos 1-3 para Admin:

1. **New app** → **Host web app** → GitHub
2. Mismo repositorio, mismo branch
3. App name: `arreglatodo-admin`
4. Build settings: usar `apps/admin/amplify.yml`
5. Variables de entorno similares a Client

### Paso 5: Deploy

Amplify desplegará automáticamente en cada push a `main`. También puedes hacer deploy manual desde la consola.

---

## 🔧 Método 2: AWS Amplify CLI (Más Control)

### Instalación

```bash
npm install -g @aws-amplify/cli
```

### Configuración Inicial

```bash
# Configurar credenciales AWS
amplify configure

# Inicializar proyecto (solo una vez)
amplify init
```

### Crear App Client

```bash
# Desde la raíz del proyecto
amplify add hosting

# Selecciona:
# - Hosting with Amplify Console
# - Manual deployment
# - App name: arreglatodo-client
```

### Deploy

```bash
# Build y deploy
amplify publish
```

**Nota:** Para monorepos, es mejor usar el Método 1 (GitHub integration).

---

## 🤖 Método 3: GitHub Actions (CI/CD Automático)

Ya están creados los workflows en `.github/workflows/`:

- `amplify-client.yml` - Deploy automático de Client
- `amplify-admin.yml` - Deploy automático de Admin

### Configuración

1. Ve a tu repositorio GitHub → Settings → Secrets and variables → Actions
2. Agrega los siguientes secrets:

```bash
AMPLIFY_CLIENT_APP_ID=tu_app_id_client
AMPLIFY_ADMIN_APP_ID=tu_app_id_admin
AMPLIFY_DEPLOY_TOKEN=tu_amplify_token
```

### Obtener App IDs y Token

**App IDs:**
1. Ve a Amplify Console
2. Selecciona tu app
3. App ID está en la URL o en App settings → General

**Deploy Token:**
1. Amplify Console → App settings → Access tokens
2. Create token → Copia el token

### Activar Workflows

Los workflows se activarán automáticamente en cada push a `main` que afecte los archivos relevantes.

---

## 📁 Estructura de Archivos Creados

```
.
├── amplify.yml                    # Configuración general (no usado directamente)
├── apps/
│   ├── client/
│   │   └── amplify.yml           # Config para Client app
│   └── admin/
│       └── amplify.yml           # Config para Admin app
└── .github/
    └── workflows/
        ├── amplify-client.yml    # GitHub Action para Client
        └── amplify-admin.yml      # GitHub Action para Admin
```

---

## 🔍 Troubleshooting

### Error: "Cannot find module"

**Solución:** Asegúrate de que el build command incluya `pnpm install` y que el root directory esté configurado correctamente.

### Error: "Build failed - pnpm not found"

**Solución:** Agrega estos comandos al inicio del preBuild:
```yaml
preBuild:
  commands:
    - corepack enable
    - corepack prepare pnpm@latest --activate
```

### Error: "Artifacts not found"

**Solución:** Verifica que `baseDirectory` apunte a `apps/client/.next` o `apps/admin/.next` según corresponda.

### Build muy lento

**Solución:** El cache está configurado en `amplify.yml`. Si sigue siendo lento, considera usar Turbo cache:
```yaml
cache:
  paths:
    - .turbo/**/*
```

---

## 💰 Costos

### Free Tier (Primeros 12 meses)

- **Build minutes:** 1000 minutos/mes (gratis)
- **Hosting:** 15GB storage (gratis)
- **Data transfer:** 5GB/mes (gratis)
- **Total:** $0/mes

### Después de Free Tier

- **Build:** $0.01 por minuto adicional
- **Hosting:** $0.023 por GB/mes adicional
- **Data transfer:** $0.15 por GB adicional

**Estimado para tu proyecto:** ~$5-15/mes (dependiendo del tráfico)

---

## ✅ Checklist

- [ ] Cuenta AWS creada
- [ ] Repositorio GitHub conectado
- [ ] App Client creada en Amplify
- [ ] App Admin creada en Amplify
- [ ] Variables de entorno configuradas
- [ ] Build settings configurados
- [ ] Primer deploy exitoso
- [ ] Dominios personalizados configurados (opcional)
- [ ] GitHub Actions configurados (opcional)

---

## 🔗 Recursos

- [Amplify Hosting Docs](https://docs.aws.amazon.com/amplify/latest/userguide/welcome.html)
- [Next.js on Amplify](https://docs.aws.amazon.com/amplify/latest/userguide/deploy-nextjs-app.html)
- [Amplify CLI Docs](https://docs.amplify.aws/cli/)

---

## 📝 Notas Importantes

1. **Monorepo:** Amplify funciona bien con monorepos siempre que configures el `baseDirectory` correctamente.

2. **API Backend:** Tu API (`apps/api`) NO puede desplegarse en Amplify porque usa Prisma + PostgreSQL que requieren Node.js completo. Usa EC2, Railway, o Render para el API.

3. **Variables de Entorno:** Las variables `NEXT_PUBLIC_*` son públicas y se incluyen en el bundle del cliente. No pongas secrets ahí.

4. **Build Time:** Los builds pueden tardar 5-10 minutos la primera vez. Los siguientes builds son más rápidos gracias al cache.

5. **Custom Domains:** Puedes configurar dominios personalizados desde Amplify Console → App settings → Domain management.
