package com.ace5.arcadium.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
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

import com.ace5.arcadium.dto.IntegrationLinksRequest;
import com.ace5.arcadium.dto.IntegrationLinksResponse;
import com.ace5.arcadium.entity.AppUser;
import com.ace5.arcadium.exception.ApiException;
import com.ace5.arcadium.repository.AppUserRepository;

/**
 * Test unitari dell'{@link IntegrationService} (M4-T15).
 *
 * <p>Verificano, senza database, che la lettura restituisca i link correnti, che
 * l'aggiornamento accetti e normalizzi URL Discord/Twitch validi (compresi www e
 * discord.gg), che un valore vuoto azzeri il link e che un URL di dominio errato
 * o malformato produca un 400 localizzato.
 */
@ExtendWith(MockitoExtension.class)
class IntegrationServiceTest {

    private static final Long USER_ID = 7L;

    @Mock
    private AppUserRepository userRepository;

    private IntegrationService service;

    @BeforeEach
    void setUp() {
        service = new IntegrationService(userRepository);
    }

    @Test
    void getLinksReturnsCurrentValues() {
        AppUser user = appUser(USER_ID);
        user.setDiscordUrl("https://discord.gg/abc");
        user.setTwitchUrl("https://twitch.tv/chan");
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        IntegrationLinksResponse response = service.getLinks(USER_ID);

        assertThat(response.discordUrl()).isEqualTo("https://discord.gg/abc");
        assertThat(response.twitchUrl()).isEqualTo("https://twitch.tv/chan");
    }

    @Test
    void updateAcceptsValidDiscordAndTwitchLinks() {
        AppUser user = appUser(USER_ID);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        IntegrationLinksResponse response = service.updateLinks(USER_ID,
                new IntegrationLinksRequest("https://www.discord.com/users/42", "https://twitch.tv/mychan"));

        assertThat(user.getDiscordUrl()).isEqualTo("https://www.discord.com/users/42");
        assertThat(user.getTwitchUrl()).isEqualTo("https://twitch.tv/mychan");
        assertThat(response.discordUrl()).isEqualTo("https://www.discord.com/users/42");
    }

    @Test
    void updateWithBlankValuesClearsLinks() {
        AppUser user = appUser(USER_ID);
        user.setDiscordUrl("https://discord.gg/old");
        user.setTwitchUrl("https://twitch.tv/old");
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        service.updateLinks(USER_ID, new IntegrationLinksRequest("   ", null));

        assertThat(user.getDiscordUrl()).isNull();
        assertThat(user.getTwitchUrl()).isNull();
    }

    @Test
    void updateRejectsDiscordLinkFromWrongDomain() {
        AppUser user = appUser(USER_ID);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> service.updateLinks(USER_ID,
                new IntegrationLinksRequest("https://evil.example/discord", null)))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(ex.getMessageKey()).isEqualTo("error.integration.discord.invalid");
                });
    }

    @Test
    void updateRejectsMalformedTwitchLink() {
        AppUser user = appUser(USER_ID);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> service.updateLinks(USER_ID,
                new IntegrationLinksRequest(null, "not-a-url")))
                .isInstanceOfSatisfying(ApiException.class, ex ->
                        assertThat(ex.getMessageKey()).isEqualTo("error.integration.twitch.invalid"));
    }

    // ------------------------------------------------------------- helpers

    private static AppUser appUser(long id) {
        try {
            Constructor<AppUser> constructor = AppUser.class.getDeclaredConstructor();
            constructor.setAccessible(true);
            AppUser user = constructor.newInstance();
            Field field = AppUser.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(user, id);
            return user;
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException("Impossibile costruire AppUser di test", e);
        }
    }
}
