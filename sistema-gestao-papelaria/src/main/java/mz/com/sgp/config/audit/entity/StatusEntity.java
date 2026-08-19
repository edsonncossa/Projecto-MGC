package mz.com.sgp.config.audit.entity;

import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.MappedSuperclass;

@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class StatusEntity extends BaseEntity {

	private static final long serialVersionUID = 1L;

	@Column(name = "STATUS")
	@Enumerated(EnumType.ORDINAL)
	private EntityState status = EntityState.ACTIVE;

	public EntityState getStatus() {
		return status;
	}

	public void setStatus(EntityState status) {
		this.status = status;
	}

}
