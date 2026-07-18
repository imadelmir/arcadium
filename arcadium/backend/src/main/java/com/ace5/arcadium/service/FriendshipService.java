package com.ace5.arcadium.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ace5.arcadium.dto.FriendResponse;
import com.ace5.arcadium.dto.FriendshipStatus;
import com.ace5.arcadium.entity.AppUser;
import com.ace5.arcadium.entity.Friendship;
import com.ace5.arcadium.exception.ApiException;
import com.ace5.arcadium.repository.AppUserRepository;
import com.ace5.arcadium.repository.FriendshipRepository;

/**
 * Amicizie tra utenti su richiesta + accettazione (change request Community).
 *
 * <p>Flusso: A invia una richiesta a B ({@code pending}); B la accetta
 * ({@code accepted}) e da quel momento sono amici, oppure la rifiuta e la riga
 * sparisce. Finche' non sono amici, B non e' tenuto a mostrare nulla ad A: il
 * controllo di visibilita' del profilo si appoggia a {@link #areFriends}.
 *
 * <p>La tabella tiene UNA sola relazione per coppia in qualsiasi direzione
 * (indice {@code uq_friendship_pair}), quindi qui si cerca sempre la relazione
 * "tra i due" senza preoccuparsi di chi l'ha creata. Rifiuto, annullamento della
 * richiesta e rimozione dell'amicizia sono la stessa operazione: si cancella la
 * riga.
 */
@Service
public class FriendshipService {

    private final FriendshipRepository friendshipRepository;
    private final AppUserRepository userRepository;

    public FriendshipService(FriendshipRepository friendshipRepository,
                             AppUserRepository userRepository) {
        this.friendshipRepository = friendshipRepository;
        this.userRepository = userRepository;
    }

    /** Amici confermati dell'utente autenticato. */
    @Transactional(readOnly = true)
    public List<FriendResponse> listFriends(Long userId) {
        return friendshipRepository.findFriends(userId).stream()
                .map(f -> FriendResponse.from(f, userId))
                .toList();
    }

    /** Richieste ricevute e ancora in attesa: l'utente deve accettare o rifiutare. */
    @Transactional(readOnly = true)
    public List<FriendResponse> listReceived(Long userId) {
        return friendshipRepository.findPendingReceived(userId).stream()
                .map(f -> FriendResponse.from(f, userId))
                .toList();
    }

    /** Richieste inviate e ancora senza risposta. */
    @Transactional(readOnly = true)
    public List<FriendResponse> listSent(Long userId) {
        return friendshipRepository.findPendingSent(userId).stream()
                .map(f -> FriendResponse.from(f, userId))
                .toList();
    }

    /**
     * Invia una richiesta di amicizia a {@code username}.
     *
     * @throws ApiException 404 se l'utente non esiste; 409 se e' se stessi o se
     *                      esiste gia' una relazione (richiesta o amicizia)
     */
    @Transactional
    public FriendResponse sendRequest(Long userId, String username) {
        AppUser me = requireUserById(userId);
        AppUser other = requireUserByUsername(username);

        if (other.getId().equals(userId)) {
            throw new ApiException(HttpStatus.CONFLICT, "error.friend.self");
        }
        if (friendshipRepository.findBetween(userId, other.getId()).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "error.friend.exists");
        }

        Friendship saved = friendshipRepository.saveAndFlush(new Friendship(me, other));
        return FriendResponse.from(saved, userId);
    }

    /**
     * Accetta la richiesta ricevuta da {@code username}.
     *
     * @throws ApiException 404 se non c'e' una richiesta in attesa DA quell'utente
     *                      verso di me; 409 se sono gia' amici
     */
    @Transactional
    public FriendResponse accept(Long userId, String username) {
        AppUser other = requireUserByUsername(username);
        Friendship friendship = friendshipRepository.findBetween(userId, other.getId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND, "error.friend.request.notFound"));

        if (friendship.isAccepted()) {
            throw new ApiException(HttpStatus.CONFLICT, "error.friend.exists");
        }
        // Puo' accettare SOLO il destinatario: chi ha inviato la richiesta non
        // puo' auto-accettarsela.
        if (!friendship.getAddressee().getId().equals(userId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "error.friend.request.notFound");
        }

        friendship.setStatus(Friendship.STATUS_ACCEPTED);
        friendship.setRespondedAt(LocalDateTime.now());
        Friendship saved = friendshipRepository.saveAndFlush(friendship);
        return FriendResponse.from(saved, userId);
    }

    /**
     * Cancella la relazione con {@code username}, qualunque essa sia: rifiuta una
     * richiesta ricevuta, annulla una richiesta inviata o rimuove un amico.
     *
     * @throws ApiException 404 se non esiste alcuna relazione tra i due
     */
    @Transactional
    public void remove(Long userId, String username) {
        AppUser other = requireUserByUsername(username);
        Friendship friendship = friendshipRepository.findBetween(userId, other.getId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND, "error.friend.request.notFound"));
        friendshipRepository.delete(friendship);
    }

    /** Stato della relazione tra l'utente autenticato e un altro utente. */
    @Transactional(readOnly = true)
    public FriendshipStatus statusWith(Long userId, AppUser other) {
        if (other.getId().equals(userId)) {
            return FriendshipStatus.SELF;
        }
        Optional<Friendship> relation = friendshipRepository.findBetween(userId, other.getId());
        if (relation.isEmpty()) {
            return FriendshipStatus.NONE;
        }
        Friendship friendship = relation.get();
        if (friendship.isAccepted()) {
            return FriendshipStatus.FRIENDS;
        }
        return friendship.getRequester().getId().equals(userId)
                ? FriendshipStatus.PENDING_SENT
                : FriendshipStatus.PENDING_RECEIVED;
    }

    /**
     * true se i due utenti sono amici (o sono la stessa persona): condizione per
     * poter vedere il contenuto di un profilo.
     */
    @Transactional(readOnly = true)
    public boolean areFriends(Long userId, Long otherId) {
        return userId.equals(otherId) || friendshipRepository.areFriends(userId, otherId);
    }

    private AppUser requireUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND, "error.user.notFound", userId));
    }

    private AppUser requireUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND, "error.user.notFound", username));
    }
}
