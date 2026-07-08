package com.ace5.arcadium.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ace5.arcadium.entity.UserAchievement;
import com.ace5.arcadium.entity.UserAchievementId;

/**
 * Repository degli sblocchi (chiave composta user_id+achievement_id).
 *
 * <p>save/existsById (ereditati, chiave {@link UserAchievementId}) coprono lo
 * sblocco e il controllo di gia'-sbloccato del motore (M4-T11). La lettura degli
 * sblocchi di un utente usa una query con fetch join sull'achievement, per
 * evitare l'N+1 quando ogni sblocco viene proiettato con la sua definizione.
 */
public interface UserAchievementRepository extends JpaRepository<UserAchievement, UserAchievementId> {

    /**
     * Sblocchi di un utente, con l'achievement gia' caricato (join fetch), per
     * sapere quali badge ha e quando li ha sbloccati.
     *
     * @param userId id dell'utente
     * @return sblocchi dell'utente, con la definizione del badge
     */
    @Query("select ua from UserAchievement ua join fetch ua.achievement "
            + "where ua.user.id = :userId")
    List<UserAchievement> findByUserWithAchievement(@Param("userId") Long userId);
}
