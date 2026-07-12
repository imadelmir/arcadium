package com.ace5.arcadium.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ace5.arcadium.dto.ForgotPasswordRequest;
import com.ace5.arcadium.dto.PasswordResetResponse;
import com.ace5.arcadium.dto.ResetPasswordRequest;
import com.ace5.arcadium.entity.AppUser;
import com.ace5.arcadium.entity.PasswordResetToken;
import com.ace5.arcadium.exception.ApiException;
import com.ace5.arcadium.repository.AppUserRepository;
import com.ace5.arcadium.repository.PasswordResetTokenRepository;

/**
 * Logica di recupero password (M4-T17): richiesta di reset e reimpostazione.
 *
 * <p><b>Passo 1 — forgot:</b> l'utente indica l'email. Se esiste un account, si
 * genera un token casuale, se ne salva l'<em>hash</em> con una scadenza breve e
 * si "invia" il link di reset. La risposta e' SEMPRE lo stesso messaggio
 * generico, esista o no l'email: non si rivela quali indirizzi sono registrati.
 *
 * <p><b>Passo 2 — reset:</b> l'utente arriva dal link col token e sceglie una
 * nuova password. Si ricalcola l'hash del token, si cerca il record, si
 * verifica che sia valido (non usato, non scaduto), si aggiorna la password
 * (hashata) e si consuma il token; per sicurezza si eliminano anche eventuali
 * altri token pendenti dello stesso utente.
 *
 * <p><b>Consegna del link (email):</b> non essendoci ancora un server SMTP
 * configurato, l'invio reale dell'email e' rinviato (produzione). Qui il link
 * viene <em>loggato</em> e, solo se il flag
 * {@code arcadium.security.password-reset.expose-token} e' attivo (dev/demo), il
 * token viene incluso nella risposta cosi' da poter provare il flusso end-to-end
 * senza leggere i log. In produzione il flag e' OFF.
 *
 * <p>Coerenza con l'auth (M4-T3): il token NON e' un JWT ma un valore opaco
 * salvato lato server, cosi' si puo' invalidare (monouso, revocabile) — cosa
 * impossibile con un JWT stateless. Come per le password, del token si conserva
 * solo l'hash.
 */
@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);

    // Sorgente di casualita' crittografica per generare i token (non prevedibili).
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    // Lunghezza del token in byte prima della codifica in Base64 URL-safe.
    private static final int TOKEN_BYTES = 32;

    private final AppUserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final MessageSource messageSource;

    // Durata di validita' del token (default 30 min). Configurabile in application.yml.
    private final Duration tokenTtl;

    // Base URL del frontend, per comporre il link di reset nel log/email.
    private final String frontendBaseUrl;

    // Solo dev/demo: se true, il token finisce anche nella risposta HTTP.
    private final boolean exposeToken;

    public PasswordResetService(
            AppUserRepository userRepository,
            PasswordResetTokenRepository tokenRepository,
            PasswordEncoder passwordEncoder,
            MessageSource messageSource,
            @Value("${arcadium.security.password-reset.token-ttl:30m}") Duration tokenTtl,
            @Value("${arcadium.frontend.base-url:http://localhost:3000}") String frontendBaseUrl,
            @Value("${arcadium.security.password-reset.expose-token:false}") boolean exposeToken) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.messageSource = messageSource;
        this.tokenTtl = tokenTtl;
        this.frontendBaseUrl = frontendBaseUrl;
        this.exposeToken = exposeToken;
    }

    /**
     * Passo 1: richiesta di reset. Genera e "invia" il link se l'email esiste,
     * ma risponde sempre allo stesso modo (niente user enumeration).
     */
    @Transactional
    public PasswordResetResponse forgotPassword(ForgotPasswordRequest request) {
        String genericMessage = translate("password.reset.requested");

        Optional<AppUser> maybeUser = userRepository.findByEmail(request.email());
        if (maybeUser.isEmpty()) {
            // Email non registrata: NON lo si dice. Stessa risposta del caso positivo.
            log.info("Richiesta di reset password per email non registrata (ignorata)");
            return PasswordResetResponse.of(genericMessage);
        }

        AppUser user = maybeUser.get();

        // Un solo link valido alla volta: si eliminano gli eventuali token pendenti.
        tokenRepository.deleteByUser(user);

        // Token opaco casuale + suo hash da salvare.
        String rawToken = generateRawToken();
        String tokenHash = sha256Hex(rawToken);
        LocalDateTime expiresAt = LocalDateTime.now().plus(tokenTtl);
        tokenRepository.save(new PasswordResetToken(user, tokenHash, expiresAt));

        // "Invio" del link: per ora loggato (SMTP reale rinviato alla produzione).
        String resetLink = frontendBaseUrl + "/reimposta-password?token=" + rawToken;
        log.info("Link di reset password per l'utente id={} (scade {}): {}",
                user.getId(), expiresAt, resetLink);

        // Solo in dev/demo (flag ON) il token viene esposto nella risposta.
        String devToken = exposeToken ? rawToken : null;
        return new PasswordResetResponse(genericMessage, devToken);
    }

    /**
     * Passo 2: reimpostazione. Valida il token, aggiorna la password e consuma
     * il token (monouso). Token assente/scaduto/gia' usato -> 400 con messaggio
     * localizzato.
     */
    @Transactional
    public PasswordResetResponse resetPassword(ResetPasswordRequest request) {
        String tokenHash = sha256Hex(request.token());

        PasswordResetToken token = tokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.BAD_REQUEST, "error.password.reset.invalidToken"));

        if (!token.isUsable(LocalDateTime.now())) {
            // Scaduto o gia' usato: stesso messaggio, non si distingue il motivo.
            throw new ApiException(HttpStatus.BAD_REQUEST, "error.password.reset.invalidToken");
        }

        // Aggiorna la password (sempre hashata, mai in chiaro — come in M4-T3).
        AppUser user = token.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        // Consuma il token: valorizza used_at, così lo stesso link non si riusa
        // (token monouso). Gli eventuali token piu' vecchi sono gia' stati
        // rimossi al momento della richiesta (forgotPassword).
        token.markUsed(LocalDateTime.now());
        tokenRepository.save(token);

        log.info("Password reimpostata per l'utente id={}", user.getId());
        return PasswordResetResponse.of(translate("password.reset.success"));
    }

    // --- Helper -------------------------------------------------------------

    /** Genera un token opaco casuale, codificato in Base64 URL-safe senza padding. */
    private String generateRawToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /** Calcola l'hash SHA-256 di una stringa e lo restituisce in esadecimale. */
    private String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            // SHA-256 e' sempre presente nella JVM: se manca, e' un errore di ambiente.
            throw new IllegalStateException("Algoritmo SHA-256 non disponibile", e);
        }
    }

    /** Traduce una chiave di messaggio nella lingua della richiesta (M4-T4). */
    private String translate(String key) {
        return messageSource.getMessage(key, null, LocaleContextHolder.getLocale());
    }
}
