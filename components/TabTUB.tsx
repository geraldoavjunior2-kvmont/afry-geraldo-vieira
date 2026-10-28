'use client';

import { useState, useEffect } from 'react';
import { fetchEquipmentByDiscipline, updateEquipment, MCCEquipment } from '@/lib/supabase';
import EquipmentTable from '@/components/EquipmentTable';

export default function TabTUB() {
  const [equipment, setEquipment] = useState<MCCEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      setLoading(true);
      const data = await fetchEquipmentByDiscipline('TUB');
      setEquipment(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      console.error('Error loading TUB equipment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateField = async (
    id: number,
    field: keyof MCCEquipment,
    value: any
  ) => {
    try {
      await updateEquipment(id, { [field]: value });
      setEquipment((prev) =>
        prev.map((eq) =>
          eq.id === id ? { ...eq, [field]: value } : eq
        )
      );
      setEditingId(null);
    } catch (err) {
      alert(`Erro ao atualizar: ${err instanceof Error ? err.message : 'Desconhecido'}`);
    }
  };

  return (
    <div className="tab-content">
      <h2>Controle MC&C - TUBULAÇÃO</h2>
      {loading && <p>Carregando...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && (
        <EquipmentTable
          equipment={equipment}
          onUpdate={handleUpdateField}
          editingId={editingId}
          setEditingId={setEditingId}
        />
      )}
    </div>
  );
}
