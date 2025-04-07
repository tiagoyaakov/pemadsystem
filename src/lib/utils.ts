/**
 * Converte uma string base64 para Blob
 * @param base64Data String base64 com formato de Data URI
 * @param contentType Tipo de conteúdo do arquivo
 * @returns Blob
 */
export function convertBase64ToBlob(base64Data: string, contentType: string): Blob {
  // Extrair a parte de dados do Data URI
  const dataUri = base64Data.split(',');
  const byteString = dataUri[0].indexOf('base64') >= 0 
    ? atob(dataUri[1]) 
    : decodeURI(dataUri[1]);
  
  // Converter para array de bytes
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  
  return new Blob([ab], { type: contentType });
}

/**
 * Gera um nome de arquivo para download com timestamp
 * @param baseName Nome base do arquivo
 * @param extension Extensão do arquivo (sem o ponto)
 * @returns Nome do arquivo formatado
 */
export function generateFilename(baseName: string, extension: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  return `${baseName}_${timestamp}.${extension}`;
}

/**
 * Inicia o download de um Blob como arquivo
 * @param blob Blob a ser baixado
 * @param filename Nome do arquivo
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  
  // Limpar o objeto URL e remover o elemento
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(link);
  }, 100);
} 