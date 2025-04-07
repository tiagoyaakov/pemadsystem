import React, { useEffect, useState } from 'react';
import { 
  ClipboardCheck, 
  Clock,
  AlertTriangle,
  Clipboard,
  Calendar,
  CalendarClock
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface DashboardStats {
  totalChecklists: number;
  completedChecklists: number;
  partialChecklists: number;
  pendingChecklists: number;
  todayChecklists: number;
  weekChecklists: number;
}

const DashboardStats: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalChecklists: 0,
    completedChecklists: 0,
    partialChecklists: 0,
    pendingChecklists: 0,
    todayChecklists: 0,
    weekChecklists: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Total de checklists
        const { data: totalData, error: totalError } = await supabase
          .from('checklists')
          .select('id', { count: 'exact' });
        
        if (totalError) throw totalError;
        
        // Checklists concluídos
        const { data: completedData, error: completedError } = await supabase
          .from('checklists')
          .select('id', { count: 'exact' })
          .eq('status', 'concluido');
        
        if (completedError) throw completedError;
        
        // Checklists parciais
        const { data: partialData, error: partialError } = await supabase
          .from('checklists')
          .select('id', { count: 'exact' })
          .eq('status', 'parcial');
        
        if (partialError) throw partialError;
        
        // Checklists pendentes
        const { data: pendingData, error: pendingError } = await supabase
          .from('checklists')
          .select('id', { count: 'exact' })
          .eq('status', 'pendente');
        
        if (pendingError) throw pendingError;
        
        // Checklists de hoje
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISOString = today.toISOString();
        
        const { data: todayData, error: todayError } = await supabase
          .from('checklists')
          .select('id', { count: 'exact' })
          .gte('data', todayISOString)
          .lt('data', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString());
        
        if (todayError) throw todayError;
        
        // Checklists da semana
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekStartISOString = weekStart.toISOString();
        
        const { data: weekData, error: weekError } = await supabase
          .from('checklists')
          .select('id', { count: 'exact' })
          .gte('data', weekStartISOString);
        
        if (weekError) throw weekError;
        
        setStats({
          totalChecklists: totalData.length,
          completedChecklists: completedData.length,
          partialChecklists: partialData.length,
          pendingChecklists: pendingData.length,
          todayChecklists: todayData.length,
          weekChecklists: weekData.length
        });
      } catch (err) {
        console.error('Erro ao buscar estatísticas:', err);
        setError('Não foi possível carregar as estatísticas. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6 h-28">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-6">
        {error}
      </div>
    );
  }

  const statItems = [
    {
      title: 'Total de Checklists',
      value: stats.totalChecklists,
      icon: <Clipboard className="text-blue-500" size={24} />,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-800',
    },
    {
      title: 'Checklists Concluídos',
      value: stats.completedChecklists,
      icon: <ClipboardCheck className="text-green-500" size={24} />,
      bgColor: 'bg-green-50',
      textColor: 'text-green-800',
    },
    {
      title: 'Checklists Parciais',
      value: stats.partialChecklists,
      icon: <Clock className="text-amber-500" size={24} />,
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-800',
    },
    {
      title: 'Checklists Pendentes',
      value: stats.pendingChecklists,
      icon: <AlertTriangle className="text-red-500" size={24} />,
      bgColor: 'bg-red-50',
      textColor: 'text-red-800',
    },
    {
      title: 'Checklists de Hoje',
      value: stats.todayChecklists,
      icon: <Calendar className="text-indigo-500" size={24} />,
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-800',
    },
    {
      title: 'Checklists da Semana',
      value: stats.weekChecklists,
      icon: <CalendarClock className="text-purple-500" size={24} />,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-800',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {statItems.map((item, index) => (
        <div
          key={index}
          className={`${item.bgColor} rounded-lg shadow p-6 flex justify-between items-center`}
        >
          <div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">{item.title}</h3>
            <p className={`text-2xl font-bold ${item.textColor}`}>{item.value}</p>
          </div>
          <div className="rounded-full bg-white p-3 shadow-sm">
            {item.icon}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats; 