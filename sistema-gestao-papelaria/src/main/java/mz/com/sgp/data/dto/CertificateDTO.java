package mz.com.sgp.data.dto;

import java.math.BigDecimal;

public class CertificateDTO {
	
	private String customerName;
    private String monthYear;
    private BigDecimal totalVolumeM3;
    private BigDecimal totalEnergyGj;
    private BigDecimal dailyAvgM3;
    private BigDecimal dailyAvgGj;
    private BigDecimal energyContentMjSm3;

    // Getters e Setters
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getMonthYear() { return monthYear; }
    public void setMonthYear(String monthYear) { this.monthYear = monthYear; }

    public BigDecimal getTotalVolumeM3() { return totalVolumeM3; }
    public void setTotalVolumeM3(BigDecimal totalVolumeM3) { this.totalVolumeM3 = totalVolumeM3; }

    public BigDecimal getTotalEnergyGj() { return totalEnergyGj; }
    public void setTotalEnergyGj(BigDecimal totalEnergyGj) { this.totalEnergyGj = totalEnergyGj; }

    public BigDecimal getDailyAvgM3() { return dailyAvgM3; }
    public void setDailyAvgM3(BigDecimal dailyAvgM3) { this.dailyAvgM3 = dailyAvgM3; }

    public BigDecimal getDailyAvgGj() { return dailyAvgGj; }
    public void setDailyAvgGj(BigDecimal dailyAvgGj) { this.dailyAvgGj = dailyAvgGj; }

    public BigDecimal getEnergyContentMjSm3() { return energyContentMjSm3; }
    public void setEnergyContentMjSm3(BigDecimal energyContentMjSm3) { this.energyContentMjSm3 = energyContentMjSm3; }


}
