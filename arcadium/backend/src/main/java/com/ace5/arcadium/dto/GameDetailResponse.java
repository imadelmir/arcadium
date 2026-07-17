package com.ace5.arcadium.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.function.Function;

import com.ace5.arcadium.entity.Category;
import com.ace5.arcadium.entity.Developer;
import com.ace5.arcadium.entity.Game;
import com.ace5.arcadium.entity.Genre;
import com.ace5.arcadium.entity.Language;
import com.ace5.arcadium.entity.Publisher;
import com.ace5.arcadium.entity.Tag;

/**
 * Vista completa di un singolo gioco per la pagina di dettaglio (M4-T6).
 *
 * <p>A differenza di {@link GameSummaryResponse} (la "card" del catalogo, M4-T5),
 * qui si espongono gli attributi descrittivi del gioco e le collezioni associate:
 * generi, categorie, tag, sviluppatori, publisher, lingue (testo e audio) e
 * screenshot. E' la vista che alimenta la pagina di dettaglio del frontend (M5-T9).
 *
 * <p>Le lookup (genere, publisher, ...) hanno tutte forma {@code {id, name}} e
 * vengono proiettate nel record annidato {@link Lookup}. Gli screenshot sono
 * semplici URL.
 *
 * <p>ATTENZIONE alle collezioni LAZY: la proiezione {@link #from(Game)} le
 * attraversa, quindi va invocata mentre la sessione JPA e' ancora aperta, cioe'
 * DENTRO il metodo transazionale del service. Con {@code open-in-view: false}
 * (application.yml, M4-T1) farlo fuori solleverebbe una LazyInitializationException.
 */
public record GameDetailResponse(
        Long appId,
        String name,
        LocalDate releaseDate,
        Short requiredAge,
        BigDecimal price,
        Short discount,
        Integer dlcCount,
        String aboutTheGame,
        String reviews,
        String headerImage,
        String website,
        String supportUrl,
        String supportEmail,
        boolean windows,
        boolean mac,
        boolean linux,
        Short metacriticScore,
        String metacriticUrl,
        Integer positive,
        Integer negative,
        Integer recommendations,
        Integer achievementsCount,
        Long ownersMin,
        Long ownersMax,
        Integer peakCcu,
        Integer avgPlaytimeForever,
        Integer medianPlaytimeForever,
        List<Lookup> genres,
        List<Lookup> categories,
        List<Lookup> tags,
        List<Lookup> developers,
        List<Lookup> publishers,
        List<Lookup> supportedLanguages,
        List<Lookup> audioLanguages,
        List<String> screenshots,
        boolean inWishlist,
        boolean inBacklog
) {

    /**
     * Voce di lookup in forma {@code {id, name}} (genere, publisher, tag, ...).
     * Record annidato per tenere in un solo file il contratto del dettaglio.
     */
    public record Lookup(Integer id, String name) {
    }

    /**
     * Proietta un'entita' {@link Game} nella vista completa di dettaglio.
     *
     * <p>Da invocare DENTRO la transazione del service: qui si leggono le
     * collezioni LAZY del gioco (una query aggiuntiva per collezione, accettabile
     * trattandosi di un singolo gioco).
     *
     * <p>I flag {@code inWishlist}/{@code inBacklog} indicano se il gioco è nella
     * wishlist e/o nel backlog dell'utente autenticato che richiede il dettaglio
     * (M6-T4). Li calcola il service con un controllo di esistenza sulla chiave
     * composta, così il frontend riceve la membership insieme al dettaglio e non
     * deve più scaricare le collezioni intere solo per confrontarle.
     */
    public static GameDetailResponse from(Game game, boolean inWishlist, boolean inBacklog) {
        return new GameDetailResponse(
                game.getAppId(),
                game.getName(),
                game.getReleaseDate(),
                game.getRequiredAge(),
                game.getPrice(),
                game.getDiscount(),
                game.getDlcCount(),
                game.getAboutTheGame(),
                game.getReviews(),
                game.getHeaderImage(),
                game.getWebsite(),
                game.getSupportUrl(),
                game.getSupportEmail(),
                Boolean.TRUE.equals(game.getWindows()),
                Boolean.TRUE.equals(game.getMac()),
                Boolean.TRUE.equals(game.getLinux()),
                game.getMetacriticScore(),
                game.getMetacriticUrl(),
                game.getPositive(),
                game.getNegative(),
                game.getRecommendations(),
                game.getAchievementsCount(),
                game.getOwnersMin(),
                game.getOwnersMax(),
                game.getPeakCcu(),
                game.getAvgPlaytimeForever(),
                game.getMedianPlaytimeForever(),
                mapLookup(game.getGenres(), Genre::getId, Genre::getName),
                mapLookup(game.getCategories(), Category::getId, Category::getName),
                mapLookup(game.getTags(), Tag::getId, Tag::getName),
                mapLookup(game.getDevelopers(), Developer::getId, Developer::getName),
                mapLookup(game.getPublishers(), Publisher::getId, Publisher::getName),
                mapLookup(game.getSupportedLanguages(), Language::getId, Language::getName),
                mapLookup(game.getAudioLanguages(), Language::getId, Language::getName),
                List.copyOf(game.getScreenshots()),
                inWishlist,
                inBacklog);
    }

    /**
     * Converte una collezione di lookup ({@code Set<T>}) nella lista di
     * {@link Lookup}. Le lookup non hanno un'interfaccia comune, quindi i due
     * getter (id e name) si passano come funzioni. Il {@code LinkedHashSet} usato
     * nell'entita' preserva l'ordine di inserimento anche nella lista risultante.
     */
    private static <T> List<Lookup> mapLookup(Set<T> source,
                                              Function<T, Integer> idGetter,
                                              Function<T, String> nameGetter) {
        return source.stream()
                .map(element -> new Lookup(idGetter.apply(element), nameGetter.apply(element)))
                .toList();
    }
}