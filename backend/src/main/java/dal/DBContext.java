package dal;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * Lớp kết nối Cơ sở dữ liệu Microsoft SQL Server 2019 qua JDBC Driver
 * Hỗ trợ JDK 17 và kết nối container Docker trên cổng 1433
 */
public class DBContext {
    protected Connection connection;

    public DBContext() {
        try {
            // Tên server và cổng mặc định của SQL Server
            String serverName = "localhost";
            String portNumber = "1433";
            String databaseName = "RacehorseDB";
            
            // Tài khoản SA mặc định đã cấu hình trong docker-compose.yml
            String userID = "sa";
            String password = "Password123@#";

            // Chuỗi kết nối JDBC cho SQL Server 2019
            // Lưu ý: với JDK 17 cần encrypt=true;trustServerCertificate=true; để tránh lỗi SSL Handshake
            String url = "jdbc:sqlserver://" + serverName + ":" + portNumber 
                    + ";databaseName=" + databaseName 
                    + ";encrypt=true;trustServerCertificate=true;";

            Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
            connection = DriverManager.getConnection(url, userID, password);
        } catch (ClassNotFoundException | SQLException ex) {
            System.err.println("Lỗi kết nối CSDL SQL Server: " + ex.getMessage());
            ex.printStackTrace();
        }
    }

    public Connection getConnection() {
        return connection;
    }

    // Phương thức test kết nối
    public static void main(String[] args) {
        DBContext db = new DBContext();
        if (db.getConnection() != null) {
            System.out.println("Kết nối tới SQL Server 2019 thành công!");
        } else {
            System.out.println("Kết nối thất bại. Hãy kiểm tra container Docker hoặc SQL Server service.");
        }
    }
}
