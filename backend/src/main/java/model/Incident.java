package model;

import java.io.Serializable;

public class Incident implements Serializable {
    private String id;
    private String stallCode;
    private String horseName;
    private String chipId;
    private String symptoms;
    private String severity;
    private String description;
    private String imageUrl;
    private String reportedBy;
    private String timestamp;
    private String status;

    public Incident() {
    }

    public Incident(String id, String stallCode, String horseName, String chipId, String symptoms, 
                    String severity, String description, String imageUrl, String reportedBy, 
                    String timestamp, String status) {
        this.id = id;
        this.stallCode = stallCode;
        this.horseName = horseName;
        this.chipId = chipId;
        this.symptoms = symptoms;
        this.severity = severity;
        this.description = description;
        this.imageUrl = imageUrl;
        this.reportedBy = reportedBy;
        this.timestamp = timestamp;
        this.status = status;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getStallCode() { return stallCode; }
    public void setStallCode(String stallCode) { this.stallCode = stallCode; }

    public String getHorseName() { return horseName; }
    public void setHorseName(String horseName) { this.horseName = horseName; }

    public String getChipId() { return chipId; }
    public void setChipId(String chipId) { this.chipId = chipId; }

    public String getSymptoms() { return symptoms; }
    public void setSymptoms(String symptoms) { this.symptoms = symptoms; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getReportedBy() { return reportedBy; }
    public void setReportedBy(String reportedBy) { this.reportedBy = reportedBy; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
