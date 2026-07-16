package com.ace5.arcadium.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ace5.arcadium.dto.PlaytimeEntryRequest;
import com.ace5.arcadium.dto.PlaytimeEntryResponse;
import com.ace5.arcadium.entity.AppUser;
import com.ace5.arcadium.entity.BacklogId;
import com.ace5.arcadium.entity.Game;
import com.ace5.arcadium.entity.PlaytimeEntry;
import com.ace5.arcadium.exception.ApiException;
import com.ace5.arcadium.repository.AppUserRepository;
import com.ace5.arcadium.repository.BacklogRepository;
import com.ace5.arcadium.repository.GameRepository;
import com.ace5.arcadium.repository.PlaytimeEntryRepository;

/**
 * Registro delle ore giocate dichiarate manualmente (feature M6).
 *
 * <p>Come backlog e wishlist, ogni operazione e' "scoped" all'utente ricevuto
 * dal controller (dal token, mai da un parametro): si agisce solo sulle proprie
 * voci. Gli errori diventano risposte HTTP localizzate via {@link ApiException}.
 *
 * <p>Si registrano ore solo per un gioco gia' nel proprio backlog: la
 * verifica di appartenenza precede l'inserimento, cosi' il client riceve un 404
 * pulito e localizzato invece della violazione della FK composta a livello DB.
 * Il tempo dichiarato qui NON tocca {@code backlog.playtime_minutes} (che resta
 * il canale del sync Steam): il totale manuale si ottiene sommando le voci.
 */
@Service
public class PlaytimeService {

    private final PlaytimeEntryRepository playtimeRepository;
    private final BacklogRepository backlogRepository;
    private final AppUserRepository userRepository;
    private final GameRepository gameRepository;

    public PlaytimeService(PlaytimeEntryRepository playtimeRepository,
                           BacklogRepository backlogRepository,
                           AppUserRepository userRepository,
                           GameRepository gameRepository) {
        this.playtimeRepository = playtimeRepository;
        this.backlogRepository = backlogRepository;
        this.userRepository = userRepository;
        this.gameRepository = gameRepository;
    }

    /**
     * Registra una sessione per un gioco del backlog dell'utente.
     *
     * @throws ApiException 404 se il gioco non e' nel backlog dell'utente
     */
    @Transactional
    public PlaytimeEntryResponse add(Long userId, Long appId, PlaytimeEntryRequest request) {
        if (!backlogRepository.existsById(new BacklogId(userId, appId))) {
            throw new ApiException(HttpStatus.NOT_FOUND, "error.backlog.notFound", appId);
        }
        AppUser user = userRepository.getReferenceById(userId);
        Game game = gameRepository.getReferenceById(appId);

        PlaytimeEntry entry = new PlaytimeEntry(user, game, request.minutes(), request.playedOn());
        return PlaytimeEntryResponse.from(playtimeRepository.save(entry));
    }

    /** Voci di un gioco dell'utente, dalla piu' recente. Lista vuota se nessuna. */
    @Transactional(readOnly = true)
    public List<PlaytimeEntryResponse> list(Long userId, Long appId) {
        return playtimeRepository
                .findByUser_IdAndGame_AppIdOrderByPlayedOnDescIdDesc(userId, appId)
                .stream()
                .map(PlaytimeEntryResponse::from)
                .toList();
    }

    /**
     * Elimina una voce dell'utente. Se la voce non esiste o non e' sua, risponde
     * 404 (stesso esito: non si rivela l'esistenza di voci altrui).
     *
     * @throws ApiException 404 se la voce non esiste o non appartiene all'utente
     */
    @Transactional
    public void delete(Long userId, Long entryId) {
        PlaytimeEntry entry = playtimeRepository.findById(entryId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND, "error.playtime.notFound", entryId));

        if (!entry.getUser().getId().equals(userId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "error.playtime.notFound", entryId);
        }
        playtimeRepository.delete(entry);
    }
}
