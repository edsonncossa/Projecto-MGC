package mz.com.sgp.data.dto;


import mz.com.sgp.model.PermissionEntity;

public record ModuleDTO(Long id, String code, String name, String route, String icon) {
    public static ModuleDTO from(PermissionEntity p) {
        return new ModuleDTO(p.getId(), p.getCode(), p.getDescription(), p.getRoute(), p.getIcon());
    }
}
