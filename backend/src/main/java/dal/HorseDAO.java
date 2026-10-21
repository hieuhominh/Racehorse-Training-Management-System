package dal;

import model.Horse;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class HorseDAO extends DBContext {

    public List<Horse> getAllHorses() {
        List<Horse> list = new ArrayList<>();
        String sql = "SELECT horse_id, microchip_id, name, breed, gender, dob, weight_kg, "
                   + "sire_name, dam_name, health_status, is_training_locked FROM dbo.Horses";
        
        try (PreparedStatement ps = connection.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Horse h = new Horse(
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
                list.add(h);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public Horse addHorse(Horse horse) {
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
            ps.setString(9, horse.getHealthStatus() != null ? horse.getHealthStatus() : "ELIGIBLE");
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
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }
}
