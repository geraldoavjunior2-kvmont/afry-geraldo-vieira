'use client';

import { useState, useEffect } from 'react';
import { fetchEquipmentByDiscipline, updateEquipment, deleteEquipment, createEquipment, MCCEquipment } from '@/lib/supabase';
import EquipmentTable from '@/components/EquipmentTable';
import NewEquipmentModal from '@/components/NewEquipmentModal';
import ActivityLogPanel from '@/components/ActivityLogPanel';
import './TabDiscipline.css';

const LABELS: Record<string, string> = {
  EIA: 'ELÉTRICA & INSTRUMENTAÇÃO',
  MEC: 'MECÂNICA',
  TUB: 'TUBULAÇÃO',
};

interface Props {
  discipline: 'EIA' | 'MEC' | 'TUB';
}

export default function TabDiscipline({ discipline }: Props) {
  const [equipment, setEquipment] = useState<MCCEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { load(); }, [discipline]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      setEquipment(await fetchEquipmentByDiscipline(discipline));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const recompute = (eq: MCCEquipment): MCCEquipment => {
    const gate1 = eq.infra === 1 && eq.cable_laying === 1 && eq.connection === 1;
    const gate2 = eq.tests === 1 && eq.walkdown_punch_list === 'OK';
    return {
      ...eq,
      gate1_status: gate1 ? '⚑' : '🔒',
      gate2_status: gate2 ? '⚑' : '🔒',
      backlog_status: gate1 ? 'Liberado para Comissionamento A Frio' : 'Aguardando MC',
    };
  };

  const handleUpdate = async (id: number, field: keyof MCCEquipment, value: unknown) => {
    try {
      await updateEquipment(id, { [field]: value } as Partial<MCCEquipment>);
      setEquipment((prev) => prev.map((eq) => eq.id === id ? recompute({ ...eq, [field]: value }) : eq));
    } catch (err) {
      alert(`Erro ao atualizar: ${err instanceof Error ? err.message : 'Desconhecido'}`);
    }
  };

  const handleDelete = async (id: number, tag: string) => {
    try {
      await deleteEquipment(id, tag);
      setEquipment((prev) => prev.filter((eq) => eq.id !== id));
    } catch (err) {
      alert(`Erro ao excluir: ${err instanceof Error ? err.message : 'Desconhecido'}`);
    }
  };

  const handleCreate = async (tag: string, name: string) => {
    await createEquipment(discipline, tag, name);
    await load();
  };

  return (
    <div className="tab-discipline">
      <div className="tab-discipline-header">
        <h2>Controle MC&amp;C — {LABELS[discipline]}</h2>
        <button className="btn-novo" onClick={() => setShowModal(true)}>
          + Novo
        </button>
      </div>

      {loading && <p className="loading">Carregando...</p>}
      {error && <p className="error">Erro: {error} <button onClick={load} className="btn-retry">↺ Tentar novamente</button></p>}

      {!loading && !error && (
        <>
          <EquipmentTable
            equipment={equipment}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            editingId={editingId}
            setEditingId={setEditingId}
          />
          <ActivityLogPanel />
        </>
      )}

      {showModal && (
        <NewEquipmentModal
          discipline={discipline}
          onSave={handleCreate}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
