package com.ace5.arcadium;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Test di fumo (smoke test) del contesto applicativo (M4-T1; isolato dal DB
 * esterno in M6-T4, BUG D).
 *
 * <p>Verifica che l'intero contesto Spring Boot si carichi con la configurazione
 * reale: auto-configurazione del datasource, Flyway, entita' JPA, sicurezza. E'
 * l'unico test che richiede un database vero; gli altri (service) sono unit puri
 * con Mockito e non toccano il DB.
 *
 * <p><b>Perche' Testcontainers.</b> Prima questo test pretendeva un PostgreSQL
 * gia' in ascolto (docker-compose): senza, {@code mvn test}/{@code mvn package}
 * fallivano e la CI restava bloccata. Ora {@code @Testcontainers} avvia un
 * PostgreSQL 16 reale ma EFFIMERO in un container e {@code @ServiceConnection}
 * lo collega automaticamente al datasource dell'applicazione: Flyway vi applica
 * le stesse migrazioni (V1..V15) e i seed ripetibili, il contesto si valida
 * contro un DB vero e il container viene distrutto a fine test. Nessun DB
 * esterno, coerente con l'approccio "empirico" del progetto.
 *
 * <p>Requisito: un demone Docker disponibile dove girano i test (in dev e in CI:
 * i runner GitHub Actions hanno Docker). L'immagine {@code postgres:16} e' la
 * stessa usata in sviluppo/produzione, quindi estensioni (pg_trgm) e dialetto
 * combaciano.
 */
@SpringBootTest
@Testcontainers
class ArcadiumApplicationTests {

    /**
     * PostgreSQL effimero per il test. {@code @ServiceConnection} inietta URL,
     * utente e password del container nel datasource: nessuna configurazione a
     * mano, nessuna variabile d'ambiente di DB richiesta.
     */
    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Test
    void contextLoads() {
        // Se il contesto non si carica (datasource, Flyway, JPA, security), il
        // test fallisce: e' sufficiente cosi'.
    }
}
