# =============================================================================
# Arcadium — ACE5 · Milestone M6 · Task T6
# Immagine del backend Spring Boot per l'ambiente demo (container separato).
#
# Multi-stage:
#   - build:   Maven + JDK 21, compila e impacchetta il jar eseguibile
#              (spring-boot-maven-plugin). Test saltati: lo smoke test
#              @SpringBootTest richiede un DB vivo, che in fase di build non c'e'.
#   - runtime: solo JRE 21 (immagine piccola), utente non-root, il jar.
#
# Le migrazioni Flyway (database/) NON sono copiate qui: vengono MONTATE in
# sola lettura dal compose su /app/database, come gia' fa il servizio flyway
# di M2/M3. Cosi' schema e app restano allineati da un'unica fonte.
# Config e credenziali arrivano tutte da variabili d'ambiente (application.yml).
# =============================================================================

# ---- Stage 1: build ---------------------------------------------------------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# Prima solo il pom, cosi' il layer delle dipendenze si mette in cache e non si
# riscarica a ogni modifica del codice.
COPY pom.xml .
RUN mvn -q -e -B -DskipTests dependency:go-offline

# Poi il sorgente e il package vero e proprio.
COPY src ./src
RUN mvn -q -e -B -DskipTests clean package

# ---- Stage 2: runtime -------------------------------------------------------
FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app

# curl serve solo all'HEALTHCHECK del compose (/actuator/health e' permitAll).
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --uid 10001 arcadium

# Il jar impacchettato (glob: prende il repackaged, non il *.jar.original).
COPY --from=build /build/target/*.jar /app/app.jar

# Percorsi in cui il compose monta database/migrations e database/seed.
ENV ARCADIUM_DB_MIGRATIONS=/app/database/migrations \
    ARCADIUM_DB_SEED=/app/database/seed \
    JAVA_OPTS=""

USER arcadium
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
