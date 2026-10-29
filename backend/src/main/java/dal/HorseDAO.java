package dal;

import model.Horse;
import util.SecurityUtil;

import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

public class HorseDAO extends DBContext {

    private static final List<Horse> memoryHorses = Collections.synchronizedList(new ArrayList<>());
    private static final AtomicInteger horseIdSeq = new AtomicInteger(10);

    static {
        memoryHorses.add(new Horse(1, "MC-VN-2022-001", "Hắc Phong", "Thoroughbred", "STALLION", Date.valueOf("2022-03-15"), 485.5, "Đại Phong Sơn", "Bạch Ngọc", "WATCH", false));
        memoryHorses.add(new Horse(2, "MC-VN-2021-014", "Xích Thố", "Arabian", "GELDING", Date.valueOf("2021-05-20"), 510.0, "Hỏa Long", "Hồng Đào", "ELIGIBLE", false));
        memoryHorses.add(new Horse(3, "MC-VN-2023-009", "Phi Yến", "Thoroughbred", "MARE", Date.valueOf("2023-01-10"), 460.0, "Bão Táp", "Yến Nhi", "INJURED", true));
        memoryHorses.add(new Horse(4, "MC-VN-2022-088", "Lôi Chấn", "Quarter Horse", "STALLION", Date.valueOf("2022-08-04"), 525.0, "Sấm Sét", "Ngân Hà", "ELIGIBLE", false));
        memoryHorses.add(new Horse(5, "MC-VN-2024-003", "Bạch Long", "Thoroughbred", "STALLION", Date.valueOf("2023-02-12"), 495.0, "Galileo", "Danehill", "ELIGIBLE", false));
    }

    private static String normalizeGender(String rawGender) {
        if (rawGender == null) return "STALLION";
        String upper = rawGender.trim().toUpperCase();
        if (upper.contains("MARE") || upper.contains("CÁI")) return "MARE";
        if (upper.contains("GELDING") || upper.contains("THIẾN")) return "GELDING";
        return "STALLION";
    }

    public List<Horse> getAllHorses() {
        if (hasConnection()) {
            List<Horse> list = new ArrayList<>();
            String sql = "SELECT horse_id, microchip_id, name, breed, gender, dob, weight_kg, "
                       + "sire_name, dam_name, health_status, is_training_locked FROM dbo.Horses ORDER BY horse_id ASC";

            try (PreparedStatement ps = connection.prepareStatement(sql);
                 ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(new Horse(
                        rs.getInt("horse_id"),
                        rs.getString("microchip_id"),
                        rs.getString("name"),
                        rs.getString("breed"),
                        rs.getString("gender"),
                        rs.getDate("dob"),
                        rs.getDouble("weight_kg"),
                        rs.getString("sire_name"),
                        rs.getString("dam_name"),
                        rs.getString("health_status"),
                        rs.getBoolean("is_training_locked")
                    ));
                }
                return list;
            } catch (SQLException ignored) {
            }
        }

