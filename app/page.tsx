'use client';

import { useState, useEffect } from 'react';
import { fetchEquipmentByDiscipline, MCCEquipment, fetchSummary, SummaryByDiscipline } from '@/lib/supabase';
import TabEIA from '@/components/TabEIA';
import TabMEC from '@/components/TabMEC';
import TabTUB from '@/components/TabTUB';
import Summary from '@/components/Summary';
import './styles.css';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'RESUMO' | 'EIA' | 'MEC' | 'TUB'>('RESUMO');
  const [summary, setSummary] = useState<SummaryByDiscipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const data = await fetchSummary();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      console.error('Error loading summary:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <header className="header">
        <h1>MC&C Control System</h1>
        <p>Area 5072 - CAPTAÇÃO (Water Intake)</p>
      </header>

      <nav className="tabs">
        <button
          className={`tab ${activeTab === 'RESUMO' ? 'active' : ''}`}
          onClick={() => setActiveTab('RESUMO')}
        >
          📊 RESUMO MC&C
        </button>
        <button
          className={`tab ${activeTab === 'EIA' ? 'active' : ''}`}
          onClick={() => setActiveTab('EIA')}
        >
          Controle MC&C-EIA
        </button>
        <button
          className={`tab ${activeTab === 'MEC' ? 'active' : ''}`}
          onClick={() => setActiveTab('MEC')}
        >
          Controle MC&C-MEC
        </button>
        <button
          className={`tab ${activeTab === 'TUB' ? 'active' : ''}`}
          onClick={() => setActiveTab('TUB')}
        >
          Controle MC&C-TUB
        </button>
      </nav>

      <div className="content">
        {loading && <p className="loading">Carregando dados...</p>}
        {error && <p className="error">Erro: {error}</p>}

        {!loading && !error && (
          <>
            {activeTab === 'RESUMO' && <Summary summary={summary} onRefresh={loadSummary} />}
            {activeTab === 'EIA' && <TabEIA />}
            {activeTab === 'MEC' && <TabMEC />}
            {activeTab === 'TUB' && <TabTUB />}
          </>
        )}
      </div>
    </main>
  );
}
