import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { FireIncident } from '@/lib/supabase';
import { FireService } from '../services/fire.service';
import { Flame, AlertTriangle, CalendarDays, Clock } from 'lucide-react';

// Importar estilos do Leaflet
import 'leaflet/dist/leaflet.css';

// Criar ícone de fogo como um SVG em base64
const fireSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#ffffff" stroke-width="1.5">
  <circle cx="12" cy="12" r="10" fill="#e74c3c"/>
  <path d="M12,4.5c0,0,2.25,2.25,2.25,4.5c0,1.24-1.01,2.25-2.25,2.25S9.75,10.24,9.75,9C9.75,6.75,12,4.5,12,4.5z M17.25,13.5
  c0,2.25-2.25,5.25-5.25,5.25s-5.25-3-5.25-5.25c0-3,2.25-4.5,3.75-4.5c0,0-0.75,2.25,1.5,2.25S15.75,9,15.75,9
  C17.25,9,17.25,11.25,17.25,13.5z" fill="#ffffff"/>
</svg>
`;

// Converter SVG para Data URL
const iconDataUrl = `data:image/svg+xml;base64,${btoa(fireSvg)}`;

// Criar ícone do Leaflet
const fireIcon = new L.Icon({
  iconUrl: iconDataUrl,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

interface FireMapProps {
  fires?: FireIncident[];
  center?: [number, number];
  zoom?: number;
  startDate?: string;
  endDate?: string;
  height?: string;
}

const FireMap: React.FC<FireMapProps> = ({
  fires: propFires,
  center = [-15.77972, -47.92972], // Brasília como padrão
  zoom = 5,
  startDate,
  endDate,
  height = '600px'
}) => {
  const [fires, setFires] = useState<FireIncident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar focos de incêndio do banco de dados se não fornecidos como prop
  useEffect(() => {
    const loadFires = async () => {
      // Se os incêndios foram fornecidos como prop, use-os
      if (propFires) {
        setFires(propFires);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await FireService.getFireIncidents(startDate, endDate);
        setFires(data);
      } catch (err) {
        console.error('Erro ao carregar focos de incêndio:', err);
        setError('Não foi possível carregar os dados de focos de incêndio.');
      } finally {
        setLoading(false);
      }
    };

    loadFires();
  }, [startDate, endDate, propFires]);

  // Calculando intervalos de confiança para coloração
  const getConfidenceColor = (confidence: number | string): string => {
    const confidenceValue = typeof confidence === 'string' 
      ? parseInt(confidence, 10) 
      : confidence;
    
    if (confidenceValue >= 80) return 'text-red-600';
    if (confidenceValue >= 50) return 'text-orange-500';
    return 'text-yellow-500';
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">Monitoramento de Focos de Incêndio</h2>
      </div>
      
      {loading ? (
        <div className="p-6 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-500"></div>
        </div>
      ) : error ? (
        <div className="p-6 text-red-500 text-center">
          <AlertTriangle className="mx-auto mb-2" size={24} />
          <p>{error}</p>
        </div>
      ) : (
        <div style={{ height }}>
          <MapContainer 
            center={center} 
            zoom={zoom} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {fires.map((fire) => (
              <Marker
                key={`${fire.latitude}-${fire.longitude}-${fire.acq_date}-${fire.acq_time}`}
                position={[fire.latitude, fire.longitude]}
                icon={fireIcon}
              >
                <Popup>
                  <div className="p-1">
                    <div className="font-bold flex items-center mb-1">
                      <Flame className="text-red-600 mr-1" size={16} />
                      Foco de Incêndio
                    </div>
                    <div className="text-sm space-y-1">
                      <p className="flex items-center">
                        <CalendarDays className="mr-1" size={14} />
                        Data: {typeof fire.acq_date === 'string' 
                          ? new Date(fire.acq_date).toLocaleDateString('pt-BR')
                          : new Date(fire.acq_date).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="flex items-center">
                        <Clock className="mr-1" size={14} />
                        Hora: {fire.acq_time ? 
                          `${fire.acq_time.substring(0, 2)}:${fire.acq_time.substring(2, 4)}` : 
                          'N/A'}
                      </p>
                      <p className={`flex items-center ${getConfidenceColor(fire.confidence)}`}>
                        <AlertTriangle className="mr-1" size={14} />
                        Confiança: {typeof fire.confidence === 'string' 
                          ? fire.confidence
                          : `${fire.confidence.toFixed(0)}%`}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {fire.daynight === 'D' ? 'Detecção diurna' : 'Detecção noturna'}
                      </p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
            
            <MapBoundsUpdater fires={fires} />
          </MapContainer>
        </div>
      )}
      
      <div className="p-4 border-t bg-gray-50">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">
            {fires.length} focos de incêndio exibidos
          </span>
          <div className="flex space-x-4">
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 bg-red-600 rounded-full mr-1"></span>
              <span>Alta confiança</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 bg-orange-500 rounded-full mr-1"></span>
              <span>Média confiança</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-1"></span>
              <span>Baixa confiança</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente auxiliar para ajustar os limites do mapa baseado nos dados
interface MapBoundsUpdaterProps {
  fires: FireIncident[];
}

const MapBoundsUpdater: React.FC<MapBoundsUpdaterProps> = ({ fires }) => {
  const map = useMap();
  
  useEffect(() => {
    if (fires.length === 0) return;
    
    // Criar limites e adicionar cada ponto
    const bounds = L.latLngBounds([]);
    fires.forEach(fire => {
      bounds.extend([fire.latitude, fire.longitude]);
    });
    
    // Ajustar mapa para mostrar todos os pontos com padding
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [fires, map]);
  
  return null;
};

export default FireMap; 