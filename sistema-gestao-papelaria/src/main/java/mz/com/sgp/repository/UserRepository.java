package mz.com.sgp.repository;


import mz.com.sgp.model.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<UserEntity, Long> {

    @Query("SELECT u FROM UserEntity u WHERE u.userName =:userName")
    UserEntity findByUsername(@Param("userName") String userName);

}
