package mz.com.sgp.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import mz.com.sgp.config.audit.entity.EntityState;
import mz.com.sgp.model.SaleItemEntity;
import mz.com.sgp.model.SaleStatus;

public interface SaleItemRepository extends JpaRepository<SaleItemEntity, Long> {

	@Query("""
		    SELECT p.id, p.name, p.image, p.unitPrice,
		           SUM(si.quantity), SUM(si.quantity * p.unitPrice)
		    FROM SaleItemEntity si
		    JOIN si.product p
		    JOIN si.sale s
		    WHERE s.saleStatus = :saleStatus
		      AND s.status = :status
		    GROUP BY p.id, p.name, p.image, p.unitPrice
		    ORDER BY SUM(si.quantity) DESC
		""")
		List<Object[]> findTopProducts(
		    @Param("saleStatus") SaleStatus saleStatus,
		    @Param("status") EntityState status
		);
}
