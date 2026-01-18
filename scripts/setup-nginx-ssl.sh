#!/bin/bash

# Script para configurar Nginx como reverse proxy y obtener certificado SSL con Let's Encrypt
# Uso: ./scripts/setup-nginx-ssl.sh
#
# Requisitos:
# - Debes tener un dominio apuntando a la IP de EC2 (registro A en DNS)
# - El puerto 80 y 443 deben estar abiertos en el Security Group de EC2
# - Debes ejecutar este script en el servidor EC2 (o vía SSH)

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔒 Configurando Nginx y SSL con Let's Encrypt...${NC}"

# Variables (ajustar según tu configuración)
DOMAIN="api.urrutylabs.com"  # Ejemplo: api.arreglatodo.com
EMAIL="nicolas@urrutylabs.com"   # Tu email para notificaciones de Let's Encrypt
API_PORT=3000  # Puerto donde corre tu API Next.js

# Verificar que las variables estén configuradas
if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo -e "${RED}❌ Error: Configura DOMAIN y EMAIL en el script${NC}"
    echo -e "${YELLOW}Ejemplo:${NC}"
    echo -e "  DOMAIN=\"api.arreglatodo.com\""
    echo -e "  EMAIL=\"tu-email@example.com\""
    exit 1
fi

echo -e "${BLUE}📋 Configuración:${NC}"
echo -e "  Dominio: ${GREEN}$DOMAIN${NC}"
echo -e "  Email: ${GREEN}$EMAIL${NC}"
echo -e "  Puerto API: ${GREEN}$API_PORT${NC}"
echo ""

# Verificar que estamos en el servidor correcto
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Error: Este script debe ejecutarse con sudo${NC}"
    echo -e "${YELLOW}Ejecuta: sudo ./scripts/setup-nginx-ssl.sh${NC}"
    exit 1
fi

# Paso 1: Instalar Nginx
echo -e "${YELLOW}📦 Paso 1: Instalando Nginx...${NC}"
if command -v nginx &> /dev/null; then
    echo -e "${GREEN}✅ Nginx ya está instalado${NC}"
else
    # Detectar el sistema operativo
    if [ -f /etc/amazon-linux-release ]; then
        # Amazon Linux 2023
        sudo dnf install -y nginx
    elif [ -f /etc/debian_version ]; then
        # Debian/Ubuntu
        sudo apt-get update
        sudo apt-get install -y nginx
    elif [ -f /etc/redhat-release ]; then
        # CentOS/RHEL
        sudo yum install -y nginx
    else
        echo -e "${RED}❌ Error: Sistema operativo no soportado${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Nginx instalado${NC}"
fi

# Paso 2: Crear configuración de Nginx
echo -e "${YELLOW}📝 Paso 2: Configurando Nginx...${NC}"

NGINX_CONFIG="/etc/nginx/conf.d/api.conf"

# Crear configuración inicial (HTTP)
cat > "$NGINX_CONFIG" << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Logs
    access_log /var/log/nginx/api-access.log;
    error_log /var/log/nginx/api-error.log;

    # Reverse proxy a la API
    location / {
        proxy_pass http://localhost:$API_PORT;
        proxy_http_version 1.1;
        
        # Headers importantes
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Cache bypass para WebSockets
        proxy_cache_bypass \$http_upgrade;
    }

    # Health check endpoint (opcional)
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

echo -e "${GREEN}✅ Configuración de Nginx creada en $NGINX_CONFIG${NC}"

# Verificar configuración de Nginx
echo -e "${YELLOW}🔍 Verificando configuración de Nginx...${NC}"
if sudo nginx -t; then
    echo -e "${GREEN}✅ Configuración de Nginx válida${NC}"
else
    echo -e "${RED}❌ Error en la configuración de Nginx${NC}"
    exit 1
fi

# Iniciar y habilitar Nginx
echo -e "${YELLOW}🚀 Iniciando Nginx...${NC}"
sudo systemctl start nginx
sudo systemctl enable nginx
echo -e "${GREEN}✅ Nginx iniciado y habilitado${NC}"

# Paso 3: Instalar Certbot
echo -e "${YELLOW}📦 Paso 3: Instalando Certbot...${NC}"
if command -v certbot &> /dev/null; then
    echo -e "${GREEN}✅ Certbot ya está instalado${NC}"
