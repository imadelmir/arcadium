package com.ace5.arcadium.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ace5.arcadium.dto.AuthResponse;
import com.ace5.arcadium.dto.BacklogItemResponse;
import com.ace5.arcadium.dto.FriendshipStatus;
import com.ace5.arcadium.dto.PageResponse;
import com.ace5.arcadium.dto.ProfileStatsResponse;
import com.ace5.arcadium.dto.UserProfileResponse;
import com.ace5.arcadium.dto.UserResponse;
import com.ace5.arcadium.dto.UserStatsResponse;
import com.ace5.arcadium.dto.UserSettingsRequest;
import com.ace5.arcadium.dto.UserSummaryResponse;
import com.ace5.arcadium.dto.WishlistItemResponse;
import com.ace5.arcadium.entity.AppUser;
import com.ace5.arcadium.exception.ApiException;
import com.ace5.arcadium.repository.AppUserRepository;
import com.ace5.arcadium.repository.BacklogRepository;
import com.ace5.arcadium.repository.UserAchievementRepository;
import com.ace5.arcadium.repository.WishlistRepository;
import com.ace5.arcadium.security.JwtService;

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

    /** Intervallo minimo tra due cambi di username (V16): una volta ogni 2 mesi. */
    private static final Period USERNAME_CHANGE_COOLDOWN = Period.ofMonths(2);

    /**
     * Avatar preset ammessi (change request avatar): NON e' un upload libero, l'utente
     * sceglie tra 6 immagini servite come statiche dal frontend ({@code frontend/public/avatars}).
     * Elenco chiuso qui per validare lato server: un client non puo' impostare un URL arbitrario.
     */
    private static final Set<String> ALLOWED_AVATAR_URLS = Set.of(
            "/avatars/synthwave.svg",
            "/avatars/alieno-acido.svg",
            "/avatars/oni.svg",
            "/avatars/lava.svg",
            "/avatars/ghost-menta.svg",
            "/avatars/invader-pink.svg");

    private final AppUserRepository userRepository;
    private final BacklogRepository backlogRepository;
    private final WishlistRepository wishlistRepository;
    private final JwtService jwtService;
    private final FriendshipService friendshipService;
    private final StatsService statsService;
    private final UserAchievementRepository userAchievementRepository;

    public UserService(AppUserRepository userRepository,
                       BacklogRepository backlogRepository,
                       WishlistRepository wishlistRepository,
                       JwtService jwtService,
                       FriendshipService friendshipService,
                       StatsService statsService,
                       UserAchievementRepository userAchievementRepository) {
        this.userRepository = userRepository;
        this.backlogRepository = backlogRepository;
        this.wishlistRepository = wishlistRepository;
        this.jwtService = jwtService;
        this.friendshipService = friendshipService;
        this.statsService = statsService;
        this.userAchievementRepository = userAchievementRepository;
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

        if (request.avatarUrl() != null) {
            // Preset chiuso (change request avatar): non un upload, quindi basta un
            // controllo di appartenenza all'elenco noto — niente storage, niente
            // validazione di formato/dimensione file.
            if (!ALLOWED_AVATAR_URLS.contains(request.avatarUrl())) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "error.user.avatar.invalid", request.avatarUrl());
            }
            user.setAvatarUrl(request.avatarUrl());
        }

        return UserResponse.from(user);
    }

    /**
     * Cambia lo username dell'utente autenticato (V16). Regole:
     * <ul>
     *   <li>al massimo una volta ogni 2 mesi (cooldown);</li>
     *   <li>il nuovo username deve essere diverso da quello attuale;</li>
     *   <li>non deve essere gia' in uso da un altro utente.</li>
     * </ul>
     * Al cambio, lo username attuale viene salvato in {@code previousUsername}
     * (mostrato sul profilo pubblico) e si registra l'istante del cambio.
     *
     * <p>Poiche' il subject del JWT e' lo username, il token corrente (con il
     * subject vecchio) non sarebbe piu' valido: si emette e si restituisce un
     * nuovo {@link AuthResponse}, che il client usa per sostituire il token.
     *
     * @param userId      id dell'utente autenticato
     * @param newUsername nuovo username desiderato (gia' validato @NotBlank/@Size)
     * @return nuovo AuthResponse con token aggiornato e vista dell'utente
     */
    @Transactional
    public AuthResponse changeUsername(Long userId, String newUsername) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND, "error.user.notFound", userId));

        String trimmed = newUsername == null ? "" : newUsername.trim();

        // Uguale all'attuale: niente da cambiare.
        if (trimmed.equals(user.getUsername())) {
            throw new ApiException(HttpStatus.CONFLICT, "error.username.same");
        }

        // Cooldown: una volta ogni 2 mesi dall'ultimo cambio.
        LocalDateTime changedAt = user.getUsernameChangedAt();
        if (changedAt != null) {
            LocalDateTime unlockAt = changedAt.plus(USERNAME_CHANGE_COOLDOWN);
            if (unlockAt.isAfter(LocalDateTime.now())) {
                throw new ApiException(HttpStatus.CONFLICT, "error.username.cooldown");
            }
        }

        // Univocita': nessun altro utente con questo username.
        if (userRepository.existsByUsername(trimmed)) {
            throw new ApiException(HttpStatus.CONFLICT, "error.username.taken");
        }

        user.setPreviousUsername(user.getUsername());
        // Il nome visualizzato coincide SEMPRE con lo username (scelta del
        // cliente): al cambio nome si allinea, cosi' header, avatar, titolo del
        // profilo e ricerca in Community mostrano tutti il nome nuovo.
        user.setDisplayName(trimmed);
        user.setUsername(trimmed);
        user.setUsernameChangedAt(LocalDateTime.now());
        AppUser saved = userRepository.saveAndFlush(user);

        String token = jwtService.generateToken(saved);
        long expiresInSeconds = jwtService.getExpirationMs() / 1000;
        return new AuthResponse(token, "Bearer", expiresInSeconds, UserResponse.from(saved));
    }

    /**
     * Profilo pubblico di un utente per username.
     *
     * <p>Restituisce solo dati di IDENTITA' (nome, handle, avatar, iscrizione,
     * handle precedente) piu' lo stato della relazione con chi guarda: servono
     * anche a un non-amico per poter inviare la richiesta. Il CONTENUTO del
     * profilo (libreria, statistiche) sta su endpoint separati, accessibili solo
     * tra amici.
     *
     * @param requesterId id dell'utente autenticato che guarda
     * @param username    handle dell'utente
     * @return profilo dell'utente con lo stato di amicizia
     * @throws ApiException 404 se l'utente non esiste
     */
    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(Long requesterId, String username) {
        AppUser target = requireUser(username);
        FriendshipStatus status = friendshipService.statusWith(requesterId, target);
        return UserProfileResponse.from(target, status);
    }

    /**
     * Numeri delle card del profilo di {@code username}, visibili solo a un amico
     * (o a se stessi). Riusa le statistiche gia' calcolate da {@link StatsService}
     * — cosi' i totali coincidono con la pagina Statistiche — e vi aggiunge il
     * totale degli achievement sbloccati.
     *
     * @throws ApiException 404 se l'utente non esiste, 403 se non siete amici
     */
    @Transactional(readOnly = true)
    public ProfileStatsResponse profileStatsOf(Long requesterId, String username) {
        AppUser target = requireVisibleUser(requesterId, username);
        UserStatsResponse stats = statsService.getStats(target.getId());

        long playing = stats.byStatus().stream()
                .filter(s -> "in_corso".equals(s.code()))
                .mapToLong(UserStatsResponse.StatusBreakdown::count)
                .findFirst()
                .orElse(0L);

        return new ProfileStatsResponse(
                stats.gamesOwned(),
                playing,
                stats.playtimeMinutes(),
                stats.playtimeHours(),
                userAchievementRepository.countUnlocked(target.getId()));
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
     * Risolve l'utente bersaglio e verifica che il richiedente possa vederne il
     * contenuto (libreria, statistiche).
     *
     * <p>Change request Community: la condizione e' l'AMICIZIA, non piu' la
     * visibilita' del profilo. Il contenuto e' accessibile solo a se stessi o a
     * un amico confermato; una richiesta ancora in attesa non basta.
     */
    private AppUser requireVisibleUser(Long requesterId, String username) {
        AppUser target = requireUser(username);
        if (!friendshipService.areFriends(requesterId, target.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "error.user.notFriends");
        }
        return target;
    }
}
