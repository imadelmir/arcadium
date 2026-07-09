package com.ace5.arcadium.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;

/**
 * Documentazione API con OpenAPI / Swagger (M4-T12).
 *
 * <p>springdoc genera automaticamente la descrizione OpenAPI (a
 * {@code /v3/api-docs}) e la Swagger UI ({@code /swagger-ui.html}) esaminando i
 * controller a runtime. Questa configurazione aggiunge solo cio' che va detto a
 * mano: i metadati dell'API e lo schema di sicurezza JWT.
 *
 * <p>Lo schema {@code bearerAuth} (HTTP bearer, formato JWT) fa comparire il
 * pulsante <em>Authorize</em> nella Swagger UI: si incolla il token ottenuto dal
 * login e si provano gli endpoint protetti direttamente dal browser. La
 * dipendenza springdoc e i path pubblici sono aggiunti in M4-T12 (pom.xml,
 * SecurityConfig).
 */
@Configuration
public class OpenApiConfig {

    private static final String BEARER_SCHEME = "bearerAuth";

    @Bean
    public OpenAPI arcadiumOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Arcadium API")
                        .version("v1")
                        .description("API del backend Arcadium (Milestone 4): catalogo, "
                                + "libreria personale (wishlist e backlog), ricerca utenti, "
                                + "statistiche e achievement. Autenticazione JWT (Bearer).")
                        .license(new License().name("Team ACE5")))
                // Applica di default lo schema JWT a tutti gli endpoint documentati.
                .addSecurityItem(new SecurityRequirement().addList(BEARER_SCHEME))
                .components(new Components().addSecuritySchemes(BEARER_SCHEME,
                        new SecurityScheme()
                                .name(BEARER_SCHEME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}
