package mz.com.sgp.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

import org.springframework.data.domain.Page;

import mz.com.sgp.config.audit.entity.EntityState;
import mz.com.sgp.model.ProductEntity;

public interface ProductRepository extends JpaRepository<ProductEntity, Long> {

	@Query("SELECT p FROM ProductEntity p WHERE p.status = :status")
	Page<ProductEntity> findAll(Pageable pageable, @Param("status") EntityState status);

	@Query(value = """
			SELECT p.*
			FROM PRODUCT p
			LEFT JOIN STOCK s ON s.product_id = p.id
			WHERE s.product_id IS NULL AND p.status = :status
			""", nativeQuery = true)
	List<ProductEntity> findProductsWithoutStock(@Param("status") EntityState status);

	@Query("SELECT p FROM ProductEntity p JOIN FETCH p.stock s WHERE s.quantity >= 1 AND p.status = :status")
	List<ProductEntity> findProductsWithStock(@Param("status") EntityState status);

	ProductEntity findFirstByOrderByIdDesc();

	@Query("SELECT DISTINCT p FROM ProductEntity p JOIN ProductUnitConversionEntity puc ON puc.product = p WHERE p.status = :status")
	List<ProductEntity> findAllProductsWithConversionByStatus(@Param("status") EntityState statuss);

	@Query("""
			    SELECT p FROM ProductEntity p
			    WHERE p.status = :status
			    AND (
			        LOWER(p.name) LIKE %:search%
			        OR LOWER(p.reference) LIKE %:search%
			        OR LOWER(p.category.name) LIKE %:search%
			    )
			""")
	Page<ProductEntity> search(@Param("search") String search, @Param("status") EntityState status, Pageable pageable);
	
	long countByStatus(EntityState status);

}
