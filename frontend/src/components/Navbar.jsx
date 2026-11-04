import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { megaMenusData } from '../data/navigationData';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import ThemeToggle from './ThemeToggle';

/* ─── HR Logo Badge ─── */
function HRLogo() {
  return (
    <span className="hr-logo-badge" aria-hidden="true">
      <span className="hr-logo-letters">HR</span>
    </span>
  );
}

export default function Navbar({ onOpenAuth }) {
  const { currentUser, logout } = useAuth();
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
    function handleResize() {
      if (window.innerWidth > 1260) {
        setMobileMenuOpen(false);
        setActiveMega(null);
      }
    }

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleMega = (id) => {
    setActiveMega(prev => (prev === id ? null : id));
  };

  const handleMouseEnter = (id) => {
    if (window.innerWidth > 1260) {
      setActiveMega(id);
    }
  };

  const handleMouseLeave = () => {
    if (window.innerWidth > 1260) {
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
        {/* ── Brand ── */}
        <Link className="brand" to="/" onClick={closeMenus}>
          <HRLogo />
          <span>
            <span className="name">{lang === 'vi' ? 'horse racing' : 'horse racing'}</span>
          </span>
        </Link>

        {/* ── Main Nav ── */}
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
                      <Link className="open-flow" to={menu.ctaLink} onClick={closeMenus}>{ctaText}</Link>
                    </div>
                    <div className="mega-links">
                      {menu.links.map((lnk, li) => {
                        const linkLabel = lang === 'en' ? (lnk.labelEn || lnk.label) : (lnk.labelVi || lnk.label);
                        const linkDesc = lang === 'en' ? (lnk.descEn || lnk.desc) : (lnk.descVi || lnk.desc);
                        return (
                          <Link key={li} to={lnk.link} onClick={closeMenus}>
                            <span className="ml-icon">{lnk.icon}</span>
                            <span>
                              <b>{linkLabel}</b>
                              <small>{linkDesc}</small>
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* ── Controls ── */}
          {/* THEME TOGGLE */}
          <ThemeToggle showLabel />

          {/* LANGUAGE TOGGLE */}
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
              ) : currentUser.role === 'VET' ? (
                <Link to="/vet" className="btn btn-solid nav-role-btn" style={{ background: '#8B5CF6', borderColor: '#8B5CF6', color: '#ffffff' }} onClick={closeMenus}>
                  <span className="nav-btn-text">Cổng Bác sĩ Thú y ({currentUser.full_name || currentUser.username})</span>
                </Link>
              ) : (currentUser.role === 'GROOM' || currentUser.role_code === 'GROOM') ? (
                <Link to="/groom" className="btn btn-solid nav-role-btn" style={{ background: '#0D9488', borderColor: '#0D9488', color: '#ffffff' }} onClick={closeMenus}>
                  <span className="nav-btn-text">Cổng Chăm sóc ({currentUser.full_name || currentUser.username})</span>
                </Link>
              ) : (currentUser.role === 'OWNER' || currentUser.role_code === 'OWNER') ? (
                <Link to="/owner" className="btn btn-solid nav-role-btn" style={{ background: 'var(--brass)', borderColor: 'var(--brass)', color: '#ffffff' }} onClick={closeMenus}>
                  <span className="nav-btn-text">Cổng Chủ ngựa ({currentUser.full_name || currentUser.username})</span>
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
                className="btn btn-ghost nav-signup-btn"
                href="#register"
                style={{ padding: '9px 26px', minWidth: '112px', textAlign: 'center', whiteSpace: 'nowrap' }}
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
                className="btn btn-solid nav-login-btn"
                href="#login"
                onClick={(e) => {
                  if (onOpenAuth) {
                    e.preventDefault();
                    onOpenAuth('login');
                  }
                }}
              >
                {t('loginBtn')} →
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
        </nav>
      </div>

      {/* 2. SIDE DRAWER DI ĐỘNG KHI BẤM 3 GẠCH (Trượt từ phải sang trái, 100vh, nền đặc sắc nét, KHÔNG MỜ) */}
      <aside className={`mainnav-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mainnav-drawer-header">
          <div className="mainnav-drawer-title">
            <span style={{ color: 'var(--brass)' }}>✦</span> {lang === 'vi' ? 'DANH MỤC HỆ THỐNG' : 'SYSTEM DIRECTORY'}
          </div>
          <button
            type="button"
            className="mainnav-drawer-close"
            onClick={closeMenus}
            aria-label="Đóng menu"
          >
            ✕
          </button>
        </div>

        <div className="mainnav-drawer-links">
          <Link to="/" onClick={closeMenus} className={`mainnav-drawer-item ${location.pathname === '/' ? 'active' : ''}`}>
            {t('home')}
          </Link>

          {megaMenusData.map((menu) => {
            const isOpen = activeMega === menu.id;
            const label = lang === 'en' ? (menu.labelEn || menu.label) : (menu.labelVi || menu.label);
            const title = lang === 'en' ? (menu.titleEn || menu.title) : (menu.titleVi || menu.title);
            const ctaText = lang === 'en' ? (menu.ctaTextEn || menu.ctaText) : (menu.ctaTextVi || menu.ctaText);

            return (
              <div key={menu.id} className="mainnav-drawer-accordion">
                <button
                  type="button"
                  className={`mainnav-drawer-accordion-btn ${isOpen ? 'open' : ''}`}
                  onClick={() => toggleMega(menu.id)}
                >
                  <span>{label}</span>
                  <span style={{ fontSize: '11px', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
                </button>

                {isOpen && (
                  <div className="mainnav-drawer-accordion-content">
                    <Link to={menu.ctaLink} onClick={closeMenus} className="mainnav-drawer-cta-link">
                      ➜ {ctaText} ({title})
                    </Link>
                    {menu.links.map((sub, sIdx) => {
                      const subTitle = lang === 'en' ? (sub.titleEn || sub.title) : (sub.titleVi || sub.title);
                      return (
                        <Link key={sIdx} to={sub.link} onClick={closeMenus} className="mainnav-drawer-sublink">
                          • {subTitle}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* THÔNG TIN VAI TRÒ & NÚT HÀNH ĐỘNG TRONG DRAWER */}
        <div className="mainnav-drawer-footer">
          {currentUser ? (
            <div className="mainnav-mobile-user-card">
              <div className="mainnav-mobile-user-info">
                <div className="mainnav-mobile-user-badge">
                  {currentUser.role === 'TRAINER' ? '🏇 Huấn luyện viên' :
                   currentUser.role === 'VET' ? '🩺 Bác sĩ Thú y' :
                   (currentUser.role === 'GROOM' || currentUser.role_code === 'GROOM') ? '🌾 Nhân viên Chăm sóc' :
                   (currentUser.role === 'OWNER' || currentUser.role_code === 'OWNER') ? '👑 Chủ sở hữu Ngựa' :
                   '🛡️ Quản trị viên'}
                </div>
                <div className="mainnav-mobile-user-name">
                  {currentUser.full_name || currentUser.username}
                </div>
              </div>

              <div className="mainnav-mobile-buttons">
                {currentUser.role === 'TRAINER' ? (
                  <Link to="/trainer" className="btn btn-solid btn-role-trainer" onClick={closeMenus}>
                    {t('trainerPortal')} ({currentUser.full_name || currentUser.username})
                  </Link>
                ) : currentUser.role === 'VET' ? (
                  <Link to="/vet" className="btn btn-solid" style={{ background: '#8B5CF6', borderColor: '#8B5CF6', color: '#ffffff' }} onClick={closeMenus}>
                    Cổng Bác sĩ Thú y ({currentUser.full_name || currentUser.username})
                  </Link>
                ) : (currentUser.role === 'GROOM' || currentUser.role_code === 'GROOM') ? (
                  <Link to="/groom" className="btn btn-solid" style={{ background: '#0D9488', borderColor: '#0D9488', color: '#ffffff' }} onClick={closeMenus}>
                    Cổng Chăm sóc ({currentUser.full_name || currentUser.username})
                  </Link>
                ) : (currentUser.role === 'OWNER' || currentUser.role_code === 'OWNER') ? (
                  <Link to="/owner" className="btn btn-solid" style={{ background: 'var(--brass)', borderColor: 'var(--brass)', color: '#0A0D14' }} onClick={closeMenus}>
                    Cổng Chủ ngựa ({currentUser.full_name || currentUser.username})
                  </Link>
                ) : (
                  <Link to="/admin" className="btn btn-solid btn-role-admin" onClick={closeMenus}>
                    {t('adminPortal')} ({currentUser.full_name || currentUser.username})
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-logout"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <span>{t('logout')}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="mainnav-mobile-auth-buttons">
              <a 
                className="btn btn-ghost" 
                href="#register"
                onClick={(e) => {
                  e.preventDefault();
                  closeMenus();
                  if (onOpenAuth) onOpenAuth('register');
                }}
                style={{ flex: 1, textAlign: 'center' }}
              >
                {t('registerBtn')}
              </a>
              <a 
                className="btn btn-solid" 
                href="#login"
                onClick={(e) => {
                  e.preventDefault();
                  closeMenus();
                  if (onOpenAuth) onOpenAuth('login');
                }}
                style={{ flex: 1, textAlign: 'center' }}
              >
                {t('loginBtn')}
              </a>
            </div>
          )}
        </div>
      </aside>

      {/* 3. LỚP NỀN CHE PHÍA SAU KHI DRAWER MỞ (TUYỆT ĐỐI KHÔNG DÙNG BACKDROP BLUR) */}
      {mobileMenuOpen && (
        <div 
          className="mainnav-backdrop" 
          onClick={closeMenus}
          aria-hidden="true"
        />
      )}
    </header>
  );
}
