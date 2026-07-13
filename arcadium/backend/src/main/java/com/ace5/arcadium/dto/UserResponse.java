package com.ace5.arcadium.dto;

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
 */
public record UserResponse(
        Long id,
        String username,
        String email,
        String displayName,
        String avatarUrl,
        String preferredLanguage,
        boolean profilePublic,
        String steamId,
        String discordUrl,
        String twitchUrl
) {
    public static UserResponse from(AppUser user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getDisplayName(),
                user.getAvatarUrl(),
                user.getPreferredLanguage(),
                Boolean.TRUE.equals(user.getIsProfilePublic()),
                user.getSteamId(),
                user.getDiscordUrl(),
                user.getTwitchUrl());
    }
}
