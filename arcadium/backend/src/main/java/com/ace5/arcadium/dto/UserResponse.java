package com.ace5.arcadium.dto;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

import com.ace5.arcadium.entity.AppUser;

/**
 * Vista pubblica dell'utente (M4-T3): mai la password. Usata nelle risposte di
 * auth e da /api/auth/me.
 *
 * <p><b>M6-T4.</b> Aggiunti {@code avatarUrl}, {@code steamId}, {@code discordUrl} e
 * {@code twitchUrl}: il frontend li usa per sapere, gia' al caricamento della
 * sessione, com'e' configurato l'utente. In particolare {@code steamId} serve al
 * pannello Impostazioni per mostrare l'account Steam come collegato anche dopo un
 * refresh della pagina (prima il campo non c'era e il pannello tornava sempre allo
 * stato "non collegato"); {@code avatarUrl} e' letto dall'header per l'avatar.
 * Sono tutti dati gia' visibili all'utente su di se': nessuna informazione
 * sensibile in piu' rispetto a prima.
 *
 * <p><b>Change request privacy — cooldown.</b> {@code profileVisibilityLockedUntil}
 * indica fino a quando la visibilita' del profilo NON puo' essere cambiata di
 * nuovo (48h dall'ultimo cambio). E' {@code null} quando non c'e' cooldown attivo
 * (mai cambiata, oppure gia' trascorse le 48h): il frontend disabilita il toggle
 * solo se il campo e' valorizzato. La durata del cooldown e' definita qui
 * ({@link #PROFILE_VISIBILITY_COOLDOWN}), unica fonte di verita' condivisa col
 * service che applica la regola.
 *
 * <p><b>Fuso orario (fix M6).</b> Il campo e' un {@link Instant} (non un
 * {@code LocalDateTime}): serializzato con offset esplicito ("...Z"), cosi' il
 * frontend con {@code new Date(...)} ricostruisce l'ISTANTE esatto a prescindere
 * dal fuso del JVM (in container spesso UTC) e da quello del browser. Con un
 * {@code LocalDateTime} "senza fuso" i due potevano divergere, mostrando l'orario
 * di sblocco ~2h in anticipo (es. 22h invece di 24h in prova). L'istante si
 * ricostruisce col fuso di sistema, lo stesso con cui {@code changedAt} e' stato
 * scritto ({@code LocalDateTime.now()} nel service).
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
        String twitchUrl
) {
    /** Intervallo minimo tra due cambi di visibilita' del profilo (change request). */
    public static final Duration PROFILE_VISIBILITY_COOLDOWN = Duration.ofHours(48);

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
                user.getTwitchUrl());
    }

    /**
     * Istante (con offset) fino a cui la visibilita' resta bloccata, o
     * {@code null} se il cooldown non e' attivo (mai cambiata o gia' scaduto).
     * La conversione usa il fuso di sistema, lo stesso con cui e' stato scritto
     * {@code profileVisibilityChangedAt}: il risultato e' l'istante assoluto
     * corretto, non un'ora "senza fuso" reinterpretabile dal client.
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
