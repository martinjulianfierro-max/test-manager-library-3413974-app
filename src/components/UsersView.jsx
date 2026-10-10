import React, { useState } from 'react';
import { api } from '../services/api';

export default function UsersView() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.createLibrarian(username.trim().toLowerCase(), password);
      setSuccess(`Bibliotecario "${res.username}" creado exitosamente con rol "${res.role}".`);
      setUsername('');
      setPassword('');
    } catch (err) {
      setError(err.message || 'Error al crear usuario bibliotecario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de Usuarios y Personal</h1>
          <p className="page-subtitle">Creación de usuarios con rol de Bibliotecario (HU-02)</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div style={{ maxWidth: 500 }}>
        <div className="card">
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--primary)' }}>
            👤 Crear Nuevo Bibliotecario
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nombre de Usuario</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej. bibliotecario1"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                Se normaliza automáticamente a minúsculas sin espacios.
              </small>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Contraseña Temporal</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Creando Usuario...' : 'Crear Bibliotecario'}
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
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              🔒 <strong>Seguridad:</strong> El rol <code>admin</code> se define exclusivamente al arranque del sistema. Los administradores pueden delegar acceso a personal bibliotecario para gestión diaria del inventario y préstamos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
