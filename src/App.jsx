import React, { useState, useEffect } from 'react';
import { authStorage, api } from './services/api';
import Navbar from './components/Navbar';
import LoginView from './components/LoginView';
import BooksView from './components/BooksView';
import MembersView from './components/MembersView';
import LoansView from './components/LoansView';
import OverdueView from './components/OverdueView';
import ReportsView from './components/ReportsView';
import UsersView from './components/UsersView';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('books');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = authStorage.getUser();
    const token = authStorage.getToken();
    if (token && savedUser) {
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setActiveTab('books');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Cargando Manager Library...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-container">
        <LoginView onLoginSuccess={(u) => setUser(u)} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
      />

      <main className="main-content">
        {activeTab === 'books' && <BooksView user={user} />}
        {activeTab === 'members' && <MembersView />}
        {activeTab === 'loans' && <LoansView />}
        {activeTab === 'overdue' && <OverdueView />}
        {activeTab === 'reports' && user.role === 'admin' && <ReportsView />}
        {activeTab === 'users' && user.role === 'admin' && <UsersView />}
      </main>

      <footer
        style={{
          borderTop: '1px solid var(--border)',
          padding: '1.5rem',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          background: '#ffffff',
          marginTop: 'auto',
        }}
      >
        Manager Library · Ficha ADSO 3413974 · Arquitectura Hexagonal y Spec-Driven Development
      </footer>
    </div>
  );
}
