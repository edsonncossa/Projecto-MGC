package mz.com.sgp.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import mz.com.sgp.model.PermissionEntity;

public interface PermissionRepository extends JpaRepository<PermissionEntity, Long> {

    /** Módulos ativos de um utilizador (ecrã de seleção). */
    @Query(value = """
        SELECT p.*
          FROM permission p
          JOIN user_permission up ON up.id_permission = p.id
          JOIN users u            ON u.id = up.id_user
         WHERE u.user_name = :username
           AND up.status = 1
           AND p.status  = 1
           AND p.code LIKE 'MODULE%'
         ORDER BY p.display_order, p.id
        """, nativeQuery = true)
    List<PermissionEntity> findActiveModulesByUsername(@Param("username") String username);

    /** Todas as permissões ativas de um utilizador (módulos + administração). */
    @Query(value = """
        SELECT p.*
          FROM permission p
          JOIN user_permission up ON up.id_permission = p.id
         WHERE up.id_user = :userId
           AND up.status = 1
           AND p.status  = 1
         ORDER BY p.display_order, p.id
        """, nativeQuery = true)
    List<PermissionEntity> findActiveByUserId(@Param("userId") Long userId);

    @Query("select p from PermissionEntity p where p.status = 1")
    List<PermissionEntity> findAllActive();

    @Query("select p from PermissionEntity p where p.status = 1 and p.code like 'MODULE%' order by p.displayOrder, p.id")
    List<PermissionEntity> findAllActiveModules();
}