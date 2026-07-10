package com.ace5.arcadium.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.ace5.arcadium.entity.Achievement;
import com.ace5.arcadium.entity.AppUser;
import com.ace5.arcadium.entity.UserAchievementId;
import com.ace5.arcadium.exception.ApiException;
import com.ace5.arcadium.repository.AchievementRepository;
import com.ace5.arcadium.repository.AppUserRepository;
import com.ace5.arcadium.repository.UserAchievementRepository;

/**
 * Test unitari del {@link ShareCardService} (M4-T14).
 *
 * <p>Verificano, senza database, che la card generica contenga i metadati
 * OpenGraph attesi, che la card personalizzata riporti il nome dell'utente solo
 * quando il profilo e' pubblico e il badge e' sbloccato, e che i casi mancanti
 * (badge o utente inesistente, profilo privato, badge non sbloccato) diano un
 * 404 (neutro per la variante personalizzata, per non rivelare dati).
 */
@ExtendWith(MockitoExtension.class)
class ShareCardServiceTest {

    private static final String URL = "https://arcadium.example/share/achievements/first_game";

    @Mock
    private AchievementRepository achievementRepository;
    @Mock
    private AppUserRepository userRepository;
    @Mock
    private UserAchievementRepository userAchievementRepository;

    private ShareCardService service;

    @BeforeEach
    void setUp() {
        service = new ShareCardService(achievementRepository, userRepository,
                userAchievementRepository, "");
    }

    @Test
    void achievementCardBuildsOpenGraphHtml() {
        when(achievementRepository.findByCode("first_game"))
                .thenReturn(Optional.of(achievement(1L, "first_game", "Primo gioco",
                        "Aggiungi il primo gioco.", "https://img.example/first.png")));

        String html = service.achievementCard("first_game", URL);

        assertThat(html).contains("<!DOCTYPE html>");
        assertThat(html).contains("property=\"og:type\" content=\"website\"");
        assertThat(html).contains("property=\"og:title\" content=\"Achievement: Primo gioco\"");
        assertThat(html).contains("property=\"og:description\" content=\"Aggiungi il primo gioco.\"");
        assertThat(html).contains("property=\"og:url\" content=\"" + URL + "\"");
        assertThat(html).contains("property=\"og:image\" content=\"https://img.example/first.png\"");
        assertThat(html).contains("name=\"twitter:card\" content=\"summary_large_image\"");
    }

    @Test
    void achievementCardUnknownCodeThrowsNotFound() {
        when(achievementRepository.findByCode("nope")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.achievementCard("nope", URL))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(ex.getMessageKey()).isEqualTo("error.achievement.notFound");
                });
    }

    @Test
    void userAchievementCardPersonalizesWhenPublicAndUnlocked() {
        when(userRepository.findByUsername("yassin"))
                .thenReturn(Optional.of(appUser(7L, "yassin", "Yassin", true)));
        when(achievementRepository.findByCode("first_game"))
                .thenReturn(Optional.of(achievement(1L, "first_game", "Primo gioco", "desc", null)));
        when(userAchievementRepository.existsById(any(UserAchievementId.class))).thenReturn(true);

        String html = service.userAchievementCard("yassin", "first_game", URL);

        // il titolo cita utente e badge (le virgolette basse sono HTML-escaped: &laquo; / &raquo;)
        assertThat(html).contains("Yassin ha sbloccato");
        assertThat(html).contains("Primo gioco");
        assertThat(html).contains("su Arcadium");
        assertThat(html).contains("property=\"og:title\"");
        // nessuna icona -> og:image assente (default vuoto)
        assertThat(html).doesNotContain("og:image");
    }

    @Test
    void userAchievementCardPrivateProfileThrowsNeutralNotFound() {
        when(userRepository.findByUsername("yassin"))
                .thenReturn(Optional.of(appUser(7L, "yassin", "Yassin", false)));

        assertThatThrownBy(() -> service.userAchievementCard("yassin", "first_game", URL))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(ex.getMessageKey()).isEqualTo("error.share.notFound");
                });
    }

    @Test
    void userAchievementCardNotUnlockedThrowsNeutralNotFound() {
        when(userRepository.findByUsername("yassin"))
                .thenReturn(Optional.of(appUser(7L, "yassin", "Yassin", true)));
        when(achievementRepository.findByCode("first_game"))
                .thenReturn(Optional.of(achievement(1L, "first_game", "Primo gioco", "desc", null)));
        when(userAchievementRepository.existsById(any(UserAchievementId.class))).thenReturn(false);

        assertThatThrownBy(() -> service.userAchievementCard("yassin", "first_game", URL))
                .isInstanceOfSatisfying(ApiException.class, ex ->
                        assertThat(ex.getMessageKey()).isEqualTo("error.share.notFound"));
    }

    // ------------------------------------------------------------- helpers

    private static Achievement achievement(long id, String code, String nameIt,
                                           String descriptionIt, String iconUrl) {
        Achievement achievement = newInstance(Achievement.class);
        setField(achievement, "id", id);
        setField(achievement, "code", code);
        setField(achievement, "nameIt", nameIt);
        setField(achievement, "descriptionIt", descriptionIt);
        setField(achievement, "iconUrl", iconUrl);
        return achievement;
    }

    private static AppUser appUser(long id, String username, String displayName, boolean isPublic) {
        AppUser user = newInstance(AppUser.class);
        setField(user, "id", id);
        setField(user, "username", username);
        setField(user, "displayName", displayName);
        setField(user, "isProfilePublic", isPublic);
        return user;
    }

    private static <T> T newInstance(Class<T> type) {
        try {
            Constructor<T> constructor = type.getDeclaredConstructor();
            constructor.setAccessible(true);
            return constructor.newInstance();
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException("Impossibile costruire " + type.getSimpleName(), e);
        }
    }

    private static void setField(Object target, String name, Object value) {
        try {
            Field field = target.getClass().getDeclaredField(name);
            field.setAccessible(true);
            field.set(target, value);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException("Campo non valorizzabile: " + name, e);
        }
    }
}
