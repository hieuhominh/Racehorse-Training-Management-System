package dal;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * Lớp kết nối Cơ sở dữ liệu PostgreSQL (mặc định) hoặc Microsoft SQL Server qua JDBC Driver
 * Hỗ trợ cấu hình linh hoạt qua biến môi trường (Environment Variables) hoặc System Properties.
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
            String dbType = getEnvOrDefault("DB_TYPE", "postgres"); // postgres hoặc sqlserver
            String serverName = getEnvOrDefault("DB_HOST", "localhost");
            String databaseName = getEnvOrDefault("DB_NAME", "RacehorseDB");

            if ("sqlserver".equalsIgnoreCase(dbType)) {
                String portNumber = getEnvOrDefault("DB_PORT", "1433");
                String userID = getEnvOrDefault("DB_USER", "sa");
                String password = getEnvOrDefault("DB_PASSWORD", "Password123@#");

                String url = "jdbc:sqlserver://" + serverName + ":" + portNumber
                        + ";databaseName=" + databaseName
                        + ";encrypt=true;trustServerCertificate=true;loginTimeout=2;";

                Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
                DriverManager.setLoginTimeout(2);
                connection = DriverManager.getConnection(url, userID, password);
            } else {
                // Mặc định kết nối PostgreSQL 14+ / 16 / 18
                String portNumber = getEnvOrDefault("DB_PORT", "5432");
                String userID = getEnvOrDefault("DB_USER", "postgres");
                String password = getEnvOrDefault("DB_PASSWORD", "postgres");

                String url = "jdbc:postgresql://" + serverName + ":" + portNumber + "/" + databaseName
                        + "?currentSchema=dbo,public&connectTimeout=2";

                Class.forName("org.postgresql.Driver");
                DriverManager.setLoginTimeout(2);
                try {
                    connection = DriverManager.getConnection(url, userID, password);
                } catch (SQLException ex) {
                    // Thử một số mật khẩu phổ biến nếu DB_PASSWORD chưa set
                    String[] fallbackPasswords = new String[]{"123456", "admin", "root", "123", ""};
                    for (String fbPass : fallbackPasswords) {
                        try {
                            connection = DriverManager.getConnection(url, userID, fbPass);
                            if (connection != null && !connection.isClosed()) {
                                break;
                            }
                        } catch (SQLException ignored) {
                        }
                    }
                    if (connection == null) {
                        throw ex;
                    }
                }
            }
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
