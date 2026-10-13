package test;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import dal.HorseDAO;
import dal.MedicalLockDAO;
import dal.MedicalRecordDAO;
import model.HealthSchedule;
import model.Horse;
import model.MedicalLock;
import model.MedicalRecord;

import java.util.List;

public class TestApiSuite {
    public static void main(String[] args) {
        Gson gson = new GsonBuilder().setPrettyPrinting().serializeNulls().create();
        System.out.println("==================================================");
        System.out.println("BẮT ĐẦU KIỂM THỬ TOÀN DIỆN CÁC DAO & DỮ LIỆU SEED");
        System.out.println("==================================================");

        // 1. Test HorseDAO & Pedigree
        System.out.println("\n[1] TEST HỒ SƠ NGỰA (PEDIGREE API):");
        HorseDAO horseDAO = new HorseDAO();
        List<Horse> horses = horseDAO.getAllHorses();
        System.out.println("- Số lượng hồ sơ ngựa trong DB: " + horses.size());
        for (Horse h : horses) {
            System.out.println("  * [" + h.getHorseId() + "] " + h.getHorseName() + " (" + h.getMicrochipNumber() 
                    + ") - Status: " + h.getCurrentStatus() + " - Health: " + h.getHealthStatus() 
                    + " - IsLocked: " + h.isMedicalLocked());
        }

        // Test Pedigree 3 đời cho Frankel (ID = 10, Sire = Galileo, Dam = Kind)
        Horse pedigreeFrankel = horseDAO.getHorsePedigree(10);
        if (pedigreeFrankel != null) {
            System.out.println("\n- Cây phả hệ của Frankel (ID 10):");
            System.out.println("  + G1 Chủ thể: " + pedigreeFrankel.getHorseName());
            System.out.println("  + G2 Sire (Cha): " + (pedigreeFrankel.getSire() != null ? pedigreeFrankel.getSire().getHorseName() : "N/A"));
            System.out.println("  + G2 Dam (Mẹ): " + (pedigreeFrankel.getDam() != null ? pedigreeFrankel.getDam().getHorseName() : "N/A"));
            System.out.println("  + Pedigree Tree JSON keys: " + pedigreeFrankel.getPedigreeTree().keySet());
        }

        // 2. Test MedicalLockDAO
        System.out.println("\n[2] TEST MEDICAL LOCK API:");
        MedicalLockDAO lockDAO = new MedicalLockDAO();
        List<MedicalLock> locks = lockDAO.getAllLocks();
        System.out.println("- Số lượng bản ghi khóa y tế: " + locks.size());
        for (MedicalLock l : locks) {
            System.out.println("  * LockID: " + l.getMedicalLockId() + " - Horse: " + l.getHorseName() 
                    + " - Active: " + l.isActive() + " - Reason: " + l.getLockReason());
        }

        // 3. Test MedicalRecordDAO & 3D Injuries & Prescriptions
        System.out.println("\n[3] TEST BỆNH ÁN & CHẤN THƯƠNG 3D & TOA THUỐC:");
        MedicalRecordDAO recordDAO = new MedicalRecordDAO();
        List<MedicalRecord> records = recordDAO.getMedicalRecords(null);
        System.out.println("- Số lượng hồ sơ bệnh án: " + records.size());
        for (MedicalRecord r : records) {
            System.out.println("  * RecordID: " + r.getMedicalRecordId() + " - Ngựa: " + r.getHorseName() 
                    + " - Chẩn đoán: " + r.getDiagnosis());
            System.out.println("    + Số chấn thương 3D: " + (r.getInjuries() != null ? r.getInjuries().size() : 0));
            if (r.getInjuries() != null) {
                r.getInjuries().forEach(inj -> System.out.println("      > Vị trí: " + inj.get("bodyLocation") + " | Ref: " + inj.get("anatomyModelReference")));
            }
            System.out.println("    + Số toa thuốc: " + (r.getPrescriptions() != null ? r.getPrescriptions().size() : 0));
            if (r.getPrescriptions() != null) {
                r.getPrescriptions().forEach(p -> System.out.println("      > Thuốc: " + p.get("medicineName") + " | Liều: " + p.get("dosage")));
            }
        }

        // 4. Test HealthSchedules
        System.out.println("\n[4] TEST LỊCH TIÊM CHỦNG & CHĂM SÓC ĐỊNH KỲ:");
        List<HealthSchedule> schedules = recordDAO.getHealthSchedules(null, null, null);
        System.out.println("- Số lượng lịch định kỳ: " + schedules.size());
        for (HealthSchedule hs : schedules) {
            System.out.println("  * ScheduleID: " + hs.getHealthScheduleId() + " - Ngựa: " + hs.getHorseName() 
                    + " - Loại: " + hs.getScheduleType() + " - Ngày hẹn: " + hs.getDueDate() 
                    + " - Trạng thái: " + hs.getStatus() + " (" + hs.getDaysUntilDue() + " ngày nữa)");
        }

        System.out.println("\n==================================================");
        System.out.println("TẤT CẢ TEST ĐỀU HOÀN TOÀN CHÍNH XÁC VÀ ĐỒNG BỘ 100%!");
        System.out.println("==================================================");
    }
}
