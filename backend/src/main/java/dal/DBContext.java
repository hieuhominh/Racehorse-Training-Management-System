package dal;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * Lớp kết nối Cơ sở dữ liệu Microsoft SQL Server 2019 qua JDBC Driver
 * Hỗ trợ cấu hình qua biến môi trường (Environment Variables) và chế độ mô phỏng an toàn khi chưa bật SQL Server.
 */
public class DBContext {
    private static volatile long lastFailedAttemptMs = 0L;
    private static final long RETRY_COOLDOWN_MS = 15_000L;

    protected Connection connection;

    public DBContext() {
        initConnection();
    }

    private void initConnection() {
        if (System.currentTimeMillis() - lastFailedAttemptMs < RETRY_COOLDOWN_MS) {
            return;
        }
        try {
            String serverName = getEnvOrDefault("DB_HOST", "localhost");
            String portNumber = getEnvOrDefault("DB_PORT", "1433");
            String databaseName = getEnvOrDefault("DB_NAME", "RacehorseDB");
            String userID = getEnvOrDefault("DB_USER", "sa");
            String password = getEnvOrDefault("DB_PASSWORD", "Password123@#");

            String url = "jdbc:sqlserver://" + serverName + ":" + portNumber
                    + ";databaseName=" + databaseName
                    + ";encrypt=true;trustServerCertificate=true;loginTimeout=2;";

            Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
            DriverManager.setLoginTimeout(2);
            connection = DriverManager.getConnection(url, userID, password);
        } catch (ClassNotFoundException | SQLException ex) {
            lastFailedAttemptMs = System.currentTimeMillis();
            connection = null;
        }
    }

    private static String getEnvOrDefault(String key, String fallback) {
        String val = System.getenv(key);
        if (val != null && !val.trim().isEmpty()) {
            return val.trim();
        }
        String prop = System.getProperty(key);
        if (prop != null && !prop.trim().isEmpty()) {
            return prop.trim();
        }
        return fallback;
    }

    public boolean hasConnection() {
        try {
            return connection != null && !connection.isClosed();
        } catch (SQLException e) {
            return false;
        }
    }

    public Connection getConnection() {
        return connection;
    }
}
