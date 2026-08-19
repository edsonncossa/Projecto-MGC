package mz.com.sgp.model;

import java.time.LocalDateTime;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import mz.com.sgp.config.audit.entity.AuditableEntity;

@Entity
@Table(name = "FILE_IMPORT")
public class FileImportEntity extends AuditableEntity {
	
	private static final long serialVersionUID = 1L;
	
	@Column(name = "FILE_NAME", nullable = false)
	private String fileName;
	
	@Column(name = "FILE_DATE", nullable = false)
	private LocalDateTime fileDate;
	
	@Column(name = "IMPORT_DATE", nullable = false)
	private LocalDateTime importDate;
	
	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "CLIENT_ID", insertable = false, updatable = false, nullable = false)
	private ClientEntity client;
	
	@Column(name = "CLIENT_ID", nullable = false)
	private Long clientId;

	public String getFileName() {
		return fileName;
	}

	public void setFileName(String fileName) {
		this.fileName = fileName;
	}
	public LocalDateTime getFileDate() {

		return fileDate;
	}

	public void setFileDate(LocalDateTime fileDate) {
		this.fileDate = fileDate;
	}

	public LocalDateTime getImportDate() {
		return importDate;
	}

	public void setImportDate(LocalDateTime importDate) {
		this.importDate = importDate;
	}


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
	
	@Override
	public boolean equals(Object o) {
		if (o == null || getClass() != o.getClass())
			return false;
		FileImportEntity that = (FileImportEntity) o;
		return  Objects.equals(fileName, that.fileName)
				&& Objects.equals(fileDate, that.fileDate) && Objects.equals(client, that.client)
				&& Objects.equals(importDate, that.importDate) && Objects.equals(clientId, that.clientId);
	}

	@Override
	public int hashCode() {
		return Objects.hash(fileName, fileDate, importDate, clientId);
	}


}
