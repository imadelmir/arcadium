package com.ace5.arcadium.service;

import java.net.URI;
import java.util.Locale;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ace5.arcadium.dto.IntegrationLinksRequest;
import com.ace5.arcadium.dto.IntegrationLinksResponse;
import com.ace5.arcadium.entity.AppUser;
import com.ace5.arcadium.exception.ApiException;
import com.ace5.arcadium.repository.AppUserRepository;

/**
 * Link di integrazione social dell'utente autenticato (M4-T15): lettura e
 * aggiornamento di Discord e Twitch (i campi {@code discord_url} /
 * {@code twitch_url} di app_user, M2-T7). Lo Steam connect e' un'altra cosa
 * (M4-T16).
 *
 * <p>Come backlog e wishlist, tutto e' "scoped" all'utente ricavato dal token.
 * L'aggiornamento e' una sostituzione (PUT): un link vuoto o assente azzera il
 * valore. Ogni link non vuoto viene validato — deve essere un URL http(s) del
 * dominio corretto (Discord o Twitch) — con 400 localizzato in caso contrario,
 * per non salvare link fuorvianti o non-URL.
 */
@Service
public class IntegrationService {

    private static final Set<String> DISCORD_HOSTS = Set.of("discord.gg", "discord.com", "discordapp.com");
    private static final Set<String> TWITCH_HOSTS = Set.of("twitch.tv");

    private final AppUserRepository userRepository;

    public IntegrationService(AppUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Link social attuali dell'utente.
     *
     * @param userId id dell'utente autenticato
     * @return i suoi link Discord/Twitch
     */
    @Transactional(readOnly = true)
    public IntegrationLinksResponse getLinks(Long userId) {
        return IntegrationLinksResponse.from(loadUser(userId));
    }

    /**
     * Sostituisce i link social dell'utente (validando i valori non vuoti).
     *
     * @param userId  id dell'utente autenticato
     * @param request nuovo stato dei link
     * @return i link aggiornati
     */
    @Transactional
    public IntegrationLinksResponse updateLinks(Long userId, IntegrationLinksRequest request) {
        AppUser user = loadUser(userId);
        user.setDiscordUrl(validate(request.discordUrl(), DISCORD_HOSTS, "error.integration.discord.invalid"));
        user.setTwitchUrl(validate(request.twitchUrl(), TWITCH_HOSTS, "error.integration.twitch.invalid"));
        // dirty checking: l'entita' e' gestita nella transazione, l'update parte al commit.
        return IntegrationLinksResponse.from(user);
    }

    private AppUser loadUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "error.user.notFound", userId));
    }

    /**
     * Normalizza e valida un link social. Vuoto/assente -&gt; null (azzera). Se
     * presente, dev'essere un URL http(s) con host fra quelli ammessi per la
     * piattaforma; altrimenti 400 localizzato.
     */
    private String validate(String raw, Set<String> allowedHosts, String errorKey) {
        if (raw == null) {
            return null;
        }
        String trimmed = raw.trim();
        if (trimmed.isEmpty()) {
            return null;
        }

        URI uri;
        try {
            uri = URI.create(trimmed);
        } catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, errorKey);
        }

        String scheme = uri.getScheme();
        String host = uri.getHost();
        boolean httpScheme = scheme != null
                && (scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"));
        if (!httpScheme || host == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, errorKey);
        }

        String normalizedHost = host.toLowerCase(Locale.ROOT);
        if (normalizedHost.startsWith("www.")) {
            normalizedHost = normalizedHost.substring(4);
        }
        if (!allowedHosts.contains(normalizedHost)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, errorKey);
        }
        return trimmed;
    }
}
