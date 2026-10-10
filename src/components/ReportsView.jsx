import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function ReportsView() {
  const [fromDate, setFromDate] = useState('2026-09-01');
  const [toDate, setToDate] = useState('2026-10-31');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMostBorrowedReport(fromDate, toDate);
      setRows(data?.rows || []);
    } catch (err) {
      setError(err.message || 'Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const maxBorrowed = rows.length > 0 ? Math.max(...rows.map((r) => r.times_borrowed)) : 1;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reporte: Libros Más Prestados</h1>
          <p className="page-subtitle">
            Estadísticas consolidadas por rango de fechas (congelamiento de títulos según ADR-004)
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchReport();
          }}
          style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}
        >
          <div style={{ flex: '1 1 200px' }}>
            <label className="form-label">Fecha Desde</label>
            <input
              type="date"
              className="form-input"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              required
            />
          </div>

          <div style={{ flex: '1 1 200px' }}>
            <label className="form-label">Fecha Hasta</label>
            <input
              type="date"
              className="form-input"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ height: '42px' }}
          >
            {loading ? 'Generando...' : '📊 Generar Reporte'}
          </button>
        </form>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 60, textAlign: 'center' }}>Posición</th>
              <th>Título del Libro (Histórico congelado)</th>
              <th>Categoría (Congelada)</th>
              <th style={{ width: 220 }}>Distribución</th>
              <th style={{ textAlign: 'right' }}>Total Préstamos</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                  Calculando agregaciones de préstamos...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No hay préstamos registrados en el rango de fechas seleccionado.
                </td>
              </tr>
            ) : (
              rows.map((r, idx) => {
                const percentage = Math.round((r.times_borrowed / maxBorrowed) * 100);
                return (
                  <tr key={r.book_id || idx}>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: idx < 3 ? 'var(--accent)' : 'var(--text-muted)' }}>
                      #{idx + 1}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{r.book_title || r.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {r.book_id}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        <span className="badge badge-secondary">{r.category_name || 'General'}</span>
                      </div>
                    </td>
                    <td>
                      <div
                        style={{
                          background: '#f1f5f9',
                          borderRadius: 6,
                          height: 14,
                          overflow: 'hidden',
                          width: '100%',
                        }}
                      >
                        <div
                          style={{
                            width: `${percentage}%`,
                            background: 'var(--accent)',
                            height: '100%',
                            borderRadius: 6,
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="badge badge-success" style={{ fontSize: '0.85rem' }}>
                        {r.times_borrowed} préstamos
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
