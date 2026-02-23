# VoucherGen 🎫

Sistema fullstack para generación y envío masivo de vouchers con QR y código de barras, desarrollado con NestJS, React y PostgreSQL.

![CI](https://github.com/AMarceloRojas/vouchergen/actions/workflows/ci.yml/badge.svg)

## 🚀 Demo en producción

- **Frontend:** https://remarkable-heart-production.up.railway.app
- **Backend:** https://vouchergen-production.up.railway.app

> Credenciales de demo: admin@yobel.com / Yobel2025!

## ⚙️ Stack

- **Backend:** NestJS + TypeScript + PostgreSQL + Prisma + Docker
- **Frontend:** React + TypeScript + Vite + TailwindCSS
- **Autenticación:** JWT + bcrypt
- **Infraestructura:** Railway + GitHub Actions
- **Seguridad:** Trivy (escaneo CRITICAL/HIGH en cada push)
- **Email:** Resend API
- **PDF:** PDFKit + pdf-lib + bwip-js + QRCode

## ✨ Funcionalidades

- Autenticación JWT con login seguro
- Sube un Excel con datos de clientes
- Genera PDF por cliente con QR + código de barras + productos + total
- Envía correo automático con PDF adjunto a cada cliente
- Genera PDF maestro con todos los vouchers del lote
- Historial de lotes por fecha/hora
- Eliminar lotes con confirmación

## 🏗️ Arquitectura
```
Frontend (React) → Backend (NestJS) → PostgreSQL
                         ↓
                    Resend API (emails)
                         ↓
                  PDFs generados en servidor
```

## 🛠️ Correr localmente
```bash
git clone https://github.com/AMarceloRojas/vouchergen.git
cd vouchergen

# Variables de entorno
cp backend/.env.example backend/.env
# Editar con tus credenciales

# Levantar con Docker
docker compose up --build
```

## 🔒 CI/CD Pipeline

Cada push a `main` ejecuta 4 jobs automáticos:

| Job | Descripción |
|-----|-------------|
| Build Backend | Compila NestJS + TypeScript |
| Build Frontend | Compila React + Vite |
| Docker Build | Construye ambas imágenes |
| Security Scan | Trivy escanea vulnerabilidades CRITICAL/HIGH |

## 👤 Autor

**Anthonny Marcelo Rojas**
[GitHub](https://github.com/AMarceloRojas)