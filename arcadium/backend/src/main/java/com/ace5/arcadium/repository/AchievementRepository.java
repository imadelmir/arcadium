package com.ace5.arcadium.repository;

import java.util.List;

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
}
