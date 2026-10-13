package dal;

import model.MedicalLock;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;

public class MedicalLockDAO extends DBContext {

    public List<MedicalLock> getAllLocks() {
        List<MedicalLock> list = new ArrayList<>();
        String sql = "SELECT ml.MedicalLockID, ml.HorseID, h.HorseName, h.MicrochipNumber, "
                   + "ml.VeterinarianID, u1.FullName AS VetName, ml.MedicalRecordID, "
                   + "ml.LockReason, ml.LockedAt, ml.ReleasedAt, ml.ReleasedByVetID, "
                   + "u2.FullName AS ReleasedByVetName, ml.ReleaseNotes, ml.IsActive "
                   + "FROM dbo.MedicalLocks ml "
                   + "INNER JOIN dbo.Horses h ON ml.HorseID = h.HorseID "
                   + "INNER JOIN dbo.Users u1 ON ml.VeterinarianID = u1.UserID "
                   + "LEFT JOIN dbo.Users u2 ON ml.ReleasedByVetID = u2.UserID "
                   + "ORDER BY ml.LockedAt DESC";

        Connection conn = getConnection();
        if (conn == null) return list;

        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                list.add(mapRowToLock(rs));
            }
        } catch (SQLException e) {
            System.err.println("Lỗi getAllLocks: " + e.getMessage());
            e.printStackTrace();
        }
        return list;
    }

    public List<MedicalLock> getLocksByHorseId(int horseId) {
        List<MedicalLock> list = new ArrayList<>();
        String sql = "SELECT ml.MedicalLockID, ml.HorseID, h.HorseName, h.MicrochipNumber, "
                   + "ml.VeterinarianID, u1.FullName AS VetName, ml.MedicalRecordID, "
                   + "ml.LockReason, ml.LockedAt, ml.ReleasedAt, ml.ReleasedByVetID, "
                   + "u2.FullName AS ReleasedByVetName, ml.ReleaseNotes, ml.IsActive "
                   + "FROM dbo.MedicalLocks ml "
                   + "INNER JOIN dbo.Horses h ON ml.HorseID = h.HorseID "
                   + "INNER JOIN dbo.Users u1 ON ml.VeterinarianID = u1.UserID "
                   + "LEFT JOIN dbo.Users u2 ON ml.ReleasedByVetID = u2.UserID "
                   + "WHERE ml.HorseID = ? "
                   + "ORDER BY ml.LockedAt DESC";

        Connection conn = getConnection();
        if (conn == null) return list;

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, horseId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRowToLock(rs));
                }
            }
        } catch (SQLException e) {
            System.err.println("Lỗi getLocksByHorseId: " + e.getMessage());
            e.printStackTrace();
        }
        return list;
    }

    public MedicalLock getActiveLockByHorseId(int horseId) {
        String sql = "SELECT TOP 1 ml.MedicalLockID, ml.HorseID, h.HorseName, h.MicrochipNumber, "
                   + "ml.VeterinarianID, u1.FullName AS VetName, ml.MedicalRecordID, "
                   + "ml.LockReason, ml.LockedAt, ml.ReleasedAt, ml.ReleasedByVetID, "
                   + "u2.FullName AS ReleasedByVetName, ml.ReleaseNotes, ml.IsActive "
                   + "FROM dbo.MedicalLocks ml "
                   + "INNER JOIN dbo.Horses h ON ml.HorseID = h.HorseID "
                   + "INNER JOIN dbo.Users u1 ON ml.VeterinarianID = u1.UserID "
                   + "LEFT JOIN dbo.Users u2 ON ml.ReleasedByVetID = u2.UserID "
                   + "WHERE ml.HorseID = ? AND ml.IsActive = 1 "
                   + "ORDER BY ml.LockedAt DESC";

        Connection conn = getConnection();
        if (conn == null) return null;

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, horseId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRowToLock(rs);
                }
            }
        } catch (SQLException e) {
            System.err.println("Lỗi getActiveLockByHorseId: " + e.getMessage());
            e.printStackTrace();
        }
        return null;
    }

    /**
     * Kích hoạt khóa huấn luyện y tế (Medical Lock)
     * Thao tác atomic: Tạo bản ghi MedicalLocks (IsActive=1) và cập nhật Horses (IsMedicalLocked=1)
     */
    public boolean lockHorse(int horseId, int veterinarianId, Integer medicalRecordId, String lockReason) {
        Connection conn = getConnection();
        if (conn == null) return false;

        String insertLockSql = "INSERT INTO dbo.MedicalLocks (HorseID, VeterinarianID, MedicalRecordID, LockReason, LockedAt, IsActive) "
                             + "VALUES (?, ?, ?, ?, SYSDATETIME(), 1)";
        String updateHorseSql = "UPDATE dbo.Horses SET IsMedicalLocked = 1, HealthStatus = CASE WHEN HealthStatus = 'Eligible' THEN 'Injured' ELSE HealthStatus END WHERE HorseID = ?";

        try {
            conn.setAutoCommit(false);

            try (PreparedStatement psInsert = conn.prepareStatement(insertLockSql, Statement.RETURN_GENERATED_KEYS)) {
                psInsert.setInt(1, horseId);
                psInsert.setInt(2, veterinarianId);
                if (medicalRecordId != null) {
                    psInsert.setInt(3, medicalRecordId);
                } else {
                    psInsert.setNull(3, Types.INTEGER);
                }
                psInsert.setString(4, lockReason);
                psInsert.executeUpdate();
            }

            try (PreparedStatement psUpdate = conn.prepareStatement(updateHorseSql)) {
                psUpdate.setInt(1, horseId);
                psUpdate.executeUpdate();
            }

            conn.commit();
            conn.setAutoCommit(true);
            return true;
        } catch (SQLException e) {
            try {
                conn.rollback();
                conn.setAutoCommit(true);
            } catch (SQLException rollbackEx) {
                rollbackEx.printStackTrace();
            }
            System.err.println("Lỗi lockHorse: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Gỡ bỏ khóa huấn luyện y tế (Unlock Medical Lock)
     * Thao tác atomic: Cập nhật MedicalLocks (IsActive=0, ReleasedAt=now, ReleasedByVetID, ReleaseNotes)
     * và cập nhật Horses (IsMedicalLocked=0)
     */
    public boolean unlockHorse(int horseId, int releasedByVetId, String releaseNotes, String newHealthStatus) {
        Connection conn = getConnection();
        if (conn == null) return false;

        String updateLockSql = "UPDATE dbo.MedicalLocks "
                             + "SET IsActive = 0, ReleasedAt = SYSDATETIME(), ReleasedByVetID = ?, ReleaseNotes = ? "
                             + "WHERE HorseID = ? AND IsActive = 1";
        
        String healthStatusToSet = (newHealthStatus != null && !newHealthStatus.trim().isEmpty()) 
                                   ? newHealthStatus : "Eligible";
        String updateHorseSql = "UPDATE dbo.Horses SET IsMedicalLocked = 0, HealthStatus = ? WHERE HorseID = ?";

        try {
            conn.setAutoCommit(false);

            try (PreparedStatement psLock = conn.prepareStatement(updateLockSql)) {
                psLock.setInt(1, releasedByVetId);
                psLock.setString(2, releaseNotes);
                psLock.setInt(3, horseId);
                psLock.executeUpdate();
            }

            try (PreparedStatement psHorse = conn.prepareStatement(updateHorseSql)) {
                psHorse.setString(1, healthStatusToSet);
                psHorse.setInt(2, horseId);
                psHorse.executeUpdate();
            }

            conn.commit();
            conn.setAutoCommit(true);
            return true;
        } catch (SQLException e) {
            try {
                conn.rollback();
                conn.setAutoCommit(true);
            } catch (SQLException rollbackEx) {
                rollbackEx.printStackTrace();
            }
            System.err.println("Lỗi unlockHorse: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    private MedicalLock mapRowToLock(ResultSet rs) throws SQLException {
        int lockId = rs.getInt("MedicalLockID");
        int horseId = rs.getInt("HorseID");
        String horseName = rs.getString("HorseName");
        String microchip = rs.getString("MicrochipNumber");
        int vetId = rs.getInt("VeterinarianID");
        String vetName = rs.getString("VetName");

        int mRecId = rs.getInt("MedicalRecordID");
        Integer medicalRecordId = rs.wasNull() ? null : mRecId;

        String reason = rs.getString("LockReason");
        Timestamp lockedAt = rs.getTimestamp("LockedAt");
        Timestamp releasedAt = rs.getTimestamp("ReleasedAt");

        int relVetId = rs.getInt("ReleasedByVetID");
        Integer releasedByVetId = rs.wasNull() ? null : relVetId;

        String releasedByVetName = rs.getString("ReleasedByVetName");
        String releaseNotes = rs.getString("ReleaseNotes");
        boolean isActive = rs.getBoolean("IsActive");

        return new MedicalLock(lockId, horseId, horseName, microchip, vetId, vetName, 
                              medicalRecordId, reason, lockedAt, releasedAt, 
                              releasedByVetId, releasedByVetName, releaseNotes, isActive);
    }
}
