package com.ace5.arcadium.config;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Verifica di connessione al database, eseguita una volta all'avvio.
 *
 * Ricalca il controllo gia' usato nell'ETL Python (src/db/connection.py,
 * check_connection di M3-T5): non scrive nulla, apre una connessione dal pool,
 * legge la versione del server e conta le 15 tabelle del catalogo statico che
 * lo schema M2 deve contenere. Serve come conferma immediata, leggibile nel
 * log di avvio, che il setup di questa task (M4-T1) e' corretto: applicazione
 * su, database raggiungibile, schema presente.
 *
 * Le 15 tabelle di catalogo (M2-T1..T2): games + sei lookup + sette ponte +
 * game_screenshot. Se ne trova meno, le migrazioni M2/M3 non sono state
 * applicate al database (vedi database/README.md).
 *
 * Gira come ApplicationRunner, quindi DOPO che Flyway ha validato la history
 * condivisa e il contesto e' pronto.
 */
@Component
public class DatabaseConnectionCheck implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConnectionCheck.class);

    /** Le 15 tabelle del catalogo statico attese dopo le migrazioni M2 (M2-T1..T2). */
    private static final String[] CATALOG_TABLES = {
        "games", "language", "developer", "publisher", "category", "genre", "tag",
        "game_language", "game_audio_language", "game_developer", "game_publisher",
        "game_category", "game_genre", "game_tag", "game_screenshot"
    };

    private static final String SQL_COUNT_CATALOG =
        "SELECT count(*) FROM pg_tables " +
        "WHERE schemaname = 'public' AND tablename = ANY(?)";

    private final DataSource dataSource;

    public DatabaseConnectionCheck(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(ApplicationArguments args) {
        try (Connection conn = dataSource.getConnection()) {
            String serverVersion = conn.getMetaData().getDatabaseProductName()
                    + " " + conn.getMetaData().getDatabaseProductVersion();
            int found = countCatalogTables(conn);

            log.info("Connessione al database riuscita.");
            log.info("  Destinazione            : {}", conn.getCatalog());
            log.info("  Server                  : {}", serverVersion);
            log.info("  Tabelle catalogo trovate: {}/{}", found, CATALOG_TABLES.length);

            if (found < CATALOG_TABLES.length) {
                log.warn("  ATTENZIONE: mancano tabelle di catalogo. "
                        + "Le migrazioni M2/M3 (Flyway) sono state applicate al database?");
            }
        } catch (SQLException ex) {
            // Non blocca l'avvio: il log rende evidente il problema di connessione.
            // Flyway (se abilitato) avrebbe gia' fermato l'avvio in caso di DB
            // irraggiungibile; questo ramo copre gli altri errori di lettura.
            log.error("Verifica di connessione al database fallita: {}", ex.getMessage());
        }
    }

    private int countCatalogTables(Connection conn) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement(SQL_COUNT_CATALOG)) {
            ps.setArray(1, conn.createArrayOf("text", CATALOG_TABLES));
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getInt(1) : 0;
            }
        }
    }
}
