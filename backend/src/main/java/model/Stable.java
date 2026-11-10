package model;

import java.io.Serializable;

public class Stable implements Serializable {
    private int stableId;
    private String stallCode;
    private String stall_code;
    private String blockName;
    private String block;
    private String tier;
    private boolean is_vip;
    private String status;
    private String horse;
    private String breed;
    private String area;
    private String dim;
    private String stallImage;
    private String stall_image;
    private String horseAvatar;

    public Stable() {
    }

    public Stable(int stableId, String stallCode, String blockName, String status) {
        this(stableId, stallCode, blockName, status, null, null, null, null, null, null, null, null);
    }

    public Stable(int stableId, String stallCode, String blockName, String status, 
                  String horse, String breed, String area, String dim, String stallImage, String horseAvatar) {
        this(stableId, stallCode, blockName, status, horse, breed, area, dim, stallImage, horseAvatar, null, null);
    }

    public Stable(int stableId, String stallCode, String blockName, String status, 
                  String horse, String breed, String area, String dim, String stallImage, String horseAvatar,
                  String tier, Boolean isVip) {
        this.stableId = stableId;
        this.stallCode = stallCode;
        this.stall_code = stallCode;
        this.blockName = blockName;
        this.block = blockName;
        this.status = status;
        this.horse = horse != null ? horse : "(Trống)";
        this.breed = breed != null ? breed : "Vacant";
        this.area = area != null ? area : "16 m²";
        this.dim = dim != null ? dim : "4.0 x 4.0m";
        this.stallImage = stallImage != null ? stallImage : 
            ("OCCUPIED".equalsIgnoreCase(status) ? "/images/stall_simulation_occupied.jpg" : "/images/stall_simulation_vacant.jpg");
        this.stall_image = this.stallImage;
        this.horseAvatar = horseAvatar;

        if (tier != null && !tier.trim().isEmpty()) {
            this.tier = tier.trim().toUpperCase();
            this.is_vip = "VIP".equalsIgnoreCase(this.tier);
        } else if (isVip != null) {
            this.is_vip = isVip;
            this.tier = isVip ? "VIP" : "STANDARD";
        } else {
            boolean vipInfer = (stallCode != null && (stallCode.toUpperCase().startsWith("A") || stallCode.toUpperCase().startsWith("B") || stallCode.toUpperCase().startsWith("VIP")))
                || (blockName != null && (blockName.toUpperCase().contains("BLOCK A") || blockName.toUpperCase().contains("BLOCK B") || blockName.toUpperCase().contains("VIP")));
            this.is_vip = vipInfer;
            this.tier = vipInfer ? "VIP" : "STANDARD";
        }
    }

    public int getStableId() { return stableId; }
    public void setStableId(int stableId) { this.stableId = stableId; }

    public String getStallCode() { return stallCode; }
    public void setStallCode(String stallCode) { 
        this.stallCode = stallCode; 
        this.stall_code = stallCode;
    }

    public String getStall_code() { return stall_code != null ? stall_code : stallCode; }
    public void setStall_code(String stall_code) {
        this.stall_code = stall_code;
        this.stallCode = stall_code;
    }

    public String getBlockName() { return blockName; }
    public void setBlockName(String blockName) { 
        this.blockName = blockName; 
        this.block = blockName;
    }

    public String getBlock() { return block != null ? block : blockName; }
    public void setBlock(String block) {
        this.block = block;
        this.blockName = block;
    }

    public String getTier() { return tier; }
    public void setTier(String tier) { 
        this.tier = tier; 
        if ("VIP".equalsIgnoreCase(tier)) this.is_vip = true;
        else if ("STANDARD".equalsIgnoreCase(tier)) this.is_vip = false;
    }

    public boolean isIs_vip() { return is_vip; }
    public void setIs_vip(boolean is_vip) { 
        this.is_vip = is_vip; 
        this.tier = is_vip ? "VIP" : "STANDARD";
    }

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
    public void setStallImage(String stallImage) { 
        this.stallImage = stallImage; 
        this.stall_image = stallImage;
    }

    public String getStall_image() { return stall_image != null ? stall_image : stallImage; }
    public void setStall_image(String stall_image) {
        this.stall_image = stall_image;
        this.stallImage = stall_image;
    }

    public String getHorseAvatar() { return horseAvatar; }
    public void setHorseAvatar(String horseAvatar) { this.horseAvatar = horseAvatar; }
}
