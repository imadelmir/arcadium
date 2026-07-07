package com.ace5.arcadium;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point del backend Arcadium.
 *
 * Avvia il contesto Spring Boot: all'avvio, in sequenza, l'auto-configurazione
 * apre il pool di connessioni (HikariCP) verso PostgreSQL, Flyway valida la
 * history condivisa contro le migrazioni M2/M3 (senza rieseguirle) e infine
 * {@link com.ace5.arcadium.config.DatabaseConnectionCheck} stampa un riepilogo
 * di verifica della connessione.
 *
 * In questa task (M4-T1) non ci sono ancora entita', repository o endpoint:
 * lo scopo e' solo che l'applicazione parta e si colleghi al database.
 */
@SpringBootApplication
public class ArcadiumApplication {

    public static void main(String[] args) {
        SpringApplication.run(ArcadiumApplication.class, args);
    }
}
