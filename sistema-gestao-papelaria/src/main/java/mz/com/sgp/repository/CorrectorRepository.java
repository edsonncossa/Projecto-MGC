package mz.com.sgp.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import mz.com.sgp.config.audit.entity.EntityState;
import mz.com.sgp.model.CorrectorEntity;

@Repository
public interface CorrectorRepository extends JpaRepository<CorrectorEntity, Long> {

    @Query("SELECT p FROM CorrectorEntity p WHERE p.status = :status")
    Page<CorrectorEntity> findAll(Pageable pageable, @Param("status") EntityState status);

    @Query("SELECT c FROM CorrectorEntity c WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    Page<CorrectorEntity> findCorrectorByName(@Param("name") String name, Pageable pageable);

    @Query("""
            SELECT c FROM CorrectorEntity c
            WHERE c.status = :status
            AND (
                LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(c.model) LIKE LOWER(CONCAT('%', :search, '%'))
            )
            """)
    Page<CorrectorEntity> search(@Param("search") String search, @Param("status") EntityState status, Pageable pageable);

    long countByStatus(EntityState status);

    /**
     * Evita NonUniqueResultException trazendo apenas o primeiro registo pelo Serial Number
     */
    @Query("SELECT p FROM CorrectorEntity p WHERE LOWER(p.name) = LOWER(:name) ORDER BY p.id DESC")
    List<CorrectorEntity> findByNameCustomList(@Param("name") String name);

    @Query("SELECT p FROM CorrectorEntity p WHERE LOWER(p.serialNumber) = LOWER(:serialNumber) ORDER BY p.id DESC")
    List<CorrectorEntity> findBySerialNumberCustomList(@Param("serialNumber") String serialNumber);


}