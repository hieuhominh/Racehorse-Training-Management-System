/**
 * Danh sách mã vùng quốc gia hỗ trợ cho biểu mẫu liên hệ
 * Bao gồm 11 quốc gia được yêu cầu:
 * Việt Nam, Mỹ, Đức, Vương Quốc Anh, Úc, Nhật Bản, Pháp, HongKong, Trung Quốc, Hàn Quốc, Singapore
 */
export const COUNTRY_PHONE_CODES = [
  { code: 'VN', nameVi: 'Việt Nam', nameEn: 'Vietnam', dialCode: '+84', placeholder: '0912 345 678' },
  { code: 'US', nameVi: 'Mỹ (Hoa Kỳ)', nameEn: 'United States', dialCode: '+1', placeholder: '(555) 012-3456' },
  { code: 'GB', nameVi: 'Vương Quốc Anh', nameEn: 'United Kingdom', dialCode: '+44', placeholder: '7911 123456' },
  { code: 'DE', nameVi: 'Đức', nameEn: 'Germany', dialCode: '+49', placeholder: '151 12345678' },
  { code: 'FR', nameVi: 'Pháp', nameEn: 'France', dialCode: '+33', placeholder: '6 12 34 56 78' },
  { code: 'AU', nameVi: 'Úc', nameEn: 'Australia', dialCode: '+61', placeholder: '412 345 678' },
  { code: 'JP', nameVi: 'Nhật Bản', nameEn: 'Japan', dialCode: '+81', placeholder: '90 1234 5678' },
  { code: 'KR', nameVi: 'Hàn Quốc', nameEn: 'South Korea', dialCode: '+82', placeholder: '10 1234 5678' },
  { code: 'CN', nameVi: 'Trung Quốc', nameEn: 'China', dialCode: '+86', placeholder: '138 0000 0000' },
  { code: 'SG', nameVi: 'Singapore', nameEn: 'Singapore', dialCode: '+65', placeholder: '8123 4567' },
  { code: 'HK', nameVi: 'Hồng Kông', nameEn: 'Hong Kong', dialCode: '+852', placeholder: '9123 4567' }
];

export const DEFAULT_COUNTRY = COUNTRY_PHONE_CODES[0]; // Việt Nam (+84)
