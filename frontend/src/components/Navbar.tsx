import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/dashboard">SlotSwapper</Link>
      </div>
      <div className="navbar-menu">
        <Link 
          to="/dashboard" 
          className={isActive('/dashboard') ? 'active' : ''}
        >
          My Calendar
        </Link>
        <Link 
          to="/marketplace" 
          className={isActive('/marketplace') ? 'active' : ''}
        >
          Marketplace
        </Link>
        <Link 
          to="/requests" 
          className={isActive('/requests') ? 'active' : ''}
        >
          Requests
        </Link>
      </div>
      <div className="navbar-user">
        <span>Hello, {user.name}</span>
        <button onClick={handleLogout} className="btn-logout">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
