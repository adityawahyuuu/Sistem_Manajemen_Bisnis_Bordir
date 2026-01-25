import { document_template_type, document_template_status } from '../../../../prisma/generated/prisma';

// ============ Template Schema Interfaces ============

export interface PageSettings {
  size: 'A4' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface StyleSettings {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
}

export interface LogoSettings {
  enabled: boolean;
  position: 'left' | 'right' | 'center';
  maxHeight: number;
  maxWidth: number;
}

export interface CompanyInfoSettings {
  enabled: boolean;
  showName: boolean;
  showAddress: boolean;
  showPhone: boolean;
  showEmail: boolean;
}

export interface DocumentInfoSettings {
  enabled: boolean;
  showTitle: boolean;
  titleText?: string;
  showNumber: boolean;
  showDate: boolean;
  showDueDate: boolean;
  showStatus: boolean;
}

export interface HeaderSettings {
  enabled: boolean;
  layout: 'left-right' | 'centered' | 'stacked';
  logo: LogoSettings;
  companyInfo: CompanyInfoSettings;
  documentInfo: DocumentInfoSettings;
  customText?: string;
}

export interface RecipientSettings {
  enabled: boolean;
  title: string;
  showName: boolean;
  showCompanyName: boolean;
  showAddress: boolean;
  showPhone: boolean;
  showEmail: boolean;
}

export interface TableColumn {
  id: string;
  field: string;
  header: string;
  width?: string;
  align: 'left' | 'center' | 'right';
  format?: 'text' | 'number' | 'currency' | 'date';
  visible: boolean;
}

export interface TableHeaderStyle {
  backgroundColor: string;
  textColor: string;
  fontWeight: 'normal' | 'bold';
}

export interface TableRowStyle {
  alternateColors: boolean;
  alternateColor?: string;
  borderBottom: boolean;
}

export interface TableSettings {
  enabled: boolean;
  columns: TableColumn[];
  showHeader: boolean;
  headerStyle: TableHeaderStyle;
  rowStyle: TableRowStyle;
}

export interface SummaryFieldCondition {
  field: string;
  operator: 'exists' | 'gt' | 'lt' | 'eq' | 'ne';
  value?: unknown;
}

export interface SummaryField {
  id: string;
  field: string;
  label: string;
  format: 'currency' | 'percentage' | 'text';
  visible: boolean;
  isGrandTotal?: boolean;
  condition?: SummaryFieldCondition;
}

export interface SummarySettings {
  enabled: boolean;
  position: 'right' | 'left' | 'full-width';
  fields: SummaryField[];
}

export interface NotesSettings {
  enabled: boolean;
  title: string;
  showIfEmpty: boolean;
}

export interface TermsSettings {
  enabled: boolean;
  title: string;
  showIfEmpty: boolean;
}

export interface SignatureColumn {
  id: string;
  title: string;
  enabled: boolean;
}

export interface SignatureSettings {
  enabled: boolean;
  columns: SignatureColumn[];
}

export interface FooterSettings {
  enabled: boolean;
  text?: string;
  showPageNumber: boolean;
}

export interface TemplateSchema {
  schemaVersion: string;
  page: PageSettings;
  styles: StyleSettings;
  header: HeaderSettings;
  recipient: RecipientSettings;
  table: TableSettings;
  summary: SummarySettings;
  notes: NotesSettings;
  terms: TermsSettings;
  signature: SignatureSettings;
  footer: FooterSettings;
}

// ============ DTO Interfaces ============

export interface CreateTemplateDto {
  name: string;
  description?: string;
  document_type: document_template_type;
  template_schema: TemplateSchema;
  is_default?: boolean;
}

export interface UpdateTemplateDto {
  name?: string;
  description?: string;
  template_schema?: TemplateSchema;
  is_default?: boolean;
}

export interface AutosaveTemplateDto {
  template_schema: Partial<TemplateSchema>;
}

export interface CloneTemplateDto {
  name: string;
  description?: string;
}

// ============ Response Interfaces ============

export interface TemplateResponse {
  id: number;
  company_id: number | null;
  name: string;
  description: string | null;
  document_type: document_template_type;
  template_schema: TemplateSchema;
  version: number;
  status: document_template_status;
  is_default: boolean;
  is_system: boolean;
  created_by: number | null;
  created_at: Date | null;
  updated_at: Date | null;
  published_at: Date | null;
}

export interface TemplateVersionResponse {
  id: number;
  template_id: number;
  version: number;
  template_schema: TemplateSchema;
  published_by: number | null;
  published_at: Date;
}

export interface TemplateListResponse {
  data: TemplateResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PublishValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============ Query Interfaces ============

export interface TemplateQueryParams {
  page?: number;
  limit?: number;
  document_type?: document_template_type;
  status?: document_template_status;
  search?: string;
}
