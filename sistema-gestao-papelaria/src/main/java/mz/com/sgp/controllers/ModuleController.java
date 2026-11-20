package mz.com.sgp.controllers;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.tags.Tag;
import mz.com.sgp.data.dto.ModuleDTO;
import mz.com.sgp.repository.PermissionRepository;

@Tag(name = "Modules")
@RestController
@RequestMapping("/auth/modules")
public class ModuleController {

    private final PermissionRepository permissionRepository;

    public ModuleController(PermissionRepository permissionRepository) {
        this.permissionRepository = permissionRepository;
    }

    /** Módulos do utilizador autenticado: alimenta o ecrã de seleção. */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<ModuleDTO> myModules(Authentication auth) {
        return permissionRepository.findActiveModulesByUsername(auth.getName())
                .stream().map(ModuleDTO::from).toList();
    }

    /** Todos os módulos ativos: alimenta o formulário de criação/edição de utilizadores. */
    @GetMapping("/all")
    @PreAuthorize("hasAuthority('ADMIN_USERS')")
    public List<ModuleDTO> all() {
        return permissionRepository.findAllActiveModules()
                .stream().map(ModuleDTO::from).toList();
    }
}