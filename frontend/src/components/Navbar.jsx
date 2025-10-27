import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
  const isFaculty = userData.role === 'faculty';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard' }
  ];

  return (
    <nav className="bg-gray-200 border-b-2 border-gray-400 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Title */}
        <div className="text-xl font-semibold text-gray-800">
          Academic Portal{isFaculty ? ' - Faculty' : ''}
        </div>

        {/* Desktop Navigation - Right side */}
        <div className="hidden md:flex items-center space-x-6">
          {navLinks.map(link => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`text-gray-700 hover:text-gray-900 ${
                isActive(link.path) ? 'font-bold underline' : ''
              }`}
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="text-red-600 hover:text-red-800 font-medium"
          >
            Logout
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-gray-700 hover:text-gray-900"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {mobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-gray-300">
          {navLinks.map(link => (
            <button
              key={link.path}
              onClick={() => {
                navigate(link.path);
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left py-2 text-gray-700 hover:text-gray-900 ${
                isActive(link.path) ? 'font-bold' : ''
              }`}
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="block w-full text-left py-2 text-red-600 hover:text-red-800 font-medium"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
