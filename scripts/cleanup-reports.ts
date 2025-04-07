import { readdirSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';
import { PERFORMANCE_CONFIG } from '../config/performance.config';

function cleanupReports(): void {
  const { outputDir, retention } = PERFORMANCE_CONFIG.report;
  const now = Date.now();
  const retentionMs = retention * 24 * 60 * 60 * 1000; // Converter dias para milissegundos

  try {
    const files = readdirSync(outputDir);
    let deletedCount = 0;
    let totalSize = 0;

    files.forEach(file => {
      const filePath = join(outputDir, file);
      const stats = statSync(filePath);
      const age = now - stats.mtimeMs;

      if (age > retentionMs) {
        totalSize += stats.size;
        unlinkSync(filePath);
        deletedCount++;
        console.log(`Deletado: ${file}`);
      }
    });

    console.log(`\nLimpeza concluída:`);
    console.log(`- ${deletedCount} arquivos removidos`);
    console.log(`- ${(totalSize / 1024 / 1024).toFixed(2)}MB liberados`);

  } catch (error) {
    console.error('Erro ao limpar relatórios:', error);
    process.exit(1);
  }
}

cleanupReports(); 