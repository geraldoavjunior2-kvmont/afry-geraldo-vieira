'use client';

import { MCCEquipment } from '@/lib/supabase';
import './EquipmentTable.css';

interface Props {
  equipment: MCCEquipment[];
  onUpdate: (id: number, field: keyof MCCEquipment, value: any) => void;
  editingId: number | null;
  setEditingId: (id: number | null) => void;
}

export default function EquipmentTable({
  equipment,
  onUpdate,
  editingId,
  setEditingId,
}: Props) {
  const handleCellChange = (id: number, field: keyof MCCEquipment, value: string) => {
    // Parse numeric values
    let parsedValue: any = value;
    if (['infra', 'cable_laying', 'connection', 'tests'].includes(field)) {
      parsedValue = value === '' ? null : parseFloat(value);
    }
    onUpdate(id, field, parsedValue);
  };

  const getStatusColor = (status: string) => {
    if (status === '⚑') return 'status-complete';
    if (status === '🔒') return 'status-incomplete';
    return 'status-empty';
  };

  return (
    <div className="table-container">
      <table className="equipment-table">
        <thead>
          <tr>
            <th>TAG</th>
            <th>EQUIPAMENTO</th>
            <th colSpan={3}>GATE 1 - MC-Completação Mecânica</th>
            <th>Status</th>
            <th colSpan={2}>GATE 2 - Handover</th>
            <th>Status</th>
            <th>Backlog</th>
            <th>Planejado</th>
            <th>Programação</th>
            <th>Semana</th>
            <th>Ações</th>
          </tr>
          <tr>
            <th></th>
            <th></th>
            <th>Infra</th>
            <th>Cabos</th>
            <th>Ligação</th>
            <th></th>
            <th>Testes</th>
            <th>Walkdown</th>
            <th></th>
            <th></th>
            <th></th>
            <th></th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {equipment.map((eq) => (
            <tr key={eq.id} className={editingId === eq.id ? 'editing' : ''}>
              <td className="tag">{eq.tag}</td>
              <td className="equipment-name">{eq.equipment_name}</td>

              {/* Gate 1 - Montagem */}
              <td className="editable">
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={eq.infra ?? ''}
                  onChange={(e) => handleCellChange(eq.id, 'infra', e.target.value)}
                  onClick={() => setEditingId(eq.id)}
                />
              </td>
              <td className="editable">
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={eq.cable_laying ?? ''}
                  onChange={(e) => handleCellChange(eq.id, 'cable_laying', e.target.value)}
                  onClick={() => setEditingId(eq.id)}
                />
              </td>
              <td className="editable">
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={eq.connection ?? ''}
                  onChange={(e) => handleCellChange(eq.id, 'connection', e.target.value)}
                  onClick={() => setEditingId(eq.id)}
                />
              </td>
              <td className={`status ${getStatusColor(eq.gate1_status || '')}`}>
                {eq.gate1_status}
              </td>

              {/* Gate 2 - Handover */}
              <td className="editable">
                <input
                  type="number"
                  min="0"
                  max="1"
                  value={eq.tests ?? ''}
                  onChange={(e) => handleCellChange(eq.id, 'tests', e.target.value)}
                  onClick={() => setEditingId(eq.id)}
                />
              </td>
              <td className="editable">
                <select
                  value={eq.walkdown_punch_list ?? ''}
                  onChange={(e) => onUpdate(eq.id, 'walkdown_punch_list', e.target.value)}
                  onClick={() => setEditingId(eq.id)}
                >
                  <option value="">-</option>
                  <option value="OK">OK</option>
                  <option value="NOK">NOK</option>
                </select>
              </td>
              <td className={`status ${getStatusColor(eq.gate2_status || '')}`}>
                {eq.gate2_status}
              </td>

              {/* Backlog */}
              <td className="backlog">{eq.backlog_status}</td>

              {/* Datas */}
              <td className="date">
                {eq.planned_date ? new Date(eq.planned_date).toLocaleDateString('pt-BR') : '-'}
              </td>
              <td className="date">
                {eq.scheduled_date ? new Date(eq.scheduled_date).toLocaleDateString('pt-BR') : '-'}
              </td>
              <td className="week">{eq.week_project || '-'}</td>

              {/* Ações */}
              <td className="actions">
                {editingId === eq.id ? (
                  <button onClick={() => setEditingId(null)} className="btn-save">
                    ✓ Salvar
                  </button>
                ) : (
                  <button onClick={() => setEditingId(eq.id)} className="btn-edit">
                    ✏️ Editar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {equipment.length === 0 && (
        <p className="empty-state">Nenhum equipamento encontrado nesta disciplina.</p>
      )}
    </div>
  );
}
