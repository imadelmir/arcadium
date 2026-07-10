package com.ace5.arcadium.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ace5.arcadium.entity.Achievement;

/**
 * Repository del catalogo achievement (seed).
 *
 * <p>Il motore di sblocco e la pagina achievement (M4-T11) leggono solo i badge
 * attivi ({@code is_active = true}, soft-delete di M1-T7): i badge disattivati
 * non si valutano piu' e non compaiono, ma gli sblocchi storici restano.
 */
public interface AchievementRepository extends JpaRepository<Achievement, Long> {

    /**
     * Achievement attivi, in ordine stabile (per id, cioe' l'ordine del seed):
     * il catalogo da valutare e da mostrare all'utente.
     *
     * @return badge attivi ordinati per id
     */
    List<Achievement> findByIsActiveTrueOrderByIdAsc();

    /**
     * Achievement per codice stabile ('first_game', ...): serve alla share-card
     * (M4-T14) per risolvere il badge da condividere.
     *
     * @param code codice del badge
     * @return il badge, se esiste
     */
    Optional<Achievement> findByCode(String code);
}
