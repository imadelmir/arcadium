package com.ace5.arcadium.dto;

import java.time.LocalDateTime;

import com.ace5.arcadium.entity.AppUser;

/**
 * Vista PUBBLICA di un utente (M4-T9): quello che un altro utente puo' vedere di
 * lui nella ricerca e sul profilo.
 *
 * <p>A differenza di {@link UserResponse} (usata da /api/auth/me per l'utente
 * stesso), NON espone l'email ne' altri dati sensibili: solo l'handle, il nome
 * visualizzato, l'avatar, la data di iscrizione e se il profilo e' pubblico.
 * Il flag {@code profilePublic} dice al client se la libreria di questo utente
 * e' consultabile.
 *
 * @param username      handle univoco (identificatore pubblico, usato negli URL)
 * @param displayName   nome visualizzato (nullable)
 * @param avatarUrl     URL dell'avatar (nullable)
 * @param profilePublic true se il profilo e la libreria sono pubblici
 * @param createdAt     data di iscrizione
 * @param previousUsername handle precedente, se l'utente ha cambiato nome (V16); nullable
 */
public record UserSummaryResponse(
        String username,
        String displayName,
        String avatarUrl,
        boolean profilePublic,
        LocalDateTime createdAt,
        String previousUsername
) {

    /** Proietta un {@link AppUser} nella sua vista pubblica. */
    public static UserSummaryResponse from(AppUser user) {
        return new UserSummaryResponse(
                user.getUsername(),
                user.getDisplayName(),
                user.getAvatarUrl(),
                Boolean.TRUE.equals(user.getIsProfilePublic()),
                user.getCreatedAt(),
                user.getPreviousUsername());
    }
}
