'use client';

import { SummaryByDiscipline } from '@/lib/supabase';
import './Summary.css';

interface Props {
  summary: SummaryByDiscipline[];
  onRefresh: () => void;
}

export default function Summary({ summary, onRefresh }: Props) {
  return (
    <div className="summary-container">
      <div className="summary-header">
        <h2>Resumo MC&C - Controle por Disciplina</h2>
        <button onClick={onRefresh} className="btn-refresh">
          🔄 Atualizar
        </button>
      </div>

      <div className="summary-grid">
        {summary.map((row) => (
          <div key={row.discipline} className="summary-card">
            <h3>{row.discipline}</h3>
            <div className="summary-stats">
              <div className="stat">
                <label>Total de Equipamentos</label>
                <span className="value">{row.total_equipment}</span>
              </div>
              <div className="stat">
                <label>Gate 1 Concluído (⚑)</label>
                <span className="value success">{row.completed_gate1}</span>
              </div>
              <div className="stat">
                <label>Gate 2 Concluído (⚑)</label>
                <span className="value success">{row.completed_gate2}</span>
              </div>
              <div className="stat">
                <label>Liberados para Comissionamento</label>
                <span className="value highlight">{row.released_for_commissioning}</span>
              </div>
            </div>

            {/* Progress bars */}
            <div className="progress-section">
              <div className="progress">
                <label>Gate 1 Progress</label>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${row.total_equipment > 0 ? (row.completed_gate1 / row.total_equipment) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
                <span className="progress-text">
                  {row.completed_gate1} / {row.total_equipment}
                </span>
              </div>

              <div className="progress">
                <label>Gate 2 Progress</label>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${row.total_equipment > 0 ? (row.completed_gate2 / row.total_equipment) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
                <span className="progress-text">
                  {row.completed_gate2} / {row.total_equipment}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {summary.length === 0 && (
        <p className="empty-state">Nenhum dado disponível.</p>
      )}
    </div>
  );
}
