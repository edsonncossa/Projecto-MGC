package mz.com.sgp.services;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import mz.com.sgp.data.dto.ModuleDTO;
import mz.com.sgp.data.dto.UserAdminDTO;
import mz.com.sgp.data.dto.UserCreateRequest;
import mz.com.sgp.data.dto.UserUpdateRequest;
import mz.com.sgp.exception.BusinessException;
import mz.com.sgp.model.PermissionEntity;
import mz.com.sgp.model.UserEntity;
import mz.com.sgp.repository.PermissionRepository;
import mz.com.sgp.repository.UserRepository;
import mz.com.sgp.security.jwt.PasswordHasher;

@Service
public class UserAdminService {

    public static final String ADMIN_AUTHORITY = "ADMIN_USERS";
    private static final String MODULE_PREFIX = "MODULE";
    private static final Pattern USERNAME = Pattern.compile("^[A-Za-z0-9._-]{3,50}$");
    private static final int MIN_PASSWORD_LENGTH = 8;

    private final UserRepository users;
    private final PermissionRepository permissions;
    private final PasswordHasher hasher;

    public UserAdminService(UserRepository users, PermissionRepository permissions, PasswordHasher hasher) {
        this.users = users;
        this.permissions = permissions;
        this.hasher = hasher;
    }

    // ───────────── Consultas ─────────────

    @Transactional(readOnly = true)
    public List<UserAdminDTO> list() {
        Map<Long, PermissionEntity> active = permissions.findAllActive().stream()
                .collect(Collectors.toMap(PermissionEntity::getId, p -> p));

        Map<Long, List<PermissionEntity>> byUser = new HashMap<>();
        for (Object[] row : users.findActiveLinks()) {
            PermissionEntity p = active.get(((Number) row[1]).longValue());
            if (p != null) {
                byUser.computeIfAbsent(((Number) row[0]).longValue(), k -> new ArrayList<>()).add(p);
            }
        }

        return users.findAllSummaries().stream()
                .map(s -> toDto(s.getId(), s.getUserName(), s.getFullName(), s.getEnabled(),
                        byUser.getOrDefault(s.getId(), List.of())))
                .toList();
    }

    @Transactional(readOnly = true)
    public UserAdminDTO get(Long id) {
        UserEntity u = findUser(id);
        return toDto(u.getId(), u.getUserName(), u.getFullName(), u.getEnabled(),
                permissions.findActiveByUserId(id));
    }

    // ───────────── Criação ─────────────

    @Transactional
    public UserAdminDTO create(UserCreateRequest req) {
        if (req == null) throw bad("Dados do utilizador em falta");

        String username = clean(req.username());
        if (!USERNAME.matcher(username).matches()) {
            throw bad("Username inválido: use 3 a 50 caracteres (letras, números, ponto, hífen ou _)");
        }
        String fullName = clean(req.fullName());
        if (fullName.isEmpty()) throw bad("Indique o nome completo");
        if (req.password() == null || req.password().length() < MIN_PASSWORD_LENGTH) {
            throw bad("A password deve ter pelo menos " + MIN_PASSWORD_LENGTH + " caracteres");
        }
        List<Long> moduleIds = validModuleIds(req.permissionIds());

        if (users.findByUsername(username) != null) {
            throw new BusinessException(HttpStatus.CONFLICT, "Já existe um utilizador com esse username");
        }

        UserEntity entity = new UserEntity();
        entity.setUserName(username);
        entity.setFullName(fullName);
        entity.setPassword(hasher.encode(req.password()));
        entity.setAccountNonExpired(true);
        entity.setAccountNonLocked(true);
        entity.setCredentialsNonExpired(true);
        entity.setEnabled(true);

        UserEntity saved = users.saveAndFlush(entity);
        syncModules(saved.getId(), moduleIds);
        return get(saved.getId());
    }

    // ───────────── Edição ─────────────

    @Transactional
    public UserAdminDTO update(Long id, UserUpdateRequest req) {
        if (req == null) throw bad("Dados em falta");
        UserEntity user = findUser(id);

        boolean changed = false;
        if (req.fullName() != null) {
            String name = clean(req.fullName());
            if (name.isEmpty()) throw bad("Indique o nome completo");
            user.setFullName(name);
            changed = true;
        }
        if (req.enabled() != null) {
            if (!req.enabled() && user.getUserName().equalsIgnoreCase(currentActor())) {
                throw bad("Não pode desativar a sua própria conta");
            }
            user.setEnabled(req.enabled());
            changed = true;
        }
        List<Long> moduleIds = req.permissionIds() == null ? null : validModuleIds(req.permissionIds());

        if (changed) users.saveAndFlush(user);
        if (moduleIds != null) syncModules(id, moduleIds);
        return get(id);
    }

    // ───────────── Auxiliares ─────────────

    /** Garante que o utilizador fica com exatamente estes módulos ativos. O histórico é preservado (status 0). */
    private void syncModules(Long userId, List<Long> moduleIds) {
        String by = currentActor();
        LocalDateTime now = LocalDateTime.now();

        users.revokeModulesNotIn(userId, moduleIds, by, now);
        for (Long permissionId : moduleIds) {
            if (users.countLink(userId, permissionId) == 0) {
                users.insertLink(userId, permissionId, by, now);
            } else {
                users.reactivateLink(userId, permissionId, by, now);
            }
        }
    }

    /** Só aceita IDs de módulos ativos: impede, por exemplo, atribuir ADMIN_USERS por este caminho. */
    private List<Long> validModuleIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) throw bad("Selecione pelo menos um módulo");

        List<Long> distinct = ids.stream().filter(Objects::nonNull).distinct().toList();
        Set<Long> allowed = permissions.findAllActiveModules().stream()
                .map(PermissionEntity::getId).collect(Collectors.toSet());

        if (distinct.isEmpty() || !allowed.containsAll(distinct)) throw bad("Módulo inválido");
        return distinct;
    }

    private UserAdminDTO toDto(Long id, String username, String fullName, Boolean enabled,
                               List<PermissionEntity> active) {
        List<ModuleDTO> modules = active.stream()
                .filter(p -> p.getCode() != null && p.getCode().startsWith(MODULE_PREFIX))
                .sorted(Comparator.comparing(PermissionEntity::getDisplayOrder,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .map(ModuleDTO::from)
                .toList();
        boolean admin = active.stream().anyMatch(p -> ADMIN_AUTHORITY.equals(p.getCode()));
        return new UserAdminDTO(id, username, fullName, Boolean.TRUE.equals(enabled), admin, modules);
    }

    private UserEntity findUser(Long id) {
        return users.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Utilizador não encontrado"));
    }

    private String currentActor() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        return (a != null && a.isAuthenticated() && !(a instanceof AnonymousAuthenticationToken))
                ? a.getName() : "SYSTEM";
    }

    private String clean(String s) {
        return s == null ? "" : s.trim();
    }

    private BusinessException bad(String message) {
        return new BusinessException(HttpStatus.BAD_REQUEST, message);
    }
}