package com.ace5.arcadium.dto;

/**
 * Piattaforma su cui gira un gioco, usata come filtro del catalogo (M4-T5).
 *
 * <p>Ogni costante mappa il nome della colonna booleana corrispondente sulla
 * tabella {@code games} ({@code windows}/{@code mac}/{@code linux}): la
 * {@link com.ace5.arcadium.repository.spec.GameSpecifications} lo usa per
 * costruire il predicato {@code <colonna> = true} senza ripetere stringhe magiche.
 *
 * <p>Il parametro di richiesta arriva come stringa (es. {@code ?platform=windows})
 * ed è convertito in modo case-insensitive dal {@code GameService}; un valore
 * non riconosciuto produce un 400 localizzato (IT/EN), coerente con M4-T4.
 */
public enum GamePlatform {

    WINDOWS("windows"),
    MAC("mac"),
    LINUX("linux");

    private final String column;

    GamePlatform(String column) {
        this.column = column;
    }

    /** Nome dell'attributo dell'entità {@code Game} (= colonna su {@code games}). */
    public String column() {
        return column;
    }
}
