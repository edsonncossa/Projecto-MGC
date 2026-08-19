package mz.com.sgp.data.dto;

import org.springframework.hateoas.server.core.Relation;

import jakarta.persistence.Column;
import mz.com.sgp.config.audit.dto.AuditableDTO;

@Relation(collectionRelation = "correctors", itemRelation = "corrector")
public class CorrectorDTO extends  AuditableDTO<CorrectorDTO> {
	
	private static final long serialVersionUID = 1L;
	
	private String name;

	private String model;

	private String serialNumber;

	private String downloadExtension;

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getModel() {
		return model;
	}

	public void setModel(String model) {
		this.model = model;
	}

	public String getSerialNumber() {
		return serialNumber;
	}

	public void setSerialNumber(String serialNumber) {
		this.serialNumber = serialNumber;
	}

	public String getDownloadExtension() {
		return downloadExtension;
	}

	public void setDownloadExtension(String downloadExtension) {
		this.downloadExtension = downloadExtension;
	}

}
