declare module 'html-pdf-node' {
  interface FileContent {
    content: string;
  }

  interface FileUrl {
    url: string;
  }

  type File = FileContent | FileUrl;

  interface Options {
    format?: string;
    path?: string;
    width?: string | number;
    height?: string | number;
    landscape?: boolean;
    margin?: {
      top?: string | number;
      right?: string | number;
      bottom?: string | number;
      left?: string | number;
    };
    printBackground?: boolean;
    preferCSSPageSize?: boolean;
  }

  function generatePdf(file: File, options?: Options): Promise<Buffer>;
  function generatePdfs(files: File[], options?: Options): Promise<Buffer[]>;

  export { generatePdf, generatePdfs, File, FileContent, FileUrl, Options };
  export default { generatePdf, generatePdfs };
}
