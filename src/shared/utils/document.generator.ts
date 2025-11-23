import * as fs from 'fs';
import * as path from 'path';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import htmlPdf from 'html-pdf-node';
import { storageConfig } from '../../config';
import { logger } from './logger.util';

export interface DocumentData {
  [key: string]: unknown;
}

export type DocumentType = 'invoice' | 'receipt' | 'waybill';
export type OutputFormat = 'docx' | 'pdf';

class DocumentGenerator {
  private ensureDirectories(): void {
    // Ensure templates directory exists
    if (!fs.existsSync(storageConfig.templatesPath)) {
      fs.mkdirSync(storageConfig.templatesPath, { recursive: true });
    }

    // For generated path: create if not exists, clear files if exists
    if (!fs.existsSync(storageConfig.generatedPath)) {
      fs.mkdirSync(storageConfig.generatedPath, { recursive: true });
      logger.info(`Created directory: ${storageConfig.generatedPath}`);
    } else {
      // Clear all files in generated folder
      try {
        const files = fs.readdirSync(storageConfig.generatedPath);
        for (const file of files) {
          const filePath = path.join(storageConfig.generatedPath, file);
          const stat = fs.statSync(filePath);
          if (stat.isFile()) {
            fs.unlinkSync(filePath);
          }
        }
        if (files.length > 0) {
          logger.info(`Cleared ${files.length} files from: ${storageConfig.generatedPath}`);
        }
      } catch (err) {
        logger.error('Error clearing generated files:', err);
      }
    }
  }

  async generateDocx(
    templateName: string,
    data: DocumentData,
    outputFileName: string
  ): Promise<string> {
    this.ensureDirectories();

    const templatePath = path.join(storageConfig.templatesPath, `${templateName}.docx`);

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }

    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.render(data);

    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    const outputPath = path.join(storageConfig.generatedPath, outputFileName);
    fs.writeFileSync(outputPath, buf);

