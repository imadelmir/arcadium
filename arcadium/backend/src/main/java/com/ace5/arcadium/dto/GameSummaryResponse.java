package com.ace5.arcadium.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.ace5.arcadium.entity.Game;

/**
 * Vista sintetica di un gioco per la lista del catalogo (M4-T5).
 *
 * <p>Contiene i campi che servono alla "card" del catalogo (M5-T8) più, dalla
 * change request Negozio, i nomi dei generi: mostrarli sulla card rende
 * "coerente" il risultato con i filtri Genere applicati (l'utente vede subito
 * PERCHÉ quel gioco è comparso), invece di doversi fidare a scatola chiusa
 * dell'esito del filtro lato server. Le altre collezioni LAZY (lingue,
 * categorie, sviluppatori, screenshot, ...) restano escluse: la vista
 * completa del gioco è compito dell'endpoint di dettaglio (M4-T6).
 *
 * <p>I generi sono sicuri da includere qui senza reintrodurre il problema N+1:
 * la collezione {@code Game.genres} è annotata {@code @BatchSize(size = 50)},
 * quindi Hibernate la carica in blocchi da 50 giochi per query invece di una
 * query per gioco.
 *
 * @param appId       chiave del gioco (PK naturale dal dataset)
 * @param name        nome del gioco
 * @param headerImage URL della copertina (usata da GameImage, M5-T7)
 * @param releaseDate data di rilascio (nullable)
 * @param price       prezzo (NUMERIC; 0 = gratis)
 * @param discount    sconto percentuale (0-100)
 * @param windows     disponibile su Windows
 * @param mac         disponibile su macOS
 * @param linux       disponibile su Linux
 * @param genres      nomi dei generi del gioco, in ordine alfabetico
 */
public record GameSummaryResponse(
        Long appId,
        String name,
        String headerImage,
        LocalDate releaseDate,
        BigDecimal price,
        Short discount,
        boolean windows,
        boolean mac,
        boolean linux,
        List<String> genres
) {

    /** Proietta un'entità {@link Game} nella sua vista sintetica di catalogo. */
    public static GameSummaryResponse from(Game game) {
        return new GameSummaryResponse(
                game.getAppId(),
                game.getName(),
                game.getHeaderImage(),
                game.getReleaseDate(),
                game.getPrice(),
                game.getDiscount(),
                Boolean.TRUE.equals(game.getWindows()),
                Boolean.TRUE.equals(game.getMac()),
                Boolean.TRUE.equals(game.getLinux()),
                game.getGenres().stream()
                        .map(g -> g.getName())
                        .sorted(String.CASE_INSENSITIVE_ORDER)
                        .toList());
    }
}
