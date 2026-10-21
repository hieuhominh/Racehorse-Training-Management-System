import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { megaMenusData } from '../data/navigationData';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar({ onOpenAuth }) {
  const { currentUser, isAdmin, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { lang, toggleLang, t } = useLanguage();
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
            <span className="name">{lang === 'vi' ? 'MÃ TRƯỜNG' : 'MA TRUONG'}</span>
            <span className="sub">{t('brandSub')}</span>
          </span>
        </Link>

        <nav className={`mainnav ${mobileMenuOpen ? 'open' : ''}`} id="mainnav">
          <Link to="/" onClick={closeMenus} className={location.pathname === '/' ? 'active' : ''}>{t('home')}</Link>

          {megaMenusData.map((menu) => {
            const isOpen = activeMega === menu.id;
            const isChildActive = menu.ctaLink === location.pathname || menu.links.some(l => l.link === location.pathname);
            const label = lang === 'en' ? (menu.labelEn || menu.label) : (menu.labelVi || menu.label);
            const badge = lang === 'en' ? (menu.badgeEn || menu.badge) : (menu.badgeVi || menu.badge);
            const title = lang === 'en' ? (menu.titleEn || menu.title) : (menu.titleVi || menu.title);
            const desc = lang === 'en' ? (menu.descriptionEn || menu.description) : (menu.descriptionVi || menu.description);
            const ctaText = lang === 'en' ? (menu.ctaTextEn || menu.ctaText) : (menu.ctaTextVi || menu.ctaText);

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
                  {label}
                </button>
                <div 
                  className="mega" 
                  id={menu.id}
                >
                  <div className="wrap mega-wrap">
                    <div className="mega-intro">
                      <div className="fno">
                        <b>{menu.fno}</b>
                        <span className={`badge ${menu.badge === 'BẮT BUỘC' || menu.badgeEn === 'REQUIRED' ? 'req' : 'opt'}`}>{badge}</span>
                      </div>
                      <h3>{title}</h3>
                      <div className="vn">{menu.subtitle}</div>
                      <p>{desc}</p>
                      <Link className="open-flow" to={menu.ctaLink} onClick={closeMenus}>
                        {ctaText}
                      </Link>
                    </div>
                    <div className="mega-links">
                      <h4>{lang === 'vi' ? 'TRONG LUỒNG NÀY' : 'IN THIS WORKFLOW'}</h4>
                      {menu.links.map((sub, sIdx) => {
                        const subTitle = lang === 'en' ? (sub.titleEn || sub.title) : (sub.titleVi || sub.title);
                        const subDesc = lang === 'en' ? (sub.descEn || sub.desc) : (sub.descVi || sub.desc);

                        return (
                          <Link key={sIdx} to={sub.link} onClick={closeMenus}>
                            {subTitle}
                            <em>{subDesc}</em>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <Link to="/ho-so-ngua" onClick={closeMenus} className={location.pathname === '/ho-so-ngua' ? 'active' : ''}>{t('horses')}</Link>
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
            <span className="theme-toggle-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
              {isDark ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </span>
            <span className="theme-toggle-label">
              {isDark ? (lang === 'vi' ? 'Sáng' : 'Light') : (lang === 'vi' ? 'Tối' : 'Dark')}
            </span>
          </button>

          {/* NÚT CHUYỂN ĐỔI NGÔN NGỮ (VI / EN) */}
          <button
            type="button"
            onClick={toggleLang}
            className="theme-toggle-btn"
            aria-label="Thay đổi ngôn ngữ (Change Language)"
            title={lang === 'vi' ? 'Chuyển sang Tiếng Anh (English)' : 'Switch to Vietnamese'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 11px', cursor: 'pointer' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span className="lang-toggle-label" style={{ fontWeight: 700 }}>
              {lang === 'vi' ? 'VI' : 'EN'}
            </span>
          </button>

          {currentUser ? (
            <>
              {currentUser.role === 'TRAINER' ? (
                <Link to="/trainer" className="btn btn-solid btn-role-trainer nav-role-btn" onClick={closeMenus}>
                  <span className="nav-btn-text">{t('trainerPortal')} ({currentUser.full_name || currentUser.username})</span>
                </Link>
              ) : (
                <Link to="/admin" className="btn btn-solid btn-role-admin nav-role-btn" onClick={closeMenus}>
                  <span className="nav-btn-text">{t('adminPortal')} ({currentUser.full_name || currentUser.username})</span>
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="btn-logout"
                title={t('logout')}
                aria-label={t('logout')}
              >
                <span className="btn-logout-text">{t('logout')}</span>
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
                {t('registerBtn')}
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
                {t('loginBtn')}
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
