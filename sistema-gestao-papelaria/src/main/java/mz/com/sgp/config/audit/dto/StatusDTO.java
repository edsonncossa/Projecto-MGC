package mz.com.sgp.config.audit.dto;

import java.util.Objects;

import org.springframework.hateoas.RepresentationModel;

import mz.com.sgp.config.audit.entity.EntityState;

public abstract class StatusDTO<T extends RepresentationModel<T>> extends BaseDTO<T> {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	private EntityState status = EntityState.ACTIVE;

	public EntityState getStatus() {
		return status;
	}

	public void setStatus(EntityState status) {
		this.status = status;
	}

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = super.hashCode();
		result = prime * result + Objects.hash(status);
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
		StatusDTO other = (StatusDTO) obj;
		return status == other.status;
	}

}
