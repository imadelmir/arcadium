package com.ace5.arcadium.repository.spec;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.springframework.data.jpa.domain.Specification;

import com.ace5.arcadium.dto.CatalogGameStatus;
import com.ace5.arcadium.dto.GamePlatform;
import com.ace5.arcadium.entity.Game;
import com.ace5.arcadium.entity.Genre;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;

/**
 * Fabbrica di {@link Specification} per il catalogo giochi (M4-T5).
 *
 * <p>Compone in AND solo i filtri effettivamente presenti: ogni parametro
 * assente non aggiunge alcun predicato. Un unico {@code toPredicate} raccoglie i
 * predicati in lista e li combina, evitando i combinatori
 * ({@code where}/{@code and}) la cui API è cambiata fra le versioni di Spring Data.
 *
 * <p>Il filtro per genere introduce una JOIN verso {@code game_genre → genre};
 * la {@code distinct} è applicata solo alla query principale (non a quella di
 * {@code count}) per non alterare il conteggio, ed è predisposta per un'eventuale
 * estensione multi-valore del filtro.
 */
public final class GameSpecifications {

    private GameSpecifications() {
        // Classe di utilità: nessuna istanza.
    }

    /**
     * Costruisce la specification combinando i filtri non nulli.
     *
     * @param q        sottostringa cercata nel nome (case-insensitive), nullable
     * @param genre    nome del genere (match esatto, case-insensitive), nullable
     * @param platform piattaforma richiesta, nullable
     * @param status   stato commerciale richiesto, nullable
     * @param minPrice prezzo minimo incluso (price &gt;= minPrice), nullable
     * @param maxPrice prezzo massimo incluso (price &lt;= maxPrice), nullable
     */
    public static Specification<Game> build(String q, String genre,
                                            GamePlatform platform, CatalogGameStatus status,
                                            BigDecimal minPrice, BigDecimal maxPrice) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // --- Ricerca testuale sul nome (LIKE %...%, case-insensitive) ---
            if (q != null && !q.isBlank()) {
                String pattern = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.like(cb.lower(root.<String>get("name")), pattern));
            }

            // --- Filtro per genere: JOIN su game_genre → genre.name ---
            if (genre != null && !genre.isBlank()) {
                Join<Game, Genre> genreJoin = root.join("genres", JoinType.INNER);
                predicates.add(cb.equal(
                        cb.lower(genreJoin.<String>get("name")),
                        genre.trim().toLowerCase(Locale.ROOT)));

                // distinct solo sulla query principale, mai su quella di count.
                if (query != null
                        && query.getResultType() != Long.class
                        && query.getResultType() != long.class) {
                    query.distinct(true);
                }
            }

            // --- Filtro per piattaforma: colonna booleana = true ---
            if (platform != null) {
                predicates.add(cb.isTrue(root.<Boolean>get(platform.column())));
            }

            // --- Filtro per stato commerciale (price/discount) ---
            if (status != null) {
                switch (status) {
                    case FREE -> predicates.add(cb.equal(root.<BigDecimal>get("price"), BigDecimal.ZERO));
                    case PAID -> predicates.add(cb.gt(root.<BigDecimal>get("price"), 0));
                    case DISCOUNTED -> predicates.add(cb.gt(root.<Short>get("discount"), 0));
                }
            }

            // --- Fascia di prezzo (change request Negozio): price >= min, price <= max ---
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.<BigDecimal>get("price"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.<BigDecimal>get("price"), maxPrice));
            }

            // Nessun filtro → congiunzione vuota (sempre vera): tutto il catalogo.
            return predicates.isEmpty()
                    ? cb.conjunction()
                    : cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
