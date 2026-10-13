package model;

import java.sql.Date;

public class HealthSchedule {
    private int healthScheduleId;
    private int horseId;
    private String horseName;
    private String microchipNumber;
    private String scheduleType;
    private Date dueDate;
    private Date completedDate;
    private Integer performedByUserId;
    private String performedByUserName;
    private String notes;
    private String status;
    private Integer daysUntilDue;

    public HealthSchedule() {
    }

    public HealthSchedule(int healthScheduleId, int horseId, String horseName, 
                          String microchipNumber, String scheduleType, Date dueDate, 
                          Date completedDate, Integer performedByUserId, 
                          String performedByUserName, String notes, String status) {
        this.healthScheduleId = healthScheduleId;
        this.horseId = horseId;
        this.horseName = horseName;
        this.microchipNumber = microchipNumber;
        this.scheduleType = scheduleType;
        this.dueDate = dueDate;
        this.completedDate = completedDate;
        this.performedByUserId = performedByUserId;
        this.performedByUserName = performedByUserName;
        this.notes = notes;
        this.status = status;
    }

    public int getHealthScheduleId() { return healthScheduleId; }
    public void setHealthScheduleId(int healthScheduleId) { this.healthScheduleId = healthScheduleId; }

    public int getHorseId() { return horseId; }
    public void setHorseId(int horseId) { this.horseId = horseId; }

    public String getHorseName() { return horseName; }
    public void setHorseName(String horseName) { this.horseName = horseName; }

    public String getMicrochipNumber() { return microchipNumber; }
    public void setMicrochipNumber(String microchipNumber) { this.microchipNumber = microchipNumber; }

    public String getScheduleType() { return scheduleType; }
    public void setScheduleType(String scheduleType) { this.scheduleType = scheduleType; }

    public Date getDueDate() { return dueDate; }
    public void setDueDate(Date dueDate) { this.dueDate = dueDate; }

    public Date getCompletedDate() { return completedDate; }
    public void setCompletedDate(Date completedDate) { this.completedDate = completedDate; }

    public Integer getPerformedByUserId() { return performedByUserId; }
    public void setPerformedByUserId(Integer performedByUserId) { this.performedByUserId = performedByUserId; }

    public String getPerformedByUserName() { return performedByUserName; }
    public void setPerformedByUserName(String performedByUserName) { this.performedByUserName = performedByUserName; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getDaysUntilDue() { return daysUntilDue; }
    public void setDaysUntilDue(Integer daysUntilDue) { this.daysUntilDue = daysUntilDue; }
}
