package mz.com.sgp.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import mz.com.sgp.config.audit.entity.EntityState;
import mz.com.sgp.model.SaleEntity;
import mz.com.sgp.model.SaleStatus;

public interface SaleRepository extends JpaRepository<SaleEntity, Long> {

	@Query("SELECT p FROM SaleEntity p WHERE p.status = :status")
	Page<SaleEntity> findAll(Pageable pageable, @Param("status") EntityState status);

	@Query("""
			    SELECT p FROM SaleEntity p
			    WHERE (:search IS NULL
			           OR LOWER(p.client.firstName) LIKE LOWER(CONCAT('%', :search, '%')))
			      AND p.status = :status
			""")
	Page<SaleEntity> search(@Param("search") String search, @Param("status") EntityState status, Pageable pageable);

	Long countByCreatedDateBetweenAndSaleStatusAndStatus(LocalDateTime startDate, LocalDateTime endDate,
			SaleStatus saleStatus, EntityState status);

	@Query("""
			SELECT FUNCTION('DAYOFWEEK', s.createdDate), COUNT(s.id)
			FROM SaleEntity s
			WHERE s.createdDate BETWEEN :start AND :end
			AND s.saleStatus = :saleStatus
			AND s.status = :status
			GROUP BY FUNCTION('DAYOFWEEK', s.createdDate)
			""")
	List<Object[]> findSalesByWeek(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end,
			@Param("saleStatus") SaleStatus saleStatus, @Param("status") EntityState status);

	@Query("""
			    SELECT COUNT(s.id)
			    FROM SaleEntity s
			    WHERE s.createdDate >= :start
			    AND s.createdDate < :end
			    AND s.saleStatus = :saleStatus
			    AND s.status = :status
			""")
	Long countSalesCurrentMonth(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end,
			@Param("saleStatus") SaleStatus saleStatus, @Param("status") EntityState status);

}
