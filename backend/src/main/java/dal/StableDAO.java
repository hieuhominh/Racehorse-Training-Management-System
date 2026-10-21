package dal;

import model.Stable;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class StableDAO extends DBContext {

    public List<Stable> getAllStables() {
        List<Stable> list = new ArrayList<>();
        String sql = "SELECT stable_id, stall_code, block_name, status FROM dbo.Stables ORDER BY stall_code ASC";

        try (PreparedStatement ps = connection.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                list.add(new Stable(
                    rs.getInt("stable_id"),
                    rs.getString("stall_code"),
                    rs.getString("block_name"),
                    rs.getString("status")
                ));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }
}
