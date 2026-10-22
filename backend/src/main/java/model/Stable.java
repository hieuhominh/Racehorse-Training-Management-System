package model;

import java.io.Serializable;

public class Stable implements Serializable {
    private int stableId;
    private String stallCode;
    private String blockName;
    private String status;
    private String horse;
    private String breed;
    private String area;
    private String dim;
    private String stallImage;
    private String horseAvatar;

    public Stable() {
    }

    public Stable(int stableId, String stallCode, String blockName, String status) {
        this.stableId = stableId;
        this.stallCode = stallCode;
        this.blockName = blockName;
        this.status = status;
        this.area = "16 m²";
        this.dim = "4.0 x 4.0m";
        this.stallImage = "OCCUPIED".equalsIgnoreCase(status) 
            ? "/images/stall_simulation_occupied.jpg" 
            : "/images/stall_simulation_vacant.jpg";
    }

    public Stable(int stableId, String stallCode, String blockName, String status, 
                  String horse, String breed, String area, String dim, String stallImage, String horseAvatar) {
        this.stableId = stableId;
        this.stallCode = stallCode;
        this.blockName = blockName;
        this.status = status;
        this.horse = horse;
        this.breed = breed;
        this.area = area != null ? area : "16 m²";
        this.dim = dim != null ? dim : "4.0 x 4.0m";
        this.stallImage = stallImage != null ? stallImage : 
            ("OCCUPIED".equalsIgnoreCase(status) ? "/images/stall_simulation_occupied.jpg" : "/images/stall_simulation_vacant.jpg");
        this.horseAvatar = horseAvatar;
    }

    public int getStableId() { return stableId; }
    public void setStableId(int stableId) { this.stableId = stableId; }

    public String getStallCode() { return stallCode; }
    public void setStallCode(String stallCode) { this.stallCode = stallCode; }

    public String getBlockName() { return blockName; }
    public void setBlockName(String blockName) { this.blockName = blockName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getHorse() { return horse; }
    public void setHorse(String horse) { this.horse = horse; }

    public String getBreed() { return breed; }
    public void setBreed(String breed) { this.breed = breed; }

    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }

    public String getDim() { return dim; }
    public void setDim(String dim) { this.dim = dim; }

    public String getStallImage() { return stallImage; }
    public void setStallImage(String stallImage) { this.stallImage = stallImage; }

    public String getHorseAvatar() { return horseAvatar; }
    public void setHorseAvatar(String horseAvatar) { this.horseAvatar = horseAvatar; }
}
