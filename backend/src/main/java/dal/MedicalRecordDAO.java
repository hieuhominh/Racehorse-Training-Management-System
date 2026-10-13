package dal;

import model.HealthSchedule;
import model.MedicalRecord;
import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MedicalRecordDAO extends DBContext {

    public List<MedicalRecord> getMedicalRecords(Integer horseId) {
        List<MedicalRecord> list = new ArrayList<>();
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT mr.MedicalRecordID, mr.HorseID, h.HorseName, h.MicrochipNumber, ")
           .append("mr.VeterinarianID, u.FullName AS VetName, mr.ExaminationDate, ")
           .append("mr.Diagnosis, mr.TreatmentPlan, mr.HealthStatus, mr.FollowUpDate, mr.Notes ")
           .append("FROM dbo.MedicalRecords mr ")
           .append("INNER JOIN dbo.Horses h ON mr.HorseID = h.HorseID ")
           .append("INNER JOIN dbo.Users u ON mr.VeterinarianID = u.UserID ");

        if (horseId != null) {
            sql.append("WHERE mr.HorseID = ? ");
        }
        sql.append("ORDER BY mr.ExaminationDate DESC");

        Connection conn = getConnection();
        if (conn == null) return list;

        try (PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            if (horseId != null) {
                ps.setInt(1, horseId);
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    MedicalRecord record = mapRowToMedicalRecord(rs);
                    record.setInjuries(getInjuriesByRecordId(record.getMedicalRecordId()));
                    record.setPrescriptions(getPrescriptionsByRecordId(record.getMedicalRecordId()));
                    list.add(record);
                }
            }
        } catch (SQLException e) {
            System.err.println("Lỗi getMedicalRecords: " + e.getMessage());
            e.printStackTrace();
        }
        return list;
    }

    public MedicalRecord getMedicalRecordById(int recordId) {
        String sql = "SELECT mr.MedicalRecordID, mr.HorseID, h.HorseName, h.MicrochipNumber, "
                   + "mr.VeterinarianID, u.FullName AS VetName, mr.ExaminationDate, "
                   + "mr.Diagnosis, mr.TreatmentPlan, mr.HealthStatus, mr.FollowUpDate, mr.Notes "
                   + "FROM dbo.MedicalRecords mr "
                   + "INNER JOIN dbo.Horses h ON mr.HorseID = h.HorseID "
                   + "INNER JOIN dbo.Users u ON mr.VeterinarianID = u.UserID "
                   + "WHERE mr.MedicalRecordID = ?";

        Connection conn = getConnection();
        if (conn == null) return null;

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, recordId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    MedicalRecord record = mapRowToMedicalRecord(rs);
                    record.setInjuries(getInjuriesByRecordId(record.getMedicalRecordId()));
                    record.setPrescriptions(getPrescriptionsByRecordId(record.getMedicalRecordId()));
                    return record;
                }
            }
        } catch (SQLException e) {
            System.err.println("Lỗi getMedicalRecordById: " + e.getMessage());
            e.printStackTrace();
        }
        return null;
    }

    public List<Map<String, Object>> getInjuriesByRecordId(int recordId) {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = "SELECT InjuryID, MedicalRecordID, HorseID, BodyLocation, InjuryDescription, "
                   + "Severity, InjuryDate, RecoveryStatus, AnatomyModelReference "
                   + "FROM dbo.Injuries WHERE MedicalRecordID = ?";

        Connection conn = getConnection();
        if (conn == null) return list;

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, recordId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("injuryId", rs.getInt("InjuryID"));
                    map.put("bodyLocation", rs.getString("BodyLocation"));
                    map.put("injuryDescription", rs.getString("InjuryDescription"));
                    map.put("severity", rs.getString("Severity"));
                    map.put("injuryDate", rs.getDate("InjuryDate") != null ? rs.getDate("InjuryDate").toString() : null);
                    map.put("recoveryStatus", rs.getString("RecoveryStatus"));
                    map.put("anatomyModelReference", rs.getString("AnatomyModelReference"));
                    list.add(map);
                }
            }
        } catch (SQLException e) {
            System.err.println("Lỗi getInjuriesByRecordId: " + e.getMessage());
            e.printStackTrace();
        }
        return list;
    }

    public List<Map<String, Object>> getPrescriptionsByRecordId(int recordId) {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = "SELECT PrescriptionID, MedicalRecordID, ItemID, MedicineName, Dosage, "
                   + "Frequency, StartDate, EndDate, Instructions "
                   + "FROM dbo.Prescriptions WHERE MedicalRecordID = ?";

        Connection conn = getConnection();
        if (conn == null) return list;

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, recordId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("prescriptionId", rs.getInt("PrescriptionID"));
                    map.put("medicineName", rs.getString("MedicineName"));
                    map.put("dosage", rs.getString("Dosage"));
                    map.put("frequency", rs.getString("Frequency"));
                    map.put("startDate", rs.getDate("StartDate") != null ? rs.getDate("StartDate").toString() : null);
                    map.put("endDate", rs.getDate("EndDate") != null ? rs.getDate("EndDate").toString() : null);
                    map.put("instructions", rs.getString("Instructions"));
                    list.add(map);
                }
            }
        } catch (SQLException e) {
            System.err.println("Lỗi getPrescriptionsByRecordId: " + e.getMessage());
            e.printStackTrace();
        }
        return list;
    }

    /**
     * Lấy danh sách lịch tiêm phòng và chăm sóc định kỳ (Health Schedules: Vaccination, Farrier, Deworming)
     */
    public List<HealthSchedule> getHealthSchedules(Integer horseId, String scheduleType, String status) {
        List<HealthSchedule> list = new ArrayList<>();
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT hs.HealthScheduleID, hs.HorseID, h.HorseName, h.MicrochipNumber, ")
           .append("hs.ScheduleType, hs.DueDate, hs.CompletedDate, hs.PerformedByUserID, ")
           .append("u.FullName AS PerformedByName, hs.Notes, hs.Status, ")
           .append("DATEDIFF(DAY, CONVERT(date, GETDATE()), hs.DueDate) AS DaysUntilDue ")
           .append("FROM dbo.HealthSchedules hs ")
           .append("INNER JOIN dbo.Horses h ON hs.HorseID = h.HorseID ")
           .append("LEFT JOIN dbo.Users u ON hs.PerformedByUserID = u.UserID ")
           .append("WHERE 1=1 ");

        List<Object> params = new ArrayList<>();
        if (horseId != null) {
            sql.append("AND hs.HorseID = ? ");
            params.add(horseId);
        }
        if (scheduleType != null && !scheduleType.trim().isEmpty() && !scheduleType.equalsIgnoreCase("ALL")) {
            sql.append("AND hs.ScheduleType = ? ");
            params.add(scheduleType);
        }
        if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) {
            sql.append("AND hs.Status = ? ");
            params.add(status);
        }
        sql.append("ORDER BY hs.DueDate ASC");

        Connection conn = getConnection();
        if (conn == null) return list;

        try (PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                Object p = params.get(i);
                if (p instanceof Integer) {
                    ps.setInt(i + 1, (Integer) p);
                } else if (p instanceof String) {
                    ps.setString(i + 1, (String) p);
                }
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    HealthSchedule hs = new HealthSchedule(
                        rs.getInt("HealthScheduleID"),
                        rs.getInt("HorseID"),
                        rs.getString("HorseName"),
                        rs.getString("MicrochipNumber"),
                        rs.getString("ScheduleType"),
                        rs.getDate("DueDate"),
                        rs.getDate("CompletedDate"),
                        rs.getInt("PerformedByUserID") == 0 && rs.wasNull() ? null : rs.getInt("PerformedByUserID"),
                        rs.getString("PerformedByName"),
                        rs.getString("Notes"),
                        rs.getString("Status")
                    );
                    hs.setDaysUntilDue(rs.getInt("DaysUntilDue"));
                    list.add(hs);
                }
            }
        } catch (SQLException e) {
            System.err.println("Lỗi getHealthSchedules: " + e.getMessage());
            e.printStackTrace();
        }
        return list;
    }

    /**
     * Lấy chi tiết 1 lịch tiêm phòng/chăm sóc theo ID
     */
    public HealthSchedule getHealthScheduleById(int scheduleId) {
        String sql = "SELECT hs.HealthScheduleID, hs.HorseID, h.HorseName, h.MicrochipNumber, "
                   + "hs.ScheduleType, hs.DueDate, hs.CompletedDate, hs.PerformedByUserID, "
                   + "u.FullName AS PerformedByName, hs.Notes, hs.Status, "
                   + "DATEDIFF(DAY, CONVERT(date, GETDATE()), hs.DueDate) AS DaysUntilDue "
                   + "FROM dbo.HealthSchedules hs "
                   + "INNER JOIN dbo.Horses h ON hs.HorseID = h.HorseID "
                   + "LEFT JOIN dbo.Users u ON hs.PerformedByUserID = u.UserID "
                   + "WHERE hs.HealthScheduleID = ?";

        Connection conn = getConnection();
        if (conn == null) return null;

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, scheduleId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    HealthSchedule hs = new HealthSchedule(
                        rs.getInt("HealthScheduleID"),
                        rs.getInt("HorseID"),
                        rs.getString("HorseName"),
                        rs.getString("MicrochipNumber"),
                        rs.getString("ScheduleType"),
                        rs.getDate("DueDate"),
                        rs.getDate("CompletedDate"),
                        rs.getInt("PerformedByUserID") == 0 && rs.wasNull() ? null : rs.getInt("PerformedByUserID"),
                        rs.getString("PerformedByName"),
                        rs.getString("Notes"),
                        rs.getString("Status")
                    );
                    hs.setDaysUntilDue(rs.getInt("DaysUntilDue"));
                    return hs;
                }
            }
        } catch (SQLException e) {
            System.err.println("Lỗi getHealthScheduleById: " + e.getMessage());
            e.printStackTrace();
        }
        return null;
    }

    private MedicalRecord mapRowToMedicalRecord(ResultSet rs) throws SQLException {
        int recId = rs.getInt("MedicalRecordID");
        int horseId = rs.getInt("HorseID");
        String horseName = rs.getString("HorseName");
        String chip = rs.getString("MicrochipNumber");
        int vetId = rs.getInt("VeterinarianID");
        String vetName = rs.getString("VetName");
        Timestamp examDate = rs.getTimestamp("ExaminationDate");
        String diag = rs.getString("Diagnosis");
        String plan = rs.getString("TreatmentPlan");
        String health = rs.getString("HealthStatus");
        Date followUp = rs.getDate("FollowUpDate");
        String notes = rs.getString("Notes");

        return new MedicalRecord(recId, horseId, horseName, chip, vetId, vetName, examDate, diag, plan, health, followUp, notes);
    }
}
