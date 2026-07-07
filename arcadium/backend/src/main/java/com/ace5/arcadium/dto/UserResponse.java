package com.ace5.arcadium.dto;

import com.ace5.arcadium.entity.AppUser;

/**
 * Vista pubblica dell'utente (M4-T3): mai la password. Usata nelle risposte di
 * auth e da /api/auth/me.
 */
public record UserResponse(
        Long id,
        String username,
        String email,
        String displayName,
        String preferredLanguage,
        boolean profilePublic
) {
    public static UserResponse from(AppUser user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getDisplayName(),
                user.getPreferredLanguage(),
                Boolean.TRUE.equals(user.getIsProfilePublic()));
    }
}
