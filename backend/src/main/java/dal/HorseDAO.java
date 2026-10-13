package dal;

import model.Horse;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class HorseDAO extends DBContext {

    public List<Horse> getAllHorses() {
        List<Horse> list = new ArrayList<>();
        String sql = "SELECT h.HorseID, h.MicrochipNumber, h.PassportNumber, h.HorseName, "
                   + "h.DateOfBirth, h.Sex, h.Breed, h.CoatColor, h.SireHorseID, h.DamHorseID, "
                   + "h.CurrentStallID, s.StallNumber, b.BarnName, h.CurrentStatus, h.HealthStatus, "
                   + "h.IsMedicalLocked, h.Notes "
                   + "FROM dbo.Horses h "
                   + "LEFT JOIN dbo.Stalls s ON h.CurrentStallID = s.StallID "
                   + "LEFT JOIN dbo.Barns b ON s.BarnID = b.BarnID "
                   + "ORDER BY h.HorseID ASC";
        
        Connection conn = getConnection();
        if (conn == null) {
            return list;
        }

        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                list.add(mapRowToHorse(rs));
            }
        } catch (SQLException e) {
            System.err.println("Lỗi getAllHorses: " + e.getMessage());
            e.printStackTrace();
        }
        return list;
    }

    public Horse getHorseById(int horseId) {
        String sql = "SELECT h.HorseID, h.MicrochipNumber, h.PassportNumber, h.HorseName, "
                   + "h.DateOfBirth, h.Sex, h.Breed, h.CoatColor, h.SireHorseID, h.DamHorseID, "
                   + "h.CurrentStallID, s.StallNumber, b.BarnName, h.CurrentStatus, h.HealthStatus, "
                   + "h.IsMedicalLocked, h.Notes "
                   + "FROM dbo.Horses h "
                   + "LEFT JOIN dbo.Stalls s ON h.CurrentStallID = s.StallID "
                   + "LEFT JOIN dbo.Barns b ON s.BarnID = b.BarnID "
                   + "WHERE h.HorseID = ?";

        Connection conn = getConnection();
        if (conn == null) {
            return null;
        }

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, horseId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRowToHorse(rs);
                }
            }
        } catch (SQLException e) {
            System.err.println("Lỗi getHorseById: " + e.getMessage());
            e.printStackTrace();
        }
        return null;
    }

    public Horse getHorseByMicrochip(String microchipNumber) {
        String sql = "SELECT h.HorseID, h.MicrochipNumber, h.PassportNumber, h.HorseName, "
                   + "h.DateOfBirth, h.Sex, h.Breed, h.CoatColor, h.SireHorseID, h.DamHorseID, "
                   + "h.CurrentStallID, s.StallNumber, b.BarnName, h.CurrentStatus, h.HealthStatus, "
                   + "h.IsMedicalLocked, h.Notes "
                   + "FROM dbo.Horses h "
                   + "LEFT JOIN dbo.Stalls s ON h.CurrentStallID = s.StallID "
                   + "LEFT JOIN dbo.Barns b ON s.BarnID = b.BarnID "
                   + "WHERE h.MicrochipNumber = ?";

        Connection conn = getConnection();
        if (conn == null) {
            return null;
        }

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, microchipNumber);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRowToHorse(rs);
                }
            }
        } catch (SQLException e) {
            System.err.println("Lỗi getHorseByMicrochip: " + e.getMessage());
            e.printStackTrace();
        }
        return null;
    }

    /**
     * Lấy chi tiết hồ sơ phả hệ 3 đời (Pedigree Tree)
     * G1: Ngựa chủ thể
     * G2: Sire (Cha) & Dam (Mẹ)
     * G3: Sire's Sire, Sire's Dam, Dam's Sire, Dam's Dam
     */
    public Horse getHorsePedigree(int horseId) {
        Horse subject = getHorseById(horseId);
        if (subject == null) {
            return null;
        }

        Map<String, Object> g1 = mapHorseToPedigreeNode(subject, "G1", "Chủ thể");

        Horse sire = null;
        if (subject.getSireHorseId() != null) {
            sire = getHorseById(subject.getSireHorseId());
            subject.setSire(sire);
        }

        Horse dam = null;
        if (subject.getDamHorseId() != null) {
            dam = getHorseById(subject.getDamHorseId());
            subject.setDam(dam);
        }

        Map<String, Object> g2 = new HashMap<>();
        Map<String, Object> g3 = new HashMap<>();

        if (sire != null) {
            g2.put("sire", mapHorseToPedigreeNode(sire, "G2", "Cha (Sire)"));

            if (sire.getSireHorseId() != null) {
                Horse sireSire = getHorseById(sire.getSireHorseId());
                if (sireSire != null) {
                    g3.put("sireSire", mapHorseToPedigreeNode(sireSire, "G3", "Ông nội (Sire's Sire)"));
                }
            }
            if (sire.getDamHorseId() != null) {
                Horse sireDam = getHorseById(sire.getDamHorseId());
                if (sireDam != null) {
                    g3.put("sireDam", mapHorseToPedigreeNode(sireDam, "G3", "Bà nội (Sire's Dam)"));
                }
            }
        }

        if (dam != null) {
            g2.put("dam", mapHorseToPedigreeNode(dam, "G2", "Mẹ (Dam)"));

            if (dam.getSireHorseId() != null) {
                Horse damSire = getHorseById(dam.getSireHorseId());
                if (damSire != null) {
                    g3.put("damSire", mapHorseToPedigreeNode(damSire, "G3", "Ông ngoại (Dam's Sire)"));
                }
            }
            if (dam.getDamHorseId() != null) {
                Horse damDam = getHorseById(dam.getDamHorseId());
                if (damDam != null) {
                    g3.put("damDam", mapHorseToPedigreeNode(damDam, "G3", "Bà ngoại (Dam's Dam)"));
                }
            }
        }

        Map<String, Object> pedigree = new HashMap<>();
        pedigree.put("g1", g1);
        pedigree.put("g2", g2);
        pedigree.put("g3", g3);

        subject.setPedigreeTree(pedigree);
        return subject;
    }

    private Map<String, Object> mapHorseToPedigreeNode(Horse h, String gen, String relation) {
        Map<String, Object> node = new HashMap<>();
        node.put("horseId", h.getHorseId());
        node.put("name", h.getHorseName());
        node.put("microchipNumber", h.getMicrochipNumber());
        node.put("passportNumber", h.getPassportNumber());
        node.put("breed", h.getBreed());
        node.put("sex", h.getSex());
        node.put("coatColor", h.getCoatColor());
        node.put("dateOfBirth", h.getDateOfBirth() != null ? h.getDateOfBirth().toString() : null);
        node.put("currentStatus", h.getCurrentStatus());
        node.put("healthStatus", h.getHealthStatus());
        node.put("generation", gen);
        node.put("relation", relation);
        return node;
    }

    private Horse mapRowToHorse(ResultSet rs) throws SQLException {
        int horseId = rs.getInt("HorseID");
        String microchip = rs.getString("MicrochipNumber");
        String passport = rs.getString("PassportNumber");
        String name = rs.getString("HorseName");
        java.sql.Date dob = rs.getDate("DateOfBirth");
        String sex = rs.getString("Sex");
        String breed = rs.getString("Breed");
        String color = rs.getString("CoatColor");
        
        int sId = rs.getInt("SireHorseID");
        Integer sireId = rs.wasNull() ? null : sId;

        int dId = rs.getInt("DamHorseID");
        Integer damId = rs.wasNull() ? null : dId;

        int stId = rs.getInt("CurrentStallID");
        Integer stallId = rs.wasNull() ? null : stId;

        String stallNumber = rs.getString("StallNumber");
        String barnName = rs.getString("BarnName");
        String status = rs.getString("CurrentStatus");
        String health = rs.getString("HealthStatus");
        boolean locked = rs.getBoolean("IsMedicalLocked");
        String notes = rs.getString("Notes");

        return new Horse(horseId, microchip, passport, name, dob, sex, breed, color, 
                         sireId, damId, stallId, stallNumber, barnName, status, health, locked, notes);
    }
}
