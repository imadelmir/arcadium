package com.ace5.arcadium.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ace5.arcadium.dto.BacklogItemResponse;
import com.ace5.arcadium.dto.PageResponse;
import com.ace5.arcadium.dto.UserResponse;
import com.ace5.arcadium.dto.UserSettingsRequest;
import com.ace5.arcadium.dto.UserSummaryResponse;
import com.ace5.arcadium.dto.WishlistItemResponse;
import com.ace5.arcadium.entity.AppUser;
import com.ace5.arcadium.exception.ApiException;
import com.ace5.arcadium.repository.AppUserRepository;
import com.ace5.arcadium.repository.BacklogRepository;
import com.ace5.arcadium.repository.WishlistRepository;

/**
 * Ricerca utenti e consultazione della libreria altrui (M4-T9).
 *
 * <p>Due funzioni della commessa: cercare utenti (per username o nome
 * visualizzato) e vedere i giochi di un utente (backlog e wishlist). La
 * visibilita' della libreria rispetta {@code is_profile_public}: i giochi di un
 * profilo privato sono visibili solo al proprietario. La ricerca invece trova
 * chiunque per nome, esponendo solo dati pubblici (mai l'email) e il flag di
 * visibilita'. Le liste riusano i DTO e le query fetch-join di M4-T7/T8.
 */
@Service
public class UserService {

    /** Tetto alla dimensione di pagina della ricerca utenti. */
    private static final int MAX_PAGE_SIZE = 50;

    /** La ricerca utenti e' sempre ordinata per username (sort non pilotabile dal client). */
    private static final Sort SEARCH_SORT = Sort.by("username").ascending();

    private final AppUserRepository userRepository;
    private final BacklogRepository backlogRepository;
    private final WishlistRepository wishlistRepository;

    public UserService(AppUserRepository userRepository,
                       BacklogRepository backlogRepository,
                       WishlistRepository wishlistRepository) {
        this.userRepository = userRepository;
        this.backlogRepository = backlogRepository;
        this.wishlistRepository = wishlistRepository;
    }

