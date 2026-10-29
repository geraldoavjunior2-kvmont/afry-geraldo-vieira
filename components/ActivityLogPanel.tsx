'use client';

import { useState, useEffect } from 'react';
import { fetchActivityLog, ActivityLog } from '@/lib/supabase';
import './ActivityLogPanel.css';

export default function ActivityLogPanel() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setLogs(await fetchActivityLog(100));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const actionLabel = (a: string) => {
    if (a === 'INSERT') return { label: 'Criado', cls: 'log-insert' };
    if (a === 'DELETE') return { label: 'Excluído', cls: 'log-delete' };
    return { label: 'Atualizado', cls: 'log-update' };
  };

  return (
    <div className="log-panel">
      <button className="btn-log" onClick={() => setOpen(!open)}>
        📋 {open ? 'Fechar LOG' : 'Ver LOG de Atividades'}
      </button>

      {open && (
        <div className="log-container">
          <div className="log-header">
            <span>LOG de Atividades (últimas 100 entradas)</span>
            <button className="btn-refresh-log" onClick={load}>↺ Atualizar</button>
          </div>
          {loading ? (
            <p className="log-loading">Carregando...</p>
          ) : logs.length === 0 ? (
            <p className="log-empty">Nenhuma atividade registrada ainda.</p>
          ) : (
            <table className="log-table">
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Ação</th>
                  <th>TAG</th>
                  <th>Campo</th>
                  <th>Valor Anterior</th>
                  <th>Novo Valor</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const { label, cls } = actionLabel(log.action);
                  return (
                    <tr key={log.id}>
                      <td className="log-date">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td><span className={`log-badge ${cls}`}>{label}</span></td>
                      <td className="log-tag">{log.equipment_tag || '-'}</td>
                      <td>{log.field_changed || '-'}</td>
                      <td className="log-old">{log.old_value ?? '-'}</td>
                      <td className="log-new">{log.new_value ?? '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
