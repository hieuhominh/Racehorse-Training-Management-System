package dal;

import model.User;
import util.SecurityUtil;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

public class UserDAO extends DBContext {

    private static final List<User> memoryUsers = Collections.synchronizedList(new ArrayList<>());
    private static final Map<String, String> memoryPasswordHashes = new ConcurrentHashMap<>();
    private static final AtomicInteger idSequence = new AtomicInteger(10);

    static {
        seedMemoryUser(new User(1, "admin", "Quản trị viên Hệ thống", "admin@matruong.vn", "0905678999", 5, "MANAGER", "ACTIVE"), "123456");
        seedMemoryUser(new User(2, "admin_quan", "Ban Quản trị Mã Trường", "quanly@matruong.vn", "0905678901", 5, "MANAGER", "ACTIVE"), "123456");
        seedMemoryUser(new User(3, "trainer_truong", "Trần Văn Hùng", "trainer@matruong.vn", "0901234567", 1, "TRAINER", "ACTIVE"), "123456");
        seedMemoryUser(new User(4, "vet_an", "Bác sĩ Nguyễn An", "vet@matruong.vn", "0902345678", 2, "VET", "ACTIVE"), "123456");
        seedMemoryUser(new User(5, "groom_nam", "Lê Hoàng Nam", "groom@matruong.vn", "0903456789", 3, "GROOM", "ACTIVE"), "123456");
        seedMemoryUser(new User(6, "owner_thanh", "Phạm Tiến Thành", "owner@matruong.vn", "0904567890", 4, "OWNER", "ACTIVE"), "123456");
    }

    private static void seedMemoryUser(User user, String rawPassword) {
        memoryUsers.add(user);
        memoryPasswordHashes.put(user.getUsername().toLowerCase(), SecurityUtil.hashPassword(rawPassword));
    }

    private static int resolveRoleId(String roleCode) {
        if (roleCode == null) return 4;
        switch (roleCode.trim().toUpperCase()) {
            case "TRAINER": return 1;
            case "VET": return 2;
            case "GROOM": return 3;
            case "MANAGER":
            case "ADMIN": return 5;
            case "OWNER":
            default: return 4;
        }
    }

