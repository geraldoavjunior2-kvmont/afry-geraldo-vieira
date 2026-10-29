'use client';

import { MCCEquipment } from '@/lib/supabase';
import './EquipmentTable.css';

interface Props {
  equipment: MCCEquipment[];
  onUpdate: (id: number, field: keyof MCCEquipment, value: unknown) => void;
  onDelete: (id: number, tag: string) => void;
  editingId: number | null;
  setEditingId: (id: number | null) => void;
}

export default function EquipmentTable({ equipment, onUpdate, onDelete, editingId, setEditingId }: Props) {
  const getStatusClass = (status: string) => {
    if (status === '⚑') return 'status-complete';
    if (status === '🔒') return 'status-incomplete';
    return 'status-empty';
  };

  const handleGate1Toggle = (id: number, field: keyof MCCEquipment, current: number) => {
    onUpdate(id, field, current === 1 ? 0 : 1);
  };

  return (
    <div className="table-container">
      <table className="equipment-table">
        <thead>
          <tr>
            <th>TAG</th>
            <th>EQUIPAMENTO</th>
            <th colSpan={3} className="th-gate1">GATE 1 — Completação Mecânica</th>
            <th>G1</th>
            <th colSpan={2} className="th-gate2">GATE 2 — Handover</th>
            <th>G2</th>
            <th>Backlog</th>
            <th>Planejado</th>
            <th>Programação</th>
            <th>Semana</th>
            <th>Ações</th>
          </tr>
          <tr>
            <th></th><th></th>
            <th className="th-sub">Infra</th>
            <th className="th-sub">Cabos</th>
            <th className="th-sub">Ligação</th>
            <th></th>
            <th className="th-sub">Testes</th>
            <th className="th-sub">Walkdown</th>
            <th></th><th></th><th></th><th></th><th></th><th></th>
          </tr>
        </thead>
        <tbody>
          {equipment.map((eq) => {
            const isEditing = editingId === eq.id;
            return (
              <tr key={eq.id} className={isEditing ? 'editing' : ''}>
                <td className="tag">{eq.tag}</td>
                <td className="equipment-name">{eq.equipment_name}</td>

                {/* Gate 1 — toggle buttons */}
                {(['infra', 'cable_laying', 'connection'] as const).map((field) => (
                  <td key={field} className="gate1-cell">
                    <button
                      className={`gate1-btn ${(eq[field] as number) === 1 ? 'gate1-on' : 'gate1-off'}`}
                      onClick={() => handleGate1Toggle(eq.id, field, eq[field] as number)}
                      title={`Clique para alternar ${field}`}
                    >
                      {(eq[field] as number) === 1 ? '1' : '0'}
                    </button>
                  </td>
                ))}

                <td className={`status ${getStatusClass(eq.gate1_status || '')}`}>
                  {eq.gate1_status}
                </td>

                {/* Gate 2 */}
                <td className="gate1-cell">
                  <button
                    className={`gate1-btn ${eq.tests === 1 ? 'gate1-on' : 'gate1-off'}`}
                    onClick={() => onUpdate(eq.id, 'tests', eq.tests === 1 ? 0 : 1)}
                  >
                    {eq.tests === 1 ? '1' : '0'}
                  </button>
                </td>
                <td className="editable">
                  <select
                    value={eq.walkdown_punch_list ?? ''}
                    onChange={(e) => onUpdate(eq.id, 'walkdown_punch_list', e.target.value)}
                  >
                    <option value="">-</option>
                    <option value="OK">OK</option>
                    <option value="NOK">NOK</option>
                  </select>
                </td>

                <td className={`status ${getStatusClass(eq.gate2_status || '')}`}>
                  {eq.gate2_status}
                </td>

                <td className={`backlog ${eq.backlog_status === 'Liberado para Comissionamento A Frio' ? 'backlog-released' : ''}`}>
                  {eq.backlog_status}
                </td>

                {/* Datas */}
                <td className="date">{eq.planned_date ? new Date(eq.planned_date).toLocaleDateString('pt-BR') : '-'}</td>
                <td className="date">{eq.scheduled_date ? new Date(eq.scheduled_date).toLocaleDateString('pt-BR') : '-'}</td>
                <td className="week">{eq.week_project || '-'}</td>

                {/* Ações */}
                <td className="actions">
                  <button
                    className="btn-delete"
                    title="Excluir equipamento"
                    onClick={() => {
                      if (confirm(`Excluir "${eq.tag}"? Esta ação não pode ser desfeita.`)) {
                        onDelete(eq.id, eq.tag);
                      }
                    }}
                  >
                    🗑
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {equipment.length === 0 && (
        <p className="empty-state">Nenhum equipamento encontrado nesta disciplina.</p>
      )}
    </div>
  );
}
