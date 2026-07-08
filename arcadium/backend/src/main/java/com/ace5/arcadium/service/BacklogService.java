package com.ace5.arcadium.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ace5.arcadium.dto.BacklogItemResponse;
import com.ace5.arcadium.dto.BacklogStatusResponse;
import com.ace5.arcadium.dto.BacklogUpdateRequest;
import com.ace5.arcadium.entity.AppUser;
import com.ace5.arcadium.entity.Backlog;
import com.ace5.arcadium.entity.BacklogId;
import com.ace5.arcadium.entity.BacklogStatus;
import com.ace5.arcadium.entity.Game;
import com.ace5.arcadium.entity.WishlistId;
import com.ace5.arcadium.exception.ApiException;
import com.ace5.arcadium.repository.AppUserRepository;
import com.ace5.arcadium.repository.BacklogRepository;
import com.ace5.arcadium.repository.BacklogStatusRepository;
import com.ace5.arcadium.repository.GameRepository;
import com.ace5.arcadium.repository.WishlistRepository;

/**
 * Logica del backlog personale (M4-T8): giochi posseduti con stato di
 * avanzamento (mai giocato / in corso / finito / abbandonato) e tempo di gioco.
 *
 * <p>Come la wishlist (M4-T7), ogni operazione e' "scoped" all'utente ricevuto
 * dal controller (ricavato dal token, mai da un parametro): un utente vede e
 * modifica SOLO il proprio backlog. Gli errori (gioco inesistente, voce gia'
 * presente o assente, stato non valido) diventano risposte HTTP localizzate
 * tramite {@link ApiException}, riusando l'infrastruttura i18n di M4-T4.
 *
 * <p>Gli stati sono validati contro la lookup {@code backlog_status} (non un
 * enum fisso), coerente con la scelta di modello di M1-T5: nuovi stati si
 * aggiungono da seed senza toccare il codice. Solo le transizioni con effetto
 * sulle date fanno riferimento ai codici noti qui sotto.
 */
@Service
public class BacklogService {

    /** Stato di default all'aggiunta di un gioco posseduto (M1-T5). */
    private static final String STATUS_NEVER_PLAYED = "mai_giocato";
    /** Passaggio a questo stato valorizza started_at (se non gia' impostato). */
    private static final String STATUS_IN_PROGRESS = "in_corso";
    /** Passaggio a questo stato valorizza finished_at (se non gia' impostato). */
    private static final String STATUS_FINISHED = "finito";

    private final BacklogRepository backlogRepository;
    private final BacklogStatusRepository statusRepository;
    private final WishlistRepository wishlistRepository;
    private final GameRepository gameRepository;
    private final AppUserRepository userRepository;

    public BacklogService(BacklogRepository backlogRepository,
                          BacklogStatusRepository statusRepository,
                          WishlistRepository wishlistRepository,
                          GameRepository gameRepository,
                          AppUserRepository userRepository) {
        this.backlogRepository = backlogRepository;
        this.statusRepository = statusRepository;
        this.wishlistRepository = wishlistRepository;
        this.gameRepository = gameRepository;
        this.userRepository = userRepository;
    }

    /**
     * Elenco del backlog dell'utente, eventualmente filtrato per stato.
     *
     * @param userId     id dell'utente autenticato
     * @param statusCode codice di stato per filtrare (nullable = tutti)
     * @return voci del backlog in forma di risposta
     * @throws ApiException 400 se statusCode e' presente ma non riconosciuto
     */
    @Transactional(readOnly = true)
    public List<BacklogItemResponse> list(Long userId, String statusCode) {
        List<Backlog> items;
        if (statusCode == null || statusCode.isBlank()) {
            items = backlogRepository.findByUserWithGame(userId);
        } else {
            String code = normalize(statusCode);
            requireStatus(code); // 400 se lo stato non esiste (invece di lista vuota)
            items = backlogRepository.findByUserAndStatusWithGame(userId, code);
        }
        return items.stream().map(BacklogItemResponse::from).toList();
    }

    /**
     * Elenco degli stati possibili del backlog, nell'ordine di visualizzazione.
     *
     * @return stati con codice ed etichette IT/EN
     */
    @Transactional(readOnly = true)
    public List<BacklogStatusResponse> listStatuses() {
        return statusRepository.findAllByOrderBySortOrderAsc().stream()
                .map(BacklogStatusResponse::from)
                .toList();
    }

