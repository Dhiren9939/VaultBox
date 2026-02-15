package me.dhiren9939.vaultbox_backend.repos;

import me.dhiren9939.vaultbox_backend.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepo extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
}
