import {
  TemplateSchema,
  HeaderSettings,
  RecipientSettings,
  TableSettings,
  TableColumn,
  SummarySettings,
  SummaryField,
  SignatureSettings,
  FooterSettings,
} from '../../modules/templates/interfaces/template.interface';

export interface DocumentData {
  // Company info
  company_name?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  company_logo?: string;

  // Document info
  document_number?: string;
  document_title?: string;
  date?: string;
  due_date?: string;
  status?: string;

  // Customer/recipient info
  customer_name?: string;
  customer_company?: string;
  customer_address?: string;
  customer_phone?: string;
  customer_email?: string;

  // Items
  items?: Array<{
    [key: string]: unknown;
  }>;

  // Totals
  subtotal?: number;
  discount?: number;
  tax?: number;
  total?: number;

  // Content
  notes?: string;
  terms_conditions?: string;

  // Receipt specific
  amount?: number;
  payment_method?: string;
  received_by?: string;
  description?: string;

  // Waybill specific
  vehicle_number?: string;
  driver_name?: string;

  // Any additional data
  [key: string]: unknown;
}

class HtmlBuilder {
  private template: TemplateSchema;
  private data: DocumentData;

  constructor(template: TemplateSchema, data: DocumentData) {
    this.template = template;
    this.data = data;
  }

