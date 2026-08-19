package mz.com.sgp.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import mz.com.sgp.config.audit.entity.AuditableEntity;


@Entity
@Table(name = "CONSUMPTION")
public class ConsumptionEntity extends AuditableEntity {
	
	private static final long serialVersionUID = 1L;
	
	
	@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @JsonSerialize(using = LocalDateTimeSerializer.class)
    @JsonDeserialize(using = LocalDateTimeDeserializer.class)
	@Column(name = "CONSUMPTION_DATE", nullable = false)
    private LocalDateTime consumptionDate;
	
	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "FILE_IMPORT_ID", insertable = false, updatable = false, nullable = false)
	private FileImportEntity fileImport;
	
	@Column(name = "FILE_IMPORT_ID", nullable = false)
    private Long fileImportId;
	
	@Column(name = "CORRECTED_VOLUME", nullable = false)
    private BigDecimal correctedVolume;
	
	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "CLIENT_ID", insertable = false, updatable = false, nullable = false)
	private ClientEntity client;
	
	@Column(name = "CLIENT_ID", nullable = false)
	private Long clientId;

	public ClientEntity getClient() {
		return client;
	}

	public void setClient(ClientEntity client) {
		this.client = client;
	}

	public Long getClientId() {
		return clientId;
	}

	public void setClientId(Long clientId) {
		this.clientId = clientId;
	}

	public LocalDateTime getConsumptionDate() {
		return consumptionDate;
	}

	public void setConsumptionDate(LocalDateTime consumptionDate) {
		this.consumptionDate = consumptionDate;
	}

	public BigDecimal getCorrectedVolume() {
		return correctedVolume;
	}

	public void setCorrectedVolume(BigDecimal correctedVolume) {
		this.correctedVolume = correctedVolume;
	}


	public FileImportEntity getFileImport() {
		return fileImport;
	}

	public void setFileImport(FileImportEntity fileImport) {
		this.fileImport = fileImport;
	}

	public Long getFileImportId() {
		return fileImportId;
	}

	public void setFileImportId(Long fileImportId) {
		this.fileImportId = fileImportId;
	}
	
	@Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ConsumptionEntity that = (ConsumptionEntity) o;
        return 
                Objects.equals(consumptionDate, that.consumptionDate) &&
               Objects.equals(fileImport, that.fileImport) &&
               Objects.equals(fileImportId, that.fileImportId) &&
              Objects.equals(client, that.client) &&
              Objects.equals(clientId, that.clientId) &&
               Objects.equals(correctedVolume, that.correctedVolume);
    }

    @Override
    public int hashCode() {
        return Objects.hash(client,clientId,correctedVolume, consumptionDate, fileImport, fileImportId,client);
    }

}
