import React, { useState } from 'react';
import { Checklist, ChecklistItem, Material } from '@/lib/supabase';
import { ChecklistExportService } from '../services/export.service';
import { downloadBlob, generateFilename } from '@/lib/utils';
import { FileSpreadsheet, FilePdf, Loader2 } from 'lucide-react';

interface ExportButtonsProps {
  checklist: Checklist;
  items: ChecklistItem[];
  materials: Record<string, Material>;
  locationName: string;
  sectorName: string;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({
  checklist,
  items,
  materials,
  locationName,
  sectorName,
}) => {
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);

  // Exportar para PDF
  const handleExportPDF = async () => {
    try {
      setExporting('pdf');
      
      const blob = await ChecklistExportService.exportToPDF({
        checklist,
        items,
        materials,
        locationName,
        sectorName,
      });
      
      // Nome do arquivo: checklist_YYYY-MM-DD_TIMESTAMP.pdf
      const checklistDate = new Date(checklist.data).toISOString().split('T')[0];
      const filename = generateFilename(`checklist_${checklistDate}`, 'pdf');
      
      downloadBlob(blob, filename);
    } catch (error) {
      console.error('Erro ao exportar para PDF:', error);
      alert('Erro ao exportar para PDF. Tente novamente.');
    } finally {
      setExporting(null);
    }
  };

  // Exportar para Excel
  const handleExportExcel = async () => {
    try {
      setExporting('excel');
      
      const blob = await ChecklistExportService.exportToExcel({
        checklist,
        items,
        materials,
        locationName,
        sectorName,
      });
      
      // Nome do arquivo: checklist_YYYY-MM-DD_TIMESTAMP.xlsx
      const checklistDate = new Date(checklist.data).toISOString().split('T')[0];
      const filename = generateFilename(`checklist_${checklistDate}`, 'xlsx');
      
      downloadBlob(blob, filename);
    } catch (error) {
      console.error('Erro ao exportar para Excel:', error);
      alert('Erro ao exportar para Excel. Tente novamente.');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExportPDF}
        disabled={exporting !== null}
        className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm"
        aria-label="Exportar para PDF"
        title="Exportar para PDF"
      >
        {exporting === 'pdf' ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Exportando...</span>
          </>
        ) : (
          <>
            <FilePdf size={16} />
            <span>PDF</span>
          </>
        )}
      </button>
      
      <button
        onClick={handleExportExcel}
        disabled={exporting !== null}
        className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm"
        aria-label="Exportar para Excel"
        title="Exportar para Excel"
      >
        {exporting === 'excel' ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Exportando...</span>
          </>
        ) : (
          <>
            <FileSpreadsheet size={16} />
            <span>Excel</span>
          </>
        )}
      </button>
    </div>
  );
};

export default ExportButtons; 