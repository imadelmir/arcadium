package com.ace5.arcadium.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ace5.arcadium.service.ShareCardService;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Share-card degli achievement (M4-T14): pagine HTML con metadati OpenGraph per
 * l'anteprima social (Facebook/Instagram).
 *
 * <ul>
 *   <li>{@code GET /share/achievements/{code}} — card generica di un badge.</li>
 *   <li>{@code GET /share/users/{username}/achievements/{code}} — card personalizzata di uno sblocco.</li>
 * </ul>
 *
 * <p>Endpoint <strong>pubblici</strong> (permitAll in SecurityConfig): i crawler
 * dei social non si autenticano e devono poter leggere i tag {@code og:...}. La
 * risposta e' {@code text/html}. L'URL assoluto della richiesta viene passato al
 * service per valorizzare {@code og:url}.
 */
@RestController
@RequestMapping("/share")
public class ShareController {

    private static final MediaType HTML_UTF8 = MediaType.valueOf("text/html;charset=UTF-8");

    private final ShareCardService shareCardService;

    public ShareController(ShareCardService shareCardService) {
        this.shareCardService = shareCardService;
    }

    /** Card generica di un achievement del catalogo. */
    @GetMapping(value = "/achievements/{code}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> achievementCard(@PathVariable String code,
                                                  HttpServletRequest request) {
        String html = shareCardService.achievementCard(code, request.getRequestURL().toString());
        return ResponseEntity.ok().contentType(HTML_UTF8).body(html);
    }

    /** Card personalizzata: lo sblocco di un badge da parte di un utente. */
    @GetMapping(value = "/users/{username}/achievements/{code}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> userAchievementCard(@PathVariable String username,
                                                      @PathVariable String code,
                                                      HttpServletRequest request) {
        String html = shareCardService.userAchievementCard(username, code, request.getRequestURL().toString());
        return ResponseEntity.ok().contentType(HTML_UTF8).body(html);
    }
}
