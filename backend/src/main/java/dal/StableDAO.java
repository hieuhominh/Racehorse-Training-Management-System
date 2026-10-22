package dal;

import model.Stable;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class StableDAO extends DBContext {

    /**
     * Lấy toàn bộ danh sách ô chuồng kèm thông tin chiến mã đang lưu trú
     */
    public List<Stable> getAllStables() {
        List<Stable> list = new ArrayList<>();
        String sql = "SELECT s.stable_id, s.stall_code, s.block_name, s.status, "
                   + "       h.name AS horse_name, h.breed AS horse_breed, h.avatar_url AS horse_avatar "
                   + "FROM dbo.Stables s "
                   + "LEFT JOIN dbo.Horses h ON s.stable_id = h.stable_id "
                   + "ORDER BY s.stall_code ASC";

        try (PreparedStatement ps = connection.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                String horseName = rs.getString("horse_name");
                String breed = rs.getString("horse_breed");
                String avatar = rs.getString("horse_avatar");
                String status = rs.getString("status");

                if (horseName == null || horseName.trim().isEmpty()) {
                    horseName = "(Trống)";
                    breed = "Vacant";
                }

                String area = rs.getString("block_name") != null && rs.getString("block_name").contains("Block B") ? "16 m²" : "14 m²";
                String dim = rs.getString("block_name") != null && rs.getString("block_name").contains("Block B") ? "4.0 x 4.0m" : "3.8 x 3.8m";
                String stallImage = "OCCUPIED".equalsIgnoreCase(status) 
                    ? "/images/stall_simulation_occupied.jpg" 
                    : "/images/stall_simulation_vacant.jpg";

                list.add(new Stable(
                    rs.getInt("stable_id"),
                    rs.getString("stall_code"),
                    rs.getString("block_name"),
                    status,
                    horseName,
                    breed,
                    area,
                    dim,
                    stallImage,
                    avatar
                ));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    /**
     * Thêm ô chuồng mới
     */
    public boolean addStable(Stable s) {
        String sql = "INSERT INTO dbo.Stables (stall_code, block_name, status) VALUES (?, ?, ?)";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, s.getStallCode());
            ps.setString(2, s.getBlockName() != null ? s.getBlockName() : "Block C");
            ps.setString(3, s.getStatus() != null ? s.getStatus() : "AVAILABLE");
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    /**
     * Cập nhật thông tin ô chuồng
     */
    public boolean updateStable(Stable s) {
        String sql = "UPDATE dbo.Stables SET block_name = ?, status = ? WHERE stall_code = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, s.getBlockName());
            ps.setString(2, s.getStatus());
            ps.setString(3, s.getStallCode());
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    /**
     * Phân bổ / thay đổi chiến mã trong ô chuồng
     */
    public boolean reassignHorseToStall(String stallCode, Integer horseId, String horseName, String breed) {
        try {
            // Lấy stable_id của stall_code
            int stableId = -1;
            String getStableSql = "SELECT stable_id FROM dbo.Stables WHERE stall_code = ?";
            try (PreparedStatement ps = connection.prepareStatement(getStableSql)) {
                ps.setString(1, stallCode);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        stableId = rs.getInt("stable_id");
                    }
                }
            }

            if (stableId == -1) return false;

            if (horseId == null || horseId <= 0) {
                // Làm trống ô chuồng: gỡ stable_id khỏi các ngựa đang ở chuồng này
                String clearSql = "UPDATE dbo.Horses SET stable_id = NULL WHERE stable_id = ?";
                try (PreparedStatement ps = connection.prepareStatement(clearSql)) {
                    ps.setInt(1, stableId);
                    ps.executeUpdate();
                }
                // Cập nhật trạng thái chuồng thành AVAILABLE
                String updateStallSql = "UPDATE dbo.Stables SET status = 'AVAILABLE' WHERE stable_id = ?";
                try (PreparedStatement ps = connection.prepareStatement(updateStallSql)) {
                    ps.setInt(1, stableId);
                    return ps.executeUpdate() > 0;
                }
            } else {
                // Gán ngựa vào ô chuồng
                String assignSql = "UPDATE dbo.Horses SET stable_id = ? WHERE horse_id = ?";
                try (PreparedStatement ps = connection.prepareStatement(assignSql)) {
                    ps.setInt(1, stableId);
                    ps.setInt(2, horseId);
                    ps.executeUpdate();
                }
                // Cập nhật trạng thái chuồng thành OCCUPIED
                String updateStallSql = "UPDATE dbo.Stables SET status = 'OCCUPIED' WHERE stable_id = ?";
                try (PreparedStatement ps = connection.prepareStatement(updateStallSql)) {
                    ps.setInt(1, stableId);
                    return ps.executeUpdate() > 0;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    /**
     * Xóa ô chuồng
     */
    public boolean deleteStable(String stallCode) {
        String unassignHorses = "UPDATE dbo.Horses SET stable_id = NULL WHERE stable_id IN (SELECT stable_id FROM dbo.Stables WHERE stall_code = ?)";
        String deleteSql = "DELETE FROM dbo.Stables WHERE stall_code = ?";
        try {
            try (PreparedStatement ps1 = connection.prepareStatement(unassignHorses)) {
                ps1.setString(1, stallCode);
                ps1.executeUpdate();
            }
            try (PreparedStatement ps2 = connection.prepareStatement(deleteSql)) {
                ps2.setString(1, stallCode);
                return ps2.executeUpdate() > 0;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }
}
