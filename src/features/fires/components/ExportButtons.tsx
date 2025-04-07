import React, { useState } from "react";
import { FileText, FileSpreadsheet, FileDown, Map, Globe } from "lucide-react";
import { FireIncident } from "@/lib/supabase";
import { FireExportService } from "../services/export.service";
import { saveAs } from "file-saver";

interface ExportButtonsProps {
  fires: FireIncident[];
  filters: {
    startDate: string;
    endDate: string;
    regionName?: string;
  };
  className?: string;
  showMapFormats?: boolean;
}

export const FireExportButtons: React.FC<ExportButtonsProps> = ({
  fires,
  filters,
  className = "",
  showMapFormats = true
}) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleExport = async (format: "pdf" | "excel" | "csv" | "geojson" | "kml") => {
    if (fires.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }

    try {
      setLoading(format);
      
      let blob: Blob;
      let fileName: string;
      const dateStr = new Date().toISOString().split("T")[0];
      
      switch (format) {
        case "pdf":
          blob = await FireExportService.exportToPDF(fires, filters.regionName || "Brasil", {
            startDate: filters.startDate,
            endDate: filters.endDate,
          });
          fileName = `focos-incendio-${dateStr}.pdf`;
          break;
        
        case "excel":
          blob = await FireExportService.exportToExcel(fires, filters.regionName || "Brasil", {
            startDate: filters.startDate,
            endDate: filters.endDate,
          });
          fileName = `focos-incendio-${dateStr}.xlsx`;
          break;
        
        case "csv":
          blob = await FireExportService.exportToCSV(fires);
          fileName = `focos-incendio-${dateStr}.csv`;
          break;
          
        case "geojson":
          blob = await FireExportService.exportToGeoJSON(fires, {
            region: filters.regionName || "Brasil",
            startDate: filters.startDate,
            endDate: filters.endDate
          });
          fileName = `focos-incendio-${dateStr}.geojson`;
          break;
          
        case "kml":
          blob = await FireExportService.exportToKML(fires, filters.regionName || "Brasil");
          fileName = `focos-incendio-${dateStr}.kml`;
          break;
          
        default:
          throw new Error("Formato não suportado");
      }
      
      // Salvar o arquivo
      saveAs(blob, fileName);
    } catch (error) {
      console.error(`Erro ao exportar para ${format}:`, error);
      alert(`Não foi possível exportar para ${format}. Tente novamente.`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <button
        onClick={() => handleExport("pdf")}
        disabled={loading !== null}
        className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
          loading === "pdf" ? "opacity-75 cursor-not-allowed" : ""
        }`}
      >
        {loading === "pdf" ? (
          <span className="animate-spin mr-2">⟳</span>
        ) : (
          <FileText className="mr-2 h-4 w-4" />
        )}
        PDF
      </button>
      
      <button
        onClick={() => handleExport("excel")}
        disabled={loading !== null}
        className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
          loading === "excel" ? "opacity-75 cursor-not-allowed" : ""
        }`}
      >
        {loading === "excel" ? (
          <span className="animate-spin mr-2">⟳</span>
        ) : (
          <FileSpreadsheet className="mr-2 h-4 w-4" />
        )}
        Excel
      </button>
      
      <button
        onClick={() => handleExport("csv")}
        disabled={loading !== null}
        className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
          loading === "csv" ? "opacity-75 cursor-not-allowed" : ""
        }`}
      >
        {loading === "csv" ? (
          <span className="animate-spin mr-2">⟳</span>
        ) : (
          <FileDown className="mr-2 h-4 w-4" />
        )}
        CSV
      </button>
      
      {showMapFormats && (
        <>
          <button
            onClick={() => handleExport("geojson")}
            disabled={loading !== null}
            className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
              loading === "geojson" ? "opacity-75 cursor-not-allowed" : ""
            }`}
            title="Exportar como GeoJSON para uso em Avenza Maps e outros aplicativos GIS"
          >
            {loading === "geojson" ? (
              <span className="animate-spin mr-2">⟳</span>
            ) : (
              <Map className="mr-2 h-4 w-4" />
            )}
            GeoJSON
          </button>
          
          <button
            onClick={() => handleExport("kml")}
            disabled={loading !== null}
            className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 ${
              loading === "kml" ? "opacity-75 cursor-not-allowed" : ""
            }`}
            title="Exportar como KML para uso em Google Earth, Avenza Maps e outros aplicativos"
          >
            {loading === "kml" ? (
              <span className="animate-spin mr-2">⟳</span>
            ) : (
              <Globe className="mr-2 h-4 w-4" />
            )}
            KML
          </button>
        </>
      )}
    </div>
  );
}; 