package mz.com.sgp.model;

import java.util.Objects;

import org.springframework.security.core.GrantedAuthority;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import mz.com.sgp.config.audit.entity.AuditableEntity;

@Entity
@Table(name = "PERMISSION")
public class PermissionEntity extends AuditableEntity implements GrantedAuthority {

    private static final long serialVersionUID = 1L;

    /** Nome apresentado ao utilizador, ex.: "Módulo de Consumos" */
    @Column
    private String description;

    /** Identificador estável usado pelo Spring Security, ex.: MODULE_CONSUMPTION */
    @Column(name = "CODE", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "ROUTE", length = 100)
    private String route;

    @Column(name = "ICON", length = 50)
    private String icon;

    @Column(name = "DISPLAY_ORDER")
    private Integer displayOrder;

    @Override
    public String getAuthority() {
        return this.code;
    }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getRoute() { return route; }
    public void setRoute(String route) { this.route = route; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PermissionEntity that = (PermissionEntity) o;
        return Objects.equals(getId(), that.getId()) && Objects.equals(code, that.code);
    }

    @Override
    public int hashCode() {
        return Objects.hash(getId(), code);
    }
}