    logger.info(`Document generated: ${outputPath}`);
    return outputPath;
  }

  async generatePdf(
    htmlContent: string,
    outputFileName: string
  ): Promise<string> {
    this.ensureDirectories();

    const file = { content: htmlContent };
    const options = {
      format: 'A4',
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
    };

    const pdfBuffer = await htmlPdf.generatePdf(file, options);
    const outputPath = path.join(storageConfig.generatedPath, outputFileName);

    fs.writeFileSync(outputPath, pdfBuffer);

    logger.info(`PDF generated: ${outputPath}`);
    return outputPath;
  }

  generateInvoiceHtml(data: DocumentData): string {
    const items = data.items as Array<{
      description: string;
      quantity: number;
      unit: string;
      unit_price: number;
      total: number;
    }>;

    const itemsHtml = items?.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${item.description}</td>
        <td>${item.quantity}</td>
        <td>${item.unit}</td>
        <td>Rp ${Number(item.unit_price).toLocaleString('id-ID')}</td>
        <td>Rp ${Number(item.total).toLocaleString('id-ID')}</td>
      </tr>
    `).join('') || '';

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { margin: 0; color: #333; }
        .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .info-left, .info-right { width: 48%; }
        .info p { margin: 5px 0; }
        .info strong { color: #555; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background-color: #f5f5f5; }
        .totals { text-align: right; }
        .totals p { margin: 5px 0; }
        .totals .grand-total { font-size: 18px; font-weight: bold; color: #333; }
        .footer { margin-top: 50px; text-align: center; color: #777; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>INVOICE</h1>
        <p><strong>${data.invoice_number}</strong></p>
      </div>

      <div class="info">
        <div class="info-left">
          <p><strong>Kepada:</strong></p>
          <p>${data.customer_name}</p>
          <p>${data.customer_company || ''}</p>
          <p>${data.customer_address || ''}</p>
          <p>${data.customer_phone || ''}</p>
        </div>
        <div class="info-right">
          <p><strong>Tanggal:</strong> ${data.date}</p>
          <p><strong>Jatuh Tempo:</strong> ${data.due_date}</p>
          <p><strong>Status:</strong> ${data.status}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Deskripsi</th>
            <th>Qty</th>
            <th>Satuan</th>
            <th>Harga</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="totals">
        <p>Subtotal: Rp ${Number(data.subtotal).toLocaleString('id-ID')}</p>
        ${data.discount ? `<p>Diskon: Rp ${Number(data.discount).toLocaleString('id-ID')}</p>` : ''}
        ${data.tax ? `<p>Pajak: Rp ${Number(data.tax).toLocaleString('id-ID')}</p>` : ''}
        <p class="grand-total">Total: Rp ${Number(data.total).toLocaleString('id-ID')}</p>
      </div>

      ${data.notes ? `<p><strong>Catatan:</strong> ${data.notes}</p>` : ''}

      <div class="footer">
        <p>Terima kasih atas kepercayaan Anda</p>
      </div>
    </body>
    </html>
    `;
  }

  generateReceiptHtml(data: DocumentData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { margin: 0; color: #333; }
        .info { margin-bottom: 20px; }
        .info p { margin: 8px 0; }
        .amount { text-align: center; margin: 30px 0; padding: 20px; background: #f5f5f5; border-radius: 8px; }
        .amount h2 { margin: 0; color: #2e7d32; font-size: 28px; }
        .signature { margin-top: 60px; display: flex; justify-content: space-between; }
        .signature div { width: 40%; text-align: center; }
        .signature-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>KWITANSI</h1>
        <p><strong>${data.receipt_number}</strong></p>
      </div>

      <div class="info">
        <p><strong>Telah diterima dari:</strong> ${data.customer_name}</p>
        <p><strong>Tanggal:</strong> ${data.receipt_date}</p>
        <p><strong>Metode Pembayaran:</strong> ${data.payment_method}</p>
        ${data.invoice_number ? `<p><strong>Untuk Invoice:</strong> ${data.invoice_number}</p>` : ''}
        <p><strong>Keterangan:</strong> ${data.description || 'Pembayaran'}</p>
      </div>

      <div class="amount">
        <p>Jumlah Pembayaran:</p>
        <h2>Rp ${Number(data.amount).toLocaleString('id-ID')}</h2>
      </div>

      ${data.notes ? `<p><strong>Catatan:</strong> ${data.notes}</p>` : ''}

      <div class="signature">
        <div>
          <div class="signature-line">Penerima</div>
        </div>
        <div>
          <div class="signature-line">${data.received_by || 'Yang Menyerahkan'}</div>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  generateWaybillHtml(data: DocumentData): string {
    const items = data.items as Array<{
      description: string;
      quantity: number;
      unit: string;
    }>;

    const itemsHtml = items?.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${item.description}</td>
        <td>${item.quantity}</td>
        <td>${item.unit}</td>
      </tr>
    `).join('') || '';

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { margin: 0; color: #333; }
        .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .info-left, .info-right { width: 48%; }
        .info p { margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background-color: #f5f5f5; }
        .delivery-info { background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .signature { margin-top: 40px; display: flex; justify-content: space-between; }
        .signature div { width: 30%; text-align: center; }
        .signature-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>SURAT JALAN</h1>
        <p><strong>${data.waybill_number}</strong></p>
      </div>

      <div class="info">
        <div class="info-left">
          <p><strong>Kepada:</strong></p>
          <p>${data.customer_name}</p>
          <p>${data.delivery_address}</p>
          <p>${data.delivery_city}, ${data.delivery_province}</p>
        </div>
        <div class="info-right">
          <p><strong>Tanggal:</strong> ${data.date}</p>
          ${data.invoice_number ? `<p><strong>No. Invoice:</strong> ${data.invoice_number}</p>` : ''}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Deskripsi Barang</th>
            <th>Qty</th>
            <th>Satuan</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="delivery-info">
        <p><strong>Informasi Pengiriman:</strong></p>
        ${data.vehicle_type ? `<p>Kendaraan: ${data.vehicle_type} - ${data.vehicle_number || ''}</p>` : ''}
        ${data.driver_name ? `<p>Driver: ${data.driver_name} (${data.driver_phone || ''})</p>` : ''}
      </div>

      ${data.notes ? `<p><strong>Catatan:</strong> ${data.notes}</p>` : ''}

      <div class="signature">
        <div>
          <div class="signature-line">Pengirim</div>
        </div>
        <div>
          <div class="signature-line">Driver</div>
        </div>
        <div>
          <div class="signature-line">Penerima</div>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  getFilePath(fileName: string): string {
    return path.join(storageConfig.generatedPath, fileName);
  }

  fileExists(fileName: string): boolean {
    return fs.existsSync(this.getFilePath(fileName));
  }

  deleteFile(fileName: string): void {
    const filePath = this.getFilePath(fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`File deleted: ${filePath}`);
    }
  }
}

export const documentGenerator = new DocumentGenerator();
