package com.ace5.arcadium.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import com.ace5.arcadium.entity.AppUser;

/**
 * Repository degli utenti (registrazione, ricerca, profilo).
 *
 * <p>I metodi derivati sono usati dall'autenticazione (M4-T3):
 * {@code findByUsername} per il login e per ricaricare il principal dal token;
 * {@code existsByUsername}/{@code existsByEmail} per i controlli di unicita' in
 * registrazione. La ricerca utenti (M4-T9) usa {@link #search} su username e
 * nome visualizzato.
 */
public interface AppUserRepository extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByUsername(String username);
    /**
     * Utente per email: serve al recupero password (M4-T17) per trovare l'account
     * a cui inviare il link di reset.
     *
     * @param email indirizzo email
     * @return l'utente con quella email, se esiste
     */
    Optional<AppUser> findByEmail(String email);

    /**
     * Utente per SteamID: serve al connect Steam (M4-T16) per garantire che uno
     * stesso account Steam non sia collegato a due utenti diversi.
     *
     * @param steamId SteamID64
     * @return l'utente collegato a quello SteamID, se esiste
     */
    Optional<AppUser> findBySteamId(String steamId);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    /**
     * Ricerca utenti per sottostringa (case-insensitive) su username o nome
     * visualizzato. Il nome visualizzato e' nullable: la clausola lo ignora se
     * assente. L'ordinamento e la paginazione arrivano dal {@link Pageable}.
     *
     * @param q        sottostringa da cercare
     * @param pageable pagina, dimensione e ordinamento
     * @return pagina di utenti che soddisfano la ricerca
     */
    @Query("select u from AppUser u where "
            + "lower(u.username) like lower(concat('%', :q, '%')) "
            + "or (u.displayName is not null and lower(u.displayName) like lower(concat('%', :q, '%')))")
    Page<AppUser> search(@Param("q") String q, Pageable pageable);
}
