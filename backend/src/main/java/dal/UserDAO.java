package dal;

import model.User;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class UserDAO extends DBContext {

    /**
     * Xác thực đăng nhập qua username hoặc email và password
     */
    public User login(String account, String password) {
        String sql = "SELECT u.user_id, u.username, u.full_name, u.email, u.phone, u.role_id, r.role_code, u.status "
                   + "FROM dbo.Users u "
                   + "JOIN dbo.Roles r ON u.role_id = r.role_id "
                   + "WHERE (u.username = ? OR u.email = ?) AND u.password_hash = ? AND u.status = 'ACTIVE'";

        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, account);
            ps.setString(2, account);
            ps.setString(3, password);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
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
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    /**
     * Đăng ký tài khoản người dùng mới
     */
    public User register(String username, String password, String fullName, String email, String phone, String roleCode) {
        int roleId = 4; // Mặc định là OWNER (Chủ ngựa) nếu không chỉ định
        String roleSql = "SELECT role_id FROM dbo.Roles WHERE role_code = ?";
        try (PreparedStatement psRole = connection.prepareStatement(roleSql)) {
            psRole.setString(1, roleCode != null ? roleCode.toUpperCase() : "OWNER");
            try (ResultSet rs = psRole.executeQuery()) {
                if (rs.next()) {
                    roleId = rs.getInt("role_id");
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }

        String insertSql = "INSERT INTO dbo.Users (username, password_hash, full_name, email, phone, role_id, status) "
                         + "VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')";
        try (PreparedStatement ps = connection.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, username);
            ps.setString(2, password);
            ps.setString(3, fullName);
            ps.setString(4, email);
            ps.setString(5, phone != null ? phone : "");
            ps.setInt(6, roleId);

            int affected = ps.executeUpdate();
            if (affected > 0) {
                try (ResultSet generatedKeys = ps.getGeneratedKeys()) {
                    if (generatedKeys.next()) {
                        int newId = generatedKeys.getInt(1);
                        return new User(newId, username, fullName, email, phone, roleId, roleCode != null ? roleCode : "OWNER", "ACTIVE");
                    }
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    /**
     * Cập nhật thông tin người dùng (cho trang Admin)
     */
    public boolean updateUser(int userId, String fullName, String email, String phone, String roleCode, String status) {
        int roleId = 4;
        String roleSql = "SELECT role_id FROM dbo.Roles WHERE role_code = ?";
        try (PreparedStatement psRole = connection.prepareStatement(roleSql)) {
            psRole.setString(1, roleCode != null ? roleCode.toUpperCase() : "OWNER");
            try (ResultSet rs = psRole.executeQuery()) {
                if (rs.next()) {
                    roleId = rs.getInt("role_id");
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }

        String sql = "UPDATE dbo.Users SET full_name = ?, email = ?, phone = ?, role_id = ?, status = ? WHERE user_id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, fullName);
            ps.setString(2, email);
            ps.setString(3, phone);
            ps.setInt(4, roleId);
            ps.setString(5, status);
            ps.setInt(6, userId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    /**
     * Xóa / Vô hiệu hóa người dùng
     */
    public boolean deleteUser(int userId) {
        String sql = "UPDATE dbo.Users SET status = 'INACTIVE' WHERE user_id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setInt(1, userId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    /**
     * Lấy toàn bộ danh sách người dùng cho Quản trị viên (Admin)
     */
    public List<User> getAllUsers() {
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
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }
}
