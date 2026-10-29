package util;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonSyntaxException;
import model.User;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.BufferedReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Tiện ích Bảo mật trung tâm (Authentication, RBAC, Password Hashing, XSS/SQLi Guard, Safe JSON Response)
 */
public final class SecurityUtil {

    private static final Gson GSON = new Gson();
    private static final String HMAC_ALGO = "HmacSHA256";
    private static final long TOKEN_TTL_MS = 24L * 60 * 60 * 1000; // 24 giờ
    private static final int MAX_BODY_CHARS = 1_048_576; // Giới hạn 1MB tránh DoS

    private static final Pattern XSS_OR_SQLI_PATTERN = Pattern.compile(
        "(?i)(<\\s*script|javascript\\s*:|on(?:error|load|click|mouseover)\\s*=|<\\s*iframe|<\\s*object|"
        + "'\\s*or\\s+'?1'?\\s*=\\s*'?1|;\\s*drop\\s+table|union\\s+all\\s+select|union\\s+select|--\\s*$)"
    );

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
    );

    private static final Pattern STALL_CODE_PATTERN = Pattern.compile(
        "^[A-Za-z0-9_-]{1,10}$"
    );

    private SecurityUtil() {
    }

    private static String getSecretKey() {
        String envKey = System.getenv("APP_JWT_SECRET");
        if (envKey != null && !envKey.trim().isEmpty()) {
            return envKey.trim();
        }
        return "MaTruong_Racehorse_HMAC_Secret_Key_2026_Secure";
    }

    /**
     * Băm mật khẩu bằng SHA-256
     */
    public static String hashPassword(String plainText) {
        if (plainText == null) return "";
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encoded = digest.digest(plainText.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder(2 * encoded.length);
            for (byte b : encoded) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Không thể khởi tạo thuật toán SHA-256", e);
        }
    }

    /**
     * Kiểm tra mật khẩu an toàn (chống Timing Attack, tương thích cả SHA-256 hash và dữ liệu seed SQL)
     */
    public static boolean verifyPassword(String inputPassword, String storedPasswordHash) {
        if (inputPassword == null || inputPassword.isEmpty() || storedPasswordHash == null || storedPasswordHash.isEmpty()) {
            return false;
        }
        String hashedInput = hashPassword(inputPassword);
        if (MessageDigest.isEqual(
                hashedInput.getBytes(StandardCharsets.UTF_8),
                storedPasswordHash.getBytes(StandardCharsets.UTF_8))) {
            return true;
        }
        // Tương thích dữ liệu khởi tạo từ init.sql nếu password_hash trong DB chưa băm
        return storedPasswordHash.length() < 64 && MessageDigest.isEqual(
                inputPassword.getBytes(StandardCharsets.UTF_8),
                storedPasswordHash.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Tạo chữ ký HMAC-SHA256
     */
    private static String signHmac(String payload) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGO);
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                getSecretKey().getBytes(StandardCharsets.UTF_8), HMAC_ALGO
            );
            mac.init(secretKeySpec);
            byte[] rawHmac = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(rawHmac);
        } catch (Exception e) {
            throw new IllegalStateException("Không thể ký token bảo mật", e);
        }
    }

    /**
     * Phát hành Token xác thực có chữ ký HMAC cho người dùng sau khi đăng nhập
     */
    public static String generateToken(User user) {
        if (user == null) return "";
        return generateToken(user.getUserId(), user.getUsername(), user.getRoleCode());
    }

    public static String generateToken(int userId, String username, String roleCode) {
        long expiresAt = System.currentTimeMillis() + TOKEN_TTL_MS;
        String safeRole = roleCode != null ? roleCode.toUpperCase() : "OWNER";
        String rawPayload = userId + ":" + username + ":" + safeRole + ":" + expiresAt;
        String encodedPayload = Base64.getUrlEncoder().withoutPadding()
            .encodeToString(rawPayload.getBytes(StandardCharsets.UTF_8));
        String signature = signHmac(encodedPayload);
        return encodedPayload + "." + signature;
    }

    /**
     * Xác thực và giải mã Token thành đối tượng User
     */
    public static User verifyToken(String token) {
        if (token == null || token.trim().isEmpty()) return null;
        String cleanToken = token.trim();
        if (cleanToken.regionMatches(true, 0, "Bearer ", 0, 7)) {
            cleanToken = cleanToken.substring(7).trim();
        }
        int dotIndex = cleanToken.indexOf('.');
        if (dotIndex <= 0 || dotIndex >= cleanToken.length() - 1) {
            return null;
        }

        String encodedPayload = cleanToken.substring(0, dotIndex);
        String providedSignature = cleanToken.substring(dotIndex + 1);
        String expectedSignature = signHmac(encodedPayload);

        if (!MessageDigest.isEqual(
                providedSignature.getBytes(StandardCharsets.UTF_8),
                expectedSignature.getBytes(StandardCharsets.UTF_8))) {
            return null;
        }

        try {
            String payload = new String(Base64.getUrlDecoder().decode(encodedPayload), StandardCharsets.UTF_8);
            String[] parts = payload.split(":");
            if (parts.length != 4) return null;

            int userId = Integer.parseInt(parts[0]);
            String username = parts[1];
            String roleCode = parts[2];
            long expiresAt = Long.parseLong(parts[3]);

            if (System.currentTimeMillis() > expiresAt) {
                return null;
            }

            return new User(userId, username, username, username + "@matruong.vn", "", 0, roleCode, "ACTIVE");
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Lấy thông tin người dùng đã xác thực từ HttpSession hoặc Authorization Header
     */
    public static User getAuthenticatedUser(HttpServletRequest request) {
        if (request == null) return null;

        HttpSession session = request.getSession(false);
        if (session != null) {
            Object sessionUser = session.getAttribute("currentUser");
            if (sessionUser instanceof User) {
                return (User) sessionUser;
            }
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && !authHeader.trim().isEmpty()) {
            User tokenUser = verifyToken(authHeader);
            if (tokenUser != null) return tokenUser;
        }

        String customToken = request.getHeader("X-Auth-Token");
        if (customToken != null && !customToken.trim().isEmpty()) {
            return verifyToken(customToken);
        }

        return null;
    }

    /**
     * Bắt buộc người dùng phải đăng nhập (trả về 401 nếu chưa đăng nhập)
     */
    public static User requireAuth(HttpServletRequest request, HttpServletResponse response) throws IOException {
        User user = getAuthenticatedUser(request);
        if (user == null) {
            sendJsonError(response, HttpServletResponse.SC_UNAUTHORIZED,
                "Yêu cầu xác thực. Vui lòng đăng nhập để thực hiện thao tác này.");
            return null;
        }
        return user;
    }

    /**
     * Bắt buộc người dùng phải đăng nhập VÀ có một trong các vai trò được phép (trả về 401 hoặc 403)
     */
    public static User requireRole(HttpServletRequest request, HttpServletResponse response, String... allowedRoles)
            throws IOException {
        User user = requireAuth(request, response);
        if (user == null) {
            return null;
        }

        String userRole = user.getRoleCode() != null ? user.getRoleCode().trim().toUpperCase() : "";
        if ("ADMIN".equals(userRole)) {
            userRole = "MANAGER";
        }

        if (allowedRoles == null || allowedRoles.length == 0) {
            return user;
        }

        for (String allowed : allowedRoles) {
            String normalizedAllowed = "ADMIN".equalsIgnoreCase(allowed) ? "MANAGER" : allowed.toUpperCase();
            if (normalizedAllowed.equals(userRole)) {
                return user;
            }
        }

        sendJsonError(response, HttpServletResponse.SC_FORBIDDEN,
            "Bạn không có quyền truy cập tài nguyên này (Yêu cầu quyền: " + String.join(", ", allowedRoles) + ").");
        return null;
    }

    /**
     * Kiểm tra chuỗi có chứa mã độc XSS hoặc SQL Injection hay không
     */
    public static boolean containsMaliciousPayload(String input) {
        if (input == null || input.isEmpty()) return false;
        return XSS_OR_SQLI_PATTERN.matcher(input).find();
    }

    public static boolean isValidEmail(String email) {
        return email != null && EMAIL_PATTERN.matcher(email.trim()).matches();
    }

    public static boolean isValidStallCode(String stallCode) {
        return stallCode != null && STALL_CODE_PATTERN.matcher(stallCode.trim()).matches();
    }

    /**
     * Làm sạch chuỗi đầu vào tránh XSS
     */
    public static String sanitize(String input) {
        if (input == null) return "";
        return input.trim()
            .replace("<", "&lt;")
            .replace(">", "&gt;");
    }

    /**
     * Đọc nội dung JSON body an toàn với giới hạn kích thước
     */
    public static String readBody(HttpServletRequest request) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = request.getReader()) {
            char[] buffer = new char[4096];
            int read;
            int total = 0;
            while ((read = reader.read(buffer)) != -1) {
                total += read;
                if (total > MAX_BODY_CHARS) {
                    throw new IOException("Kích thước dữ liệu gửi lên vượt quá giới hạn cho phép.");
                }
                sb.append(buffer, 0, read);
            }
        }
        return sb.toString();
    }

    /**
     * Phân tích JSON Object an toàn
     */
    public static JsonObject parseJsonObject(HttpServletRequest request) throws IOException {
        String raw = readBody(request);
        if (raw == null || raw.trim().isEmpty()) {
            return null;
        }
        try {
            JsonElement elem = GSON.fromJson(raw, JsonElement.class);
            if (elem != null && elem.isJsonObject()) {
                return elem.getAsJsonObject();
            }
        } catch (JsonSyntaxException ignored) {
        }
        return null;
    }

    public static String getString(JsonObject obj, String key, String defaultVal) {
        if (obj == null || !obj.has(key)) return defaultVal;
        JsonElement el = obj.get(key);
        if (el == null || el.isJsonNull() || !el.isJsonPrimitive()) return defaultVal;
        return el.getAsString();
    }

    public static int getInt(JsonObject obj, String key, int defaultVal) {
        if (obj == null || !obj.has(key)) return defaultVal;
        JsonElement el = obj.get(key);
        if (el == null || el.isJsonNull() || !el.isJsonPrimitive()) return defaultVal;
        try {
            return el.getAsInt();
        } catch (NumberFormatException e) {
            return defaultVal;
        }
    }

    public static double getDouble(JsonObject obj, String key, double defaultVal) {
        if (obj == null || !obj.has(key)) return defaultVal;
        JsonElement el = obj.get(key);
        if (el == null || el.isJsonNull() || !el.isJsonPrimitive()) return defaultVal;
        try {
            return el.getAsDouble();
        } catch (NumberFormatException e) {
            return defaultVal;
        }
    }

    public static boolean getBoolean(JsonObject obj, String key, boolean defaultVal) {
        if (obj == null || !obj.has(key)) return defaultVal;
        JsonElement el = obj.get(key);
        if (el == null || el.isJsonNull() || !el.isJsonPrimitive()) return defaultVal;
        return el.getAsBoolean();
    }

    /**
     * Phản hồi lỗi JSON chuẩn hóa (không nối chuỗi thủ công, chống JSON Injection & rò rỉ StackTrace)
     */
    public static void sendJsonError(HttpServletResponse response, int statusCode, String message) throws IOException {
        response.setStatus(statusCode);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        Map<String, Object> payload = new HashMap<>();
        payload.put("success", false);
        payload.put("error", message != null ? message : "Đã xảy ra lỗi xử lý yêu cầu.");
        response.getWriter().print(GSON.toJson(payload));
        response.getWriter().flush();
    }
}

