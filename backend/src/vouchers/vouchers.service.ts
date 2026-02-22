import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as QRCode from 'qrcode';
import * as bwipjs from 'bwip-js';
import PDFDocument from 'pdfkit';
import { PDFDocument as PDFLib } from 'pdf-lib';
import { Resend } from 'resend';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class VouchersService {
  private prisma = new PrismaClient();
  private resend = new Resend(process.env.RESEND_API_KEY);

  async procesarExcel(buffer: Buffer): Promise<any> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    const nombre = `Lote_${new Date().toISOString().replace(/[:.]/g, '-')}`;
    const lote = await this.prisma.lote.create({ data: { nombre, totalItems: data.length } });
    const vouchers: any[] = [];
    for (const row of data as any[]) {
      const productos: any[] = [];
      const skuName = (row as any)['sku Name'] || (row as any)['SKU Name'] || 'Producto';
      const precio = parseFloat((row as any)['SKU Selling Price'] || (row as any)['Payment Value'] || 0);
      productos.push({ descripcion: skuName, precio });
      const voucher = await this.prisma.voucher.create({
        data: {
          loteId: lote.id,
          orden: String((row as any)['Order'] || ''),
          clienteNombre: (row as any)['Client Name'] || '',
          clienteApellido: (row as any)['Client Last Name'] || '',
          clienteEmail: (row as any)['Email'] || '',
          clienteDni: String((row as any)['Client Document'] || ''),
          clientePhone: String((row as any)['Phone'] || ''),
          direccion: (row as any)['Street'] || '',
          distrito: (row as any)['distrito'] || '',
          ciudad: (row as any)['City'] || '',
          referencia: (row as any)['Reference'] || '',
          codigoPostal: String((row as any)['Postal Code'] || ''),
          trackingYobel: String((row as any)['tracking Yobel'] || ''),
          productos,
          total: precio,
        },
      });
      vouchers.push(voucher);
    }
    return { lote, total: vouchers.length };
  }

  private async generarQR(texto: string): Promise<Buffer> {
    const dataUrl = await QRCode.toDataURL(texto);
    return Buffer.from(dataUrl.replace('data:image/png;base64,', ''), 'base64');
  }

  private async generarBarcode(texto: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      bwipjs.toBuffer(
        { bcid: 'code128', text: texto, scale: 3, height: 10, includetext: true },
        (err: any, png: Buffer) => { if (err) reject(err); else resolve(png); }
      );
    });
  }

  private async generarPDFVoucher(voucher: any): Promise<Buffer> {
    return new Promise(async (resolve) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header rojo
      doc.rect(0, 0, 595, 80).fill('#B91C1C');
      doc.fillColor('white').fontSize(22).font('Helvetica-Bold').text('YOBEL SCM', 40, 20);
      doc.fontSize(11).font('Helvetica').text('Plataforma de Vouchers', 40, 48);
      doc.fontSize(11).text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, 400, 34);

      // Destinatario
      doc.roundedRect(40, 100, 515, 150, 8).stroke('#e5e7eb');
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#B91C1C').text('DESTINATARIO', 55, 112);
      doc.font('Helvetica').fillColor('#374151').fontSize(10);
      doc.text(`Cliente: ${voucher.clienteNombre} ${voucher.clienteApellido || ''}`, 55, 130);
      doc.text(`DNI: ${voucher.clienteDni || '-'}`, 55, 146);
      doc.text(`Direccion: ${voucher.direccion || '-'}`, 55, 162);
      doc.text(`Distrito: ${voucher.distrito || '-'}   Ciudad: ${voucher.ciudad || '-'}`, 55, 178);
      doc.text(`Referencia: ${voucher.referencia || '-'}`, 55, 194);
      doc.text(`Contacto: ${voucher.clientePhone || '-'}`, 55, 210);

      // QR y Barcode
      const qrBuffer = await this.generarQR(voucher.orden || `VOUCHER-${voucher.id}`);
      doc.image(qrBuffer, 55, 270, { width: 90, height: 90 });
      doc.fontSize(9).fillColor('#374151').text('Codigo QR', 65, 365);

      try {
        const barcodeBuffer = await this.generarBarcode(voucher.orden || `V${voucher.id}`);
        doc.image(barcodeBuffer, 180, 290, { width: 250, height: 50 });
      } catch (e) {}

      // Tracking
      doc.roundedRect(40, 380, 515, 40, 6).fill('#FEF2F2');
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#B91C1C')
        .text(`Tracking Yobel: ${voucher.trackingYobel || '-'}`, 55, 395);

      // Tabla productos
      doc.fillColor('#B91C1C').rect(40, 440, 515, 25).fill();
      doc.fillColor('white').font('Helvetica-Bold').fontSize(10)
        .text('Producto', 55, 449)
        .text('Precio', 490, 449, { align: 'right', width: 55 });

      let y = 475;
      (voucher.productos as any[]).forEach((p: any, i: number) => {
        if (i % 2 === 0) doc.rect(40, y - 5, 515, 20).fill('#f9fafb');
        doc.fillColor('#374151').font('Helvetica').fontSize(10)
          .text(p.descripcion, 55, y)
          .text(`S/ ${p.precio.toFixed(2)}`, 490, y, { align: 'right', width: 55 });
        y += 20;
      });

      // Total
      doc.rect(40, y + 5, 515, 25).fill('#1f2937');
      doc.fillColor('white').font('Helvetica-Bold').fontSize(11)
        .text('TOTAL', 55, y + 11)
        .text(`S/ ${voucher.total.toFixed(2)}`, 490, y + 11, { align: 'right', width: 55 });

      // Footer
      doc.rect(0, 720, 595, 50).fill('#1f2937');
      doc.fillColor('#9ca3af').fontSize(9).font('Helvetica')
        .text('2025 Yobel SCM - Plataforma de Vouchers', 40, 738, { align: 'center', width: 515 });

      doc.end();
    });
  }

  async enviarVouchers(loteId: number): Promise<any> {
    const vouchers = await this.prisma.voucher.findMany({ where: { loteId, estado: 'PENDIENTE' } });
    const uploadsDir = path.join(process.cwd(), 'uploads', `lote_${loteId}`);
    fs.mkdirSync(uploadsDir, { recursive: true });
    let enviados = 0;
    let errores = 0;
    const pdfsGenerados: Buffer[] = [];

    for (const voucher of vouchers) {
      try {
        const pdfBuffer = await this.generarPDFVoucher(voucher);
        pdfsGenerados.push(pdfBuffer);
        fs.writeFileSync(path.join(uploadsDir, `voucher_${voucher.id}.pdf`), pdfBuffer);

        await this.resend.emails.send({
          from: 'Yobel SCM <onboarding@resend.dev>',
          to: voucher.clienteEmail,
          subject: `Tu Voucher - Orden ${voucher.orden}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#B91C1C;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
              <h1 style="color:white;margin:0;">YOBEL SCM</h1>
            </div>
            <div style="background:#fff;padding:40px;border:1px solid #eee;">
              <p>Estimado <strong>${voucher.clienteNombre} ${voucher.clienteApellido || ''}</strong>,</p>
              <p>Adjunto tu voucher para la orden <strong style="color:#B91C1C;">${voucher.orden}</strong>.</p>
              <p>Total: <strong>S/ ${voucher.total.toFixed(2)}</strong></p>
            </div>
            <div style="background:#111827;padding:24px;text-align:center;border-radius:0 0 12px 12px;">
              <p style="color:#9CA3AF;margin:0;">2025 Yobel SCM</p>
            </div>
          </div>`,
          attachments: [{ filename: `Voucher_${voucher.orden}.pdf`, content: pdfBuffer.toString('base64') }],
        });

        await this.prisma.voucher.update({ where: { id: voucher.id }, data: { estado: 'ENVIADO' } });
        enviados++;
      } catch (e) {
        console.error(e);
        await this.prisma.voucher.update({ where: { id: voucher.id }, data: { estado: 'ERROR' } });
        errores++;
      }
    }

    // PDF maestro con todas las páginas correctamente unidas
    const pdfMaestro = await PDFLib.create();
    for (const pdfBuf of pdfsGenerados) {
      const pdfDoc = await PDFLib.load(pdfBuf);
      const pages = await pdfMaestro.copyPages(pdfDoc, pdfDoc.getPageIndices());
      pages.forEach((page: any) => pdfMaestro.addPage(page));
    }
    const pdfMaestroBytes = await pdfMaestro.save();
    const pdfMaestroPath = path.join(uploadsDir, `lote_${loteId}_completo.pdf`);
    fs.writeFileSync(pdfMaestroPath, Buffer.from(pdfMaestroBytes));

    await this.prisma.lote.update({
      where: { id: loteId },
      data: { enviados, errores, estado: 'COMPLETADO', pdfMaestro: pdfMaestroPath },
    });

    return { enviados, errores };
  }

  async getLotes() {
    return this.prisma.lote.findMany({ orderBy: { creadoEn: 'desc' } });
  }

  async getVouchersByLote(loteId: number) {
    return this.prisma.voucher.findMany({ where: { loteId } });
  }

  async eliminarLote(loteId: number) {
    const uploadsDir = path.join(process.cwd(), 'uploads', `lote_${loteId}`);
    if (fs.existsSync(uploadsDir)) fs.rmSync(uploadsDir, { recursive: true });
    await this.prisma.lote.delete({ where: { id: loteId } });
    return { mensaje: 'Lote eliminado correctamente' };
  }
}