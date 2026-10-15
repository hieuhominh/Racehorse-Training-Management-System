import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { megaMenusData } from '../data/navigationData';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ onOpenAuth }) {
  const { currentUser, isAdmin, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMega, setActiveMega] = useState(null);
  const navRef = useRef(null);
  const location = useLocation();

  const handleLogout = () => {
    closeMenus();
    logout();
    navigate('/');
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setActiveMega(null);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setActiveMega(null);
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleMega = (id) => {
    setActiveMega(prev => (prev === id ? null : id));
  };

  const handleMouseEnter = (id) => {
    if (window.innerWidth > 760) {
      setActiveMega(id);
    }
  };

  const handleMouseLeave = () => {
    if (window.innerWidth > 760) {
      setActiveMega(null);
    }
  };

  const closeMenus = () => {
    setActiveMega(null);
    setMobileMenuOpen(false);
  };

  return (
    <header className="nav" ref={navRef} onMouseLeave={handleMouseLeave}>
      <div className="wrap nav-wrap">
        <Link className="brand" to="/" onClick={closeMenus}>
          <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
            <path d="M17 3c6 0 10 4.6 10 10.6 0 5-2.6 7.4-2.6 11.2 0 2.6 1.6 3.9 1.6 5.4 0 1.2-1 1.8-2.3 1.8-2.6 0-4.2-2.2-4.2-5.2 0-3.4 2.2-5.6 2.2-9.2 0-2.9-1.8-5-4.7-5s-4.7 2.1-4.7 5c0 3.6 2.2 5.8 2.2 9.2 0 3-1.6 5.2-4.2 5.2-1.3 0-2.3-.6-2.3-1.8 0-1.5 1.6-2.8 1.6-5.4C9.6 21 7 18.6 7 13.6 7 6.6 11 3 17 3Z" fill="#C9A227"/>
          </svg>
          <span>
            <span className="name">MÃ TRƯỜNG</span>
            <span className="sub">RACEHORSE SYSTEM</span>
          </span>
        </Link>

        <nav className={`mainnav ${mobileMenuOpen ? 'open' : ''}`} id="mainnav">
          <Link to="/" onClick={closeMenus} className={location.pathname === '/' ? 'active' : ''}>Trang chủ</Link>

          {megaMenusData.map((menu) => {
            const isOpen = activeMega === menu.id;
            const isChildActive = menu.ctaLink === location.pathname || menu.links.some(l => l.link === location.pathname);

            return (
              <div 
                key={menu.id}
                className={`navitem ${isOpen ? 'open' : ''}`}
                onMouseEnter={() => handleMouseEnter(menu.id)}
              >
                <button
                  type="button"
                  className={`navlink ${isChildActive ? 'active' : ''}`}
                  aria-expanded={isOpen}
                  onClick={() => toggleMega(menu.id)}
                >
                  {menu.label}
                </button>
                <div 
                  className="mega" 
                  id={menu.id}
                >
                  <div className="wrap mega-wrap">
                    <div className="mega-intro">
                      <div className="fno">
                        <b>{menu.fno}</b>
                        <span className={`badge ${menu.badge === 'BẮT BUỘC' ? 'req' : 'opt'}`}>{menu.badge}</span>
                      </div>
                      <h3>{menu.title}</h3>
                      <div className="vn">{menu.subtitle}</div>
                      <p>{menu.description}</p>
                      <Link className="open-flow" to={menu.ctaLink} onClick={closeMenus}>
                        {menu.ctaText}
                      </Link>
                    </div>
                    <div className="mega-links">
                      <h4>TRONG LUỒNG NÀY</h4>
                      {menu.links.map((sub, sIdx) => (
                        <Link key={sIdx} to={sub.link} onClick={closeMenus}>
                          {sub.title}
                          <em>{sub.desc}</em>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <Link to="/ho-so-ngua" onClick={closeMenus} className={location.pathname === '/ho-so-ngua' ? 'active' : ''}>Hồ sơ ngựa & Phả hệ</Link>
        </nav>

        <div className="nav-cta">
          {/* NÚT CHUYỂN ĐỔI CHẾ ĐỘ SÁNG / TỐI (THEME TOGGLE) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle-btn"
            aria-label={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
            title={isDark ? 'Chuyển sang giao diện Sáng (Light Mode)' : 'Chuyển sang giao diện Tối (Dark Mode)'}
          >
            <span className="theme-toggle-icon">
              {isDark ? '☀️' : '🌙'}
            </span>
            <span className="theme-toggle-label">
              {isDark ? 'Sáng' : 'Tối'}
            </span>
          </button>

          {currentUser ? (
            <>
              {currentUser.role === 'TRAINER' && (
                <Link to="/trainer" className="btn btn-solid btn-role-trainer nav-role-btn" onClick={closeMenus}>
                  <span className="nav-btn-icon">🏇</span>
                  <span className="nav-btn-text">Huấn luyện</span>
                </Link>
              )}
              {currentUser.role !== 'TRAINER' && isAdmin && (
                <Link to="/admin" className="btn btn-solid btn-role-admin nav-role-btn" onClick={closeMenus}>
                  <span className="nav-btn-icon">👑</span>
                  <span className="nav-btn-text">Quản trị</span>
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="btn-logout"
                title="Đăng xuất khỏi hệ thống"
                aria-label="Đăng xuất"
              >
                <span className="btn-logout-icon">🚪</span>
                <span className="btn-logout-text">Đăng xuất</span>
              </button>
            </>
          ) : (
            <>
              <a 
                className="btn btn-ghost" 
                href="#register"
                onClick={(e) => {
                  if (onOpenAuth) {
                    e.preventDefault();
                    onOpenAuth('register');
                  }
                }}
              >
                Đăng ký
              </a>
              <a 
                className="btn btn-solid" 
                href="#login"
                onClick={(e) => {
                  if (onOpenAuth) {
                    e.preventDefault();
                    onOpenAuth('login');
                  }
                }}
              >
                Vào hệ thống
              </a>
            </>
          )}

          <button 
            className="burger" 
            id="burger" 
            aria-label="Mở menu" 
            aria-expanded={mobileMenuOpen}
            onClick={() => {
              setMobileMenuOpen(!mobileMenuOpen);
              if (mobileMenuOpen) setActiveMega(null);
            }}
          >
            ≡
          </button>
        </div>
      </div>
    </header>
  );
}
