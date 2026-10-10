import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function BooksView({ user }) {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [activeBook, setActiveBook] = useState(null);

  // Form states
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    isbn: '',
    category_id: '',
    total_copies: 3,
  });

  const [editBook, setEditBook] = useState({
    title: '',
    author: '',
    category_id: '',
    total_copies: 1,
  });

  const [coverFile, setCoverFile] = useState(null);

  const fetchCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data || []);
      if (data && data.length > 0 && !newBook.category_id) {
        setNewBook((prev) => ({ ...prev, category_id: data[0].id }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const data = await api.getBooks({
        q: search,
        category_id: selectedCat,
        available_only: availableOnly,
      });
      setBooks(data?.items || []);
    } catch (err) {
      setError(err.message || 'Error al cargar libros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBooks();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedCat, availableOnly]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api.createBook({
        title: newBook.title,
        author: newBook.author,
        isbn: newBook.isbn,
        category_id: newBook.category_id,
        total_copies: parseInt(newBook.total_copies, 10),
      });
      setSuccess('Libro registrado exitosamente');
      setShowCreateModal(false);
      setNewBook({
        title: '',
        author: '',
        isbn: '',
        category_id: categories[0]?.id || '',
        total_copies: 3,
      });
      fetchBooks();
    } catch (err) {
      setError(err.message || 'Error al crear libro');
    }
  };

  const openEdit = (book) => {
    setActiveBook(book);
    setEditBook({
      title: book.title,
      author: book.author,
      category_id: book.category_id,
      total_copies: book.total_copies,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api.updateBook(activeBook.id, {
        title: editBook.title,
        author: editBook.author,
        category_id: editBook.category_id,
        total_copies: parseInt(editBook.total_copies, 10),
      });
      setSuccess('Libro actualizado exitosamente');
      setShowEditModal(false);
      fetchBooks();
    } catch (err) {
      setError(err.message || 'Error al actualizar libro');
    }
  };

  const handleDelete = async (book) => {
    if (!window.confirm(`¿Dar de baja el libro "${book.title}"?`)) return;
    setError(null);
    try {
      await api.deleteBook(book.id);
      setSuccess('Libro dado de baja');
      fetchBooks();
    } catch (err) {
      setError(err.message || 'Error al dar de baja el libro');
    }
  };

  const openCover = (book) => {
    setActiveBook(book);
    setCoverFile(null);
    setShowCoverModal(true);
  };

  const handleCoverSubmit = async (e) => {
    e.preventDefault();
    if (!coverFile) return;
    setError(null);
    try {
      await api.uploadCover(activeBook.id, coverFile);
      setSuccess('Portada actualizada exitosamente');
      setShowCoverModal(false);
      fetchBooks();
    } catch (err) {
      setError(err.message || 'Error al subir la portada');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Catálogo de Libros</h1>
          <p className="page-subtitle">Gestiona ejemplares, inventario y disponibilidad</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          ➕ Nuevo Libro
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="filters-bar card" style={{ padding: '1rem' }}>
        <div className="search-box">
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Buscar por título o autor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ minWidth: 180 }}>
          <select
            className="form-select"
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
          >
            <option value="">Todas las Categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
          />
          Solo con ejemplares disponibles
        </label>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>Portada</th>
              <th>Título y Autor</th>
              <th>ISBN</th>
              <th>Categoría</th>
              <th style={{ textAlign: 'center' }}>Disponibles / Total</th>
              <th style={{ textAlign: 'center' }}>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                  Cargando catálogo...
                </td>
              </tr>
            ) : books.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No se encontraron libros.
                </td>
              </tr>
            ) : (
              books.map((b) => (
                <tr key={b.id} style={{ opacity: b.is_active ? 1 : 0.6 }}>
                  <td>
                    {b.cover_url ? (
                      <img
                        src={b.cover_url}
                        alt="cover"
                        style={{ width: 38, height: 50, objectFit: 'cover', borderRadius: 4 }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 38,
                          height: 50,
                          background: '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 4,
                          fontSize: '1.2rem',
                        }}
                      >
                        📖
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{b.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{b.author}</div>
                  </td>
                  <td>
                    <code style={{ fontSize: '0.85rem' }}>{b.isbn}</code>
                  </td>
                  <td>
                    <span className="badge badge-neutral">{b.category_name}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      className={`badge ${
                        b.available_copies > 0 ? 'badge-success' : 'badge-danger'
                      }`}
                    >
                      {b.available_copies} / {b.total_copies}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${b.is_active ? 'badge-success' : 'badge-neutral'}`}>
                      {b.is_active ? 'Activo' : 'Baja'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        title="Subir Portada"
                        onClick={() => openCover(b)}
                      >
                        🖼️
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        title="Editar"
                        onClick={() => openEdit(b)}
                      >
                        ✏️
                      </button>
                      {b.is_active && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--danger)' }}
                          title="Dar de baja"
                          onClick={() => handleDelete(b)}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Crear Libro */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2 className="modal-title">Registrar Nuevo Libro</h2>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Título</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={newBook.title}
                    onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Autor</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={newBook.author}
                    onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ISBN (13 dígitos numéricos)</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    maxLength={13}
                    placeholder="9789580000001"
                    value={newBook.isbn}
                    onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select
                    className="form-select"
                    value={newBook.category_id}
                    onChange={(e) => setNewBook({ ...newBook, category_id: e.target.value })}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Total de Ejemplares</label>
                  <input
                    type="number"
                    min={1}
                    className="form-input"
                    required
                    value={newBook.total_copies}
                    onChange={(e) => setNewBook({ ...newBook, total_copies: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Libro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Libro */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2 className="modal-title">Editar Libro</h2>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Título</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={editBook.title}
                    onChange={(e) => setEditBook({ ...editBook, title: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Autor</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={editBook.author}
                    onChange={(e) => setEditBook({ ...editBook, author: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select
                    className="form-select"
                    value={editBook.category_id}
                    onChange={(e) => setEditBook({ ...editBook, category_id: e.target.value })}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Total de Ejemplares</label>
                  <input
                    type="number"
                    min={1}
                    className="form-input"
                    required
                    value={editBook.total_copies}
                    onChange={(e) => setEditBook({ ...editBook, total_copies: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Portada */}
      {showCoverModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2 className="modal-title">Subir Portada — {activeBook?.title}</h2>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowCoverModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCoverSubmit}>
              <div className="modal-body">
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Formatos permitidos: JPG, PNG, WEBP. Tamaño máximo: 2 MB.
                </p>
                <div className="form-group">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="form-input"
                    required
                    onChange={(e) => setCoverFile(e.target.files[0])}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCoverModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={!coverFile}>
                  Subir Portada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
