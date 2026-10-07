package mz.com.sgp.repository;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import mz.com.sgp.config.audit.entity.EntityState;
import mz.com.sgp.model.ConsumptionEntity;

@Repository
public interface ConsumptionRepository extends JpaRepository<ConsumptionEntity, Long> {

    @Query("SELECT c FROM ConsumptionEntity c " +
            "LEFT JOIN c.client cl " +
            "WHERE (:clientIds IS NULL OR c.clientId IN :clientIds) AND " +
            "(:startDate IS NULL OR c.consumptionDate >= :startDate) AND " +
            "(:endDate IS NULL OR c.consumptionDate <= :endDate) AND " +
            "(:search IS NULL OR :search = '' OR LOWER(cl.firstName) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
            "c.status = :status " +
            "ORDER BY c.consumptionDate ASC")
    Page<ConsumptionEntity> filterConsumptions(
            @Param("clientIds") List<Long> clientIds,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("search") String search,
            @Param("status") EntityState status,
            Pageable pageable);
    
    long countByStatus(EntityState status);
}