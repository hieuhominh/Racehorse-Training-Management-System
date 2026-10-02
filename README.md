# Hệ thống Quản lý Huấn luyện Ngựa đua — MÃ TRƯỜNG
> Dự án môn học SWP / Web Application

---

## 📁 1. Cấu trúc thư mục dự án chuẩn Front-end / Back-end

Toàn bộ dự án đã được phân tách rõ ràng giữa Front-end và Back-end:

```text
SWP/
├── frontend/                   # [FRONT-END] Ứng dụng giao diện người dùng
│   ├── src/
│   │   ├── components/         # Các React component (Navbar, Hero, Vitals, Roles, Stables...)
│   │   ├── data/               # Dữ liệu tĩnh (Navigation, Roles, Flows, Stalls, Schedule)
│   │   ├── App.jsx             # Component chính tập hợp giao diện
│   │   ├── index.css           # Toàn bộ CSS Design System, Responsive
│   │   └── main.jsx
│   ├── static/                 # Bản HTML/CSS/JS thuần tách riêng (để xem ngay không cần npm)
│   │   ├── index.html
│   │   ├── css/style.css
│   │   └── js/main.js
│   ├── vite.config.js          # Cấu hình proxy sang Backend Tomcat (port 8080)
│   └── package.json
│
├── backend/                    # [BACK-END] Mã nguồn Java Web API (NetBeans 13 + Tomcat 9)
│   ├── pom.xml                 # Maven cấu hình Java 17, Servlet 4.0, SQL JDBC Driver, Gson
│   └── src/main/
│       ├── java/
│       │   ├── dal/            # DBContext.java kết nối SQL Server 2019, HorseDAO.java
│       │   ├── model/          # Horse.java (Model chiến mã)
│       │   ├── controller/     # HorseApiController.java (REST API trả về JSON)
│       │   └── filter/         # CorsFilter.java (Cho phép React gọi API không bị chặn CORS)
│       └── webapp/WEB-INF/
│           └── web.xml         # Cấu hình Web Application
│
├── database/                   # [DATABASE] Cơ sở dữ liệu Microsoft SQL Server 2019
│   └── init.sql                # Script tạo DB RacehorseDB + Dữ liệu mẫu đồng bộ với UI
│
├── docker-compose.yml          # Cấu hình Docker chạy SQL Server 2019 với 1 lệnh
└── README.md                   # Hướng dẫn chi tiết dự án
```

---

## 🎨 2. Chạy Front-end (ReactJS)

1. Mở PowerShell tại thư mục `frontend`:
   ```powershell
   cd c:\Users\ASUS\Desktop\SWP\frontend
   npm install
   npm run dev
   ```
2. Trình duyệt sẽ mở tại địa chỉ: **`http://localhost:3000`**

*(Nếu muốn mở bản HTML thuần không cần Node.js, bạn có thể mở trực tiếp file `frontend/static/index.html`)*.

---

## ☕ 3. Chạy Back-end (NetBeans 13 + Tomcat 9.0.113 + JDK 17)

1. **Khởi động SQL Server 2019 (Docker):**
   ```powershell
   cd c:\Users\ASUS\Desktop\SWP
   docker compose up -d
   ```
   *Tài khoản:* `sa` / *Mật khẩu:* `Password123@#` / *Database:* `RacehorseDB`. Chạy script trong `database/init.sql` để tạo bảng và nạp dữ liệu mẫu.

2. **Mở dự án Back-end trong NetBeans 13:**
   - Trong NetBeans: Chọn **File** > **Open Project...**
   - Trỏ tới thư mục `c:\Users\ASUS\Desktop\SWP\backend`.
   - Chuột phải vào project `racehorse-backend` > Chọn **Properties** > Mục **Run** > Chọn Server: **Apache Tomcat 9.0.113**.
   - Bấm **Run** (F6).

3. **Kiểm tra REST API:**
   - Truy cập: `http://localhost:8080/racehorse-backend/api/horses`
   - Dữ liệu JSON danh sách chiến mã sẽ được trả về và kết nối trực tiếp với Front-end React.
