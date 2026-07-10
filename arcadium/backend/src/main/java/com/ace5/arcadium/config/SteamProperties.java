package com.ace5.arcadium.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Configurazione dell'integrazione Steam (M4-T16).
 *
 * <p>Valori da ambiente (dev: default locali):
 * <ul>
 *   <li>{@code arcadium.steam.api-key} (STEAM_API_KEY) — chiave della Steam Web
 *       API, necessaria per la sync della libreria. Assente = sync non configurata.</li>
 *   <li>{@code arcadium.steam.realm} — il realm OpenID (dominio dell'app).</li>
 *   <li>{@code arcadium.steam.return-url} — l'URL a cui Steam rimanda dopo il
 *       login (una pagina del frontend che poi inoltra i parametri al backend).</li>
 * </ul>
 *
 * <p>La chiave non e' versionata: vive solo in ambiente, come DB_PASSWORD e il
 * segreto JWT.
 */
@Component
public class SteamProperties {

    private final String apiKey;
    private final String realm;
    private final String returnUrl;

    public SteamProperties(
            @Value("${arcadium.steam.api-key:}") String apiKey,
            @Value("${arcadium.steam.realm:http://localhost:8080}") String realm,
            @Value("${arcadium.steam.return-url:http://localhost:3000/steam/callback}") String returnUrl) {
        this.apiKey = apiKey;
        this.realm = realm;
        this.returnUrl = returnUrl;
    }

    public String getApiKey() {
        return apiKey;
    }

    public String getRealm() {
        return realm;
    }

    public String getReturnUrl() {
        return returnUrl;
    }

    /** True se la chiave API e' presente: la sync della libreria e' possibile. */
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }
}
