package mz.com.sgp.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import mz.com.sgp.config.audit.entity.EntityState;
import mz.com.sgp.model.CategoryEntity;

public interface CategoryRepository extends JpaRepository<CategoryEntity, Long> {

	@Query("SELECT p FROM CategoryEntity p WHERE p.status = :status")
	Page<CategoryEntity> findAll(Pageable pageable, @Param("status") EntityState status);

	@Query("""
			    SELECT c FROM CategoryEntity c
			    WHERE (
			        :search IS NULL OR
			        LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR
			        LOWER(c.description) LIKE LOWER(CONCAT('%', :search, '%'))
			    )
			    AND c.status = :status
			""")
	Page<CategoryEntity> search(@Param("search") String search, @Param("status") EntityState status, Pageable pageable);

}
