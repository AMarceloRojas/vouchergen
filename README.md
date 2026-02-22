# VoucherGen 🎫

Sistema fullstack para generación y envío masivo de vouchers con QR y código de barras.

## ¿Qué hace?

- Sube un Excel con datos de clientes y pedidos
- Genera un PDF por cliente con QR + código de barras + productos + total
- Envía el voucher PDF por correo automáticamente
- Genera un PDF maestro con todos los vouchers para imprimir
- Historial de lotes por fecha/hora con opción de eliminar

## Stack

- **Backend:** NestJS + TypeScript + Prisma + PostgreSQL
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **PDF:** PDFKit + pdf-lib
- **Correos:** Resend
- **Contenedores:** Docker + Docker Compose

## Correr el proyecto
```bash
docker compose up -d
```

Backend en `http://localhost:3001`  
Frontend en `http://localhost:5173`

## Columnas del Excel

| Columna | Descripción |
|---|---|
| Order | Número de orden |
| Client Name | Nombre del cliente |
| Client Last Name | Apellido |
| Email | Correo electrónico |
| Phone | Teléfono |
| City | Ciudad |
| Street | Dirección |
| distrito | Distrito |
| tracking Yobel | Código de tracking |
| sku Name | Nombre del producto |
| SKU Selling Price | Precio |
