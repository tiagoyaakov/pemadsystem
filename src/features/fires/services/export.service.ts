import { FireIncident } from "@/lib/supabase";
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

// Interface para o objeto de dados do callback didDrawPage
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
}

/**
 * Serviço para exportação de dados de incêndios
 */
export class FireExportService {
  /**
   * Exporta os dados de incêndios para PDF
   */
  static async exportToPDF(
    fires: FireIncident[],
    regionName: string = "Brasil",
    period: { startDate: string; endDate: string }
  ): Promise<Blob> {
    return new Promise((resolve) => {
      // Configurar o documento PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Adicionar cabeçalho
      doc.setFontSize(18);
      doc.text("Relatório de Focos de Incêndio", pageWidth / 2, 15, { align: "center" });
      
      // Informações do relatório
      doc.setFontSize(12);
      doc.text(`Região: ${regionName}`, 14, 30);
      doc.text(`Período: ${new Date(period.startDate).toLocaleDateString("pt-BR")} a ${new Date(period.endDate).toLocaleDateString("pt-BR")}`, 14, 37);
      doc.text(`Total de focos detectados: ${fires.length}`, 14, 44);
      
      // Adicionar informações estatísticas se houver dados
      if (fires.length > 0) {
        // Calcular confiança média
        const avgConfidence = fires.reduce((sum, fire) => {
          const confidence = typeof fire.confidence === 'string' 
            ? parseInt(fire.confidence, 10) 
            : fire.confidence;
          return sum + (confidence || 0);
        }, 0) / fires.length;
        
        // Agrupar por data
        const firesByDate = fires.reduce((acc: Record<string, number>, fire) => {
          const date = typeof fire.acq_date === 'string' ? fire.acq_date : fire.acq_date.toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});
        
        // Encontrar a data com mais ocorrências
        let maxDate = '';
        let maxCount = 0;
        Object.entries(firesByDate).forEach(([date, count]) => {
          if (count > maxCount) {
            maxCount = count;
            maxDate = date;
          }
        });
        
        doc.text(`Confiança média: ${avgConfidence.toFixed(2)}%`, 14, 51);
        if (maxDate) {
          doc.text(`Data com mais ocorrências: ${new Date(maxDate).toLocaleDateString("pt-BR")} (${maxCount} focos)`, 14, 58);
        }
      }
      
      // Preparar dados para a tabela
      const tableData = fires.map((fire) => [
        typeof fire.acq_date === 'string' 
          ? new Date(fire.acq_date).toLocaleDateString("pt-BR") 
          : new Date(fire.acq_date).toLocaleDateString("pt-BR"),
        fire.acq_time ? `${fire.acq_time.substring(0, 2)}:${fire.acq_time.substring(2, 4)}` : "N/A",
        fire.latitude.toFixed(4),
        fire.longitude.toFixed(4),
        `${typeof fire.confidence === 'string' ? fire.confidence : fire.confidence.toFixed(0)}%`,
        fire.satellite || "N/A",
        fire.daynight === 'D' ? 'Diurno' : 'Noturno'
      ]);
      
      // Adicionar tabela de dados
      doc.autoTable({
        startY: fires.length > 0 ? 65 : 51,
        head: [["Data", "Hora", "Latitude", "Longitude", "Confiança", "Satélite", "Período"]],
        body: tableData,
        theme: "striped",
        headStyles: {
          fillColor: [211, 84, 0], // Laranja
          textColor: 255,
          fontStyle: "bold",
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
   * Exporta os dados de incêndios para Excel
   */
  static async exportToExcel(
    fires: FireIncident[],
    regionName: string = "Brasil",
    period: { startDate: string; endDate: string }
  ): Promise<Blob> {
    // Criar a planilha de dados
    const workbook = XLSX.utils.book_new();
    
    // Informações do relatório
    const reportInfo = [
      ["Relatório de Focos de Incêndio"],
      [],
      ["Região", regionName],
      ["Período", `${new Date(period.startDate).toLocaleDateString("pt-BR")} a ${new Date(period.endDate).toLocaleDateString("pt-BR")}`],
      ["Total de focos detectados", fires.length.toString()],
      []
    ];
    
    // Adicionar informações estatísticas se houver dados
    if (fires.length > 0) {
      // Calcular confiança média
      const avgConfidence = fires.reduce((sum, fire) => {
        const confidence = typeof fire.confidence === 'string' 
          ? parseInt(fire.confidence, 10) 
          : fire.confidence;
        return sum + (confidence || 0);
      }, 0) / fires.length;
      
      reportInfo.push(["Confiança média", `${avgConfidence.toFixed(2)}%`]);
    }
    
    reportInfo.push([]);
    
    // Cabeçalho da tabela de dados
    reportInfo.push(["Data", "Hora", "Latitude", "Longitude", "Confiança", "Satélite", "Período", "Intensidade (FRP)"]);
    
    // Dados dos incêndios
    fires.forEach((fire) => {
      reportInfo.push([
        typeof fire.acq_date === 'string' 
          ? new Date(fire.acq_date).toLocaleDateString("pt-BR") 
          : new Date(fire.acq_date).toLocaleDateString("pt-BR"),
        fire.acq_time ? `${fire.acq_time.substring(0, 2)}:${fire.acq_time.substring(2, 4)}` : "N/A",
        fire.latitude.toString(),
        fire.longitude.toString(),
        `${typeof fire.confidence === 'string' ? fire.confidence : fire.confidence.toFixed(0)}%`,
        fire.satellite || "N/A",
        fire.daynight === 'D' ? 'Diurno' : 'Noturno',
        fire.frp ? fire.frp.toFixed(2) : "N/A"
      ]);
    });
    
    // Criar a planilha
    const worksheet = XLSX.utils.aoa_to_sheet(reportInfo);
    
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Focos de Incêndio");
    
    // Gerar o blob do Excel
    const excelBlob = new Blob(
      [XLSX.write(workbook, { bookType: "xlsx", type: "array" })],
      { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
    );
    
    return excelBlob;
  }

  /**
   * Exporta os dados de incêndios para CSV
   */
  static async exportToCSV(fires: FireIncident[]): Promise<Blob> {
    // Cabeçalho do CSV
    const headers = ["data", "hora", "latitude", "longitude", "confianca", "satelite", "periodo", "intensidade_frp"];
    
    // Converter dados para o formato CSV
    const rows = fires.map((fire) => [
      typeof fire.acq_date === 'string' ? fire.acq_date : new Date(fire.acq_date).toISOString().split('T')[0],
      fire.acq_time || "",
      fire.latitude.toString(),
      fire.longitude.toString(),
      typeof fire.confidence === 'string' ? fire.confidence : fire.confidence.toString(),
      fire.satellite || "",
      fire.daynight,
      fire.frp ? fire.frp.toString() : ""
    ]);
    
    // Combinar cabeçalho e linhas
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Criar o blob do CSV
    const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    return csvBlob;
  }

  /**
   * Exporta os dados de incêndios para GeoJSON
   * Formato compatível com Avenza Maps e outros aplicativos de GIS
   */
  static async exportToGeoJSON(
    fires: FireIncident[],
    properties?: Record<string, any>
  ): Promise<Blob> {
    // Criar estrutura GeoJSON
    const geojson = {
      type: "FeatureCollection",
      properties: {
        name: "Focos de Incêndio",
        description: `Dados de ${fires.length} focos de incêndio`,
        created: new Date().toISOString(),
        source: "NASA FIRMS via PEMAD Material Check",
        ...properties
      },
      features: fires.map(fire => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [fire.longitude, fire.latitude]
        },
        properties: {
          id: fire.id || `${fire.latitude}_${fire.longitude}_${fire.acq_date}`,
          date: fire.acq_date,
          time: fire.acq_time ? `${fire.acq_time.substring(0, 2)}:${fire.acq_time.substring(2, 4)}` : null,
          confidence: fire.confidence,
          brightness: fire.brightness,
          satellite: fire.satellite,
          daynight: fire.daynight === 'D' ? 'Diurno' : 'Noturno',
          frp: fire.frp,
          scan: fire.scan,
          track: fire.track
        }
      }))
    };
    
    // Converter para string JSON
    const geoJsonString = JSON.stringify(geojson, null, 2);
    
    // Criar o blob do GeoJSON
    const geoJsonBlob = new Blob([geoJsonString], { type: 'application/geo+json' });
    
    return geoJsonBlob;
  }

  /**
   * Exporta os dados de incêndios para KML
   * Formato compatível com Google Earth, Avenza Maps e outros aplicativos de mapeamento
   */
  static async exportToKML(
    fires: FireIncident[],
    regionName: string = "Brasil"
  ): Promise<Blob> {
    // Cabeçalho KML
    let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Focos de Incêndio - ${regionName}</name>
    <description>Dados de ${fires.length} focos de incêndio</description>
    
    <!-- Estilo para os pontos -->
    <Style id="fireIcon">
      <IconStyle>
        <color>ff0000ff</color>
        <scale>1.0</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/shapes/fire.png</href>
        </Icon>
      </IconStyle>
    </Style>
    
    <!-- Pontos de incêndio -->`;
    
    // Adicionar cada foco de incêndio como um ponto
    fires.forEach(fire => {
      const fireDate = typeof fire.acq_date === 'string' 
        ? new Date(fire.acq_date).toLocaleDateString("pt-BR") 
        : new Date(fire.acq_date).toLocaleDateString("pt-BR");
      
      const fireTime = fire.acq_time 
        ? `${fire.acq_time.substring(0, 2)}:${fire.acq_time.substring(2, 4)}` 
        : "N/A";
      
      kml += `
    <Placemark>
      <name>Foco de Incêndio</name>
      <description>
        <![CDATA[
        <h3>Detalhes do foco de incêndio</h3>
        <table>
          <tr><td>Data:</td><td>${fireDate}</td></tr>
          <tr><td>Hora:</td><td>${fireTime}</td></tr>
          <tr><td>Latitude:</td><td>${fire.latitude}</td></tr>
          <tr><td>Longitude:</td><td>${fire.longitude}</td></tr>
          <tr><td>Confiança:</td><td>${typeof fire.confidence === 'string' ? fire.confidence : `${fire.confidence.toFixed(0)}%`}</td></tr>
          <tr><td>Satélite:</td><td>${fire.satellite || "N/A"}</td></tr>
          <tr><td>Período:</td><td>${fire.daynight === 'D' ? 'Diurno' : 'Noturno'}</td></tr>
        </table>
        ]]>
      </description>
      <styleUrl>#fireIcon</styleUrl>
      <Point>
        <coordinates>${fire.longitude},${fire.latitude},0</coordinates>
      </Point>
    </Placemark>`;
    });
    
    // Fechar o documento KML
    kml += `
  </Document>
</kml>`;
    
    // Criar o blob do KML
    const kmlBlob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
    
    return kmlBlob;
  }
} 