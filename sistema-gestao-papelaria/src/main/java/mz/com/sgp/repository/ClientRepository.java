package mz.com.sgp.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import mz.com.sgp.config.audit.entity.EntityState;
import mz.com.sgp.model.ClientEntity;

@Repository
public interface ClientRepository extends JpaRepository<ClientEntity, Long> {

    @Query("SELECT p FROM ClientEntity p WHERE p.status = :status")
    Page<ClientEntity> findAll(Pageable pageable, @Param("status") EntityState status);

    @Query("SELECT c FROM ClientEntity c WHERE LOWER(c.firstName) LIKE LOWER(CONCAT('%', :firstName, '%'))")
    Page<ClientEntity> findClientByName(@Param("firstName") String firstName, Pageable pageable);


    @Query("""
            SELECT c FROM ClientEntity c
            WHERE c.status = :status
            AND (
                LOWER(c.firstName) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(c.address) LIKE LOWER(CONCAT('%', :search, '%'))
            )
            """)
    Page<ClientEntity> search(@Param("search") String search, @Param("status") EntityState status, Pageable pageable);

    long countByStatus(EntityState status);

    /**
     * Retorna apenas o primeiro registo encontrado (evita a exceção de múltiplos resultados)
     */
    @Query("SELECT c FROM ClientEntity c WHERE LOWER(c.firstName) = LOWER(:firstName) ORDER BY c.id DESC")
    Optional<ClientEntity> findFirstByFirstNameIgnoreCase(@Param("firstName") String firstName);

}