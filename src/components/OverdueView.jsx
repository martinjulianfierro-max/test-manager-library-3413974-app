import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function OverdueView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [returningId, setReturningId] = useState(null);

  const fetchOverdue = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getOverdueLoans();
      setItems(data?.items || []);
    } catch (err) {
      setError(err.message || 'Error al consultar préstamos vencidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverdue();
  }, []);

  const handleReturn = async (loanId, itemId, bookTitle) => {
    if (!window.confirm(`¿Registrar devolución de "${bookTitle}"?`)) return;
    setReturningId(itemId);
    setError(null);
    setSuccess(null);
    try {
      await api.returnLoanItem(loanId, itemId);
      setSuccess(`Libro "${bookTitle}" devuelto correctamente. Inventario restablecido.`);
      fetchOverdue();
    } catch (err) {
      setError(err.message || 'Error al devolver el ejemplar');
    } finally {
      setReturningId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Préstamos Vencidos</h1>
          <p className="page-subtitle">Control y seguimiento de préstamos que han superado el plazo de 14 días (HU-09)</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={fetchOverdue}
        >
          🔄 Actualizar
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="stat-grid">
        <div className="stat-card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div className="stat-title">Total Ítems Vencidos</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{items.length}</div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Socio Afectado</th>
              <th>Título del Libro</th>
              <th style={{ textAlign: 'center' }}>Fecha Límite (due_at)</th>
              <th style={{ textAlign: 'center' }}>Días de Retraso</th>
              <th style={{ textAlign: 'center' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                  Consultando registros vencidos...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--accent-text)' }}>
                  🎉 No hay préstamos vencidos en este momento. Todos los préstamos están al día.
                </td>
              </tr>
            ) : (
              items.map((it, idx) => (
                <tr key={it.item_id || idx}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      {it.member_name || 'Socio'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Préstamo: {it.loan_id}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{it.book_title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Ítem ID: {it.item_id}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', fontSize: '0.85rem' }}>
                    {it.due_at ? new Date(it.due_at).toLocaleDateString() : '-'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge badge-danger">
                      ⚠️ {it.days_late ?? it.days_overdue ?? 0} días
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={returningId === it.item_id}
                      onClick={() => handleReturn(it.loan_id, it.item_id, it.book_title)}
                    >
                      {returningId === it.item_id ? 'Devolviendo...' : '📥 Devolver'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
