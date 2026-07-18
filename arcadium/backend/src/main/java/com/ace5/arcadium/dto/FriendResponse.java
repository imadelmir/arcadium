package com.ace5.arcadium.dto;

import java.time.LocalDateTime;

import com.ace5.arcadium.entity.AppUser;
import com.ace5.arcadium.entity.Friendship;

/**
 * Voce delle liste "amici" e "richieste" (change request Community): descrive
 * sempre la CONTROPARTE rispetto all'utente autenticato, piu' lo stato della
 * relazione vista da lui.
 *
 * @param username     handle della controparte
 * @param displayName  nome visualizzato (nullable)
 * @param avatarUrl    URL dell'avatar (nullable)
 * @param status       stato della relazione dal punto di vista di chi guarda
 * @param createdAt    invio della richiesta
 * @param respondedAt  accettazione (null se ancora in attesa)
 */
public record FriendResponse(
        String username,
        String displayName,
        String avatarUrl,
        FriendshipStatus status,
        LocalDateTime createdAt,
        LocalDateTime respondedAt
) {

    /**
     * Proietta una relazione dal punto di vista di {@code viewerId}: espone
     * l'altro utente e traduce direzione + stato in un {@link FriendshipStatus}.
     */
    public static FriendResponse from(Friendship friendship, Long viewerId) {
        AppUser other = friendship.other(viewerId);
        FriendshipStatus status;
        if (friendship.isAccepted()) {
            status = FriendshipStatus.FRIENDS;
        } else if (friendship.getRequester().getId().equals(viewerId)) {
            status = FriendshipStatus.PENDING_SENT;
        } else {
            status = FriendshipStatus.PENDING_RECEIVED;
        }
        return new FriendResponse(
                other.getUsername(),
                other.getDisplayName(),
                other.getAvatarUrl(),
                status,
                friendship.getCreatedAt(),
                friendship.getRespondedAt());
    }
}