  /**
   * Build complete HTML document
   */
  build(): string {
    const styles = this.buildStyles();
    const body = this.buildBody();

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>${styles}</style>
    </head>
    <body>
      ${body}
    </body>
    </html>
    `.trim();
  }

  /**
   * Build CSS styles from template
   */
  private buildStyles(): string {
    const { styles, page, header, table, summary } = this.template;
    const primaryColor = styles.primaryColor || '#333333';
    const secondaryColor = styles.secondaryColor || '#666666';
    const fontFamily = styles.fontFamily || 'Arial, sans-serif';
    const fontSize = styles.fontSize || 12;
    const lineHeight = styles.lineHeight || 1.5;

    return `
      @page {
        size: ${page.size} ${page.orientation};
        margin: ${page.margins.top}mm ${page.margins.right}mm ${page.margins.bottom}mm ${page.margins.left}mm;
      }
      body {
        font-family: ${fontFamily};
        font-size: ${fontSize}px;
        line-height: ${lineHeight};
        color: #333;
        margin: 0;
        padding: 20px;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 30px;
        border-bottom: 2px solid ${primaryColor};
        padding-bottom: 20px;
      }
      .header-centered {
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 2px solid ${primaryColor};
        padding-bottom: 20px;
      }
      .header-stacked {
        margin-bottom: 30px;
        border-bottom: 2px solid ${primaryColor};
        padding-bottom: 20px;
      }
      .company-info h2 {
        margin: 0 0 5px 0;
        color: ${primaryColor};
      }
      .company-info p {
        margin: 2px 0;
        color: ${secondaryColor};
        font-size: ${fontSize - 1}px;
      }
      .document-title h1 {
        margin: 0;
        color: ${primaryColor};
        font-size: 28px;
      }
      .document-title p {
        margin: 5px 0;
      }
      .label {
        color: #888;
        font-size: ${fontSize - 2}px;
        text-transform: uppercase;
      }
      .recipient {
        background: #f9f9f9;
        padding: 15px;
        border-radius: 5px;
        margin-bottom: 20px;
      }
      .recipient p {
        margin: 4px 0;
      }
      .info-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;
      }
      .info-left {
        width: 48%;
      }
      .info-right {
        width: 48%;
        text-align: right;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      th {
        background-color: ${table.headerStyle?.backgroundColor || primaryColor};
        color: ${table.headerStyle?.textColor || '#ffffff'};
        padding: 10px;
        text-align: left;
        font-size: ${fontSize - 1}px;
        font-weight: ${table.headerStyle?.fontWeight || 'bold'};
      }
      td {
        padding: 10px;
        ${table.rowStyle?.borderBottom ? `border-bottom: 1px solid #eee;` : ''}
      }
      ${table.rowStyle?.alternateColors ? `
      tr:nth-child(even) {
        background-color: ${table.rowStyle?.alternateColor || '#f9f9f9'};
      }
      ` : ''}
      tr:hover {
        background-color: #fafafa;
      }
      .summary {
        margin-top: 20px;
        ${summary.position === 'right' ? 'text-align: right;' : ''}
        ${summary.position === 'left' ? 'text-align: left;' : ''}
      }
      .summary table {
        width: ${summary.position === 'full-width' ? '100%' : '300px'};
        ${summary.position === 'right' ? 'margin-left: auto;' : ''}
      }
      .summary td {
        border: none;
        padding: 5px 10px;
      }
      .summary .label-col {
        text-align: right;
        color: ${secondaryColor};
      }
      .summary .value-col {
        text-align: right;
        font-weight: 500;
      }
      .summary .grand-total td {
        font-size: ${fontSize + 4}px;
        font-weight: bold;
        color: ${primaryColor};
        border-top: 2px solid ${primaryColor};
        padding-top: 10px;
      }
      .notes {
        margin-top: 30px;
        padding: 15px;
        background: #f9f9f9;
        border-radius: 5px;
      }
      .notes h4 {
        margin: 0 0 10px 0;
        color: #555;
      }
      .terms {
        margin-top: 20px;
        font-size: ${fontSize - 2}px;
        color: #888;
      }
      .signature-section {
        margin-top: 50px;
        display: flex;
        justify-content: space-around;
      }
      .signature-box {
        width: 150px;
        text-align: center;
      }
      .signature-line {
        border-top: 1px solid #333;
        margin-top: 60px;
        padding-top: 5px;
      }
      .footer {
        margin-top: 40px;
        text-align: center;
        color: #888;
        font-size: ${fontSize - 1}px;
        border-top: 1px solid #eee;
        padding-top: 20px;
      }
      .status-badge {
        display: inline-block;
        padding: 5px 15px;
        border-radius: 20px;
        font-size: ${fontSize - 1}px;
        text-transform: uppercase;
        color: white;
      }
      .status-paid { background: #4caf50; }
      .status-cancelled { background: #f44336; }
      .status-default { background: #ff9800; }
      .amount-display {
        text-align: center;
        margin: 30px 0;
        padding: 20px;
        background: #f5f5f5;
        border-radius: 8px;
      }
      .amount-display h2 {
        margin: 0;
        color: #2e7d32;
        font-size: 28px;
      }
    `.trim();
  }

  /**
   * Build HTML body content
   */
  private buildBody(): string {
    const parts: string[] = [];

    if (this.template.header.enabled) {
      parts.push(this.buildHeader(this.template.header));
    }

    if (this.template.recipient.enabled) {
      parts.push(this.buildRecipient(this.template.recipient));
    }

    if (this.template.table.enabled && this.data.items) {
      parts.push(this.buildTable(this.template.table));
    }

    if (this.template.summary.enabled) {
      parts.push(this.buildSummary(this.template.summary));
    }

    if (this.template.notes.enabled && (this.data.notes || this.template.notes.showIfEmpty)) {
      parts.push(this.buildNotes());
    }

    if (this.template.terms.enabled && (this.data.terms_conditions || this.template.terms.showIfEmpty)) {
      parts.push(this.buildTerms());
    }

    if (this.template.signature.enabled) {
      parts.push(this.buildSignature(this.template.signature));
    }

    if (this.template.footer.enabled) {
      parts.push(this.buildFooter(this.template.footer));
    }

    return parts.join('\n');
  }

  /**
   * Build header section
   */
  private buildHeader(header: HeaderSettings): string {
    const { layout, logo, companyInfo, documentInfo, customText } = header;

    let logoHtml = '';
    if (logo.enabled && this.data.company_logo) {
      logoHtml = `<img src="${this.data.company_logo}" alt="Logo" style="max-height: ${logo.maxHeight}px; max-width: ${logo.maxWidth}px; margin-bottom: 10px;" />`;
    }

    let companyHtml = '';
    if (companyInfo.enabled) {
      companyHtml = `
        <div class="company-info">
          ${logoHtml}
          ${companyInfo.showName ? `<h2>${this.data.company_name || ''}</h2>` : ''}
          ${companyInfo.showAddress ? `<p>${this.data.company_address || ''}</p>` : ''}
          <p>
            ${companyInfo.showPhone && this.data.company_phone ? `Tel: ${this.data.company_phone}` : ''}
            ${companyInfo.showEmail && this.data.company_email ? `| ${this.data.company_email}` : ''}
          </p>
        </div>
      `;
    }

    let documentHtml = '';
    if (documentInfo.enabled) {
      documentHtml = `
        <div class="document-title">
          ${documentInfo.showTitle ? `<h1>${documentInfo.titleText || this.data.document_title || 'DOCUMENT'}</h1>` : ''}
          ${documentInfo.showNumber ? `<p><strong>${this.data.document_number || ''}</strong></p>` : ''}
          ${documentInfo.showDate ? `
            <p class="label">Tanggal</p>
            <p>${this.data.date || '-'}</p>
          ` : ''}
          ${documentInfo.showDueDate && this.data.due_date ? `
            <p class="label">Jatuh Tempo</p>
            <p>${this.data.due_date}</p>
          ` : ''}
          ${documentInfo.showStatus && this.data.status ? `
            <span class="status-badge status-${this.data.status === 'paid' ? 'paid' : this.data.status === 'cancelled' ? 'cancelled' : 'default'}">${this.data.status}</span>
          ` : ''}
        </div>
      `;
    }

    if (layout === 'centered') {
      return `
        <div class="header-centered">
          ${logoHtml}
          ${documentInfo.showTitle ? `<h1>${documentInfo.titleText || this.data.document_title || 'DOCUMENT'}</h1>` : ''}
          ${documentInfo.showNumber ? `<p><strong>${this.data.document_number || ''}</strong></p>` : ''}
          ${companyInfo.showName ? `<p>${this.data.company_name || ''}</p>` : ''}
          ${customText ? `<p>${customText}</p>` : ''}
        </div>
      `;
    }

    if (layout === 'stacked') {
      return `
        <div class="header-stacked">
          ${logoHtml}
          ${companyHtml}
          <hr style="margin: 15px 0; border: none; border-top: 1px solid #eee;" />
          ${documentHtml}
          ${customText ? `<p>${customText}</p>` : ''}
        </div>
      `;
    }

    // Default: left-right layout
    return `
      <div class="header">
        ${companyHtml}
        ${documentHtml}
      </div>
      ${customText ? `<p style="text-align: center; margin-bottom: 20px;">${customText}</p>` : ''}
    `;
  }

  /**
   * Build recipient section
   */
  private buildRecipient(recipient: RecipientSettings): string {
    return `
      <div class="recipient">
        <p class="label">${recipient.title}</p>
        ${recipient.showName ? `<p><strong>${this.data.customer_name || ''}</strong></p>` : ''}
        ${recipient.showCompanyName && this.data.customer_company ? `<p>${this.data.customer_company}</p>` : ''}
        ${recipient.showAddress && this.data.customer_address ? `<p>${this.data.customer_address}</p>` : ''}
        ${recipient.showPhone && this.data.customer_phone ? `<p>Tel: ${this.data.customer_phone}</p>` : ''}
        ${recipient.showEmail && this.data.customer_email ? `<p>Email: ${this.data.customer_email}</p>` : ''}
      </div>
    `;
  }

  /**
   * Build items table
   */
  private buildTable(table: TableSettings): string {
    const visibleColumns = table.columns.filter((col) => col.visible);
    const items = this.data.items || [];

    const headerRow = visibleColumns
      .map((col) => {
        const style = `text-align: ${col.align}; ${col.width ? `width: ${col.width};` : ''}`;
        return `<th style="${style}">${col.header}</th>`;
      })
      .join('');

    const bodyRows = items
      .map((item, index) => {
        const cells = visibleColumns
          .map((col) => {
            const value = this.getCellValue(col, item, index);
            const style = `text-align: ${col.align};`;
            return `<td style="${style}">${value}</td>`;
          })
          .join('');
        return `<tr>${cells}</tr>`;
      })
      .join('');

    return `
      <table>
        ${table.showHeader ? `<thead><tr>${headerRow}</tr></thead>` : ''}
        <tbody>${bodyRows}</tbody>
      </table>
    `;
  }

  /**
   * Get formatted cell value
   */
  private getCellValue(col: TableColumn, item: Record<string, unknown>, index: number): string {
    if (col.field === 'index') {
      return String(index + 1);
    }

    const value = item[col.field];

    if (value === undefined || value === null) {
      return '-';
    }

    switch (col.format) {
      case 'currency':
        return `Rp ${Number(value).toLocaleString('id-ID')}`;
      case 'number':
        return Number(value).toLocaleString('id-ID');
      case 'date':
        return String(value);
      default:
        return String(value);
    }
  }

  /**
   * Build summary/totals section
   */
  private buildSummary(summary: SummarySettings): string {
    const visibleFields = summary.fields.filter((field) => {
      if (!field.visible) return false;
      if (field.condition) {
        return this.evaluateCondition(field.condition);
      }
      return true;
    });

    const rows = visibleFields
      .map((field) => this.buildSummaryRow(field))
      .join('');

    return `
      <div class="summary">
        <table>
          ${rows}
        </table>
      </div>
    `;
  }

  /**
   * Build single summary row
   */
  private buildSummaryRow(field: SummaryField): string {
    const value = this.data[field.field];
    let formattedValue = '-';

    if (value !== undefined && value !== null) {
      switch (field.format) {
        case 'currency':
          formattedValue = `Rp ${Number(value).toLocaleString('id-ID')}`;
          break;
        case 'percentage':
          formattedValue = `${Number(value)}%`;
          break;
        default:
          formattedValue = String(value);
      }
    }

    const rowClass = field.isGrandTotal ? 'grand-total' : '';

    return `
      <tr class="${rowClass}">
        <td class="label-col">${field.label}</td>
        <td class="value-col">${formattedValue}</td>
      </tr>
    `;
  }

  /**
   * Evaluate condition for conditional fields
   */
  private evaluateCondition(condition: { field: string; operator: string; value?: unknown }): boolean {
    const fieldValue = this.data[condition.field];

    switch (condition.operator) {
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null && fieldValue !== 0;
      case 'gt':
        return Number(fieldValue) > Number(condition.value);
      case 'lt':
        return Number(fieldValue) < Number(condition.value);
      case 'eq':
        return fieldValue === condition.value;
      case 'ne':
        return fieldValue !== condition.value;
      default:
        return true;
    }
  }

  /**
   * Build notes section
   */
  private buildNotes(): string {
    return `
      <div class="notes">
        <h4>${this.template.notes.title}</h4>
        <p>${this.data.notes || ''}</p>
      </div>
    `;
  }

  /**
   * Build terms section
   */
  private buildTerms(): string {
    return `
      <div class="terms">
        <strong>${this.template.terms.title}</strong>
        <p>${this.data.terms_conditions || ''}</p>
      </div>
    `;
  }

  /**
   * Build signature section
   */
  private buildSignature(signature: SignatureSettings): string {
    const enabledColumns = signature.columns.filter((col) => col.enabled);

    const boxes = enabledColumns
      .map(
        (col) => `
        <div class="signature-box">
          <div class="signature-line">${col.title}</div>
        </div>
      `
      )
      .join('');

    return `
      <div class="signature-section">
        ${boxes}
      </div>
    `;
  }

  /**
   * Build footer section
   */
  private buildFooter(footer: FooterSettings): string {
    return `
      <div class="footer">
        ${footer.text || ''}
        ${footer.showPageNumber ? '<p style="margin-top: 10px; font-size: 10px;">Halaman 1</p>' : ''}
      </div>
    `;
  }
}

/**
 * Generate HTML from template schema and data
 */
export function generateHtmlFromTemplate(
  template: TemplateSchema,
  data: DocumentData
): string {
  const builder = new HtmlBuilder(template, data);
  return builder.build();
}

/**
 * Create default invoice template schema
 */
export function getDefaultInvoiceTemplate(): TemplateSchema {
  return {
    schemaVersion: '1.0.0',
    page: {
      size: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
    },
    styles: {
      primaryColor: '#333333',
      secondaryColor: '#666666',
      fontFamily: 'Arial, sans-serif',
      fontSize: 12,
      lineHeight: 1.5,
    },
    header: {
      enabled: true,
      layout: 'left-right',
      logo: { enabled: true, position: 'left', maxHeight: 60, maxWidth: 200 },
      companyInfo: { enabled: true, showName: true, showAddress: true, showPhone: true, showEmail: true },
      documentInfo: { enabled: true, showTitle: true, titleText: 'INVOICE', showNumber: true, showDate: true, showDueDate: true, showStatus: true },
    },
    recipient: {
      enabled: true,
      title: 'Ditagihkan Kepada:',
      showName: true,
      showCompanyName: true,
      showAddress: true,
      showPhone: true,
      showEmail: false,
    },
    table: {
      enabled: true,
      showHeader: true,
      headerStyle: { backgroundColor: '#333333', textColor: '#ffffff', fontWeight: 'bold' },
      rowStyle: { alternateColors: false, borderBottom: true },
      columns: [
        { id: 'no', field: 'index', header: 'No', width: '40px', align: 'center', format: 'number', visible: true },
        { id: 'description', field: 'description', header: 'Deskripsi', align: 'left', format: 'text', visible: true },
        { id: 'quantity', field: 'quantity', header: 'Qty', width: '60px', align: 'center', format: 'number', visible: true },
        { id: 'unit', field: 'unit', header: 'Satuan', width: '60px', align: 'center', format: 'text', visible: true },
        { id: 'unit_price', field: 'unit_price', header: 'Harga Satuan', width: '120px', align: 'right', format: 'currency', visible: true },
        { id: 'total', field: 'total', header: 'Total', width: '120px', align: 'right', format: 'currency', visible: true },
      ],
    },
    summary: {
      enabled: true,
      position: 'right',
      fields: [
        { id: 'subtotal', field: 'subtotal', label: 'Subtotal', format: 'currency', visible: true },
        { id: 'discount', field: 'discount', label: 'Diskon', format: 'currency', visible: true, condition: { field: 'discount', operator: 'gt', value: 0 } },
        { id: 'tax', field: 'tax', label: 'Pajak', format: 'currency', visible: true, condition: { field: 'tax', operator: 'gt', value: 0 } },
        { id: 'total', field: 'total', label: 'Total', format: 'currency', visible: true, isGrandTotal: true },
      ],
    },
    notes: { enabled: true, title: 'Catatan:', showIfEmpty: false },
    terms: { enabled: true, title: 'Syarat & Ketentuan:', showIfEmpty: false },
    signature: {
      enabled: true,
      columns: [{ id: 'sender', title: 'Hormat Kami', enabled: true }],
    },
    footer: { enabled: true, text: 'Terima kasih atas kepercayaan Anda', showPageNumber: false },
  };
}

/**
 * Create default receipt template schema
 */
export function getDefaultReceiptTemplate(): TemplateSchema {
  return {
    schemaVersion: '1.0.0',
    page: {
      size: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
    },
    styles: {
      primaryColor: '#333333',
      secondaryColor: '#666666',
      fontFamily: 'Arial, sans-serif',
      fontSize: 12,
      lineHeight: 1.5,
    },
    header: {
      enabled: true,
      layout: 'centered',
      logo: { enabled: true, position: 'center', maxHeight: 60, maxWidth: 200 },
      companyInfo: { enabled: true, showName: true, showAddress: false, showPhone: false, showEmail: false },
      documentInfo: { enabled: true, showTitle: true, titleText: 'KWITANSI', showNumber: true, showDate: false, showDueDate: false, showStatus: false },
    },
    recipient: {
      enabled: true,
      title: 'Telah diterima dari:',
      showName: true,
      showCompanyName: false,
      showAddress: false,
      showPhone: false,
      showEmail: false,
    },
    table: {
      enabled: false,
      showHeader: false,
      headerStyle: { backgroundColor: '#333333', textColor: '#ffffff', fontWeight: 'bold' },
      rowStyle: { alternateColors: false, borderBottom: true },
      columns: [],
    },
    summary: {
      enabled: false,
      position: 'right',
      fields: [],
    },
    notes: { enabled: true, title: 'Keterangan:', showIfEmpty: false },
    terms: { enabled: false, title: 'Syarat & Ketentuan:', showIfEmpty: false },
    signature: {
      enabled: true,
      columns: [
        { id: 'receiver', title: 'Penerima', enabled: true },
        { id: 'giver', title: 'Yang Menyerahkan', enabled: true },
      ],
    },
    footer: { enabled: false, showPageNumber: false },
  };
}

/**
 * Create default waybill template schema
 */
export function getDefaultWaybillTemplate(): TemplateSchema {
  return {
    schemaVersion: '1.0.0',
    page: {
      size: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
    },
    styles: {
      primaryColor: '#333333',
      secondaryColor: '#666666',
      fontFamily: 'Arial, sans-serif',
      fontSize: 12,
      lineHeight: 1.5,
    },
    header: {
      enabled: true,
      layout: 'centered',
      logo: { enabled: true, position: 'center', maxHeight: 60, maxWidth: 200 },
      companyInfo: { enabled: true, showName: true, showAddress: true, showPhone: true, showEmail: false },
      documentInfo: { enabled: true, showTitle: true, titleText: 'SURAT JALAN', showNumber: true, showDate: true, showDueDate: false, showStatus: false },
    },
    recipient: {
      enabled: true,
      title: 'Kepada:',
      showName: true,
      showCompanyName: true,
      showAddress: true,
      showPhone: true,
      showEmail: false,
    },
    table: {
      enabled: true,
      showHeader: true,
      headerStyle: { backgroundColor: '#333333', textColor: '#ffffff', fontWeight: 'bold' },
      rowStyle: { alternateColors: false, borderBottom: true },
      columns: [
        { id: 'no', field: 'index', header: 'No', width: '40px', align: 'center', format: 'number', visible: true },
        { id: 'description', field: 'description', header: 'Nama Barang', align: 'left', format: 'text', visible: true },
        { id: 'quantity', field: 'quantity', header: 'Qty', width: '80px', align: 'center', format: 'number', visible: true },
        { id: 'unit', field: 'unit', header: 'Satuan', width: '80px', align: 'center', format: 'text', visible: true },
        { id: 'notes', field: 'notes', header: 'Keterangan', align: 'left', format: 'text', visible: true },
      ],
    },
    summary: {
      enabled: false,
      position: 'right',
      fields: [],
    },
    notes: { enabled: true, title: 'Catatan:', showIfEmpty: false },
    terms: { enabled: false, title: 'Syarat & Ketentuan:', showIfEmpty: false },
    signature: {
      enabled: true,
      columns: [
        { id: 'sender', title: 'Pengirim', enabled: true },
        { id: 'driver', title: 'Driver', enabled: true },
        { id: 'receiver', title: 'Penerima', enabled: true },
      ],
    },
    footer: { enabled: false, showPageNumber: false },
  };
}
