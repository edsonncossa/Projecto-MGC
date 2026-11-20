package mz.com.sgp.data.dto;

import java.util.List;

public record UserUpdateRequest(String fullName, Boolean enabled, List<Long> permissionIds) {}