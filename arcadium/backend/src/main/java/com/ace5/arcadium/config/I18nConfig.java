package com.ace5.arcadium.config;

import java.util.List;
import java.util.Locale;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;

/**
 * Configurazione della localizzazione dei messaggi server (M4-T4).
 *
 * <p>Espone un {@link LocaleResolver} che sceglie la lingua della risposta a
 * partire dall'header HTTP {@code Accept-Language} della richiesta. Sono
 * supportate solo due lingue, italiano e inglese; qualsiasi altra richiesta
 * (o header assente) ricade sul default italiano.
 *
 * <p>Il {@code MessageSource} che carica i file {@code messages*.properties} e'
 * auto-configurato da Spring Boot (vedi il blocco {@code spring.messages} in
 * application.yml): qui non serve dichiararlo.
 */
@Configuration
public class I18nConfig {

    /** Lingua usata quando Accept-Language e' assente o non supportato. */
    private static final Locale DEFAULT_LOCALE = Locale.ITALIAN;

    /** Lingue effettivamente tradotte dall'applicazione. */
    private static final List<Locale> SUPPORTED_LOCALES =
            List.of(Locale.ITALIAN, Locale.ENGLISH);

    /**
     * Risolutore di lingua basato sull'header {@code Accept-Language}.
     *
     * <p>Il bean DEVE chiamarsi {@code localeResolver}: e' il nome con cui il
     * DispatcherServlet lo cerca. Ad ogni richiesta Spring confronta le lingue
     * gradite dal client con quelle supportate e mette la migliore a
     * disposizione del resto dell'applicazione (LocaleContextHolder), da cui la
     * attingono l'exception handler e l'entry point per tradurre i messaggi.
     */
    @Bean
    public LocaleResolver localeResolver() {
        AcceptHeaderLocaleResolver resolver = new AcceptHeaderLocaleResolver();
        resolver.setDefaultLocale(DEFAULT_LOCALE);
        resolver.setSupportedLocales(SUPPORTED_LOCALES);
        return resolver;
    }
}