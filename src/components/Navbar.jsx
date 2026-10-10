import React from 'react';

export default function Navbar({ activeTab, setActiveTab, user, onLogout }) {
  const isAdmin = user?.role === 'admin';

  return (
    <header className="navbar">
      <div className="nav-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <a href="#" className="brand" onClick={(e) => { e.preventDefault(); setActiveTab('books'); }}>
            <div className="brand-icon">ML</div>
            <span>Manager Library</span>
          </a>

          <nav>
            <ul className="nav-links">
              <li>
                <button
                  type="button"
                  className={`nav-btn ${activeTab === 'books' ? 'active' : ''}`}
                  onClick={() => setActiveTab('books')}
                >
                  Catálogo
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`nav-btn ${activeTab === 'members' ? 'active' : ''}`}
                  onClick={() => setActiveTab('members')}
                >
                  Socios
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`nav-btn ${activeTab === 'loans' ? 'active' : ''}`}
                  onClick={() => setActiveTab('loans')}
                >
                  Préstamos
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`nav-btn ${activeTab === 'overdue' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overdue')}
                >
                  Vencidos
                </button>
              </li>
              {isAdmin && (
                <>
                  <li>
                    <button
                      type="button"
                      className={`nav-btn ${activeTab === 'reports' ? 'active' : ''}`}
                      onClick={() => setActiveTab('reports')}
                    >
                      Reportes
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`}
                      onClick={() => setActiveTab('users')}
                    >
                      Usuarios
                    </button>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>

        <div className="nav-user">
          <div className="user-badge">
            <span>👤 {user?.username}</span>
            <span className={`role-pill ${isAdmin ? 'role-admin' : 'role-librarian'}`}>
              {user?.role}
            </span>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onLogout}>
            Cerrar Sesión
          </button>
        </div>
      </div>
    </header>
  );
}
