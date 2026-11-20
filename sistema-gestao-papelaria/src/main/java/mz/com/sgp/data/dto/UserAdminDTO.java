package mz.com.sgp.data.dto;

import java.util.List;

public record UserAdminDTO(Long id, String username, String fullName,
                           boolean enabled, boolean admin, List<ModuleDTO> modules) {}