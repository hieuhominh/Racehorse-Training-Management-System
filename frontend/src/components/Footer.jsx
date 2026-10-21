import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t, lang } = useLanguage();

  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="fgrid">
          <div>
            <Link className="brand" to="/" style={{ marginBottom: '14px' }}>
              <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
                <path d="M17 3c6 0 10 4.6 10 10.6 0 5-2.6 7.4-2.6 11.2 0 2.6 1.6 3.9 1.6 5.4 0 1.2-1 1.8-2.3 1.8-2.6 0-4.2-2.2-4.2-5.2 0-3.4 2.2-5.6 2.2-9.2 0-2.9-1.8-5-4.7-5s-4.7 2.1-4.7 5c0 3.6 2.2 5.8 2.2 9.2 0 3-1.6 5.2-4.2 5.2-1.3 0-2.3-.6-2.3-1.8 0-1.5 1.6-2.8 1.6-5.4C9.6 21 7 18.6 7 13.6 7 6.6 11 3 17 3Z" fill="#C9A227"/>
              </svg>
              <span>
                <span className="name">{lang === 'vi' ? 'MÃ TRƯỜNG' : 'MA TRUONG'}</span>
                <span className="sub">{t('brandSub')}</span>
              </span>
            </Link>
            <p className="footer-desc">
              {t('footerDesc')}
            </p>
          </div>
          <div>
            <h4>{t('footerColTraining')}</h4>
            <ul>
              <li><Link to="/ho-so-ngua">{lang === 'vi' ? 'Danh sách ngựa' : 'Horse Directory'}</Link></li>
              <li><Link to="/ho-so-ngua">{lang === 'vi' ? 'Giáo án & Phả hệ' : 'Workouts & Pedigree'}</Link></li>
              <li><Link to="/thanh-tich">{lang === 'vi' ? 'Lịch sử thành tích' : 'Race History'}</Link></li>
              <li><Link to="/chuong-trai">{lang === 'vi' ? 'Sơ đồ chuồng' : 'Stable Layout'}</Link></li>
            </ul>
          </div>
          <div>
            <h4>{t('footerColMedical')}</h4>
            <ul>
              <li><Link to="/ho-so-ngua">{lang === 'vi' ? 'Bệnh án & Khám' : 'Medical Records'}</Link></li>
              <li><Link to="/chuong-trai">{lang === 'vi' ? 'Trạng thái sức khỏe' : 'Health Status'}</Link></li>
              <li><Link to="/chuong-trai">{lang === 'vi' ? 'Checklist Groom' : 'Groom Checklists'}</Link></li>
              <li><Link to="/ho-so-ngua">{lang === 'vi' ? 'Khóa huấn luyện' : 'Medical Locks'}</Link></li>
            </ul>
          </div>
          <div>
            <h4>{t('footerColStables')}</h4>
            <ul>
              <li><Link to="/chuong-trai">{lang === 'vi' ? 'Sơ đồ chuồng (A1-B6)' : 'Stalls Map (A1-B6)'}</Link></li>
              <li><Link to="/chuong-trai">{lang === 'vi' ? 'Khẩu phần & Dinh dưỡng' : 'Diet & Nutrition'}</Link></li>
              <li><Link to="/chuong-trai">{lang === 'vi' ? 'Checklist công việc' : 'Daily Task List'}</Link></li>
              <li><Link to="/chuong-trai">{lang === 'vi' ? 'Lịch sinh hoạt' : 'Daily Routine'}</Link></li>
            </ul>
          </div>
          <div>
            <h4>{t('footerColClub')}</h4>
            <ul>
              <li><Link to="/thanh-tich">{lang === 'vi' ? 'Đối soát chi phí & Thưởng' : 'Purse & Expenses'}</Link></li>
              <li><Link to="/ho-so-ngua">{lang === 'vi' ? 'Chủ sở hữu & Tỉ lệ' : 'Ownership Syndicates'}</Link></li>
              <li><Link to="/thanh-tich">{lang === 'vi' ? 'Báo cáo cho chủ ngựa' : 'Owner Reports'}</Link></li>
              <li><Link to="/chuong-trai">{lang === 'vi' ? 'Quản lý khu vực chuồng' : 'Facility Controls'}</Link></li>
            </ul>
          </div>
        </div>
        <div className="fbot">
          <span>{t('footerCopyright')}</span>
          <span className="fbot-links">
            <Link to="/">{t('footerTerms')}</Link> · <Link to="/">{t('footerPrivacy')}</Link> · <Link to="/">{t('footerContact')}</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
