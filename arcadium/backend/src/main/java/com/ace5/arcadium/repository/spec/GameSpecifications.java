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
import com.ace5.arcadium.entity.Tag;

import jakarta.persistence.criteria.CommonAbstractCriteria;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;

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

    /**
     * Etichette (generi e tag Steam) che identificano un titolo per adulti
     * (change request safe search, V18). Sono i valori che il dataset usa
     * davvero, gia' normalizzati in minuscolo per il confronto: il match e'
     * esatto sul nome della lookup, non una LIKE, cosi' "Nudity" esclude ma
     * "Nudity-Free" o un futuro genere che contenga la parola no.
     *
     * <p>Elenco unico per generi e tag: le due tabelle condividono gran parte
     * del vocabolario Steam, e un titolo etichettato in un modo solo va escluso
     * comunque. Per allargare o restringere il filtro basta intervenire qui.
     */
    private static final List<String> ADULT_LABELS = List.of(
            "sexual content",
            "nudity",
            "nsfw",
            "hentai",
            "adult",
            "adult content",
            "mature",
            "eroge",
            "erotic",
            "porn",
            "sexual themes",
            "lgbtq+ sexual content");

    /**
     * Eta' minima (games.required_age) oltre la quale un titolo e' considerato
     * per adulti anche senza etichette esplicite. Terzo segnale del safe search:
     * il dataset non e' sempre coerente nel taggare, ma un 18+ dichiarato lo e'.
     */
    private static final Short ADULT_MIN_AGE = 18;

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
     * @param platform piattaforme richieste: match ESATTO sul set (le
     *                 selezionate devono essere true, le non selezionate
     *                 false), nullable/vuota = nessun filtro
     * @param status   stato commerciale richiesto, nullable
     * @param minPrice prezzo minimo incluso, confrontato con il prezzo EFFETTIVO
     *                 (scontato, V13): effectivePrice &gt;= minPrice, nullable
     * @param maxPrice prezzo massimo incluso, confrontato con il prezzo EFFETTIVO
     *                 (scontato, V13): effectivePrice &lt;= maxPrice, nullable
     * @param europeanOnly se {@code TRUE}, limita ai titoli che iniziano con una
     *                     lettera europea (colonna generata name_starts_latin,
     *                     V8); {@code null}/false non aggiunge alcun predicato
     * @param safeSearch   se {@code TRUE} (change request safe search, V18),
     *                     esclude i titoli per adulti: generi o tag in
     *                     {@link #ADULT_LABELS}, oppure {@code required_age >= 18}.
     *                     {@code null}/false non aggiunge alcun predicato
     */
    public static Specification<Game> build(String q, List<String> genre,
                                            List<String> language, List<String> category,
                                            List<GamePlatform> platform, CatalogGameStatus status,
                                            BigDecimal minPrice, BigDecimal maxPrice,
                                            Boolean europeanOnly, Boolean safeSearch) {
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

            // --- Filtro per piattaforma: match ESATTO sul set di flag selezionato ---
            // Cambiato da OR inclusivo (change request Vins, seconda iterazione):
            // "solo Linux" deve escludere i giochi anche su Windows, non solo
            // includere quelli anche su Linux. Ogni piattaforma SELEZIONATA
            // deve essere true, ogni piattaforma NON selezionata deve essere
            // false: Windows+Linux selezionati -> windows=true AND linux=true
            // AND mac=false (esclude i giochi anche su Mac).
            if (platform != null && !platform.isEmpty()) {
                for (GamePlatform p : GamePlatform.values()) {
                    boolean selected = platform.contains(p);
                    predicates.add(selected
                            ? cb.isTrue(root.<Boolean>get(p.column()))
                            : cb.isFalse(root.<Boolean>get(p.column())));
                }
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

            // --- Safe search (change request, V18): fuori i contenuti per adulti ---
            // Tre segnali in OR fra loro, negati tutti insieme: genere esplicito,
            // tag esplicito, eta' richiesta >= 18.
            //
            // Perche' NOT IN (subquery) e non una JOIN negata: con una JOIN il
            // predicato varrebbe "esiste ALMENO UNA riga di genere che non e'
            // esplicita", che e' vero per qualunque gioco con due o piu' generi —
            // il filtro non escluderebbe nulla. La sotto-query risolve prima
            // l'insieme degli appId da scartare, poi lo si esclude in blocco.
            //
            // Trappola nota del NOT IN: se la sotto-query restituisse anche un
            // solo NULL, l'intero predicato diventerebbe "sconosciuto" e la
            // query non tornerebbe NESSUN gioco. Qui non puo' succedere perche'
            // si seleziona games.app_id, che e' la chiave primaria e quindi NOT
            // NULL — ma se un domani si cambiasse colonna, andrebbe rivisto.
            if (Boolean.TRUE.equals(safeSearch) && query != null) {
                predicates.add(cb.not(root.<Long>get("appId").in(adultByGenre(query, cb))));
                predicates.add(cb.not(root.<Long>get("appId").in(adultByTag(query, cb))));
                // required_age e' nullable: NULL significa "non dichiarata" e non
                // deve escludere il gioco (in SQL, NULL >= 18 non e' falso, e'
                // sconosciuto — senza il ramo isNull il predicato scarterebbe
                // anche i titoli senza classificazione).
                predicates.add(cb.or(
                        cb.isNull(root.<Short>get("requiredAge")),
                        cb.lessThan(root.<Short>get("requiredAge"), ADULT_MIN_AGE)));
            }

            // Nessun filtro → congiunzione vuota (sempre vera): tutto il catalogo.
            return predicates.isEmpty()
                    ? cb.conjunction()
                    : cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * appId dei giochi che hanno almeno un GENERE nell'elenco per adulti
     * (safe search, V18). Sotto-query non correlata: PostgreSQL la valuta una
     * volta sola e il piano resta un anti-join sull'indice di game_genre.
     */
    private static Subquery<Long> adultByGenre(CommonAbstractCriteria query, CriteriaBuilder cb) {
        Subquery<Long> sub = query.subquery(Long.class);
        Root<Game> adult = sub.from(Game.class);
        Join<Game, Genre> genreJoin = adult.join("genres", JoinType.INNER);
        return sub.select(adult.<Long>get("appId"))
                .where(cb.lower(genreJoin.<String>get("name")).in(ADULT_LABELS));
    }

    /** Come {@link #adultByGenre}, ma sui TAG: il dataset etichetta l'uno o l'altro in modo incoerente. */
    private static Subquery<Long> adultByTag(CommonAbstractCriteria query, CriteriaBuilder cb) {
        Subquery<Long> sub = query.subquery(Long.class);
        Root<Game> adult = sub.from(Game.class);
        Join<Game, Tag> tagJoin = adult.join("tags", JoinType.INNER);
        return sub.select(adult.<Long>get("appId"))
                .where(cb.lower(tagJoin.<String>get("name")).in(ADULT_LABELS));
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
