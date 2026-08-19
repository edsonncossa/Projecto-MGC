package mz.com.sgp.data.dto;

import java.util.Objects;

import mz.com.sgp.config.audit.dto.AuditableDTO;

public class PermissionDTO extends AuditableDTO<PermissionDTO> {

	private static final long serialVersionUID = 1L;

	private String description;

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = super.hashCode();
		result = prime * result + Objects.hash(description);
		return result;
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (!super.equals(obj))
			return false;
		if (getClass() != obj.getClass())
			return false;
		PermissionDTO other = (PermissionDTO) obj;
		return Objects.equals(description, other.description);
	}

}
