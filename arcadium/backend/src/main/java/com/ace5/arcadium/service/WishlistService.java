package com.ace5.arcadium.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ace5.arcadium.dto.WishlistItemResponse;
import com.ace5.arcadium.entity.AppUser;
import com.ace5.arcadium.entity.Game;
import com.ace5.arcadium.entity.Wishlist;
import com.ace5.arcadium.entity.WishlistId;
import com.ace5.arcadium.exception.ApiException;
import com.ace5.arcadium.repository.AppUserRepository;
import com.ace5.arcadium.repository.GameRepository;
import com.ace5.arcadium.repository.WishlistRepository;

/**
 * Logica della wishlist personale (M4-T7): aggiunta, elenco e rimozione dei
 * giochi desiderati dall'utente autenticato.
 *
 * <p>Ogni operazione e' "scoped" all'utente ricevuto dal controller (ricavato
 * dal token, mai da un parametro della richiesta): un utente vede e modifica
 * SOLO la propria wishlist. Gli errori (gioco inesistente, voce gia' presente o
 * assente) diventano risposte HTTP localizzate tramite {@link ApiException},
 * riusando l'infrastruttura i18n di M4-T4.
 */
@Service
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final GameRepository gameRepository;
    private final AppUserRepository userRepository;

    public WishlistService(WishlistRepository wishlistRepository,
                           GameRepository gameRepository,
                           AppUserRepository userRepository) {
        this.wishlistRepository = wishlistRepository;
        this.gameRepository = gameRepository;
        this.userRepository = userRepository;
    }

    /**
     * Elenco della wishlist dell'utente, dal piu' recente al piu' vecchio.
     * Sola lettura: il fetch join sul gioco (nel repository) evita l'N+1 quando
     * si proietta ogni voce nel DTO.
     *
     * @param userId id dell'utente autenticato
     * @return voci della wishlist in forma di risposta
     */
    @Transactional(readOnly = true)
    public List<WishlistItemResponse> list(Long userId) {
        return wishlistRepository.findByUserWithGame(userId).stream()
                .map(WishlistItemResponse::from)
                .toList();
    }

    /**
     * Aggiunge un gioco alla wishlist dell'utente.
     *
     * @param userId id dell'utente autenticato
     * @param appId  gioco da aggiungere
     * @return la voce di wishlist creata
     * @throws ApiException 404 se il gioco non esiste, 409 se e' gia' in wishlist
     */
    @Transactional
    public WishlistItemResponse add(Long userId, Long appId) {
        // Il gioco deve esistere nel catalogo: findById valida e ci da' l'entita'.
        Game game = gameRepository.findById(appId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND, "error.game.notFound", appId));

        // La coppia (utente, gioco) e' unica: niente doppioni in wishlist.
        if (wishlistRepository.existsById(new WishlistId(userId, appId))) {
            throw new ApiException(HttpStatus.CONFLICT, "error.wishlist.alreadyExists", appId);
        }

        // getReferenceById: proxy dell'utente senza query aggiuntiva; l'id basta
        // sia per la FK sia per la chiave composta della wishlist.
        AppUser user = userRepository.getReferenceById(userId);
        // saveAndFlush forza subito l'INSERT: così @CreationTimestamp viene
        // valorizzato e addedAt è presente nella risposta (non null).
        Wishlist saved = wishlistRepository.saveAndFlush(new Wishlist(user, game));
        return WishlistItemResponse.from(saved);
    }

    /**
     * Rimuove un gioco dalla wishlist dell'utente.
     *
     * @param userId id dell'utente autenticato
     * @param appId  gioco da rimuovere
     * @throws ApiException 404 se quel gioco non e' nella wishlist dell'utente
     */
    @Transactional
    public void remove(Long userId, Long appId) {
        WishlistId key = new WishlistId(userId, appId);
        if (!wishlistRepository.existsById(key)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "error.wishlist.notFound", appId);
        }
        wishlistRepository.deleteById(key);
    }
}