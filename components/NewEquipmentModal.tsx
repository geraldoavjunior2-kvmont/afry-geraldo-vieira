'use client';

import { useState } from 'react';
import { MCCEquipment } from '@/lib/supabase';
import './NewEquipmentModal.css';

interface Props {
  discipline: 'EIA' | 'MEC' | 'TUB';
  onSave: (tag: string, name: string) => Promise<void>;
  onClose: () => void;
}

export default function NewEquipmentModal({ discipline, onSave, onClose }: Props) {
  const [tag, setTag] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tag.trim() || !name.trim()) {
      setError('TAG e Nome são obrigatórios.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await onSave(tag.trim(), name.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar equipamento');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Novo Equipamento — {discipline}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <label>
            TAG <span className="required">*</span>
            <input
              type="text"
              placeholder="Ex: 11-5072-BBA-0099-MT1"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              autoFocus
            />
          </label>
          <label>
            Nome / Descrição <span className="required">*</span>
            <input
              type="text"
              placeholder="Ex: BOMBA DE CAPTAÇÃO"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          {error && <p className="modal-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-confirm" disabled={saving}>
              {saving ? 'Salvando...' : '✓ Criar Equipamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
