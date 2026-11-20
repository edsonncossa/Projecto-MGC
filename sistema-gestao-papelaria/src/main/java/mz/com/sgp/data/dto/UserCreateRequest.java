package mz.com.sgp.data.dto;

import java.util.List;

public record UserCreateRequest(String username, String fullName, String password, List<Long> permissionIds) {}