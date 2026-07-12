package com.ace5.arcadium.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ace5.arcadium.entity.AppUser;
import com.ace5.arcadium.entity.PasswordResetToken;

/**
 * Repository dei token di recupero password (M4-T17).
 *
 * <p>Il servizio cerca un token per hash al momento del reset
 * ({@link #findByTokenHash}) e, per igiene, cancella gli eventuali token ancora
 * pendenti di un utente ({@link #deleteByUser}) quando ne emette uno nuovo o
 * quando il reset va a buon fine: un solo link valido alla volta.
 */
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    /**
     * Cerca il token dal suo hash (il token in chiaro arriva nel link, se ne
     * calcola l'hash e si confronta qui).
     *
     * @param tokenHash hash SHA-256 del token
     * @return il record corrispondente, se esiste
     */
    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    /**
     * Elimina tutti i token di un utente. Usato per invalidare i link
     * precedenti quando se ne emette uno nuovo e per ripulire dopo un reset
     * riuscito. {@code @Modifying} perche' e' una DELETE massiva.
     *
     * @param user utente di cui rimuovere i token
     */
    @Modifying
    @Query("delete from PasswordResetToken t where t.user = :user")
    void deleteByUser(@Param("user") AppUser user);
}
