import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { megaMenusData } from '../data/navigationData';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onOpenAuth }) {
  const { currentUser, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMega, setActiveMega] = useState(null);
  const navRef = useRef(null);
  const location = useLocation();

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
    <header className="nav" ref={navRef} onMouseLeave={handleMouseLeave} style={{ backgroundColor: '#000000', background: '#000000', width: '100%', left: 0, right: 0, opacity: 1, zIndex: 99999 }}>
      <div className="wrap" style={{ backgroundColor: '#000000', background: '#000000', width: '100%', maxWidth: '100%', margin: 0, padding: '0 40px', boxSizing: 'border-box' }}>
        <Link className="brand" to="/" onClick={closeMenus}>
          <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
            <path d="M17 3c6 0 10 4.6 10 10.6 0 5-2.6 7.4-2.6 11.2 0 2.6 1.6 3.9 1.6 5.4 0 1.2-1 1.8-2.3 1.8-2.6 0-4.2-2.2-4.2-5.2 0-3.4 2.2-5.6 2.2-9.2 0-2.9-1.8-5-4.7-5s-4.7 2.1-4.7 5c0 3.6 2.2 5.8 2.2 9.2 0 3-1.6 5.2-4.2 5.2-1.3 0-2.3-.6-2.3-1.8 0-1.5 1.6-2.8 1.6-5.4C9.6 21 7 18.6 7 13.6 7 6.6 11 3 17 3Z" fill="#C9A227"/>
          </svg>
          <span>
            <span className="name">MÃ TRƯỜNG</span>
            <span className="sub">RACEHORSE SYSTEM</span>
          </span>
        </Link>

        <nav className={`mainnav ${mobileMenuOpen ? 'open' : ''}`} id="mainnav" style={{ background: 'transparent' }}>
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
                  style={{ 
                    backgroundColor: '#000000',
                    background: '#000000',
                    width: '100%',
                    left: 0,
                    right: 0,
                    opacity: 1, 
                    zIndex: 999999,
                    borderTop: '1px solid #C9A227',
                    borderBottom: '1px solid var(--line)',
                    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.9)'
                  }}
                >
                  <div 
                    className="wrap" 
                    style={{ 
                      backgroundColor: '#000000',
                      background: '#000000',
                      opacity: 1,
                      width: '100%',
                      maxWidth: '100%',
                      margin: 0,
                      padding: '32px 40px 36px',
                      boxSizing: 'border-box'
                    }}
                  >
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
          {currentUser ? (
            <>
              {currentUser.role === 'TRAINER' && (
                <Link to="/trainer" className="btn btn-solid" onClick={closeMenus} style={{ background: '#3B82F6', borderColor: '#3B82F6' }}>
                  🏇 Huấn luyện
                </Link>
              )}
              {currentUser.role !== 'TRAINER' && isAdmin && (
                <Link to="/admin" className="btn btn-solid" onClick={closeMenus}>
                  👑 Quản trị
                </Link>
              )}
              <button
                type="button"
                onClick={logout}
                style={{
                  background: 'rgba(217, 83, 79, 0.16)',
                  border: '1px solid rgba(239, 68, 68, 0.45)',
                  color: '#FF8885',
                  padding: '9px 18px',
                  borderRadius: '3px',
                  fontFamily: 'var(--body)',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(217, 83, 79, 0.32)';
                  e.currentTarget.style.borderColor = '#EF4444';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(217, 83, 79, 0.16)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.45)';
                  e.currentTarget.style.color = '#FF8885';
                }}
              >
                <span>🚪</span> Đăng xuất
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
