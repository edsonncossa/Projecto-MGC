package mz.com.sgp.controllers;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.tags.Tag;
import mz.com.sgp.data.dto.MeDTO;
import mz.com.sgp.model.UserEntity;

@Tag(name = "Session")
@RestController
@RequestMapping("/auth/me")
public class MeController {

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public MeDTO me(Authentication auth) {
        boolean admin = auth.getAuthorities().stream()
                .anyMatch(a -> "ADMIN_USERS".equals(a.getAuthority()));
        String fullName = auth.getPrincipal() instanceof UserEntity u ? u.getFullName() : auth.getName();
        return new MeDTO(auth.getName(), fullName, admin);
    }
}