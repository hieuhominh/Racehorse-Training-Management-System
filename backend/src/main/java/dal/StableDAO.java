package dal;

import model.Stable;
import util.SecurityUtil;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

public class StableDAO extends DBContext {

    private static final List<Stable> memoryStables = Collections.synchronizedList(new ArrayList<>());
    private static final AtomicInteger stableIdSeq = new AtomicInteger(15);

    static {
        memoryStables.add(new Stable(1, "A1", "Block A", "OCCUPIED", "Xích Thố", "Arabian", "14 m²", "3.8 x 3.8m", "/images/stall_simulation_occupied.jpg", null));
        memoryStables.add(new Stable(2, "A2", "Block A", "OCCUPIED", "Bạch Long", "Thoroughbred", "14 m²", "3.8 x 3.8m", "/images/stall_simulation_occupied.jpg", null));
        memoryStables.add(new Stable(3, "A3", "Block A", "OCCUPIED", "Hắc Phong", "Thoroughbred", "14 m²", "3.8 x 3.8m", "/images/stall_simulation_occupied.jpg", null));
        memoryStables.add(new Stable(4, "A4", "Block A", "OCCUPIED", "Phi Vũ", "Thoroughbred", "14 m²", "3.8 x 3.8m", "/images/stall_simulation_occupied.jpg", null));
        memoryStables.add(new Stable(5, "A5", "Block A", "OCCUPIED", "Phi Yến", "Thoroughbred", "14 m²", "3.8 x 3.8m", "/images/stall_simulation_occupied.jpg", null));
        memoryStables.add(new Stable(6, "A6", "Block A", "OCCUPIED", "Kim Kê", "Quarter Horse", "14 m²", "3.8 x 3.8m", "/images/stall_simulation_occupied.jpg", null));
        memoryStables.add(new Stable(7, "B1", "Block B", "OCCUPIED", "Thanh Vân", "Thoroughbred", "16 m²", "4.0 x 4.0m", "/images/stall_simulation_occupied.jpg", null));
        memoryStables.add(new Stable(8, "B2", "Block B", "OCCUPIED", "Lôi Chấn", "Quarter Horse", "16 m²", "4.0 x 4.0m", "/images/stall_simulation_occupied.jpg", null));
        memoryStables.add(new Stable(9, "B3", "Block B", "OCCUPIED", "Hồng Sa", "Arabian", "16 m²", "4.0 x 4.0m", "/images/stall_simulation_occupied.jpg", null));
        memoryStables.add(new Stable(10, "B4", "Block B", "OCCUPIED", "Thiên Lý", "Thoroughbred", "16 m²", "4.0 x 4.0m", "/images/stall_simulation_occupied.jpg", null));
        memoryStables.add(new Stable(11, "B5", "Block B", "OCCUPIED", "Bảo Mã", "Thoroughbred", "16 m²", "4.0 x 4.0m", "/images/stall_simulation_occupied.jpg", null));
        memoryStables.add(new Stable(12, "B6", "Block B", "AVAILABLE", "(Trống)", "Vacant", "16 m²", "4.0 x 4.0m", "/images/stall_simulation_vacant.jpg", null));
    }

    /**
     * Lấy toàn bộ danh sách ô chuồng kèm thông tin chiến mã đang lưu trú
     */
    public List<Stable> getAllStables() {
        if (hasConnection()) {
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
                return list;
            } catch (SQLException ignored) {
            }
        }

