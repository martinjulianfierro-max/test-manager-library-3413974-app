import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function LoansView() {
  const [members, setMembers] = useState([]);
  const [books, setBooks] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loansLoading, setLoansLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filter
  const [statusFilter, setStatusFilter] = useState('');

  // New Loan Form
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedBookIds, setSelectedBookIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Manual Return Form
  const [returnLoanId, setReturnLoanId] = useState('');
  const [returnItemId, setReturnItemId] = useState('');
  const [returning, setReturning] = useState(false);
  const [returningItemId, setReturningItemId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [membersRes, booksRes] = await Promise.all([
        api.getMembers(),
        api.getBooks({ available_only: true }),
      ]);
      setMembers(membersRes?.items || []);
      setBooks(booksRes?.items || []);
      if (membersRes?.items?.length > 0 && !selectedMemberId) {
        setSelectedMemberId(membersRes.items[0].id);
      }
    } catch (err) {
      setError(err.message || 'Error al cargar socios o libros');
    } finally {
      setLoading(false);
    }
  };

  const fetchLoans = async () => {
    setLoansLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.getLoans(params);
      setLoans(res?.items || []);
    } catch (err) {
      console.error('Error al cargar préstamos:', err);
    } finally {
      setLoansLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    fetchLoans();
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [statusFilter]);

  const handleBookToggle = (bookId) => {
    if (selectedBookIds.includes(bookId)) {
      setSelectedBookIds(selectedBookIds.filter((id) => id !== bookId));
    } else {
      if (selectedBookIds.length >= 3) {
        alert('Regla de negocio (RN-2): No se pueden prestar más de 3 libros por operación.');
        return;
      }
      setSelectedBookIds([...selectedBookIds, bookId]);
    }
  };

  const handleCreateLoan = async (e) => {
    e.preventDefault();
    if (selectedBookIds.length === 0) {
      setError('Debes seleccionar al menos 1 libro (máximo 3).');
      return;
    }
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const res = await api.createLoan(selectedMemberId, selectedBookIds);
      setSuccess(`Préstamo creado con éxito (ID: ${res.id}). ${res.items?.length || selectedBookIds.length} libros asignados.`);
      setSelectedBookIds([]);
      loadData();
      fetchLoans();
    } catch (err) {
      setError(err.message || 'Error al procesar el préstamo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnItem = async (e) => {
    e.preventDefault();
    if (!returnLoanId.trim() || !returnItemId.trim()) {
      setError('Ingresa el ID del préstamo y el ID del ítem.');
      return;
    }
    setError(null);
    setSuccess(null);
    setReturning(true);
    try {
      await api.returnLoanItem(returnLoanId.trim(), returnItemId.trim());
      setSuccess('Ejemplar devuelto exitosamente e inventario restablecido.');
      setReturnLoanId('');
      setReturnItemId('');
      loadData();
      fetchLoans();
    } catch (err) {
      setError(err.message || 'Error al registrar devolución');
    } finally {
      setReturning(false);
    }
  };

  const handleDirectReturn = async (loanId, itemId, bookTitle) => {
    if (!window.confirm(`¿Registrar devolución de "${bookTitle}"?`)) return;
    setReturningItemId(itemId);
    setError(null);
    setSuccess(null);
    try {
      await api.returnLoanItem(loanId, itemId);
      setSuccess(`Ejemplar "${bookTitle}" devuelto exitosamente e inventario restablecido (+1 disponible).`);
      loadData();
      fetchLoans();
    } catch (err) {
      setError(err.message || 'Error al registrar devolución');
    } finally {
      setReturningItemId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <span className="badge badge-success">Abierto (Al día)</span>;
      case 'overdue':
        return <span className="badge badge-danger">Vencido</span>;
      case 'closed':
        return <span className="badge badge-secondary">Cerrado (Completado)</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de Préstamos y Devoluciones</h1>
          <p className="page-subtitle">
            Registro de préstamos (1 a 3 líneas), control de vencimientos (14 días) y devoluciones (HU-06, HU-07, HU-08)
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        {/* Registrar Préstamo */}
        <div className="card">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--primary)' }}>
            📤 Registrar Nuevo Préstamo
          </h2>
          <form onSubmit={handleCreateLoan}>
            <div className="form-group">
              <label className="form-label">Socio Solicitante</label>
              <select
                className="form-select"
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                required
              >
                <option value="">Seleccione un socio...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name} (Doc: {m.document_number})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Seleccionar Libros ({selectedBookIds.length} / 3 seleccionados)
              </label>
              <div
                style={{
                  maxHeight: 250,
                  overflowY: 'auto',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.5rem',
                }}
              >
                {books.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '0.5rem' }}>
                    No hay ejemplares disponibles para préstamo.
                  </p>
                ) : (
                  books.map((b) => (
                    <label
                      key={b.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.45rem 0.6rem',
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="checkbox"
                          checked={selectedBookIds.includes(b.id)}
                          onChange={() => handleBookToggle(b.id)}
                        />
                        <span style={{ fontWeight: 600 }}>{b.title}</span>
                      </div>
                      <span className="badge badge-success">{b.available_copies} disp.</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={submitting || selectedBookIds.length === 0}
            >
              {submitting ? 'Procesando Préstamo...' : 'Confirmar Préstamo'}
            </button>
          </form>
        </div>

        {/* Registrar Devolución Manual o Info */}
        <div className="card">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--primary)' }}>
            📥 Devolución Rápida por Código
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            También puedes devolver cualquier ejemplar directamente desde la tabla de préstamos inferiores.
          </p>

          <form onSubmit={handleReturnItem}>
            <div className="form-group">
              <label className="form-label">ID del Préstamo (UUID)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej. a0b1c2d3-e4f5-6789-abcd-ef0123456789"
                value={returnLoanId}
                onChange={(e) => setReturnLoanId(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">ID del Ítem (UUID)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej. b1c2d3e4-f5a6-7890-bcde-f0123456789a"
                value={returnItemId}
                onChange={(e) => setReturnItemId(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={returning}
            >
              {returning ? 'Registrando Devolución...' : 'Devolver por Código'}
            </button>
          </form>

          <div
            style={{
              marginTop: '1.5rem',
              padding: '0.85rem',
              background: '#f8fafc',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
            }}
          >
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              ℹ️ Reglas de Negocio (RN-1 a RN-6)
            </h3>
            <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.4rem', paddingLeft: '1.2rem' }}>
              <li>Préstamo vence en 14 días (UTC).</li>
              <li>Máximo 3 libros activos por socio.</li>
              <li>Socio con libros vencidos no puede solicitar préstamos.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Lista de Préstamos Registrados */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary)' }}>
              📋 Registro de Préstamos Activos e Históricos
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Estado calculado en tiempo real (open, overdue, closed)
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Filtrar Estado:</label>
            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos los Estados</option>
              <option value="open">Abiertos (Al día)</option>
              <option value="overdue">Vencidos</option>
              <option value="closed">Cerrados</option>
            </select>

            <button type="button" className="btn btn-secondary btn-sm" onClick={fetchLoans}>
              🔄 Refrescar
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Préstamo</th>
                <th>Fecha Préstamo</th>
                <th style={{ textAlign: 'center' }}>Estado Calculado</th>
                <th>Líneas de Préstamo (Libros asignados)</th>
              </tr>
            </thead>
            <tbody>
              {loansLoading ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                    Cargando listado de préstamos...
                  </td>
                </tr>
              ) : loans.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No hay préstamos para mostrar con el filtro actual.
                  </td>
                </tr>
              ) : (
                loans.map((loan) => (
                  <tr key={loan.id}>
                    <td style={{ verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--primary)' }}>
                        {loan.id.substring(0, 8)}...
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Socio: {loan.member_id.substring(0, 8)}...
                      </div>
                    </td>
                    <td style={{ verticalAlign: 'top', fontSize: '0.85rem' }}>
                      {loan.loaned_at ? new Date(loan.loaned_at).toLocaleDateString() : '-'}
                    </td>
                    <td style={{ verticalAlign: 'top', textAlign: 'center' }}>
                      {getStatusBadge(loan.status)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {loan.items?.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.4rem 0.6rem',
                              background: item.returned_at ? '#f8fafc' : '#eff6ff',
                              borderRadius: 'var(--radius-sm)',
                              border: `1px solid ${item.returned_at ? '#e2e8f0' : '#bfdbfe'}`,
                              fontSize: '0.85rem',
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 600 }}>
                                📖 {item.book_title}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Vence: {new Date(item.due_at).toLocaleDateString()}
                                {item.returned_at && (
                                  <span style={{ color: 'var(--success)', marginLeft: '0.5rem', fontWeight: 600 }}>
                                    ✓ Devuelto el {new Date(item.returned_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>

                            {!item.returned_at && (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                disabled={returningItemId === item.id}
                                onClick={() => handleDirectReturn(loan.id, item.id, item.book_title)}
                                style={{ marginLeft: '1rem', whiteSpace: 'nowrap' }}
                              >
                                {returningItemId === item.id ? 'Devolviendo...' : '📥 Devolver'}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
