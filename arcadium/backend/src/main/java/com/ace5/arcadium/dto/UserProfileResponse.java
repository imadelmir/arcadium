package com.ace5.arcadium.dto;

import java.time.LocalDateTime;

import com.ace5.arcadium.entity.AppUser;

/**
 * Profilo di un utente visto da un altro utente (change request Community).
 *
 * <p>A differenza di {@link UserSummaryResponse} (usata nella ricerca) porta con
 * se' lo {@code friendshipStatus}: il client sa subito se mostrare il contenuto
 * del profilo (solo tra amici) oppure il pulsante per inviare / accettare una
 * richiesta. I campi qui esposti sono di sola IDENTITA' (nome, handle, avatar,
 * iscrizione): il CONTENUTO del profilo — libreria, statistiche — vive su
 * endpoint separati, negati a chi non e' amico.
 *
 * @param username         handle univoco
 * @param displayName      nome visualizzato (nullable)
 * @param avatarUrl        URL dell'avatar (nullable)
 * @param profilePublic    true se il profilo e' pubblico
 * @param createdAt        data di iscrizione
 * @param previousUsername handle precedente, se ha cambiato nome (V16); nullable
 * @param friendshipStatus relazione con l'utente autenticato
 */
public record UserProfileResponse(
        String username,
        String displayName,
        String avatarUrl,
        boolean profilePublic,
        LocalDateTime createdAt,
        String previousUsername,
        FriendshipStatus friendshipStatus
) {

    public static UserProfileResponse from(AppUser user, FriendshipStatus status) {
        return new UserProfileResponse(
                user.getUsername(),
                user.getDisplayName(),
                user.getAvatarUrl(),
                Boolean.TRUE.equals(user.getIsProfilePublic()),
                user.getCreatedAt(),
                user.getPreviousUsername(),
                status);
    }
}
