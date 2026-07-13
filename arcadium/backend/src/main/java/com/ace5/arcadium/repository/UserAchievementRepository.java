package com.ace5.arcadium.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ace5.arcadium.entity.UserAchievement;
import com.ace5.arcadium.entity.UserAchievementId;

/**
 * Sblocchi degli achievement per utente (M4-T11).
 */
public interface UserAchievementRepository extends JpaRepository<UserAchievement, UserAchievementId> {

    /**
     * Gli achievement sbloccati da un utente, con la definizione gia' caricata
     * (join fetch: niente N+1 quando si legge codice, nome e icona del badge).
     */
    @Query("select ua from UserAchievement ua join fetch ua.achievement "
            + "where ua.user.id = :userId")
    List<UserAchievement> findByUserWithAchievement(@Param("userId") Long userId);

    /**
     * Registra uno sblocco solo se non esiste gia' (M6-T4).
     *
     * <p>La chiave primaria della tabella e' {@code (user_id, achievement_id)}: due
     * valutazioni concorrenti dello stesso utente — scenario tutt'altro che teorico,
     * visto che React in sviluppo (StrictMode) monta i componenti due volte e manda
     * due richieste in parallelo — con un normale {@code save()} finivano in
     * violazione di chiave primaria, quindi 500. Qui l'inserimento e' delegato a
     * PostgreSQL con {@code ON CONFLICT DO NOTHING}: il secondo arriva, non trova
     * nulla da fare e non esplode.
     *
     * <p>{@code unlocked_at} lo valorizza il database ({@code DEFAULT now()}), che e'
     * anche l'unico orologio autorevole.
     *
     * @return 1 se lo sblocco e' stato registrato ora, 0 se c'era gia'
     */
    @Modifying
    @Query(value = "INSERT INTO user_achievement (user_id, achievement_id) "
            + "VALUES (:userId, :achievementId) "
            + "ON CONFLICT (user_id, achievement_id) DO NOTHING",
            nativeQuery = true)
    int insertIfAbsent(@Param("userId") Long userId, @Param("achievementId") Long achievementId);
}
