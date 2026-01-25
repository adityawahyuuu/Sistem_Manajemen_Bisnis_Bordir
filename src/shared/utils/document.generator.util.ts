import * as fs from 'fs';
import * as path from 'path';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import htmlPdf from 'html-pdf-node';
import { storageConfig } from '../../config';
import { logger } from './logger.util';
import { TemplateSchema } from '../../modules/templates/interfaces/template.interface';
import { generateHtmlFromTemplate, DocumentData as TemplateDocumentData } from './html-builder.util';

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

  /*
   * Generate HTML from template schema and data
   * This is the new template-driven generation method
   */
  generateFromTemplate(
    template: TemplateSchema,
    data: TemplateDocumentData
  ): string {
    return generateHtmlFromTemplate(template, data);
  }

  /*
   * Generate PDF from template schema and data
   */
  async generatePdfFromTemplate(
    template: TemplateSchema,
    data: TemplateDocumentData,
    outputFileName: string
  ): Promise<string> {
    const htmlContent = generateHtmlFromTemplate(template, data);
    return this.generatePdf(htmlContent, outputFileName);
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
