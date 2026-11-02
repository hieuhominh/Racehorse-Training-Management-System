import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import horseHeroImg from '../assets/hero-horse.png';

/* ─── Role Avatar Pills ─── */
const ROLE_AVATARS = [
  { letter: 'O', color: '#C47B3A', title: 'Owner' },
  { letter: 'J', color: '#E86B2C', title: 'Jockey' },
  { letter: 'R', color: '#8B5CF6', title: 'Referee' },
  { letter: 'S', color: '#3A5C4E', title: 'Spectator' },
  { letter: 'A', color: '#2D4A3E', title: 'Admin' },
];

/* ─── Race Command mini-card ─── */
function RaceCommandCard({ onOpenAuth, t }) {
  return (
    <div className="race-command-card">
      <div className="rcc-label">RACE COMMAND</div>
      <div className="rcc-avatars">
        {ROLE_AVATARS.map((av, i) => (
          <span
            key={i}
            className="rcc-avatar"
            style={{ background: av.color, zIndex: ROLE_AVATARS.length - i }}
            title={av.title}
          >
            {av.letter}
          </span>
        ))}
      </div>
      <div className="rcc-roles-count">
        <strong>5 roles</strong>
        <span>Owner, jockey, referee,<br />spectator, admin</span>
      </div>
      <div className="rcc-divider" />
      <div className="rcc-footer">
        <span className="rcc-explore-label">Explore</span>
        <div className="rcc-open-row">
          <span className="rcc-open-text">Open race<br />hub</span>
          <button
            className="rcc-arrow-btn"
            onClick={() => onOpenAuth && onOpenAuth('login')}
            aria-label="Open race hub"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Hero({ onOpenAuth }) {
  const { t } = useLanguage();

  return (
    <div className="hero">
      <div className="wrap hero-wrap">
        <div className="hero-grid">
          {/* ── Left column: text ── */}
          <div className="hero-text-col">
            <div className="eyebrow">
              <span className="eyebrow-dot"></span>
              {t('heroEyebrow')}
            </div>
            <h1>
              {t('heroTitle1')} <em>{t('heroTitle2')}</em>
            </h1>
            <p className="lede">
              {t('heroLede')}
            </p>
            <div className="hero-actions">
              <a
                className="btn btn-solid btn-hero-cta"
                href="/dang-nhap.html"
                onClick={(e) => {
                  if (onOpenAuth) {
                    e.preventDefault();
                    onOpenAuth('login');
                  }
                }}
              >
                {t('heroEnterSystem')} →
              </a>
              <a className="btn btn-ghost btn-hero-ghost" href="#vai-tro">
                {t('heroChooseRole')}
              </a>
            </div>
          </div>

          {/* ── Center: Horse image ── */}
          <div className="hero-image-col">
            <div className="hero-circle-bg" />
            <img
              src={horseHeroImg}
              alt="Racing horse"
              className="hero-horse-img"
              loading="eager"
            />
          </div>

          {/* ── Right column: Race command card ── */}
          <div className="hero-card-col">
            <RaceCommandCard onOpenAuth={onOpenAuth} t={t} />
          </div>
        </div>
      </div>
    </div>
  );
}
