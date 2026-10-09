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
    if (window.innerWidth > 1140) {
      setActiveMega(id);
    }
  };

  const handleMouseLeave = () => {
    if (window.innerWidth > 1140) {
      setActiveMega(null);
    }
  };

  const closeMenus = () => {
    setActiveMega(null);
    setMobileMenuOpen(false);
  };

  return (
    <header className="nav" ref={navRef} onMouseLeave={handleMouseLeave}>
      <div className="wrap">
        <Link className="brand" to="/" onClick={closeMenus}>
          <svg width="32" height="32" viewBox="0 0 34 34" aria-hidden="true">
            <path d="M17 3c6 0 10 4.6 10 10.6 0 5-2.6 7.4-2.6 11.2 0 2.6 1.6 3.9 1.6 5.4 0 1.2-1 1.8-2.3 1.8-2.6 0-4.2-2.2-4.2-5.2 0-3.4 2.2-5.6 2.2-9.2 0-2.9-1.8-5-4.7-5s-4.7 2.1-4.7 5c0 3.6 2.2 5.8 2.2 9.2 0 3-1.6 5.2-4.2 5.2-1.3 0-2.3-.6-2.3-1.8 0-1.5 1.6-2.8 1.6-5.4C9.6 21 7 18.6 7 13.6 7 6.6 11 3 17 3Z" fill="#C9A227"/>
          </svg>
          <span>
            <span className="name">MÃ TRƯỜNG</span>
            <span className="sub">RACEHORSE SYSTEM</span>
          </span>
        </Link>

        {/* THANH ĐIỀU HƯỚNG CHÍNH (RESPONSIVE DESKTOP & MOBILE DRAWER) */}
        <nav className={`mainnav ${mobileMenuOpen ? 'open' : ''}`} id="mainnav">
          {/* Mobile User Card hiển thị bên trong drawer trên điện thoại */}
          {currentUser ? (
            <div className="mobile-user-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '22px' }}>👤</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '14px' }}>{currentUser.full_name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--brass, #C9A227)' }}>{currentUser.role_name}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { closeMenus(); logout(); }}
                style={{
                  padding: '6px 12px',
                  background: 'rgba(217, 83, 79, 0.2)',
                  border: '1px solid #D9534F',
                  color: '#FF8885',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="mobile-guest-card">
              <button
                type="button"
                onClick={() => { closeMenus(); onOpenAuth('login'); }}
                className="btn btn-solid"
                style={{ width: '100%', marginBottom: '8px', fontSize: '13.5px' }}
              >
                Vào hệ thống / Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => { closeMenus(); onOpenAuth('register'); }}
                className="btn btn-ghost"
                style={{ width: '100%', fontSize: '13.5px' }}
              >
                Đăng ký tài khoản
              </button>
            </div>
          )}

          <Link to="/" onClick={closeMenus} className={location.pathname === '/' ? 'active' : ''}>
            Trang chủ
          </Link>

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
                <div className="mega" id={menu.id}>
                  <div className="wrap">
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

          <Link to="/ho-so-ngua" onClick={closeMenus} className={location.pathname === '/ho-so-ngua' ? 'active' : ''}>
            Hồ sơ ngựa & Phả hệ
          </Link>

          <Link 
            to="/admin" 
            onClick={closeMenus} 
            className={location.pathname === '/admin' ? 'active' : ''}
            style={{
              color: 'var(--brass, #C9A227)',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            👑 Cổng Quản Trị
          </Link>
        </nav>

        {/* NÚT TÁC VỤ BÊN PHẢI (NAV CTA) */}
        <div className="nav-cta">
          {currentUser ? (
            <div className="nav-user-cluster">
              <div className="nav-user-text">
                <span className="nav-user-name">{currentUser.full_name}</span>
                <span className="nav-user-role">{currentUser.role_name}</span>
              </div>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="btn btn-solid btn-admin-header"
                >
                  👑 Quản Trị
                </Link>
              )}
              <button
                type="button"
                onClick={logout}
                className="btn btn-ghost btn-logout-header"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="nav-guest-cluster">
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
            </div>
          )}

          {/* NÚT BURGER CHO MOBILE & TABLET */}
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
            {mobileMenuOpen ? '✕' : '≡'}
          </button>
        </div>
      </div>
    </header>
  );
}
