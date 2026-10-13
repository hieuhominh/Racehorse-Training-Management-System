package model;

import java.sql.Date;
import java.util.Map;

public class Horse {
    private int horseId;
    private String microchipNumber;
    private String passportNumber;
    private String horseName;
    private Date dateOfBirth;
    private String sex;
    private String breed;
    private String coatColor;
    private Integer sireHorseId;
    private Integer damHorseId;
    private Integer currentStallId;
    private String stallNumber;
    private String barnName;
    private String currentStatus;
    private String healthStatus;
    private boolean isMedicalLocked;
    private String notes;

    // Pedigree details (populated when requested)
    private Horse sire;
    private Horse dam;
    private Map<String, Object> pedigreeTree;

    public Horse() {
    }

    public Horse(int horseId, String microchipNumber, String passportNumber, String horseName, 
                 Date dateOfBirth, String sex, String breed, String coatColor, 
                 Integer sireHorseId, Integer damHorseId, Integer currentStallId, 
                 String stallNumber, String barnName, String currentStatus, 
                 String healthStatus, boolean isMedicalLocked, String notes) {
        this.horseId = horseId;
        this.microchipNumber = microchipNumber;
        this.passportNumber = passportNumber;
        this.horseName = horseName;
        this.dateOfBirth = dateOfBirth;
        this.sex = sex;
        this.breed = breed;
        this.coatColor = coatColor;
        this.sireHorseId = sireHorseId;
        this.damHorseId = damHorseId;
        this.currentStallId = currentStallId;
        this.stallNumber = stallNumber;
        this.barnName = barnName;
        this.currentStatus = currentStatus;
        this.healthStatus = healthStatus;
        this.isMedicalLocked = isMedicalLocked;
        this.notes = notes;
    }

    // Getters and Setters
    public int getHorseId() { return horseId; }
    public void setHorseId(int horseId) { this.horseId = horseId; }

    public String getMicrochipNumber() { return microchipNumber; }
    public void setMicrochipNumber(String microchipNumber) { this.microchipNumber = microchipNumber; }

    public String getPassportNumber() { return passportNumber; }
    public void setPassportNumber(String passportNumber) { this.passportNumber = passportNumber; }

    public String getHorseName() { return horseName; }
    public void setHorseName(String horseName) { this.horseName = horseName; }

    public Date getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(Date dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getSex() { return sex; }
    public void setSex(String sex) { this.sex = sex; }

    public String getBreed() { return breed; }
    public void setBreed(String breed) { this.breed = breed; }

    public String getCoatColor() { return coatColor; }
    public void setCoatColor(String coatColor) { this.coatColor = coatColor; }

    public Integer getSireHorseId() { return sireHorseId; }
    public void setSireHorseId(Integer sireHorseId) { this.sireHorseId = sireHorseId; }

    public Integer getDamHorseId() { return damHorseId; }
    public void setDamHorseId(Integer damHorseId) { this.damHorseId = damHorseId; }

    public Integer getCurrentStallId() { return currentStallId; }
    public void setCurrentStallId(Integer currentStallId) { this.currentStallId = currentStallId; }

    public String getStallNumber() { return stallNumber; }
    public void setStallNumber(String stallNumber) { this.stallNumber = stallNumber; }

    public String getBarnName() { return barnName; }
    public void setBarnName(String barnName) { this.barnName = barnName; }

    public String getCurrentStatus() { return currentStatus; }
    public void setCurrentStatus(String currentStatus) { this.currentStatus = currentStatus; }

    public String getHealthStatus() { return healthStatus; }
    public void setHealthStatus(String healthStatus) { this.healthStatus = healthStatus; }

    public boolean isMedicalLocked() { return isMedicalLocked; }
    public void setMedicalLocked(boolean medicalLocked) { isMedicalLocked = medicalLocked; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Horse getSire() { return sire; }
    public void setSire(Horse sire) { this.sire = sire; }

    public Horse getDam() { return dam; }
    public void setDam(Horse dam) { this.dam = dam; }

    public Map<String, Object> getPedigreeTree() { return pedigreeTree; }
    public void setPedigreeTree(Map<String, Object> pedigreeTree) { this.pedigreeTree = pedigreeTree; }
}