else
    # Detectar el sistema operativo
    if [ -f /etc/amazon-linux-release ]; then
        # Amazon Linux 2023
        sudo dnf install -y certbot python3-certbot-nginx
    elif [ -f /etc/debian_version ]; then
        # Debian/Ubuntu
        sudo apt-get install -y certbot python3-certbot-nginx
    elif [ -f /etc/redhat-release ]; then
        # CentOS/RHEL
        sudo yum install -y certbot python3-certbot-nginx
    else
        echo -e "${RED}❌ Error: Sistema operativo no soportado${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Certbot instalado${NC}"
fi

# Paso 4: Verificar que el dominio apunta a este servidor
echo -e "${YELLOW}🔍 Paso 4: Verificando DNS...${NC}"
SERVER_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || hostname -I | awk '{print $1}')
DOMAIN_IP=$(dig +short $DOMAIN | tail -n1)

echo -e "${BLUE}IP del servidor: ${GREEN}$SERVER_IP${NC}"
echo -e "${BLUE}IP del dominio: ${GREEN}$DOMAIN_IP${NC}"

if [ "$SERVER_IP" != "$DOMAIN_IP" ]; then
    echo -e "${YELLOW}⚠️  Advertencia: El dominio no apunta a este servidor${NC}"
    echo -e "${YELLOW}   Asegúrate de que el registro A de $DOMAIN apunte a $SERVER_IP${NC}"
    echo -e "${YELLOW}   Puedes continuar, pero el certificado SSL puede fallar${NC}"
    read -p "¿Continuar de todos modos? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ DNS configurado correctamente${NC}"
fi

# Paso 5: Obtener certificado SSL
echo -e "${YELLOW}🔒 Paso 5: Obteniendo certificado SSL...${NC}"
echo -e "${BLUE}Esto puede tomar unos minutos...${NC}"

# Obtener certificado y configurar Nginx automáticamente
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL --redirect

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Certificado SSL obtenido exitosamente${NC}"
else
    echo -e "${RED}❌ Error al obtener el certificado SSL${NC}"
    echo -e "${YELLOW}Verifica:${NC}"
    echo -e "  1. El dominio apunta a este servidor"
    echo -e "  2. Los puertos 80 y 443 están abiertos en el Security Group"
    echo -e "  3. Nginx está corriendo y accesible desde internet"
    exit 1
fi

# Paso 6: Verificar renovación automática
echo -e "${YELLOW}🔄 Paso 6: Configurando renovación automática...${NC}"

# Verificar que el timer de renovación esté habilitado
if sudo systemctl list-timers | grep -q "certbot"; then
    echo -e "${GREEN}✅ Renovación automática ya configurada${NC}"
else
    # Probar renovación (dry-run)
    echo -e "${BLUE}Probando renovación automática...${NC}"
    sudo certbot renew --dry-run
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Renovación automática configurada correctamente${NC}"
    else
        echo -e "${YELLOW}⚠️  Advertencia: No se pudo verificar la renovación automática${NC}"
    fi
fi

# Paso 7: Verificar configuración final
echo -e "${YELLOW}🔍 Paso 7: Verificando configuración final...${NC}"
sudo nginx -t
sudo systemctl reload nginx

# Mostrar resumen
echo ""
echo -e "${GREEN}✅ Configuración completada exitosamente!${NC}"
echo ""
echo -e "${BLUE}📋 Resumen:${NC}"
echo -e "  Dominio: ${GREEN}$DOMAIN${NC}"
echo -e "  HTTP: ${GREEN}http://$DOMAIN${NC}"
echo -e "  HTTPS: ${GREEN}https://$DOMAIN${NC}"
echo -e "  Puerto API: ${GREEN}$API_PORT${NC}"
echo ""
echo -e "${BLUE}📝 Archivos importantes:${NC}"
echo -e "  Configuración Nginx: ${GREEN}$NGINX_CONFIG${NC}"
echo -e "  Certificados SSL: ${GREEN}/etc/letsencrypt/live/$DOMAIN/${NC}"
echo -e "  Logs Nginx: ${GREEN}/var/log/nginx/${NC}"
echo ""
echo -e "${BLUE}🔧 Comandos útiles:${NC}"
echo -e "  Ver estado Nginx: ${GREEN}sudo systemctl status nginx${NC}"
echo -e "  Ver logs Nginx: ${GREEN}sudo tail -f /var/log/nginx/api-error.log${NC}"
echo -e "  Renovar certificado manualmente: ${GREEN}sudo certbot renew${NC}"
echo -e "  Reiniciar Nginx: ${GREEN}sudo systemctl restart nginx${NC}"
echo ""
echo -e "${GREEN}🎉 ¡Listo! Tu API ahora está disponible en https://$DOMAIN${NC}"