        synchronized (memoryStables) {
            return new ArrayList<>(memoryStables);
        }
    }

    /**
     * Thêm ô chuồng mới
     */
    public boolean addStable(Stable s) {
        if (s == null || !SecurityUtil.isValidStallCode(s.getStallCode())) {
            return false;
        }
        String cleanCode = s.getStallCode().trim().toUpperCase();
        String block = s.getBlockName() != null ? SecurityUtil.sanitize(s.getBlockName()) : "Block C";
        String status = s.getStatus() != null ? SecurityUtil.sanitize(s.getStatus()).toUpperCase() : "AVAILABLE";

        if (hasConnection()) {
            String sql = "INSERT INTO dbo.Stables (stall_code, block_name, status) VALUES (?, ?, ?)";
            try (PreparedStatement ps = connection.prepareStatement(sql)) {
                ps.setString(1, cleanCode);
                ps.setString(2, block);
                ps.setString(3, status);
                return ps.executeUpdate() > 0;
            } catch (SQLException e) {
                return false;
            }
        }

        synchronized (memoryStables) {
            for (Stable item : memoryStables) {
                if (cleanCode.equalsIgnoreCase(item.getStallCode())) {
                    return false;
                }
            }
            s.setStableId(stableIdSeq.incrementAndGet());
            s.setStallCode(cleanCode);
            s.setBlockName(block);
            s.setStatus(status);
            if (s.getHorse() == null || s.getHorse().isEmpty()) {
                s.setHorse("(Trống)");
                s.setBreed("Vacant");
            }
            memoryStables.add(s);
            return true;
        }
    }

    /**
     * Cập nhật thông tin ô chuồng
     */
    public boolean updateStable(Stable s) {
        if (s == null || !SecurityUtil.isValidStallCode(s.getStallCode())) {
            return false;
        }
        String cleanCode = s.getStallCode().trim().toUpperCase();

        if (hasConnection()) {
            String sql = "UPDATE dbo.Stables SET block_name = ?, status = ? WHERE stall_code = ?";
            try (PreparedStatement ps = connection.prepareStatement(sql)) {
                ps.setString(1, SecurityUtil.sanitize(s.getBlockName()));
                ps.setString(2, SecurityUtil.sanitize(s.getStatus()).toUpperCase());
                ps.setString(3, cleanCode);
                return ps.executeUpdate() > 0;
            } catch (SQLException e) {
                return false;
            }
        }

        synchronized (memoryStables) {
            for (Stable item : memoryStables) {
                if (cleanCode.equalsIgnoreCase(item.getStallCode())) {
                    if (s.getBlockName() != null && !s.getBlockName().isEmpty()) {
                        item.setBlockName(SecurityUtil.sanitize(s.getBlockName()));
                    }
                    if (s.getStatus() != null && !s.getStatus().isEmpty()) {
                        item.setStatus(SecurityUtil.sanitize(s.getStatus()).toUpperCase());
                    }
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Phân bổ / thay đổi chiến mã trong ô chuồng
     */
    public boolean reassignHorseToStall(String stallCode, Integer horseId, String horseName, String breed) {
        if (!SecurityUtil.isValidStallCode(stallCode)) {
            return false;
        }
        String cleanCode = stallCode.trim().toUpperCase();

        if (hasConnection()) {
            try {
                int stableId = -1;
                String getStableSql = "SELECT stable_id FROM dbo.Stables WHERE stall_code = ?";
                try (PreparedStatement ps = connection.prepareStatement(getStableSql)) {
                    ps.setString(1, cleanCode);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) {
                            stableId = rs.getInt("stable_id");
                        }
                    }
                }

                if (stableId == -1) return false;

                if (horseId == null || horseId <= 0) {
                    String clearSql = "UPDATE dbo.Horses SET stable_id = NULL WHERE stable_id = ?";
                    try (PreparedStatement ps = connection.prepareStatement(clearSql)) {
                        ps.setInt(1, stableId);
                        ps.executeUpdate();
                    }
                    String updateStallSql = "UPDATE dbo.Stables SET status = 'AVAILABLE' WHERE stable_id = ?";
                    try (PreparedStatement ps = connection.prepareStatement(updateStallSql)) {
                        ps.setInt(1, stableId);
                        return ps.executeUpdate() > 0;
                    }
                } else {
                    String assignSql = "UPDATE dbo.Horses SET stable_id = ? WHERE horse_id = ?";
                    try (PreparedStatement ps = connection.prepareStatement(assignSql)) {
                        ps.setInt(1, stableId);
                        ps.setInt(2, horseId);
                        ps.executeUpdate();
                    }
                    String updateStallSql = "UPDATE dbo.Stables SET status = 'OCCUPIED' WHERE stable_id = ?";
                    try (PreparedStatement ps = connection.prepareStatement(updateStallSql)) {
                        ps.setInt(1, stableId);
                        return ps.executeUpdate() > 0;
                    }
                }
            } catch (SQLException e) {
                return false;
            }
        }

        synchronized (memoryStables) {
            for (Stable item : memoryStables) {
                if (cleanCode.equalsIgnoreCase(item.getStallCode())) {
                    if ((horseId == null || horseId <= 0) && (horseName == null || horseName.trim().isEmpty())) {
                        item.setStatus("AVAILABLE");
                        item.setHorse("(Trống)");
                        item.setBreed("Vacant");
                        item.setStallImage("/images/stall_simulation_vacant.jpg");
                    } else {
                        item.setStatus("OCCUPIED");
                        item.setHorse(horseName != null && !horseName.isEmpty() ? SecurityUtil.sanitize(horseName) : "Chiến mã #" + horseId);
                        item.setBreed(breed != null && !breed.isEmpty() ? SecurityUtil.sanitize(breed) : "Thoroughbred");
                        item.setStallImage("/images/stall_simulation_occupied.jpg");
                    }
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Xóa ô chuồng
     */
    public boolean deleteStable(String stallCode) {
        if (!SecurityUtil.isValidStallCode(stallCode)) {
            return false;
        }
        String cleanCode = stallCode.trim().toUpperCase();

        if (hasConnection()) {
            String unassignHorses = "UPDATE dbo.Horses SET stable_id = NULL WHERE stable_id IN (SELECT stable_id FROM dbo.Stables WHERE stall_code = ?)";
            String deleteSql = "DELETE FROM dbo.Stables WHERE stall_code = ?";
            try {
                try (PreparedStatement ps1 = connection.prepareStatement(unassignHorses)) {
                    ps1.setString(1, cleanCode);
                    ps1.executeUpdate();
                }
                try (PreparedStatement ps2 = connection.prepareStatement(deleteSql)) {
                    ps2.setString(1, cleanCode);
                    return ps2.executeUpdate() > 0;
                }
            } catch (SQLException e) {
                return false;
            }
        }

        synchronized (memoryStables) {
            return memoryStables.removeIf(s -> cleanCode.equalsIgnoreCase(s.getStallCode()));
        }
    }
}
