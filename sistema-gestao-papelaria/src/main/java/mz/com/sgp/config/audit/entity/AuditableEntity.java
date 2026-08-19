package mz.com.sgp.config.audit.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;

@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class AuditableEntity extends StatusEntity {

	private static final long serialVersionUID = 1L;

	@CreatedBy
	@Column(name = "CREATED_BY", updatable = false)
	private String createdBy;

	@LastModifiedBy
	@Column(name = "UPDATED_BY")
	private String updatedBy;

	@CreatedDate
	@Column(name = "CREATED_DATE", updatable = false)
	private LocalDateTime createdDate;

	@LastModifiedDate
	@Column(name = "UPDATED_DATE")
	private LocalDateTime updatedDate;

	// getters
	public String getCreatedBy() {
		return createdBy;
	}

	public String getUpdatedBy() {
		return updatedBy;
	}

	public LocalDateTime getCreatedDate() {
		return createdDate;
	}

	public LocalDateTime getUpdatedDate() {
		return updatedDate;
	}

	// setters se precisares
	protected void setCreatedBy(String createdBy) {
		this.createdBy = createdBy;
	}

	protected void setUpdatedBy(String updatedBy) {
		this.updatedBy = updatedBy;
	}

	protected void setCreatedDate(LocalDateTime createdDate) {
		this.createdDate = createdDate;
	}

	protected void setUpdatedDate(LocalDateTime updatedDate) {
		this.updatedDate = updatedDate;
	}
}
