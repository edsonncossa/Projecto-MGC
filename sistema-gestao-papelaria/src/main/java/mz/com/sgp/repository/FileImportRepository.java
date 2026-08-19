package mz.com.sgp.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import mz.com.sgp.config.audit.entity.EntityState;
import mz.com.sgp.model.FileImportEntity;

@Repository
public interface FileImportRepository extends JpaRepository<FileImportEntity, Long> {

    boolean existsByFileName(String fileName);

    @Query("SELECT p FROM FileImportEntity p WHERE p.status = :status")
    Page<FileImportEntity> findAll(Pageable pageable, @Param("status") EntityState status);

    @Query("SELECT c FROM FileImportEntity c WHERE LOWER(c.client.firstName) LIKE LOWER(CONCAT('%', :firstName, '%'))")
    Page<FileImportEntity> findClientByName(@Param("firstName") String firstName, Pageable pageable);


    @Query("""
            SELECT c FROM FileImportEntity c
            WHERE c.status = :status
            AND (
                LOWER(c.client.firstName) LIKE LOWER(CONCAT('%', :search, '%'))
            )
            """)
    Page<FileImportEntity> search(@Param("search") String search, @Param("status") EntityState status, Pageable pageable);

    long countByStatus(EntityState status);

}