    /**
     * Aggiunge un gioco al backlog dell'utente con stato di default
     * "mai giocato". Se il gioco era in wishlist, viene tolto dalla wishlist:
     * possedere un gioco lo fa passare da wishlist a backlog (regola M1-T5 §8).
     *
     * @param userId id dell'utente autenticato
     * @param appId  gioco da aggiungere
     * @return la voce di backlog creata
     * @throws ApiException 404 se il gioco non esiste, 409 se gia' nel backlog
     */
    @Transactional
    public BacklogItemResponse add(Long userId, Long appId) {
        Game game = gameRepository.findById(appId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND, "error.game.notFound", appId));

        if (backlogRepository.existsById(new BacklogId(userId, appId))) {
            throw new ApiException(HttpStatus.CONFLICT, "error.backlog.alreadyExists", appId);
        }

        BacklogStatus defaultStatus = requireStatus(STATUS_NEVER_PLAYED);
        AppUser user = userRepository.getReferenceById(userId);
        // saveAndFlush forza subito l'INSERT: cosi' @CreationTimestamp valorizza
        // addedAt, presente (non null) nella risposta.
        Backlog saved = backlogRepository.saveAndFlush(new Backlog(user, game, defaultStatus));

        // Regola wishlist -> backlog: il gioco posseduto esce dalla wishlist.
        WishlistId wishlistKey = new WishlistId(userId, appId);
        if (wishlistRepository.existsById(wishlistKey)) {
            wishlistRepository.deleteById(wishlistKey);
        }

        return BacklogItemResponse.from(saved);
    }

    /**
     * Aggiorna una voce del backlog: cambia stato e/o tempo di gioco. Al
     * passaggio a "in corso"/"finito" valorizza started_at/finished_at se non
     * ancora impostate (fill-if-null: lo storico non viene sovrascritto). Se il
     * corpo e' vuoto, la voce resta invariata.
     *
     * @param userId  id dell'utente autenticato
     * @param appId   gioco da aggiornare
     * @param request nuovo stato e/o tempo di gioco (entrambi opzionali)
     * @return la voce aggiornata
     * @throws ApiException 404 se il gioco non e' nel backlog, 400 se lo stato non e' valido
     */
    @Transactional
    public BacklogItemResponse update(Long userId, Long appId, BacklogUpdateRequest request) {
        Backlog entry = backlogRepository.findById(new BacklogId(userId, appId))
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND, "error.backlog.notFound", appId));

        if (request.status() != null && !request.status().isBlank()) {
            BacklogStatus newStatus = requireStatus(normalize(request.status()));
            applyStatusTransition(entry, newStatus);
        }
        if (request.playtimeMinutes() != null) {
            entry.setPlaytimeMinutes(request.playtimeMinutes());
        }

        Backlog saved = backlogRepository.saveAndFlush(entry);
        return BacklogItemResponse.from(saved);
    }

    /**
     * Rimuove un gioco dal backlog dell'utente.
     *
     * @param userId id dell'utente autenticato
     * @param appId  gioco da rimuovere
     * @throws ApiException 404 se quel gioco non e' nel backlog dell'utente
     */
    @Transactional
    public void remove(Long userId, Long appId) {
        BacklogId key = new BacklogId(userId, appId);
        if (!backlogRepository.existsById(key)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "error.backlog.notFound", appId);
        }
        backlogRepository.deleteById(key);
    }

    // ------------------------------------------------------------- helpers

    /**
     * Applica il nuovo stato e, sulle transizioni note, valorizza la data
     * corrispondente solo se ancora nulla (non si sovrascrive lo storico).
     */
    private void applyStatusTransition(Backlog entry, BacklogStatus newStatus) {
        LocalDateTime now = LocalDateTime.now();
        String code = newStatus.getCode();
        if (STATUS_IN_PROGRESS.equals(code) && entry.getStartedAt() == null) {
            entry.setStartedAt(now);
        }
        if (STATUS_FINISHED.equals(code) && entry.getFinishedAt() == null) {
            entry.setFinishedAt(now);
        }
        entry.setStatus(newStatus);
    }

    private String normalize(String rawCode) {
        return rawCode.trim().toLowerCase(Locale.ROOT);
    }

    /** Risolve uno stato per codice o solleva 400 localizzato se non esiste. */
    private BacklogStatus requireStatus(String code) {
        return statusRepository.findByCode(code)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.BAD_REQUEST, "error.backlog.status.invalid", code));
    }
}