    /**
     * Cerca utenti per sottostringa su username o nome visualizzato. Con {@code q}
     * vuoto elenca tutti gli utenti pubblici (paginati). Ordinamento fisso per
     * username.
     *
     * <p>Change request privacy — visibilita' reciproca:
     * <ul>
     *   <li>chi ha il profilo PRIVATO non puo' cercare: 403;</li>
     *   <li>i risultati contengono solo profili PUBBLICI (un utente privato non
     *       e' cercabile) ed escludono il richiedente stesso.</li>
     * </ul>
     *
     * @param requesterId id dell'utente autenticato che effettua la ricerca
     * @param q           sottostringa da cercare (nullable/vuoto = tutti i pubblici)
     * @param pageable    pagina e dimensione richieste (l'ordinamento e' imposto)
     * @return pagina di viste pubbliche degli utenti
     * @throws ApiException 403 se il richiedente ha il profilo privato
     */
    @Transactional(readOnly = true)
    public PageResponse<UserSummaryResponse> search(Long requesterId, String q, Pageable pageable) {
        AppUser requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND, "error.user.notFound", requesterId));
        if (!Boolean.TRUE.equals(requester.getIsProfilePublic())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "error.user.search.private");
        }

        int size = Math.min(Math.max(pageable.getPageSize(), 1), MAX_PAGE_SIZE);
        Pageable safe = PageRequest.of(pageable.getPageNumber(), size, SEARCH_SORT);

        Page<AppUser> page = (q == null || q.isBlank())
                ? userRepository.findByIsProfilePublicTrueAndIdNot(requesterId, safe)
                : userRepository.searchPublic(q.trim(), requesterId, safe);

        List<UserSummaryResponse> content = page.getContent().stream()
                .map(UserSummaryResponse::from)
                .toList();
        return PageResponse.of(page, content);
    }

    /**
     * Aggiorna le impostazioni dell'utente autenticato (change request privacy).
     * Per ora l'unica impostazione e' la visibilita' del profilo. PATCH parziale:
     * i campi null nella richiesta non vengono toccati.
     *
     * @param userId  id dell'utente autenticato
     * @param request nuove impostazioni (campi opzionali)
     * @return la vista aggiornata dell'utente
     * @throws ApiException 404 se l'utente non esiste
     */
    @Transactional
    public UserResponse updateSettings(Long userId, UserSettingsRequest request) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND, "error.user.notFound", userId));

        if (request.profilePublic() != null
                && !request.profilePublic().equals(Boolean.TRUE.equals(user.getIsProfilePublic()))) {
            // La visibilita' cambia DAVVERO (salvare lo stesso valore non conta):
            // change request cooldown — non prima di 48h dall'ultimo cambio.
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime changedAt = user.getProfileVisibilityChangedAt();
            if (changedAt != null) {
                LocalDateTime unlockAt = changedAt.plus(UserResponse.PROFILE_VISIBILITY_COOLDOWN);
                if (unlockAt.isAfter(now)) {
                    long hoursLeft = Math.max(1L,
                            (long) Math.ceil(Duration.between(now, unlockAt).toMinutes() / 60.0));
                    throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                            "error.profile.visibility.cooldown", hoursLeft);
                }
            }
            user.setIsProfilePublic(request.profilePublic());
            user.setProfileVisibilityChangedAt(now);
        }

        if (request.abandonAfterMonths() != null) {
            // Auto-abbandono (change request): 0 = disattivato (NULL a DB), 1/3/6 = mesi.
            int months = request.abandonAfterMonths();
            if (months == 0) {
                user.setAbandonAfterMonths(null);
            } else if (months == 1 || months == 3 || months == 6) {
                user.setAbandonAfterMonths((short) months);
            } else {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "error.user.abandonMonths.invalid", months);
            }
        }

        return UserResponse.from(user);
    }

    /**
     * Profilo pubblico di un utente per username.
     *
     * @param username handle dell'utente
     * @return vista pubblica dell'utente
     * @throws ApiException 404 se l'utente non esiste
     */
    @Transactional(readOnly = true)
    public UserSummaryResponse getProfile(String username) {
        return UserSummaryResponse.from(requireUser(username));
    }

    /**
     * Backlog di un utente (tutti gli stati), se consultabile dal richiedente.
     *
     * @param requesterId id dell'utente autenticato
     * @param username    handle dell'utente di cui vedere il backlog
     * @return voci del backlog dell'utente
     * @throws ApiException 404 se l'utente non esiste, 403 se il profilo e' privato e non e' il proprio
     */
    @Transactional(readOnly = true)
    public List<BacklogItemResponse> backlogOf(Long requesterId, String username) {
        AppUser target = requireVisibleUser(requesterId, username);
        return backlogRepository.findByUserWithGame(target.getId()).stream()
                .map(BacklogItemResponse::from)
                .toList();
    }

    /**
     * Wishlist di un utente, se consultabile dal richiedente.
     *
     * @param requesterId id dell'utente autenticato
     * @param username    handle dell'utente di cui vedere la wishlist
     * @return voci della wishlist dell'utente
     * @throws ApiException 404 se l'utente non esiste, 403 se il profilo e' privato e non e' il proprio
     */
    @Transactional(readOnly = true)
    public List<WishlistItemResponse> wishlistOf(Long requesterId, String username) {
        AppUser target = requireVisibleUser(requesterId, username);
        return wishlistRepository.findByUserWithGame(target.getId()).stream()
                .map(WishlistItemResponse::from)
                .toList();
    }

    // ------------------------------------------------------------- helpers

    private AppUser requireUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND, "error.user.notFound", username));
    }

    /**
     * Risolve l'utente bersaglio e verifica la visibilita' della sua libreria:
     * consentita se il profilo e' pubblico oppure se e' il richiedente stesso.
     */
    private AppUser requireVisibleUser(Long requesterId, String username) {
        AppUser target = requireUser(username);
        boolean isSelf = target.getId().equals(requesterId);
        if (!isSelf && !Boolean.TRUE.equals(target.getIsProfilePublic())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "error.user.profilePrivate");
        }
        return target;
    }
}
