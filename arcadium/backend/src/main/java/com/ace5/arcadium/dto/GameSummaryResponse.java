package com.ace5.arcadium.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.ace5.arcadium.entity.Game;

/**
 * Vista sintetica di un gioco per la lista del catalogo (M4-T5).
 *
 * <p>Contiene solo i campi che servono alla "card" del catalogo (M5-T8): niente
 * collezioni LAZY (generi, screenshot, sviluppatori...). Questo evita sia il
 * problema N+1 sia i lazy-init con {@code open-in-view: false}: la vista
 * completa del gioco — con generi, lingue e screenshot — è compito
 * dell'endpoint di dettaglio (M4-T6).
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
        boolean linux
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
                Boolean.TRUE.equals(game.getLinux()));
    }
}
