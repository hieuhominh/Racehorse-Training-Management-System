package model;

import java.sql.Timestamp;

public class MedicalLock {
    private int medicalLockId;
    private int horseId;
    private String horseName;
    private String microchipNumber;
    private int veterinarianId;
    private String veterinarianName;
    private Integer medicalRecordId;
    private String lockReason;
    private Timestamp lockedAt;
    private Timestamp releasedAt;
    private Integer releasedByVetId;
    private String releasedByVetName;
    private String releaseNotes;
    private boolean isActive;

    public MedicalLock() {
    }

    public MedicalLock(int medicalLockId, int horseId, String horseName, String microchipNumber, 
                       int veterinarianId, String veterinarianName, Integer medicalRecordId, 
                       String lockReason, Timestamp lockedAt, Timestamp releasedAt, 
                       Integer releasedByVetId, String releasedByVetName, String releaseNotes, 
                       boolean isActive) {
        this.medicalLockId = medicalLockId;
        this.horseId = horseId;
        this.horseName = horseName;
        this.microchipNumber = microchipNumber;
        this.veterinarianId = veterinarianId;
        this.veterinarianName = veterinarianName;
        this.medicalRecordId = medicalRecordId;
        this.lockReason = lockReason;
        this.lockedAt = lockedAt;
        this.releasedAt = releasedAt;
        this.releasedByVetId = releasedByVetId;
        this.releasedByVetName = releasedByVetName;
        this.releaseNotes = releaseNotes;
        this.isActive = isActive;
    }

    // Getters and Setters
    public int getMedicalLockId() { return medicalLockId; }
    public void setMedicalLockId(int medicalLockId) { this.medicalLockId = medicalLockId; }

    public int getHorseId() { return horseId; }
    public void setHorseId(int horseId) { this.horseId = horseId; }

    public String getHorseName() { return horseName; }
    public void setHorseName(String horseName) { this.horseName = horseName; }

    public String getMicrochipNumber() { return microchipNumber; }
    public void setMicrochipNumber(String microchipNumber) { this.microchipNumber = microchipNumber; }

    public int getVeterinarianId() { return veterinarianId; }
    public void setVeterinarianId(int veterinarianId) { this.veterinarianId = veterinarianId; }

    public String getVeterinarianName() { return veterinarianName; }
    public void setVeterinarianName(String veterinarianName) { this.veterinarianName = veterinarianName; }

    public Integer getMedicalRecordId() { return medicalRecordId; }
    public void setMedicalRecordId(Integer medicalRecordId) { this.medicalRecordId = medicalRecordId; }

    public String getLockReason() { return lockReason; }
    public void setLockReason(String lockReason) { this.lockReason = lockReason; }

    public Timestamp getLockedAt() { return lockedAt; }
    public void setLockedAt(Timestamp lockedAt) { this.lockedAt = lockedAt; }

    public Timestamp getReleasedAt() { return releasedAt; }
    public void setReleasedAt(Timestamp releasedAt) { this.releasedAt = releasedAt; }

    public Integer getReleasedByVetId() { return releasedByVetId; }
    public void setReleasedByVetId(Integer releasedByVetId) { this.releasedByVetId = releasedByVetId; }

    public String getReleasedByVetName() { return releasedByVetName; }
    public void setReleasedByVetName(String releasedByVetName) { this.releasedByVetName = releasedByVetName; }

    public String getReleaseNotes() { return releaseNotes; }
    public void setReleaseNotes(String releaseNotes) { this.releaseNotes = releaseNotes; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
}
