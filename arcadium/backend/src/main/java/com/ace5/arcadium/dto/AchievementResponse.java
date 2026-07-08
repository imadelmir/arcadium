package com.ace5.arcadium.dto;

import java.time.LocalDateTime;

import com.ace5.arcadium.entity.Achievement;

/**
 * Un achievement dal punto di vista di un utente (M4-T11).
 *
 * <p>Unisce la definizione del badge (dal catalogo seed {@code achievement}) con
 * lo stato dell'utente autenticato: quanto e' avanti sulla metrica
 * ({@link #progress()}), se e' gia' sbloccato e quando. Alimenta la pagina
 * achievement del frontend (M5), che disegna la barra di avanzamento come
 * {@code min(progress / threshold, 1)}.
 *
 * <p>Le etichette sono bilingui IT/EN (come backlog_status e le statistiche): il
 * frontend sceglie la lingua corrente senza una chiamata aggiuntiva.
 *
 * @param code          codice stabile del badge ('first_game', 'finisher_10', ...)
 * @param nameIt        nome del badge in italiano
 * @param nameEn        nome del badge in inglese
 * @param descriptionIt descrizione in italiano (nullable)
 * @param descriptionEn descrizione in inglese (nullable)
 * @param iconUrl       URL dell'icona del badge (nullable)
 * @param metric        metrica misurata ('games_owned', 'playtime_hours', ...)
 * @param threshold     soglia da raggiungere per sbloccare
 * @param points        punti gamification del badge
 * @param progress      valore corrente della metrica per l'utente
 * @param unlocked      true se l'utente ha gia' sbloccato il badge
 * @param unlockedAt    momento dello sblocco (null se non sbloccato)
 */
public record AchievementResponse(
        String code,
        String nameIt,
        String nameEn,
        String descriptionIt,
        String descriptionEn,
        String iconUrl,
        String metric,
        int threshold,
        int points,
        long progress,
        boolean unlocked,
        LocalDateTime unlockedAt
) {

    /**
     * Compone la vista di un achievement per un utente.
     *
     * @param achievement definizione del badge (dal catalogo)
     * @param progress    valore corrente della metrica dell'utente
     * @param unlockedAt  momento dello sblocco, o null se non ancora sbloccato
     * @return la vista utente del badge
     */
    public static AchievementResponse of(Achievement achievement, long progress, LocalDateTime unlockedAt) {
        return new AchievementResponse(
                achievement.getCode(),
                achievement.getNameIt(),
                achievement.getNameEn(),
                achievement.getDescriptionIt(),
                achievement.getDescriptionEn(),
                achievement.getIconUrl(),
                achievement.getMetric(),
                achievement.getThreshold(),
                achievement.getPoints(),
                progress,
                unlockedAt != null,
                unlockedAt);
    }
}