    /**
     * Xác thực đăng nhập qua username hoặc email và mật khẩu đã băm SHA-256
     */
    public User login(String account, String password) {
        if (account == null || account.trim().isEmpty() || password == null || password.isEmpty()) {
            return null;
        }
        String cleanAccount = account.trim();
        if (SecurityUtil.containsMaliciousPayload(cleanAccount)) {
            return null;
        }

        if (hasConnection()) {
            String sql = "SELECT u.user_id, u.username, u.password_hash, u.full_name, u.email, u.phone, u.role_id, r.role_code, u.status "
                       + "FROM dbo.Users u "
                       + "JOIN dbo.Roles r ON u.role_id = r.role_id "
                       + "WHERE (u.username = ? OR u.email = ?) AND u.status = 'ACTIVE'";

            try (PreparedStatement ps = connection.prepareStatement(sql)) {
                ps.setString(1, cleanAccount);
                ps.setString(2, cleanAccount);

                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        String storedHash = rs.getString("password_hash");
                        if (SecurityUtil.verifyPassword(password, storedHash)) {
                            return new User(
                                rs.getInt("user_id"),
                                rs.getString("username"),
                                rs.getString("full_name"),
                                rs.getString("email"),
                                rs.getString("phone"),
                                rs.getInt("role_id"),
                                rs.getString("role_code"),
                                rs.getString("status")
                            );
                        }
                        return null;
                    }
                }
            } catch (SQLException ignored) {
            }
        }

        // Fallback bộ nhớ an toàn khi chạy kiểm thử mô phỏng (không có SQL Server)
        synchronized (memoryUsers) {
            for (User u : memoryUsers) {
                boolean matchesAccount = cleanAccount.equalsIgnoreCase(u.getUsername())
                        || (u.getEmail() != null && cleanAccount.equalsIgnoreCase(u.getEmail()));
                if (matchesAccount && "ACTIVE".equalsIgnoreCase(u.getStatus())) {
                    String storedHash = memoryPasswordHashes.get(u.getUsername().toLowerCase());
                    if (SecurityUtil.verifyPassword(password, storedHash)) {
                        return u;
                    }
                    return null;
                }
            }
        }
        return null;
    }

    /**
     * Đăng ký tài khoản người dùng mới (Băm mật khẩu bằng SHA-256 và kiểm tra trùng lặp)
     */
    public User register(String username, String password, String fullName, String email, String phone, String roleCode) {
        if (username == null || username.trim().isEmpty()
                || password == null || password.isEmpty()
                || fullName == null || fullName.trim().isEmpty()
                || email == null || email.trim().isEmpty()) {
            return null;
        }

        String cleanUsername = SecurityUtil.sanitize(username);
        String cleanFullName = SecurityUtil.sanitize(fullName);
        String cleanEmail = email.trim().toLowerCase();
        String cleanPhone = phone != null ? SecurityUtil.sanitize(phone) : "";
        String normalizedRole = roleCode != null ? roleCode.trim().toUpperCase() : "OWNER";
        String passwordHash = SecurityUtil.hashPassword(password);
        int roleId = resolveRoleId(normalizedRole);

        if (hasConnection()) {
            String roleSql = "SELECT role_id FROM dbo.Roles WHERE role_code = ?";
            try (PreparedStatement psRole = connection.prepareStatement(roleSql)) {
                psRole.setString(1, normalizedRole);
                try (ResultSet rs = psRole.executeQuery()) {
                    if (rs.next()) {
                        roleId = rs.getInt("role_id");
                    }
                }
            } catch (SQLException ignored) {
            }

            String insertSql = "INSERT INTO dbo.Users (username, password_hash, full_name, email, phone, role_id, status) "
                             + "VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')";
            try (PreparedStatement ps = connection.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS)) {
                ps.setString(1, cleanUsername);
                ps.setString(2, passwordHash);
                ps.setString(3, cleanFullName);
                ps.setString(4, cleanEmail);
                ps.setString(5, cleanPhone);
                ps.setInt(6, roleId);

                int affected = ps.executeUpdate();
                if (affected > 0) {
                    try (ResultSet generatedKeys = ps.getGeneratedKeys()) {
                        if (generatedKeys.next()) {
                            int newId = generatedKeys.getInt(1);
                            return new User(newId, cleanUsername, cleanFullName, cleanEmail, cleanPhone, roleId, normalizedRole, "ACTIVE");
                        }
                    }
                }
                return null;
            } catch (SQLException e) {
                return null;
            }
        }

        synchronized (memoryUsers) {
            for (User existing : memoryUsers) {
                if (cleanUsername.equalsIgnoreCase(existing.getUsername())
                        || cleanEmail.equalsIgnoreCase(existing.getEmail())) {
                    return null;
                }
            }
            int newId = idSequence.incrementAndGet();
            User created = new User(newId, cleanUsername, cleanFullName, cleanEmail, cleanPhone, roleId, normalizedRole, "ACTIVE");
            memoryUsers.add(created);
            memoryPasswordHashes.put(cleanUsername.toLowerCase(), passwordHash);
            return created;
        }
    }

    /**
     * Cập nhật thông tin người dùng (cho trang Admin)
     */
    public boolean updateUser(int userId, String fullName, String email, String phone, String roleCode, String status) {
        if (userId <= 0) return false;

        String normalizedRole = roleCode != null && !roleCode.trim().isEmpty() ? roleCode.trim().toUpperCase() : null;
        int roleId = resolveRoleId(normalizedRole != null ? normalizedRole : "OWNER");

        if (hasConnection()) {
            if (normalizedRole != null) {
                String roleSql = "SELECT role_id FROM dbo.Roles WHERE role_code = ?";
                try (PreparedStatement psRole = connection.prepareStatement(roleSql)) {
                    psRole.setString(1, normalizedRole);
                    try (ResultSet rs = psRole.executeQuery()) {
                        if (rs.next()) {
                            roleId = rs.getInt("role_id");
                        }
                    }
                } catch (SQLException ignored) {
                }
            }

            String sql = "UPDATE dbo.Users SET full_name = ?, email = ?, phone = ?, role_id = ?, status = ? WHERE user_id = ?";
            try (PreparedStatement ps = connection.prepareStatement(sql)) {
                ps.setString(1, SecurityUtil.sanitize(fullName));
                ps.setString(2, email != null ? email.trim() : "");
                ps.setString(3, phone != null ? SecurityUtil.sanitize(phone) : "");
                ps.setInt(4, roleId);
                ps.setString(5, status != null ? status.trim().toUpperCase() : "ACTIVE");
                ps.setInt(6, userId);
                return ps.executeUpdate() > 0;
            } catch (SQLException e) {
                return false;
            }
        }

        synchronized (memoryUsers) {
            for (User u : memoryUsers) {
                if (u.getUserId() == userId) {
                    if (fullName != null && !fullName.trim().isEmpty()) {
                        u.setFullName(SecurityUtil.sanitize(fullName));
                    }
                    if (email != null && !email.trim().isEmpty()) {
                        u.setEmail(email.trim());
                    }
                    if (phone != null && !phone.trim().isEmpty()) {
                        u.setPhone(SecurityUtil.sanitize(phone));
                    }
                    if (normalizedRole != null) {
                        u.setRoleCode(normalizedRole);
                        u.setRoleId(roleId);
                    }
                    if (status != null && !status.trim().isEmpty()) {
                        u.setStatus(status.trim().toUpperCase());
                    }
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Xóa / Vô hiệu hóa người dùng (Bảo vệ tài khoản Root Admin user_id = 1)
     */
    public boolean deleteUser(int userId) {
        if (userId <= 1) {
            return false;
        }

        if (hasConnection()) {
            String sql = "UPDATE dbo.Users SET status = 'INACTIVE' WHERE user_id = ?";
            try (PreparedStatement ps = connection.prepareStatement(sql)) {
                ps.setInt(1, userId);
                return ps.executeUpdate() > 0;
            } catch (SQLException e) {
                return false;
            }
        }

        synchronized (memoryUsers) {
            for (User u : memoryUsers) {
                if (u.getUserId() == userId) {
                    u.setStatus("INACTIVE");
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Lấy toàn bộ danh sách người dùng cho Quản trị viên (Admin)
     */
    public List<User> getAllUsers() {
        if (hasConnection()) {
            List<User> list = new ArrayList<>();
            String sql = "SELECT u.user_id, u.username, u.full_name, u.email, u.phone, u.role_id, r.role_code, u.status "
                       + "FROM dbo.Users u "
                       + "JOIN dbo.Roles r ON u.role_id = r.role_id "
                       + "ORDER BY u.user_id ASC";

            try (PreparedStatement ps = connection.prepareStatement(sql);
                 ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(new User(
                        rs.getInt("user_id"),
                        rs.getString("username"),
                        rs.getString("full_name"),
                        rs.getString("email"),
                        rs.getString("phone"),
                        rs.getInt("role_id"),
                        rs.getString("role_code"),
                        rs.getString("status")
                    ));
                }
                return list;
            } catch (SQLException ignored) {
            }
        }

        synchronized (memoryUsers) {
            return new ArrayList<>(memoryUsers);
        }
    }
}
