package mz.com.sgp.data.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.springframework.hateoas.server.core.Relation;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;

import mz.com.sgp.config.audit.dto.AuditableDTO;

@Relation(collectionRelation = "consumptions", itemRelation = "consumption")
public class ConsumptionDTO extends  AuditableDTO<ConsumptionDTO> {
	
	private static final long serialVersionUID = 1L;

	@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @JsonSerialize(using = LocalDateTimeSerializer.class)
    @JsonDeserialize(using = LocalDateTimeDeserializer.class)
	private LocalDateTime consumptionDate;

	private FileImportDTO fileImport;
	
    private Long fileImportId;
	
    private BigDecimal correctedVolume;
	
	private ClientDTO client;
	
	private Long clientId;

	public LocalDateTime getConsumptionDate() {
		return consumptionDate;
	}

	public void setConsumptionDate(LocalDateTime consumptionDate) {
		this.consumptionDate = consumptionDate;
	}

	public FileImportDTO getFileImport() {
		return fileImport;
	}

	public void setFileImport(FileImportDTO fileImport) {
		this.fileImport = fileImport;
	}

	public Long getFileImportId() {
		return fileImportId;
	}

	public void setFileImportId(Long fileImportId) {
		this.fileImportId = fileImportId;
	}

	public BigDecimal getCorrectedVolume() {
		return correctedVolume;
	}

	public void setCorrectedVolume(BigDecimal correctedVolume) {
		this.correctedVolume = correctedVolume;
	}

	public ClientDTO getClient() {
		return client;
	}

	public void setClient(ClientDTO client) {
		this.client = client;
	}

	public Long getClientId() {
		return clientId;
	}

	public void setClientId(Long clientId) {
		this.clientId = clientId;
	}
	

}
