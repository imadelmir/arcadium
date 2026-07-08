package com.ace5.arcadium;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Test di fumo (smoke test) del contesto applicativo.
 * Verifica che il contesto Spring Boot si carichi correttamente con la
 * configurazione di M4-T1. Richiede un PostgreSQL raggiungibile (docker-compose)
 * perche' l'auto-configurazione del datasource e Flyway partono all'avvio del
 * contesto. In M4-T2, con l'ingresso delle entita', questo test verra' isolato
 * dal database reale (Testcontainers o profilo di test dedicato).
 */
@SpringBootTest
class ArcadiumApplicationTests {

    @Test
    void contextLoads() {
        // Se il contesto non si carica, il test fallisce: e' sufficiente cosi'.
    }
}
