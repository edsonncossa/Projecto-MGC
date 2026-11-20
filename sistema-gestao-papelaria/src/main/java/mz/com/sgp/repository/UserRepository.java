package mz.com.sgp.repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import mz.com.sgp.model.UserEntity;

public interface UserRepository extends JpaRepository<UserEntity, Long> {

    @Query("SELECT u FROM UserEntity u WHERE u.userName =:userName")
    UserEntity findByUsername(@Param("userName") String userName);

    /** Projeção leve para a listagem: não carrega as permissões de cada utilizador. */
    interface UserSummary {
        Long getId();
        String getUserName();
        String getFullName();
        Boolean getEnabled();
    }

    @Query("select u.id as id, u.userName as userName, u.fullName as fullName, u.enabled as enabled "
         + "from UserEntity u order by u.userName")
    List<UserSummary> findAllSummaries();

    /** Ligações ativas utilizador-permissão: cada linha é [id_user, id_permission]. */
    @Query(value = "SELECT up.id_user, up.id_permission FROM user_permission up WHERE up.status = 1",
           nativeQuery = true)
    List<Object[]> findActiveLinks();

    @Query(value = "SELECT COUNT(*) FROM user_permission WHERE id_user = :userId AND id_permission = :permissionId",
           nativeQuery = true)
    long countLink(@Param("userId") Long userId, @Param("permissionId") Long permissionId);

    @Modifying
    @Query(value = """
        INSERT INTO user_permission (id_user, id_permission, status, created_by, created_date)
        VALUES (:userId, :permissionId, 1, :by, :now)
        """, nativeQuery = true)
    void insertLink(@Param("userId") Long userId, @Param("permissionId") Long permissionId,
                    @Param("by") String by, @Param("now") LocalDateTime now);

    @Modifying
    @Query(value = """
        UPDATE user_permission
           SET status = 1, updated_by = :by, updated_date = :now
         WHERE id_user = :userId AND id_permission = :permissionId AND status <> 1
        """, nativeQuery = true)
    void reactivateLink(@Param("userId") Long userId, @Param("permissionId") Long permissionId,
                        @Param("by") String by, @Param("now") LocalDateTime now);

    /** Revoga (status = 0) os módulos que não estão na lista. Nunca toca em permissões que não sejam MODULE. */
    @Modifying
    @Query(value = """
        UPDATE user_permission
           SET status = 0, updated_by = :by, updated_date = :now
         WHERE id_user = :userId
           AND status = 1
           AND id_permission IN (SELECT id FROM permission WHERE code LIKE 'MODULE%')
           AND id_permission NOT IN (:keepIds)
        """, nativeQuery = true)
    void revokeModulesNotIn(@Param("userId") Long userId, @Param("keepIds") Collection<Long> keepIds,
                            @Param("by") String by, @Param("now") LocalDateTime now);
}