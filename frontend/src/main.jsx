import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lỗi khởi động giao diện:', error, errorInfo);
  }

  handleReset = () => {
    try {
      const tabKeys = [
        'matruong_tab_owner', 'matruong_tab_admin', 'matruong_tab_trainer', 
        'matruong_tab_vet', 'matruong_tab_groom', 'matruong_tab_achievements',
        'matruong_stables_selected_code', 'matruong_home_selected_stall',
        'matruong_horses_status_filter', 'matruong_horses_view_mode'
      ];
      tabKeys.forEach(k => localStorage.removeItem(k));
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0A0D14',
          color: '#F3F4F6',
          fontFamily: 'system-ui, sans-serif',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '520px',
            background: '#131929',
            border: '1px solid rgba(212, 175, 55, 0.4)',
            borderRadius: '12px',
            padding: '32px 24px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ color: '#D4AF37', margin: '0 0 12px', fontSize: '20px' }}>
              Mã Trường Racehorse System
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: 1.6, margin: '0 0 20px' }}>
              Trình duyệt vừa phát hiện xung đột dữ liệu khi tải lại trang. Bạn có thể bấm nút bên dưới để khôi phục giao diện ngay lập tức.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  background: '#D4AF37',
                  color: '#0A0D14',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontSize: '13.5px',
                  cursor: 'pointer'
                }}
              >
                Khôi phục giao diện
              </button>
              <button
                type="button"
                onClick={() => { window.location.href = '/'; }}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: '#F3F4F6',
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontSize: '13.5px',
                  cursor: 'pointer'
                }}
              >
                Về Trang chủ
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
)