        synchronized (memoryHorses) {
            return new ArrayList<>(memoryHorses);
        }
    }

    public Horse getHorseById(int id) {
        if (id <= 0) return null;

        if (hasConnection()) {
            String sql = "SELECT horse_id, microchip_id, name, breed, gender, dob, weight_kg, "
                       + "sire_name, dam_name, health_status, is_training_locked FROM dbo.Horses WHERE horse_id = ?";
            try (PreparedStatement ps = connection.prepareStatement(sql)) {
                ps.setInt(1, id);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        return new Horse(
                            rs.getInt("horse_id"),
                            rs.getString("microchip_id"),
                            rs.getString("name"),
                            rs.getString("breed"),
                            rs.getString("gender"),
                            rs.getDate("dob"),
                            rs.getDouble("weight_kg"),
                            rs.getString("sire_name"),
                            rs.getString("dam_name"),
                            rs.getString("health_status"),
                            rs.getBoolean("is_training_locked")
                        );
                    }
                    return null;
                }
            } catch (SQLException ignored) {
            }
        }

        synchronized (memoryHorses) {
            for (Horse h : memoryHorses) {
                if (h.getHorseId() == id) {
                    return h;
                }
            }
        }
        return null;
    }

    public Horse addHorse(Horse horse) {
        if (horse == null || horse.getName() == null || horse.getName().trim().isEmpty()
                || horse.getMicrochipId() == null || horse.getMicrochipId().trim().isEmpty()) {
            return null;
        }

        horse.setName(SecurityUtil.sanitize(horse.getName()));
        horse.setMicrochipId(SecurityUtil.sanitize(horse.getMicrochipId()));
        horse.setBreed(horse.getBreed() != null ? SecurityUtil.sanitize(horse.getBreed()) : "Thoroughbred");
        horse.setGender(normalizeGender(horse.getGender()));
        if (horse.getWeightKg() <= 0) {
            horse.setWeightKg(485.0);
        }
        if (horse.getDob() == null) {
            horse.setDob(Date.valueOf("2023-01-01"));
        }
        if (horse.getHealthStatus() == null || horse.getHealthStatus().trim().isEmpty()) {
            horse.setHealthStatus("ELIGIBLE");
        }

        if (hasConnection()) {
            String sql = "INSERT INTO dbo.Horses (microchip_id, name, breed, gender, dob, weight_kg, sire_name, dam_name, health_status, is_training_locked) "
                       + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            try (PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
                ps.setString(1, horse.getMicrochipId());
                ps.setString(2, horse.getName());
                ps.setString(3, horse.getBreed());
                ps.setString(4, horse.getGender());
                ps.setDate(5, horse.getDob());
                ps.setDouble(6, horse.getWeightKg());
                ps.setString(7, horse.getSireName());
                ps.setString(8, horse.getDamName());
                ps.setString(9, horse.getHealthStatus());
                ps.setBoolean(10, horse.isTrainingLocked());

                int affected = ps.executeUpdate();
                if (affected > 0) {
                    try (ResultSet gk = ps.getGeneratedKeys()) {
                        if (gk.next()) {
                            horse.setHorseId(gk.getInt(1));
                            return horse;
                        }
                    }
                }
                return null;
            } catch (SQLException e) {
                return null;
            }
        }

        synchronized (memoryHorses) {
            for (Horse existing : memoryHorses) {
                if (horse.getMicrochipId().equalsIgnoreCase(existing.getMicrochipId())) {
                    return null;
                }
            }
            horse.setHorseId(horseIdSeq.incrementAndGet());
            memoryHorses.add(horse);
            return horse;
        }
    }

    public boolean updateHorse(Horse horse) {
        if (horse == null || horse.getHorseId() <= 0) return false;
        horse.setName(SecurityUtil.sanitize(horse.getName()));
        horse.setBreed(SecurityUtil.sanitize(horse.getBreed()));
        horse.setGender(normalizeGender(horse.getGender()));

        if (hasConnection()) {
            String sql = "UPDATE dbo.Horses SET name = ?, breed = ?, gender = ?, weight_kg = ?, "
                       + "sire_name = ?, dam_name = ?, health_status = ?, is_training_locked = ? "
                       + "WHERE horse_id = ?";
            try (PreparedStatement ps = connection.prepareStatement(sql)) {
                ps.setString(1, horse.getName());
                ps.setString(2, horse.getBreed());
                ps.setString(3, horse.getGender());
                ps.setDouble(4, horse.getWeightKg());
                ps.setString(5, horse.getSireName());
                ps.setString(6, horse.getDamName());
                ps.setString(7, horse.getHealthStatus());
                ps.setBoolean(8, horse.isTrainingLocked());
                ps.setInt(9, horse.getHorseId());
                return ps.executeUpdate() > 0;
            } catch (SQLException e) {
                return false;
            }
        }

        synchronized (memoryHorses) {
            for (int i = 0; i < memoryHorses.size(); i++) {
                if (memoryHorses.get(i).getHorseId() == horse.getHorseId()) {
                    memoryHorses.set(i, horse);
                    return true;
                }
            }
        }
        return false;
    }

    public boolean toggleLock(int horseId, boolean locked) {
        if (horseId <= 0) return false;

        if (hasConnection()) {
            String sql = "UPDATE dbo.Horses SET is_training_locked = ? WHERE horse_id = ?";
            try (PreparedStatement ps = connection.prepareStatement(sql)) {
                ps.setBoolean(1, locked);
                ps.setInt(2, horseId);
                return ps.executeUpdate() > 0;
            } catch (SQLException e) {
                return false;
            }
        }

        synchronized (memoryHorses) {
            for (Horse h : memoryHorses) {
                if (h.getHorseId() == horseId) {
                    h.setTrainingLocked(locked);
                    h.setHealthStatus(locked ? "INJURED" : "ELIGIBLE");
                    return true;
                }
            }
        }
        return false;
    }

    public boolean deleteHorse(int horseId) {
        if (horseId <= 0) return false;

        if (hasConnection()) {
            String sql = "DELETE FROM dbo.Horses WHERE horse_id = ?";
            try (PreparedStatement ps = connection.prepareStatement(sql)) {
                ps.setInt(1, horseId);
                return ps.executeUpdate() > 0;
            } catch (SQLException e) {
                return false;
            }
        }

        synchronized (memoryHorses) {
            return memoryHorses.removeIf(h -> h.getHorseId() == horseId);
        }
    }
}
