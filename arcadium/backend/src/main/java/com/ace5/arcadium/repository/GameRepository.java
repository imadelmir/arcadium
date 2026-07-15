package com.ace5.arcadium.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

import com.ace5.arcadium.entity.Game;

/**
 * Repository del catalogo giochi (chiave naturale app_id).
 *
 * <p>Estende {@link JpaSpecificationExecutor} per il catalogo filtrabile (M4-T5):
 * i filtri dinamici (nome, genere, piattaforma, stato) sono costruiti come
 * {@link org.springframework.data.jpa.domain.Specification} in
 * {@code GameSpecifications} ed eseguiti con {@code findAll(spec, pageable)}.
 */
public interface GameRepository extends JpaRepository<Game, Long>, JpaSpecificationExecutor<Game> {

    // --- Liste per i menu a tendina dei filtri del Negozio (change request) ---
    // Restituiscono i NOMI distinti di genere/categoria/lingua, in ordine
    // alfabetico case-insensitive (lower(...) evita che la maiuscola scavalchi
    // la minuscola con la collation di default, come per games.name in V6/V7).
    // Il JOIN da Game garantisce STRUTTURALMENTE che compaiano solo i valori
    // associati ad almeno un gioco: una lingua/genere/categoria senza giochi
    // non può comparire in questi risultati.

    @Query("select g.name from Game gm join gm.genres g "
            + "group by g.name order by lower(g.name) asc")
    List<String> findGenreNames();

    @Query("select c.name from Game gm join gm.categories c "
            + "group by c.name order by lower(c.name) asc")
    List<String> findCategoryNames();

    @Query("select l.name from Game gm join gm.supportedLanguages l "
            + "group by l.name order by lower(l.name) asc")
    List<String> findLanguageNames();
}
