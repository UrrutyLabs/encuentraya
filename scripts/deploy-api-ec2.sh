#!/bin/bash

# Script para deploy del API a EC2
# Uso: ./scripts/deploy-api-ec2.sh

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Iniciando deployment del API a EC2...${NC}"

# Variables (ajustar según tu configuración)
EC2_USER="ec2-user"
EC2_HOST=""  # Tu IP o dominio de EC2
EC2_KEY=""   # Path a tu archivo .pem
PROJECT_DIR="arreglatodo"
API_DIR="apps/api"

# Verificar que las variables estén configuradas
if [ -z "$EC2_HOST" ] || [ -z "$EC2_KEY" ]; then
    echo -e "${RED}❌ Error: Configura EC2_HOST y EC2_KEY en el script${NC}"
    exit 1
fi

# Verificar que el archivo .pem existe
if [ ! -f "$EC2_KEY" ]; then
    echo -e "${RED}❌ Error: Archivo .pem no encontrado en $EC2_KEY${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Construyendo proyecto localmente...${NC}"
pnpm install
pnpm build --filter api

echo -e "${YELLOW}📤 Subiendo archivos a EC2...${NC}"
# Crear archivo temporal con los archivos a subir
tar -czf /tmp/api-deploy.tar.gz \
    apps/api/.next \
    apps/api/package.json \
    apps/api/prisma \
    packages \
    pnpm-workspace.yaml \
    package.json \
    pnpm-lock.yaml

# Subir a EC2
scp -i "$EC2_KEY" /tmp/api-deploy.tar.gz "$EC2_USER@$EC2_HOST:/tmp/"

echo -e "${YELLOW}🔧 Ejecutando deployment en EC2...${NC}"
ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" << 'ENDSSH'
    set -e
    
    cd ~/$PROJECT_DIR || cd ~/arreglatodo
    
    # Extraer archivos
    tar -xzf /tmp/api-deploy.tar.gz -C .
    rm /tmp/api-deploy.tar.gz
    
    # Instalar dependencias
    pnpm install --frozen-lockfile
    
    # Generar Prisma Client
    cd apps/api
    pnpm db:generate
    
    # Reiniciar con PM2
    pm2 restart api || pm2 start pnpm --name "api" -- start
    
    echo "✅ Deployment completado!"
ENDSSH

echo -e "${GREEN}✅ Deployment exitoso!${NC}"
echo -e "${GREEN}🌐 API disponible en: http://$EC2_HOST:3002${NC}"
