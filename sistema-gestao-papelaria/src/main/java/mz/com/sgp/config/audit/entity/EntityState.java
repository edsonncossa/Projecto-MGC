package mz.com.sgp.config.audit.entity;

import mz.com.sgp.exception.ValidationException;

public enum EntityState {

	INACTIVE, // 0

	ACTIVE; // 1

	public EntityState invert(EntityState status) {
		// verify current is equal to status
		if (!status.equals(this))
			throw new ValidationException("Estado incompatível para inversão.");

		if (INACTIVE.name().equals(name()))
			return ACTIVE;
		else
			return INACTIVE;
	}
}
