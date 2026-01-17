# API Deployment Guide

Tu API (`apps/api`) usa **Prisma + PostgreSQL** que requieren **Node.js completo**, por lo que **NO puede desplegarse en Amplify** (que usa Edge Runtime).

## 🎯 Opciones de Deployment

### Opción 1: AWS EC2 (Free Tier) ⭐ Recomendado para AWS
### Opción 2: Railway (Más Simple)
### Opción 3: Render (Alternativa Simple)
### Opción 4: AWS ECS Fargate (Más Complejo)

---

## 🚀 Opción 1: AWS EC2 (Free Tier)

### Arquitectura

```
API (Next.js) → EC2 t2.micro (Free Tier)
PostgreSQL → RDS db.t2.micro (Free Tier)
```

### Costo: $0/mes (primeros 12 meses)

---

## Paso 1: Crear RDS PostgreSQL

1. **AWS Console** → **RDS** → **Create Database**
2. Configuración:
   - **Engine:** PostgreSQL (versión 15 o 16)
   - **Template:** Free Tier
   - **DB instance:** db.t2.micro
   - **Storage:** 20GB (gratis)
   - **Master username:** `postgres`
   - **Master password:** (guarda esta contraseña)
   - **Public access:** Yes (para conectar desde EC2)
   - **VPC:** Default VPC
   - **Security Group:** Crear nuevo
     - Permitir puerto 5432 desde el Security Group de EC2

3. **Espera** 5-10 minutos a que se cree la instancia

4. **Copia el Endpoint** (ej: `mydb.xxxxx.us-east-1.rds.amazonaws.com`)

---

## Paso 2: Crear EC2 Instance

1. **AWS Console** → **EC2** → **Launch Instance**

2. **Configuración:**
   - **Name:** `arreglatodo-api`
   - **AMI:** Amazon Linux 2023 (Free Tier eligible)
   - **Instance type:** t2.micro (Free Tier)
   - **Key pair:** Crear nuevo (descargar `.pem` file)
   - **Network:** Default VPC
   - **Security Group:** Crear nuevo
     - **SSH (22)** desde tu IP
     - **HTTP (80)** desde `0.0.0.0/0`
     - **Custom TCP (3002)** desde `0.0.0.0/0`

3. **Launch Instance**

4. **Espera** a que el estado sea "Running"

5. **Copia la Public IP** o **Public DNS**

---

## Paso 3: Conectar y Configurar EC2

### 3.1 Conectar vía SSH

```bash
# Dar permisos al archivo .pem
chmod 400 tu-key.pem

# Conectar
ssh -i tu-key.pem ec2-user@tu-ec2-ip
```

### 3.2 Instalar Node.js y pnpm

```bash
# Instalar Node.js 18
sudo dnf install -y nodejs npm
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs

# Verificar instalación
node --version  # Debe ser v18.x o superior
npm --version

# Instalar pnpm
npm install -g pnpm

# Instalar Git
sudo dnf install -y git
```

### 3.3 Clonar Repositorio

```bash
# Clonar tu repo (o usar CodeDeploy/CodePipeline)
git clone https://github.com/tu-usuario/arreglatodo.git
cd arreglatodo

# O si prefieres usar HTTPS con token:
# git clone https://tu-token@github.com/tu-usuario/arreglatodo.git
```

### 3.4 Instalar Dependencias

```bash
# Instalar dependencias
pnpm install
```

### 3.5 Configurar Variables de Entorno

```bash
cd apps/api
nano .env
```

**Contenido de `.env`:**

```bash
# Database (usar el endpoint de RDS)
DATABASE_URL=postgresql://postgres:tu-password@tu-rds-endpoint:5432/postgres

# Supabase Auth
SUPABASE_URL=tu_supabase_url
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Node Environment
NODE_ENV=production
PORT=3002

# Sentry (opcional)
SENTRY_ORG=tu_org
SENTRY_PROJECT=api
SENTRY_AUTH_TOKEN=tu_token

# Upstash Redis (si usas rate limiting)
UPSTASH_REDIS_REST_URL=tu_url
UPSTASH_REDIS_REST_TOKEN=tu_token

# Email (SendGrid)
SENDGRID_API_KEY=tu_key
ADMIN_EMAIL=admin@example.com
SUPPORT_EMAIL=support@example.com

# Twilio (WhatsApp)
TWILIO_ACCOUNT_SID=tu_sid
TWILIO_AUTH_TOKEN=tu_token
TWILIO_WHATSAPP_FROM=tu_numero

# MercadoPago (si usas)
MERCADOPAGO_ACCESS_TOKEN=tu_token
MERCADOPAGO_WEBHOOK_SECRET=tu_secret
```

**Guardar:** `Ctrl+O`, `Enter`, `Ctrl+X`

### 3.6 Generar Prisma Client y Ejecutar Migraciones

```bash
# Generar Prisma Client
pnpm db:generate

# Ejecutar migraciones
pnpm db:migrate
```

### 3.7 Build y Start

```bash
# Build
pnpm build

# Instalar PM2 para mantener el proceso vivo
npm install -g pm2

# Iniciar con PM2
pm2 start pnpm --name "api" -- start
pm2 save
pm2 startup  # Seguir las instrucciones que aparecen
```

### 3.8 Verificar que Funciona

```bash
# Ver logs
pm2 logs api

# Verificar que está corriendo
pm2 status

# Probar endpoint
curl http://localhost:3002/api/trpc/health.ping
```

---

## Paso 4: Configurar Nginx como Reverse Proxy (Opcional pero Recomendado)

