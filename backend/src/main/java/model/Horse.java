package model;

import java.sql.Date;

public class Horse {
    private int horseId;
    private String microchipId;
    private String name;
    private String breed;
    private String gender;
    private Date dob;
    private double weightKg;
    private String sireName;
    private String damName;
    private String healthStatus;
    private boolean isTrainingLocked;

    public Horse() {
    }

    public Horse(int horseId, String microchipId, String name, String breed, String gender, 
                 Date dob, double weightKg, String sireName, String damName, 
                 String healthStatus, boolean isTrainingLocked) {
        this.horseId = horseId;
        this.microchipId = microchipId;
        this.name = name;
        this.breed = breed;
        this.gender = gender;
        this.dob = dob;
        this.weightKg = weightKg;
        this.sireName = sireName;
        this.damName = damName;
        this.healthStatus = healthStatus;
        this.isTrainingLocked = isTrainingLocked;
    }

    // Getters and Setters
    public int getHorseId() { return horseId; }
    public void setHorseId(int horseId) { this.horseId = horseId; }

    public String getMicrochipId() { return microchipId; }
    public void setMicrochipId(String microchipId) { this.microchipId = microchipId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getBreed() { return breed; }
    public void setBreed(String breed) { this.breed = breed; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public Date getDob() { return dob; }
    public void setDob(Date dob) { this.dob = dob; }

    public double getWeightKg() { return weightKg; }
    public void setWeightKg(double weightKg) { this.weightKg = weightKg; }

    public String getSireName() { return sireName; }
    public void setSireName(String sireName) { this.sireName = sireName; }

    public String getDamName() { return damName; }
    public void setDamName(String damName) { this.damName = damName; }

    public String getHealthStatus() { return healthStatus; }
    public void setHealthStatus(String healthStatus) { this.healthStatus = healthStatus; }

    public boolean isTrainingLocked() { return isTrainingLocked; }
    public void setTrainingLocked(boolean trainingLocked) { isTrainingLocked = trainingLocked; }
}
