package mz.com.sgp.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import mz.com.sgp.config.audit.entity.EntityState;
import mz.com.sgp.model.UnitEntity;

public interface UnitRepository extends JpaRepository<UnitEntity, Long> {

	@Query("SELECT u FROM UnitEntity u WHERE u.status = :status")
	Page<UnitEntity> findAll(Pageable pageable, @Param("status") EntityState status);

	@Query("""
			    SELECT u FROM UnitEntity u
			    WHERE u.status = :status
			    AND (
			        LOWER(u.name) LIKE %:search%
			        OR LOWER(u.symbol) LIKE %:search%
			    )
			""")
	Page<UnitEntity> search(@Param("search") String search, @Param("status") EntityState status, Pageable pageable);

}
