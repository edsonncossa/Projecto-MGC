package mz.com.sgp.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import mz.com.sgp.config.audit.entity.EntityState;
import mz.com.sgp.model.StockMovementEntity;

public interface StockMovementRepository extends JpaRepository<StockMovementEntity, Long> {

	@Query("SELECT sm FROM StockMovementEntity sm WHERE sm.status = :status")
	Page<StockMovementEntity> findAll(Pageable pageable, @Param("status") EntityState status);

	Page<StockMovementEntity> findByStockIdAndStatus(Long productId, EntityState state, Pageable pageable);

	List<StockMovementEntity> findByStockIdAndStatus(Long stockId, EntityState status);

}
