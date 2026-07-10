package com.ace5.arcadium.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.HtmlUtils;

import com.ace5.arcadium.entity.Achievement;
import com.ace5.arcadium.entity.AppUser;
import com.ace5.arcadium.entity.UserAchievementId;
import com.ace5.arcadium.exception.ApiException;
import com.ace5.arcadium.repository.AchievementRepository;
import com.ace5.arcadium.repository.AppUserRepository;
import com.ace5.arcadium.repository.UserAchievementRepository;

/**
 * Genera le "share-card" degli achievement: pagine HTML con metadati OpenGraph e
 * Twitter Card, pensate per l'anteprima quando un link viene condiviso su
 * Facebook/Instagram (M4-T14).
 *
 * <p>Perche' HTML e non JSON: i crawler dei social leggono i tag
 * {@code <meta property="og:...">} dell'HTML della pagina condivisa. Per questo
 * gli endpoint che la servono sono pubblici (i crawler non si autenticano) e la
 * risposta e' una paginetta con i meta corretti.
 *
 * <p>Due varianti: la card <em>generica</em> di un achievement (dal catalogo) e
 * quella <em>personalizzata</em> "&lt;utente&gt; ha sbloccato &lt;badge&gt;". La
 * seconda riusa il dominio achievement (M4-T11) per verificare lo sblocco e
 * rispetta la privacy del profilo (M4-T9): se il profilo non e' pubblico o il
 * badge non risulta sbloccato, risponde con un 404 neutro (non rivela chi ha
 * sbloccato cosa).
 *
 * <p>I testi usano la lingua predefinita (italiano): un crawler non invia
 * Accept-Language. Tutti i valori dinamici sono sottoposti a escaping HTML.
 */
@Service
public class ShareCardService {

    private static final String TITLE_UNLOCKED = "%s ha sbloccato \u00ab%s\u00bb su Arcadium";
    private static final String TITLE_GENERIC = "Achievement: %s";

    private final AchievementRepository achievementRepository;
    private final AppUserRepository userRepository;
    private final UserAchievementRepository userAchievementRepository;

    /** Immagine di fallback per og:image quando il badge non ha un'icona (iconUrl null). */
    private final String defaultImage;

    public ShareCardService(AchievementRepository achievementRepository,
                            AppUserRepository userRepository,
                            UserAchievementRepository userAchievementRepository,
                            @Value("${arcadium.share.default-image:}") String defaultImage) {
        this.achievementRepository = achievementRepository;
        this.userRepository = userRepository;
        this.userAchievementRepository = userAchievementRepository;
        this.defaultImage = defaultImage;
    }

    /**
     * Card generica di un achievement del catalogo.
     *
     * @param code       codice del badge
     * @param requestUrl URL assoluto della richiesta (per og:url)
     * @return HTML con i metadati OpenGraph del badge
     */
    @Transactional(readOnly = true)
    public String achievementCard(String code, String requestUrl) {
        Achievement achievement = achievementRepository.findByCode(code)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "error.achievement.notFound", code));

        String title = String.format(TITLE_GENERIC, achievement.getNameIt());
        return buildHtml(title, achievement.getDescriptionIt(), imageOf(achievement), requestUrl);
    }

    /**
     * Card personalizzata: "&lt;utente&gt; ha sbloccato &lt;badge&gt;". Disponibile
     * solo se il profilo e' pubblico e il badge risulta sbloccato; altrimenti 404
     * neutro (privacy).
     *
     * @param username   utente che condivide
     * @param code       codice del badge
     * @param requestUrl URL assoluto della richiesta (per og:url)
     * @return HTML con i metadati OpenGraph dello sblocco
     */
    @Transactional(readOnly = true)
    public String userAchievementCard(String username, String code, String requestUrl) {
        AppUser user = userRepository.findByUsername(username)
                .filter(u -> Boolean.TRUE.equals(u.getIsProfilePublic()))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "error.share.notFound"));

        Achievement achievement = achievementRepository.findByCode(code)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "error.share.notFound"));

        boolean unlocked = userAchievementRepository
                .existsById(new UserAchievementId(user.getId(), achievement.getId()));
        if (!unlocked) {
            throw new ApiException(HttpStatus.NOT_FOUND, "error.share.notFound");
        }

        String title = String.format(TITLE_UNLOCKED, displayNameOf(user), achievement.getNameIt());
        return buildHtml(title, achievement.getDescriptionIt(), imageOf(achievement), requestUrl);
    }

    /** Nome da mostrare: displayName se presente, altrimenti username. */
    private String displayNameOf(AppUser user) {
        String displayName = user.getDisplayName();
        return (displayName == null || displayName.isBlank()) ? user.getUsername() : displayName;
    }

    /** URL immagine: icona del badge se presente, altrimenti il fallback configurato (eventualmente vuoto). */
    private String imageOf(Achievement achievement) {
        return achievement.getIconUrl() != null ? achievement.getIconUrl() : defaultImage;
    }

    /**
     * Compone la paginetta HTML con i meta OpenGraph e Twitter. Ogni valore
     * dinamico e' sottoposto a escaping HTML per non rompere il markup ne'
     * permettere injection (es. username con caratteri speciali).
     */
    private String buildHtml(String title, String description, String image, String url) {
        String safeTitle = HtmlUtils.htmlEscape(title == null ? "" : title);
        String safeDescription = HtmlUtils.htmlEscape(description == null ? "" : description);
        String safeUrl = HtmlUtils.htmlEscape(url == null ? "" : url);
        boolean hasImage = image != null && !image.isBlank();
        String safeImage = hasImage ? HtmlUtils.htmlEscape(image) : "";

        StringBuilder html = new StringBuilder(1024);
        html.append("<!DOCTYPE html>\n")
                .append("<html lang=\"it\">\n<head>\n")
                .append("<meta charset=\"UTF-8\">\n")
                .append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n")
                .append("<title>").append(safeTitle).append("</title>\n")
                .append("<meta property=\"og:type\" content=\"website\">\n")
                .append("<meta property=\"og:site_name\" content=\"Arcadium\">\n")
                .append("<meta property=\"og:title\" content=\"").append(safeTitle).append("\">\n")
                .append("<meta property=\"og:description\" content=\"").append(safeDescription).append("\">\n")
                .append("<meta property=\"og:url\" content=\"").append(safeUrl).append("\">\n");
        if (hasImage) {
            html.append("<meta property=\"og:image\" content=\"").append(safeImage).append("\">\n");
        }
        html.append("<meta name=\"twitter:card\" content=\"summary_large_image\">\n")
                .append("<meta name=\"twitter:title\" content=\"").append(safeTitle).append("\">\n")
                .append("<meta name=\"twitter:description\" content=\"").append(safeDescription).append("\">\n");
        if (hasImage) {
            html.append("<meta name=\"twitter:image\" content=\"").append(safeImage).append("\">\n");
        }
        html.append("</head>\n<body>\n<main>\n")
                .append("<h1>").append(safeTitle).append("</h1>\n")
                .append("<p>").append(safeDescription).append("</p>\n")
                .append("</main>\n</body>\n</html>\n");
        return html.toString();
    }
}
