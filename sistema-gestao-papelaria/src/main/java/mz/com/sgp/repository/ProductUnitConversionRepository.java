package mz.com.sgp.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import mz.com.sgp.config.audit.entity.EntityState;
import mz.com.sgp.model.ProductUnitConversionEntity;

public interface ProductUnitConversionRepository extends JpaRepository<ProductUnitConversionEntity, Long> {

	@Query("SELECT p FROM ProductUnitConversionEntity p WHERE p.status = :status")
	Page<ProductUnitConversionEntity> findAll(Pageable pageable, @Param("status") EntityState status);

	List<ProductUnitConversionEntity> findByProductIdAndStatus(Long productId, EntityState status);

	@Query("""
			    SELECT p FROM ProductUnitConversionEntity p
			    WHERE (:search IS NULL
			           OR LOWER(p.product.name) LIKE LOWER(CONCAT('%', :search, '%'))
			           OR LOWER(p.unit.name) LIKE LOWER(CONCAT('%', :search, '%')))
			      AND p.status = :status
			""")
	Page<ProductUnitConversionEntity> search(@Param("search") String search, @Param("status") EntityState status,
			Pageable pageable);

}
