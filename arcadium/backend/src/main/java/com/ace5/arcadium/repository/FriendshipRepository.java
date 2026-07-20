package com.ace5.arcadium.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ace5.arcadium.entity.Friendship;

/**
 * Accesso alle amicizie / richieste (V10, change request Community).
 *
 * <p>La relazione e' UNA sola per coppia in qualsiasi direzione (indice
 * {@code uq_friendship_pair}), quindi le ricerche "tra due utenti" verificano
 * entrambe le direzioni. Le liste usano fetch join sugli utenti per evitare
 * query N+1 quando si proietta la controparte.
 */
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    /**
     * La relazione tra due utenti, in qualsiasi direzione e qualsiasi stato.
     * Vuoto se non si sono mai scritti.
     */
    @Query("select f from Friendship f "
            + "join fetch f.requester join fetch f.addressee "
            + "where (f.requester.id = :a and f.addressee.id = :b) "
            + "   or (f.requester.id = :b and f.addressee.id = :a)")
    Optional<Friendship> findBetween(@Param("a") Long a, @Param("b") Long b);

    /** true se i due utenti sono amici (relazione accettata). */
    @Query("select count(f) > 0 from Friendship f "
            + "where f.status = 'accepted' "
            + "  and ((f.requester.id = :a and f.addressee.id = :b) "
            + "    or (f.requester.id = :b and f.addressee.id = :a))")
    boolean areFriends(@Param("a") Long a, @Param("b") Long b);

    /** Amicizie confermate dell'utente, in qualsiasi direzione. */
    @Query("select f from Friendship f "
            + "join fetch f.requester join fetch f.addressee "
            + "where f.status = 'accepted' "
            + "  and (f.requester.id = :userId or f.addressee.id = :userId) "
            + "order by f.respondedAt desc")
    List<Friendship> findFriends(@Param("userId") Long userId);

    /** Richieste RICEVUTE e ancora in attesa: l'utente deve accettare o rifiutare. */
    @Query("select f from Friendship f "
            + "join fetch f.requester join fetch f.addressee "
            + "where f.status = 'pending' and f.addressee.id = :userId "
            + "order by f.createdAt desc")
    List<Friendship> findPendingReceived(@Param("userId") Long userId);

    /**
     * Quante richieste RICEVUTE sono ancora in attesa (change request notifiche).
     * Serve al pallino sulla voce Community della sidebar, interrogato di
     * frequente: si conta a DB invece di caricare le righe e gli utenti
     * collegati come fa {@link #findPendingReceived}, che con la sua doppia
     * fetch join sarebbe sproporzionata per ottenere un solo numero.
     */
    @Query("select count(f) from Friendship f "
            + "where f.status = 'pending' and f.addressee.id = :userId")
    long countPendingReceived(@Param("userId") Long userId);

    /** Richieste INVIATE e ancora in attesa di risposta. */
    @Query("select f from Friendship f "
            + "join fetch f.requester join fetch f.addressee "
            + "where f.status = 'pending' and f.requester.id = :userId "
            + "order by f.createdAt desc")
    List<Friendship> findPendingSent(@Param("userId") Long userId);
}