### 4.1 Instalar Nginx

```bash
sudo dnf install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 4.2 Configurar Nginx

```bash
sudo nano /etc/nginx/conf.d/api.conf
```

**Contenido:**

```nginx
server {
    listen 80;
    server_name tu-dominio.com;  # O usar la IP pública de EC2

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4.3 Reiniciar Nginx

```bash
sudo nginx -t  # Verificar configuración
sudo systemctl restart nginx
```

---

## Paso 5: Configurar Security Groups

### 5.1 RDS Security Group

1. **RDS Console** → Tu instancia → **Connectivity & security** → **VPC security groups**
2. Click en el Security Group
3. **Inbound rules** → **Edit inbound rules**
4. Agregar regla:
   - **Type:** PostgreSQL
   - **Source:** Custom → Seleccionar el Security Group de EC2
   - **Save rules**

### 5.2 EC2 Security Group

1. **EC2 Console** → **Security Groups**
2. Seleccionar el Security Group de tu instancia EC2
3. **Inbound rules** → **Edit inbound rules**
4. Verificar que tenga:
   - **SSH (22)** desde tu IP
   - **HTTP (80)** desde `0.0.0.0/0`
   - **Custom TCP (3002)** desde `0.0.0.0/0` (si no usas Nginx)

---

## Paso 6: Configurar Dominio Personalizado (Opcional)

1. **Route 53** → Crear hosted zone (costo: ~$0.50/mes)
2. Configurar registros A apuntando a la IP de EC2
3. Actualizar Nginx con el dominio

---

## 🔄 Actualizar Deployment (Después del Primer Setup)

### Opción A: Manual (SSH)

```bash
# Conectar a EC2
ssh -i tu-key.pem ec2-user@tu-ec2-ip

# Ir al directorio del proyecto
cd arreglatodo

# Pull cambios
git pull origin main

# Reinstalar si hay cambios en dependencias
pnpm install

# Rebuild
cd apps/api
pnpm build

# Reiniciar con PM2
pm2 restart api
```

### Opción B: GitHub Actions (Automático)

Ver `.github/workflows/deploy-api-ec2.yml` (se creará en siguiente paso)

---

## 💰 Costos

### Free Tier (Primeros 12 meses)

| Servicio | Free Tier | Uso Real | Costo |
|----------|-----------|----------|-------|
| **EC2 t2.micro** | 750 horas/mes | 730 horas | $0 |
| **RDS db.t2.micro** | 750 horas/mes | 730 horas | $0 |
| **RDS Storage** | 20GB | ~5-10GB | $0 |
| **Data Transfer** | 1GB/mes | ~500MB | $0 |
| **Total** | | | **$0/mes** |

### Después de 12 meses

| Servicio | Costo Estimado |
|----------|----------------|
| **EC2 t2.micro** | ~$8-10/mes |
| **RDS db.t2.micro** | ~$15/mes |
| **RDS Storage** | ~$0.115/GB/mes |
| **Total** | **~$23-25/mes** |

---

## 🚀 Opción 2: Railway (Más Simple)

Si prefieres simplicidad sobre usar solo AWS:

### Ventajas

- ✅ Configuración más simple
- ✅ Deploy automático desde Git
- ✅ PostgreSQL incluido
- ✅ Variables de entorno fáciles

### Pasos

1. Ve a [Railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. Selecciona tu repositorio
4. Railway detectará automáticamente el monorepo
5. Configura:
   - **Root Directory:** (vacío)
   - **Build Command:** `pnpm install && pnpm build --filter api`
   - **Start Command:** `cd apps/api && pnpm start`
6. Agrega variables de entorno
7. Conecta PostgreSQL (Railway lo crea automáticamente)

### Costo: ~$5-10/mes

---

## 🚀 Opción 3: Render

Similar a Railway:

1. Ve a [Render.com](https://render.com)
2. **New** → **Web Service**
3. Conecta GitHub
4. Configura:
   - **Build Command:** `cd ../.. && pnpm install && pnpm build --filter api`
   - **Start Command:** `cd apps/api && pnpm start`
5. Agrega PostgreSQL desde Render dashboard

### Costo: Gratis (con sleep) → $7/mes (sin sleep)

---

## ✅ Checklist

- [ ] RDS PostgreSQL creado
- [ ] EC2 instance creada
- [ ] Security Groups configurados
- [ ] Node.js y pnpm instalados
- [ ] Repositorio clonado
- [ ] Variables de entorno configuradas
- [ ] Prisma Client generado
- [ ] Migraciones ejecutadas
- [ ] API corriendo con PM2
- [ ] Nginx configurado (opcional)
- [ ] Endpoints probados
- [ ] Dominio configurado (opcional)

---

## 🔗 Próximos Pasos

1. **Monitoreo:** Configurar CloudWatch para logs
2. **Backups:** Configurar backups automáticos de RDS
3. **SSL:** Configurar certificado SSL con Let's Encrypt
4. **CI/CD:** Configurar GitHub Actions para deploy automático

---

## 📝 Notas Importantes

1. **t2.micro es limitado:** Para producción con más tráfico, considera t3.micro o t3.small
2. **RDS es costoso después del Free Tier:** Considera migrar a Railway/Render PostgreSQL si el costo es un problema
3. **PM2 mantiene el proceso vivo:** Si EC2 se reinicia, PM2 iniciará automáticamente la app
4. **Security Groups:** Asegúrate de que RDS solo acepte conexiones desde EC2, no desde internet público
