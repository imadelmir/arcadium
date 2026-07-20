package com.ace5.arcadium.dto;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.ZoneId;

import com.ace5.arcadium.entity.AppUser;

/**
 * Vista pubblica dell'utente (M4-T3): mai la password. Usata nelle risposte di
 * auth e da /api/auth/me.
 *
 * <p><b>Cooldown visibilita'.</b> {@code profileVisibilityLockedUntil} indica
 * fino a quando la visibilita' NON puo' essere ricambiata (48h). E' un
 * {@link Instant} (serializzato con offset "...Z") per evitare lo skew di fuso
 * tra JVM e browser. {@code null} quando non c'e' cooldown attivo.
 *
 * <p><b>Auto-abbandono (feature M6).</b> {@code abandonAfterMonths} riflette la
 * scelta dell'utente: {@code null} = disattivato, 1/3/6 = mesi. Serve al selettore
 * in Impostazioni per mostrare il valore corrente dopo un refresh.
 *
 * <p><b>Safe search (V18).</b> {@code safeSearch} e' il filtro contenuti per
 * adulti: true = i titoli espliciti restano fuori dal Negozio. Viaggia nella
 * sessione perche' e' il frontend a doverne rispecchiare lo stato (interruttore
 * in Impostazioni, indicatore nel Negozio); il filtro vero resta comunque lato
 * server, che legge il valore dall'utente autenticato e non dal client.
 */
public record UserResponse(
        Long id,
        String username,
        String email,
        String displayName,
        String avatarUrl,
        String preferredLanguage,
        boolean profilePublic,
        Instant profileVisibilityLockedUntil,
        String steamId,
        String discordUrl,
        String twitchUrl,
        Integer abandonAfterMonths,
        String previousUsername,
        Instant usernameChangeAllowedAt,
        boolean safeSearch
) {
    /** Intervallo minimo tra due cambi di visibilita' del profilo (change request). */
    public static final Duration PROFILE_VISIBILITY_COOLDOWN = Duration.ofHours(48);

    /** Intervallo minimo tra due cambi di username (V16): una volta ogni 2 mesi. */
    public static final Period USERNAME_CHANGE_COOLDOWN = Period.ofMonths(2);

    public static UserResponse from(AppUser user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getDisplayName(),
                user.getAvatarUrl(),
                user.getPreferredLanguage(),
                Boolean.TRUE.equals(user.getIsProfilePublic()),
                visibilityLockedUntil(user),
                user.getSteamId(),
                user.getDiscordUrl(),
                user.getTwitchUrl(),
                user.getAbandonAfterMonths() == null ? null : user.getAbandonAfterMonths().intValue(),
                user.getPreviousUsername(),
                usernameChangeAllowedAt(user),
                // Colonna NOT NULL DEFAULT TRUE: un null qui puo' arrivare solo
                // da un'istanza non ancora persistita, e in quel caso il default
                // corretto e' "filtro attivo".
                !Boolean.FALSE.equals(user.getSafeSearch()));
    }

    /**
     * Istante (con offset) a partire dal quale l'utente potra' cambiare di nuovo
     * lo username, o {@code null} se puo' gia' cambiarlo ora (mai cambiato o
     * cooldown di 2 mesi gia' scaduto). Serve al pannello Impostazioni per
     * disabilitare il campo e indicare quando sara' di nuovo possibile.
     */
    private static Instant usernameChangeAllowedAt(AppUser user) {
        LocalDateTime changedAt = user.getUsernameChangedAt();
        if (changedAt == null) {
            return null;
        }
        LocalDateTime unlockAt = changedAt.plus(USERNAME_CHANGE_COOLDOWN);
        if (!unlockAt.isAfter(LocalDateTime.now())) {
            return null;
        }
        return unlockAt.atZone(ZoneId.systemDefault()).toInstant();
    }

    /**
     * Istante (con offset) fino a cui la visibilita' resta bloccata, o
     * {@code null} se il cooldown non e' attivo. La conversione usa il fuso di
     * sistema, lo stesso con cui e' stato scritto {@code profileVisibilityChangedAt}.
     */
    private static Instant visibilityLockedUntil(AppUser user) {
        LocalDateTime changedAt = user.getProfileVisibilityChangedAt();
        if (changedAt == null) {
            return null;
        }
        LocalDateTime unlockAt = changedAt.plus(PROFILE_VISIBILITY_COOLDOWN);
        if (!unlockAt.isAfter(LocalDateTime.now())) {
            return null;
        }
        return unlockAt.atZone(ZoneId.systemDefault()).toInstant();
    }
}
