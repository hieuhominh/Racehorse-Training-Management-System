package model;

import java.io.Serializable;

public class User implements Serializable {
    private int userId;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private int roleId;
    private String roleCode;
    private String status;

    public User() {
    }

    public User(int userId, String username, String fullName, String email, String phone, int roleId, String roleCode, String status) {
        this.userId = userId;
        this.username = username;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.roleId = roleId;
        this.roleCode = roleCode;
        this.status = status;
    }

    // Getters and Setters
    public int getUserId() { return userId; }
    public void setUserId(int userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public int getRoleId() { return roleId; }
    public void setRoleId(int roleId) { this.roleId = roleId; }

    public String getRoleCode() { return roleCode; }
    public void setRoleCode(String roleCode) { this.roleCode = roleCode; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
