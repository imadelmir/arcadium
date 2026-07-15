package com.ace5.arcadium.repository.spec;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.springframework.data.jpa.domain.Specification;

import com.ace5.arcadium.dto.CatalogGameStatus;
import com.ace5.arcadium.dto.GamePlatform;
import com.ace5.arcadium.entity.Category;
import com.ace5.arcadium.entity.Game;
import com.ace5.arcadium.entity.Genre;
import com.ace5.arcadium.entity.Language;

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
 * <p>Genere/lingua/categoria (change request Negozio: multi-select) introducono
 * una JOIN verso la rispettiva lookup, con semantica <b>OR dentro il filtro,
 * AND fra filtri</b>: un gioco entra se ha ALMENO UNO dei generi selezionati
 * (stesso discorso per lingua e categoria), ma deve soddisfare ogni filtro
 * attivo. È il comportamento standard di un filtro a checkbox negli store
 * (Steam compreso). La {@code distinct} è applicata solo alla query principale
 * (non a quella di {@code count}) per non alterare il conteggio, dato che una
 * JOIN M-a-M può duplicare la riga del gioco.
 */
public final class GameSpecifications {

    private GameSpecifications() {
        // Classe di utilità: nessuna istanza.
    }

    /**
     * Costruisce la specification combinando i filtri non nulli.
     *
     * @param q        sottostringa cercata nel nome (case-insensitive), nullable
     * @param genre    nomi di genere selezionati (OR fra loro), nullable/vuoto = nessun filtro
     * @param language nomi di lingua selezionati (OR fra loro), nullable/vuoto = nessun filtro
     * @param category nomi di categoria selezionati (OR fra loro), nullable/vuoto = nessun filtro
     * @param platform piattaforma richiesta, nullable
     * @param status   stato commerciale richiesto, nullable
     * @param minPrice prezzo minimo incluso, confrontato con il prezzo EFFETTIVO
     *                 (scontato, V13): effectivePrice &gt;= minPrice, nullable
     * @param maxPrice prezzo massimo incluso, confrontato con il prezzo EFFETTIVO
     *                 (scontato, V13): effectivePrice &lt;= maxPrice, nullable
     * @param europeanOnly se {@code TRUE}, limita ai titoli che iniziano con una
     *                     lettera europea (colonna generata name_starts_latin,
     *                     V8); {@code null}/false non aggiunge alcun predicato
     */
    public static Specification<Game> build(String q, List<String> genre,
                                            List<String> language, List<String> category,
                                            GamePlatform platform, CatalogGameStatus status,
                                            BigDecimal minPrice, BigDecimal maxPrice,
                                            Boolean europeanOnly) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // --- Ricerca testuale sul nome (LIKE %...%, case-insensitive) ---
            if (q != null && !q.isBlank()) {
                String pattern = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.like(cb.lower(root.<String>get("name")), pattern));
            }

            // --- Filtri multi-valore con JOIN sulle lookup (genere / lingua / categoria) ---
            // IN case-insensitive sui nomi selezionati: OR dentro il filtro (un
            // gioco con ALMENO UNO dei valori entra), AND fra filtri diversi.
            // Quando è attivo almeno uno di questi filtri la query principale usa
            // DISTINCT (una JOIN M-a-M può duplicare la riga del gioco); mai sulla
            // query di count.
            boolean joinFilter = false;

            List<String> genreValues = normalized(genre);
            if (!genreValues.isEmpty()) {
                Join<Game, Genre> genreJoin = root.join("genres", JoinType.INNER);
                predicates.add(cb.lower(genreJoin.<String>get("name")).in(genreValues));
                joinFilter = true;
            }

            List<String> languageValues = normalized(language);
            if (!languageValues.isEmpty()) {
                Join<Game, Language> languageJoin = root.join("supportedLanguages", JoinType.INNER);
                predicates.add(cb.lower(languageJoin.<String>get("name")).in(languageValues));
                joinFilter = true;
            }

            List<String> categoryValues = normalized(category);
            if (!categoryValues.isEmpty()) {
                Join<Game, Category> categoryJoin = root.join("categories", JoinType.INNER);
                predicates.add(cb.lower(categoryJoin.<String>get("name")).in(categoryValues));
                joinFilter = true;
            }

            // distinct solo sulla query principale, mai su quella di count.
            if (joinFilter && query != null
                    && query.getResultType() != Long.class
                    && query.getResultType() != long.class) {
                query.distinct(true);
            }

            // --- Filtro per piattaforma: colonna booleana = true ---
            if (platform != null) {
                predicates.add(cb.isTrue(root.<Boolean>get(platform.column())));
            }

            // --- Filtro per stato commerciale (price/discount) ---
            // FREE/PAID guardano il prezzo EFFETTIVO (V13): un gioco scontato
            // al 100% e' "Gratis" adesso, non "A pagamento" sul listino.
            if (status != null) {
                switch (status) {
                    case FREE -> predicates.add(cb.equal(root.<BigDecimal>get("effectivePrice"), BigDecimal.ZERO));
                    case PAID -> predicates.add(cb.gt(root.<BigDecimal>get("effectivePrice"), 0));
                    case DISCOUNTED -> predicates.add(cb.gt(root.<Short>get("discount"), 0));
                }
            }

            // --- Fascia di prezzo (change request Negozio): confronta il prezzo
            // EFFETTIVO (V13, dopo lo sconto) — lo stesso che la card mostra —
            // non il prezzo di listino. Corregge il bug per cui un gioco
            // scontato poteva risultare dentro la fascia sui dati grezzi ma
            // apparire fuori range sullo schermo.
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.<BigDecimal>get("effectivePrice"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.<BigDecimal>get("effectivePrice"), maxPrice));
            }

            // --- Vetrina Negozio: solo titoli che iniziano con lettera europea ---
            // Attivo solo quando richiesto (ricerca vuota): il flag generato
            // name_starts_latin (V8) è true per i titoli latini/europei.
            if (Boolean.TRUE.equals(europeanOnly)) {
                predicates.add(cb.isTrue(root.<Boolean>get("nameStartsLatin")));
            }

            // Nessun filtro → congiunzione vuota (sempre vera): tutto il catalogo.
            return predicates.isEmpty()
                    ? cb.conjunction()
                    : cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /** Ripulisce una lista di selezioni: scarta null/vuoti, normalizza per il match case-insensitive. */
    private static List<String> normalized(List<String> values) {
        if (values == null || values.isEmpty()) {
            return List.of();
        }
        return values.stream()
                .filter(v -> v != null && !v.isBlank())
                .map(v -> v.trim().toLowerCase(Locale.ROOT))
                .toList();
    }
}
