import { Checklist, ChecklistItem, Material } from "@/lib/supabase";
import { convertBase64ToBlob } from "@/lib/utils";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

// Declaração para estender o jsPDF com autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Interface para os parâmetros de exportação
interface ExportParams {
  checklist: Checklist;
  items: ChecklistItem[];
  materials: Record<string, Material>;
  locationName: string;
  sectorName: string;
}

// Definir interface para o objeto de dados do callback didDrawPage
interface AutoTableData {
  table: {
    startY: number;
    finalY: number;
  };
  settings: Record<string, any>;
  cursor: {
    y: number;
  };
  pageCount: number;
  // Outras propriedades podem ser adicionadas conforme necessário
}

// Classe para exportação de checklists
export class ChecklistExportService {
  /**
   * Exporta o checklist para PDF
   */
  static async exportToPDF({
    checklist,
    items,
    materials,
    locationName,
    sectorName,
  }: ExportParams): Promise<Blob> {
    return new Promise((resolve) => {
      // Configurar o documento PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Adicionar cabeçalho
      doc.setFontSize(18);
      doc.text("Relatório de Checklist", pageWidth / 2, 15, { align: "center" });
      
      // Informações do checklist
      doc.setFontSize(12);
      doc.text(`Data: ${new Date(checklist.data).toLocaleDateString("pt-BR")}`, 14, 30);
      doc.text(`Responsável: ${checklist.responsavel}`, 14, 37);
      doc.text(`Localização: ${locationName}`, 14, 44);
      doc.text(`Setor: ${sectorName}`, 14, 51);
      doc.text(`Status: ${this.formatStatus(checklist.status)}`, 14, 58);
      doc.text(`Progresso: ${checklist.porcentagem}%`, 14, 65);
      
      // Adicionar barra de progresso
      const progressBarWidth = 100;
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(200, 200, 200);
      doc.rect(14, 68, progressBarWidth, 5, "F");
      
      // Cor da barra de progresso baseada na porcentagem
      if (checklist.porcentagem === 100) {
        doc.setFillColor(46, 204, 113); // Verde
      } else if (checklist.porcentagem > 50) {
        doc.setFillColor(52, 152, 219); // Azul
      } else {
        doc.setFillColor(241, 196, 15); // Amarelo
      }
      
      doc.rect(14, 68, (progressBarWidth * checklist.porcentagem) / 100, 5, "F");
      
      // Adicionar observações se existirem
      if (checklist.observacoes) {
        doc.text("Observações:", 14, 80);
        
        // Quebrar texto longo em múltiplas linhas
        const textLines = doc.splitTextToSize(checklist.observacoes, pageWidth - 28);
        doc.text(textLines, 14, 87);
      }
      
      // Preparar dados para a tabela de itens
      const tableData = items.map((item) => {
        const material = materials[item.material_id];
        return [
          material ? material.nome : "Material não encontrado",
          material ? material.codigo : "",
          item.conferido ? "Sim" : "Não",
          item.observacoes || "",
        ];
      });
      
      // Adicionar tabela de itens
      doc.autoTable({
        startY: checklist.observacoes ? 100 : 80,
        head: [["Material", "Código", "Conferido", "Observações"]],
        body: tableData,
        theme: "striped",
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 30 },
          2: { cellWidth: 20 },
          3: { cellWidth: 'auto' },
        },
        didDrawPage: (_data: AutoTableData) => {
          // Adicionar rodapé com data e hora de geração
          const footerText = `Gerado em: ${new Date().toLocaleString("pt-BR")}`;
          doc.setFontSize(10);
          doc.text(
            footerText,
            pageWidth / 2,
            pageHeight - 10,
            { align: "center" }
          );
        },
      });
      
      // Gerar o blob do PDF
      const pdfBlob = convertBase64ToBlob(
        doc.output("datauristring"),
        "application/pdf"
      );
      
      resolve(pdfBlob);
    });
  }

  /**
   * Exporta o checklist para Excel
   */
  static async exportToExcel({
    checklist,
    items,
    materials,
    locationName,
    sectorName,
  }: ExportParams): Promise<Blob> {
    // Criar a planilha de dados
    const workbook = XLSX.utils.book_new();
    
    // Informações do checklist
    const checklistInfo = [
      ["Relatório de Checklist"],
      [],
      ["Data", new Date(checklist.data).toLocaleDateString("pt-BR")],
      ["Responsável", checklist.responsavel],
      ["Localização", locationName],
      ["Setor", sectorName],
      ["Status", this.formatStatus(checklist.status)],
      ["Progresso", `${checklist.porcentagem}%`],
      [],
    ];
    
    // Adicionar observações se existirem
    if (checklist.observacoes) {
      checklistInfo.push(["Observações", checklist.observacoes]);
      checklistInfo.push([]);
    }
    
    // Cabeçalho da tabela de itens
    checklistInfo.push(["Material", "Código", "Conferido", "Observações"]);
    
    // Dados dos itens
    items.forEach((item) => {
      const material = materials[item.material_id];
      checklistInfo.push([
        material ? material.nome : "Material não encontrado",
        material ? material.codigo : "",
        item.conferido ? "Sim" : "Não",
        item.observacoes || "",
      ]);
    });
    
    // Criar a planilha
    const worksheet = XLSX.utils.aoa_to_sheet(checklistInfo);
    
    // Estilizar células
    const range = XLSX.utils.decode_range(worksheet["!ref"] as string);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + "1";
      if (!worksheet[address]) continue;
      worksheet[address].s = {
        font: { bold: true, sz: 16 },
        alignment: { horizontal: "center" },
      };
    }
    
    // Adicionar a planilha ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Checklist");
    
    // Gerar o blob do Excel
    const excelBlob = new Blob(
      [XLSX.write(workbook, { bookType: "xlsx", type: "array" })],
      { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
    );
    
    return excelBlob;
  }

  /**
   * Formata o status do checklist para exibição amigável
   */
  private static formatStatus(status: string): string {
    switch (status) {
      case "concluido":
        return "Concluído";
      case "parcial":
        return "Parcial";
      case "pendente":
        return "Pendente";
      default:
        return status;
    }
  }
} 