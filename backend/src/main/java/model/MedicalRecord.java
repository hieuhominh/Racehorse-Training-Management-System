package model;

import java.sql.Date;
import java.sql.Timestamp;
import java.util.List;
import java.util.Map;

public class MedicalRecord {
    private int medicalRecordId;
    private int horseId;
    private String horseName;
    private String microchipNumber;
    private int veterinarianId;
    private String veterinarianName;
    private Timestamp examinationDate;
    private String diagnosis;
    private String treatmentPlan;
    private String healthStatus;
    private Date followUpDate;
    private String notes;

    private List<Map<String, Object>> injuries;
    private List<Map<String, Object>> prescriptions;

    public MedicalRecord() {
    }

    public MedicalRecord(int medicalRecordId, int horseId, String horseName, String microchipNumber, 
                         int veterinarianId, String veterinarianName, Timestamp examinationDate, 
                         String diagnosis, String treatmentPlan, String healthStatus, 
                         Date followUpDate, String notes) {
        this.medicalRecordId = medicalRecordId;
        this.horseId = horseId;
        this.horseName = horseName;
        this.microchipNumber = microchipNumber;
        this.veterinarianId = veterinarianId;
        this.veterinarianName = veterinarianName;
        this.examinationDate = examinationDate;
        this.diagnosis = diagnosis;
        this.treatmentPlan = treatmentPlan;
        this.healthStatus = healthStatus;
        this.followUpDate = followUpDate;
        this.notes = notes;
    }

    public int getMedicalRecordId() { return medicalRecordId; }
    public void setMedicalRecordId(int medicalRecordId) { this.medicalRecordId = medicalRecordId; }

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

    public Timestamp getExaminationDate() { return examinationDate; }
    public void setExaminationDate(Timestamp examinationDate) { this.examinationDate = examinationDate; }

    public String getDiagnosis() { return diagnosis; }
    public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }

    public String getTreatmentPlan() { return treatmentPlan; }
    public void setTreatmentPlan(String treatmentPlan) { this.treatmentPlan = treatmentPlan; }

    public String getHealthStatus() { return healthStatus; }
    public void setHealthStatus(String healthStatus) { this.healthStatus = healthStatus; }

    public Date getFollowUpDate() { return followUpDate; }
    public void setFollowUpDate(Date followUpDate) { this.followUpDate = followUpDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public List<Map<String, Object>> getInjuries() { return injuries; }
    public void setInjuries(List<Map<String, Object>> injuries) { this.injuries = injuries; }

    public List<Map<String, Object>> getPrescriptions() { return prescriptions; }
    public void setPrescriptions(List<Map<String, Object>> prescriptions) { this.prescriptions = prescriptions; }
}
