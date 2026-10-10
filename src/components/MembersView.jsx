import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function MembersView() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [newMember, setNewMember] = useState({
    full_name: '',
    document_number: '',
  });

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const data = await api.getMembers(search);
      setMembers(data?.items || []);
    } catch (err) {
      setError(err.message || 'Error al cargar socios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMembers();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api.createMember(newMember);
      setSuccess('Socio registrado con éxito');
      setShowModal(false);
      setNewMember({ full_name: '', document_number: '' });
      fetchMembers();
    } catch (err) {
      setError(err.message || 'Error al registrar socio');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Directorio de Socios</h1>
          <p className="page-subtitle">Consulta de usuarios registrados y control de afiliaciones</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          ➕ Registrar Socio
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="filters-bar card" style={{ padding: '1rem' }}>
        <div className="search-box">
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Buscar por nombre o número de documento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre Completo</th>
              <th>Documento de Identidad</th>
              <th style={{ textAlign: 'center' }}>Estado</th>
              <th style={{ textAlign: 'right' }}>Fecha de Registro</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                  Cargando socios...
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No se encontraron socios.
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{m.full_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {m.id}</div>
                  </td>
                  <td>
                    <code style={{ fontSize: '0.9rem' }}>{m.document_number}</code>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${m.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {m.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {new Date(m.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Registrar Socio */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2 className="modal-title">Registrar Nuevo Socio</h2>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre Completo</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="Ej. Ana María Rojas"
                    value={newMember.full_name}
                    onChange={(e) => setNewMember({ ...newMember, full_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Documento de Identidad</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="Ej. 1020304050"
                    value={newMember.document_number}
                    onChange={(e) => setNewMember({ ...newMember, document_number: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
