package mz.com.sgp.model;

import java.io.Serializable;
import java.util.Objects;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import mz.com.sgp.config.audit.entity.AuditableEntity;

@Entity
@Table(name = "CORRECTOR")
public class CorrectorEntity extends AuditableEntity {

	private static final long serialVersionUID = 1L;
	
	@Column(name = "NAME", nullable = false)
	private String name;

	@Column(name = "MODEL", nullable = true)
	private String model;

	@Column(name = "SERIAL_NUMBER", nullable = true)
	private String serialNumber;

	@Column(name = "DOWNLOAD_EXTENSION", nullable = true)
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
	
	@Override
	public boolean equals(Object o) {
		if (o == null || getClass() != o.getClass())
			return false;
		CorrectorEntity that = (CorrectorEntity) o;
		return  Objects.equals(name, that.name)
				&& Objects.equals(model, that.model) && Objects.equals(serialNumber, that.serialNumber)
				&& Objects.equals(downloadExtension, that.downloadExtension);
	}

	@Override
	public int hashCode() {
		return Objects.hash(name, model, serialNumber, downloadExtension);
	}

}
