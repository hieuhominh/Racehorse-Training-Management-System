import React, { useState } from 'react';

export default function PedigreeModal({ horse, isOpen, onClose }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [viewTab, setViewTab] = useState('tree'); // 'tree' | 'table'

  if (!isOpen || !horse) return null;

  const pedigree = horse.pedigree || {};
  const g1 = pedigree.g1 || {};
  const g2 = pedigree.g2 || {};
  const g3 = pedigree.g3 || {};

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const activeDetail = selectedNode || g1;

  return (
    <div className="modal-overlay" onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-labelledby="pedigree-modal-title">
      <div className="modal-container pedigree-modal">
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="badge-row">
              <span className="badge badge-gold">CÂY DÒNG DÕI 3 ĐỜI</span>
              <span className="chip-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M2 12h20M7 7l10 10M17 7L7 17"/>
                </svg>
                CHIP RFID: <strong>{horse.chipId}</strong>
              </span>
            </div>
            <h2 id="pedigree-modal-title" className="modal-title">
              {horse.name} <span className="sub-title">({horse.englishName})</span>
            </h2>
            <p className="modal-subtitle">
              {horse.breed} • {horse.gender} • Sinh năm {horse.yob} ({horse.age} tuổi) • {horse.color}
            </p>
          </div>

          <div className="modal-actions-top">
            <div className="tab-pill-group">
              <button 
                type="button"
                className={`tab-pill ${viewTab === 'tree' ? 'active' : ''}`}
                onClick={() => setViewTab('tree')}
              >
                🌳 Sơ đồ phả hệ 3D
              </button>
              <button 
                type="button"
                className={`tab-pill ${viewTab === 'table' ? 'active' : ''}`}
                onClick={() => setViewTab('table')}
              >
                📋 Bảng chi tiết 7 đời
              </button>
            </div>
            <button type="button" className="close-btn" onClick={onClose} aria-label="Đóng modal">
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {viewTab === 'tree' ? (
            <div className="pedigree-tree-wrapper">
              <div className="tree-legend">
                <div className="legend-item"><span className="legend-dot dot-subject"></span> Chủ thể (G1)</div>
                <div className="legend-item"><span className="legend-dot dot-sire"></span> Dòng Cha (Sire Line)</div>
                <div className="legend-item"><span className="legend-dot dot-dam"></span> Dòng Mẹ (Dam Line)</div>
                <div className="legend-hint">💡 Bấm vào bất kỳ ngựa tổ tiên nào để xem hồ sơ dòng dõi</div>
              </div>

              {/* 3-Generation Pedigree Grid */}
              <div className="pedigree-grid">
                {/* Generation 1: Subject Horse */}
                <div className="gen-column gen-1">
                  <div className="gen-title">ĐỜI 1: CHỦ THỂ</div>
                  <div 
                    className={`node-card node-subject ${activeDetail?.chipId === g1.chipId ? 'node-selected' : ''}`}
                    onClick={() => setSelectedNode(g1)}
                  >
                    <div className="node-avatar-wrapper">
                      <img src={horse.avatar} alt={horse.name} className="node-avatar" />
                      <span className="node-gen-badge">G1</span>
                    </div>
                    <div className="node-info">
                      <div className="node-role">CHIẾN MÃ</div>
                      <div className="node-name">{g1.name || horse.name}</div>
                      <div className="node-eng">{g1.englishName || horse.englishName}</div>
                      <div className="node-chip">MÃ CHIP: {g1.chipId || horse.chipId}</div>
                      <div className="node-tags">
                        <span className="mini-tag">{horse.breed}</span>
                        <span className="mini-tag gold-tag">{g1.record || horse.winsCount}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connection lines G1 to G2 */}
                <div className="tree-connector-col col-1-2">
                  <svg className="connector-svg" width="40" height="100%" viewBox="0 0 40 400" preserveAspectRatio="none">
                    <path d="M0 200 H20 V100 H40 M20 200 V300 H40" fill="none" stroke="var(--brass)" strokeWidth="2" opacity="0.6" />
                  </svg>
                </div>

                {/* Generation 2: Parents (Sire & Dam) */}
                <div className="gen-column gen-2">
                  <div className="gen-title">ĐỜI 2: CHA & MẸ (PARENTS)</div>
                  
                  {/* SIRE */}
                  <div className="parent-branch sire-branch">
                    <div 
                      className={`node-card node-sire ${activeDetail?.chipId === g2.sire?.chipId ? 'node-selected' : ''}`}
                      onClick={() => setSelectedNode({ ...g2.sire, relationRole: 'Cha (Sire)' })}
                    >
                      <div className="node-header-row">
                        <span className="relation-pill sire-pill">♂ SIRE (CHA)</span>
                        <span className="node-yob">{g2.sire?.yob}</span>
                      </div>
                      <div className="node-name">{g2.sire?.name || 'Chưa cập nhật'}</div>
                      <div className="node-chip">MÃ CHIP: {g2.sire?.chipId}</div>
                      <div className="node-lineage">Dòng: {g2.sire?.lineage}</div>
                      <div className="node-record">Thành tích: {g2.sire?.record}</div>
                      <div className="node-origin">📍 {g2.sire?.origin}</div>
                    </div>
                  </div>

                  {/* DAM */}
                  <div className="parent-branch dam-branch">
                    <div 
                      className={`node-card node-dam ${activeDetail?.chipId === g2.dam?.chipId ? 'node-selected' : ''}`}
                      onClick={() => setSelectedNode({ ...g2.dam, relationRole: 'Mẹ (Dam)' })}
                    >
                      <div className="node-header-row">
                        <span className="relation-pill dam-pill">♀ DAM (MẸ)</span>
                        <span className="node-yob">{g2.dam?.yob}</span>
                      </div>
                      <div className="node-name">{g2.dam?.name || 'Chưa cập nhật'}</div>
                      <div className="node-chip">MÃ CHIP: {g2.dam?.chipId}</div>
                      <div className="node-lineage">Dòng: {g2.dam?.lineage}</div>
                      <div className="node-record">Thành tích: {g2.dam?.record}</div>
                      <div className="node-origin">📍 {g2.dam?.origin}</div>
                    </div>
                  </div>
                </div>

                {/* Connection lines G2 to G3 */}
                <div className="tree-connector-col col-2-3">
                  <svg className="connector-svg" width="40" height="100%" viewBox="0 0 40 400" preserveAspectRatio="none">
                    {/* Top branch for Sire */}
                    <path d="M0 100 H20 V50 H40 M20 100 V150 H40" fill="none" stroke="#60A5FA" strokeWidth="1.5" opacity="0.6" />
                    {/* Bottom branch for Dam */}
                    <path d="M0 300 H20 V250 H40 M20 300 V350 H40" fill="none" stroke="#F472B6" strokeWidth="1.5" opacity="0.6" />
                  </svg>
                </div>

                {/* Generation 3: Grandparents (4 Nodes) */}
                <div className="gen-column gen-3">
                  <div className="gen-title">ĐỜI 3: ÔNG BÀ NỘI NGOẠI (GRANDPARENTS)</div>
                  
                  {/* Sire's Sire */}
                  <div className="grandparent-slot">
                    <div 
                      className={`node-card node-g3 node-sire-line ${activeDetail?.chipId === g3.sireSire?.chipId ? 'node-selected' : ''}`}
                      onClick={() => setSelectedNode({ ...g3.sireSire, relationRole: 'Ông Nội (Sire\'s Sire)' })}
                    >
                      <div className="node-header-row">
                        <span className="g3-pill male">♂ ÔNG NỘI</span>
                        <span className="node-yob">{g3.sireSire?.yob}</span>
                      </div>
                      <div className="node-name">{g3.sireSire?.name}</div>
                      <div className="node-chip">CHIP: {g3.sireSire?.chipId}</div>
                      <div className="node-desc">{g3.sireSire?.achievements}</div>
                    </div>
                  </div>

                  {/* Sire's Dam */}
                  <div className="grandparent-slot">
                    <div 
                      className={`node-card node-g3 node-sire-line ${activeDetail?.chipId === g3.sireDam?.chipId ? 'node-selected' : ''}`}
                      onClick={() => setSelectedNode({ ...g3.sireDam, relationRole: 'Bà Nội (Sire\'s Dam)' })}
                    >
                      <div className="node-header-row">
                        <span className="g3-pill female">♀ BÀ NỘI</span>
                        <span className="node-yob">{g3.sireDam?.yob}</span>
                      </div>
                      <div className="node-name">{g3.sireDam?.name}</div>
                      <div className="node-chip">CHIP: {g3.sireDam?.chipId}</div>
                      <div className="node-desc">{g3.sireDam?.achievements}</div>
                    </div>
                  </div>

                  {/* Dam's Sire */}
                  <div className="grandparent-slot">
                    <div 
                      className={`node-card node-g3 node-dam-line ${activeDetail?.chipId === g3.damSire?.chipId ? 'node-selected' : ''}`}
                      onClick={() => setSelectedNode({ ...g3.damSire, relationRole: 'Ông Ngoại (Dam\'s Sire)' })}
                    >
                      <div className="node-header-row">
                        <span className="g3-pill male">♂ ÔNG NGOẠI</span>
                        <span className="node-yob">{g3.damSire?.yob}</span>
                      </div>
                      <div className="node-name">{g3.damSire?.name}</div>
                      <div className="node-chip">CHIP: {g3.damSire?.chipId}</div>
                      <div className="node-desc">{g3.damSire?.achievements}</div>
                    </div>
                  </div>

                  {/* Dam's Dam */}
                  <div className="grandparent-slot">
                    <div 
                      className={`node-card node-g3 node-dam-line ${activeDetail?.chipId === g3.damDam?.chipId ? 'node-selected' : ''}`}
                      onClick={() => setSelectedNode({ ...g3.damDam, relationRole: 'Bà Ngoại (Dam\'s Dam)' })}
                    >
                      <div className="node-header-row">
                        <span className="g3-pill female">♀ BÀ NGOẠI</span>
                        <span className="node-yob">{g3.damDam?.yob}</span>
                      </div>
                      <div className="node-name">{g3.damDam?.name}</div>
                      <div className="node-chip">CHIP: {g3.damDam?.chipId}</div>
                      <div className="node-desc">{g3.damDam?.achievements}</div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Selected Node Details Box */}
              {activeDetail && (
                <div className="selected-node-panel">
                  <div className="panel-title-row">
                    <span className="panel-badge">CHI TIẾT THÔNG TIN HUYẾT THỐNG CHỌN LỌC</span>
                    <span className="panel-role">{activeDetail.relationRole || activeDetail.relation || 'Chiến mã chủ thể'}</span>
                  </div>
                  <div className="panel-grid">
                    <div className="panel-item">
                      <label>Tên ngựa:</label>
                      <span className="highlight-text">{activeDetail.name}</span>
                    </div>
                    <div className="panel-item">
                      <label>Mã Chip RFID:</label>
                      <code className="chip-code">{activeDetail.chipId}</code>
                    </div>
                    <div className="panel-item">
                      <label>Giống & Xuất xứ:</label>
                      <span>{activeDetail.breed || 'Thoroughbred'} ({activeDetail.origin || 'N/A'})</span>
                    </div>
                    <div className="panel-item">
                      <label>Năm sinh / Tuổi:</label>
                      <span>{activeDetail.yob ? `Năm ${activeDetail.yob}` : 'N/A'}</span>
                    </div>
                    <div className="panel-item full-width">
                      <label>Thành tích / Danh hiệu nổi bật:</label>
                      <span className="achievement-text">
                        {activeDetail.achievements || activeDetail.record || activeDetail.notes || 'Hồ sơ thi đấu tiêu chuẩn quốc tế'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Table view of 7 ancestors */
            <div className="pedigree-table-wrapper">
              <table className="pedigree-table">
                <thead>
                  <tr>
                    <th>Thế hệ</th>
                    <th>Quan hệ / Vai trò</th>
                    <th>Tên ngựa</th>
                    <th>Mã Chip RFID</th>
                    <th>Năm sinh</th>
                    <th>Giống & Xuất xứ</th>
                    <th>Thành tích / Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {/* G1 */}
                  <tr className="row-g1">
                    <td><span className="gen-tag g1">Đời 1</span></td>
                    <td><strong>Chủ thể</strong></td>
                    <td className="horse-name-cell">
                      <img src={horse.avatar} alt={horse.name} className="mini-avatar" />
                      <div>
                        <strong>{g1.name || horse.name}</strong>
                        <small>{g1.englishName || horse.englishName}</small>
                      </div>
                    </td>
                    <td><code>{g1.chipId || horse.chipId}</code></td>
                    <td>{g1.yob || horse.yob}</td>
                    <td>{g1.breed || horse.breed} ({g1.origin || 'Việt Nam'})</td>
                    <td>{g1.record || horse.winsCount}</td>
                  </tr>

                  {/* G2 Sire */}
                  <tr className="row-sire">
                    <td><span className="gen-tag g2">Đời 2</span></td>
                    <td><span className="relation-pill sire-pill">♂ Cha (Sire)</span></td>
                    <td><strong>{g2.sire?.name}</strong></td>
                    <td><code>{g2.sire?.chipId}</code></td>
                    <td>{g2.sire?.yob}</td>
                    <td>{g2.sire?.breed} ({g2.sire?.origin})</td>
                    <td>{g2.sire?.achievements || g2.sire?.record}</td>
                  </tr>

                  {/* G2 Dam */}
                  <tr className="row-dam">
                    <td><span className="gen-tag g2">Đời 2</span></td>
                    <td><span className="relation-pill dam-pill">♀ Mẹ (Dam)</span></td>
                    <td><strong>{g2.dam?.name}</strong></td>
                    <td><code>{g2.dam?.chipId}</code></td>
                    <td>{g2.dam?.yob}</td>
                    <td>{g2.dam?.breed} ({g2.dam?.origin})</td>
                    <td>{g2.dam?.achievements || g2.dam?.record}</td>
                  </tr>

                  {/* G3 Sire's Sire */}
                  <tr>
                    <td><span className="gen-tag g3">Đời 3</span></td>
                    <td>Ông nội (Sire's Sire)</td>
                    <td><strong>{g3.sireSire?.name}</strong></td>
                    <td><code>{g3.sireSire?.chipId}</code></td>
                    <td>{g3.sireSire?.yob}</td>
                    <td>{g3.sireSire?.breed} ({g3.sireSire?.origin})</td>
                    <td>{g3.sireSire?.achievements}</td>
                  </tr>

                  {/* G3 Sire's Dam */}
                  <tr>
                    <td><span className="gen-tag g3">Đời 3</span></td>
                    <td>Bà nội (Sire's Dam)</td>
                    <td><strong>{g3.sireDam?.name}</strong></td>
                    <td><code>{g3.sireDam?.chipId}</code></td>
                    <td>{g3.sireDam?.yob}</td>
                    <td>{g3.sireDam?.breed} ({g3.sireDam?.origin})</td>
                    <td>{g3.sireDam?.achievements}</td>
                  </tr>

                  {/* G3 Dam's Sire */}
                  <tr>
                    <td><span className="gen-tag g3">Đời 3</span></td>
                    <td>Ông ngoại (Dam's Sire)</td>
                    <td><strong>{g3.damSire?.name}</strong></td>
                    <td><code>{g3.damSire?.chipId}</code></td>
                    <td>{g3.damSire?.yob}</td>
                    <td>{g3.damSire?.breed} ({g3.damSire?.origin})</td>
                    <td>{g3.damSire?.achievements}</td>
                  </tr>

                  {/* G3 Dam's Dam */}
                  <tr>
                    <td><span className="gen-tag g3">Đời 3</span></td>
                    <td>Bà ngoại (Dam's Dam)</td>
                    <td><strong>{g3.damDam?.name}</strong></td>
                    <td><code>{g3.damDam?.chipId}</code></td>
                    <td>{g3.damDam?.yob}</td>
                    <td>{g3.damDam?.breed} ({g3.damDam?.origin})</td>
                    <td>{g3.damDam?.achievements}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <div className="footer-info">
            🔒 Xác thực sinh trắc học DNA & Mã Chip RFID đăng ký chính thức bởi Hiệp hội Đua Mã Quốc tế.
          </div>
          <div className="footer-btns">
            <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
              🖨️ In chứng nhận phả hệ
            </button>
            <button type="button" className="btn btn-solid" onClick={onClose}>
              Đóng cửa sổ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
