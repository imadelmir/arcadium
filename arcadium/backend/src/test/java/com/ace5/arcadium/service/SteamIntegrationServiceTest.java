package com.ace5.arcadium.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.ace5.arcadium.config.SteamProperties;
import com.ace5.arcadium.dto.SteamConnectResponse;
import com.ace5.arcadium.dto.SteamSyncResponse;
import com.ace5.arcadium.entity.AppUser;
import com.ace5.arcadium.entity.Backlog;
import com.ace5.arcadium.entity.BacklogStatus;
import com.ace5.arcadium.entity.Game;
import com.ace5.arcadium.exception.ApiException;
import com.ace5.arcadium.repository.AppUserRepository;
import com.ace5.arcadium.repository.BacklogRepository;
import com.ace5.arcadium.repository.BacklogStatusRepository;
import com.ace5.arcadium.repository.GameRepository;
import com.ace5.arcadium.steam.SteamClient;
import com.ace5.arcadium.steam.SteamClient.OwnedGame;
import com.ace5.arcadium.steam.SteamClient.OwnedLibrary;

@ExtendWith(MockitoExtension.class)
class SteamIntegrationServiceTest {

    private static final Long USER_ID = 7L;
    private static final String STEAM_ID = "76561198000000000";
    private static final String CLAIMED_ID = "https://steamcommunity.com/openid/id/" + STEAM_ID;

    @Mock
    private SteamClient steamClient;
    @Mock
    private SteamProperties properties;
    @Mock
    private AppUserRepository userRepository;
    @Mock
    private GameRepository gameRepository;
    @Mock
    private BacklogRepository backlogRepository;
    @Mock
    private BacklogStatusRepository backlogStatusRepository;

    @InjectMocks
    private SteamIntegrationService service;

    @Test
    void connectVerifiesAndLinksSteamId() {
        AppUser user = appUser(USER_ID, null);
        when(steamClient.verifyOpenId(anyMap())).thenReturn(true);
        when(userRepository.findBySteamId(STEAM_ID)).thenReturn(Optional.empty());
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        SteamConnectResponse response = service.connect(USER_ID,
                Map.of("openid.claimed_id", CLAIMED_ID, "openid.mode", "id_res"));

        assertThat(response.steamId()).isEqualTo(STEAM_ID);
        assertThat(user.getSteamId()).isEqualTo(STEAM_ID);
    }

    @Test
    void connectFailsWhenSteamRejectsAssertion() {
        when(steamClient.verifyOpenId(anyMap())).thenReturn(false);

        assertThatThrownBy(() -> service.connect(USER_ID, Map.of("openid.claimed_id", CLAIMED_ID)))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(ex.getMessageKey()).isEqualTo("error.steam.verificationFailed");
                });
    }

    @Test
    void connectRejectsSteamIdAlreadyLinkedToAnotherUser() {
        when(steamClient.verifyOpenId(anyMap())).thenReturn(true);
        when(userRepository.findBySteamId(STEAM_ID)).thenReturn(Optional.of(appUser(99L, STEAM_ID)));

        assertThatThrownBy(() -> service.connect(USER_ID, Map.of("openid.claimed_id", CLAIMED_ID)))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(ex.getMessageKey()).isEqualTo("error.steam.alreadyLinked");
                });
    }

    @Test
    void syncFailsWhenIntegrationNotConfigured() {
        when(properties.isConfigured()).thenReturn(false);

        assertThatThrownBy(() -> service.sync(USER_ID))
                .isInstanceOfSatisfying(ApiException.class, ex ->
                        assertThat(ex.getMessageKey()).isEqualTo("error.steam.notConfigured"));
    }

    @Test
    void syncFailsWhenNoSteamAccountLinked() {
        when(properties.isConfigured()).thenReturn(true);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(appUser(USER_ID, null)));

        assertThatThrownBy(() -> service.sync(USER_ID))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(ex.getMessageKey()).isEqualTo("error.steam.notConnected");
                });
    }

    /**
     * M6-T4: profilo Steam privato. Steam risponde 200 con un involucro vuoto e il
     * client lo segnala con visible=false. Prima diventava un successo con zero
     * giochi; ora deve essere un 422 parlante, cosi' il frontend puo' mostrare
     * l'avviso con il link alla privacy di Steam.
     */
    @Test
    void syncFailsWhenSteamProfileIsPrivate() {
        when(properties.isConfigured()).thenReturn(true);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(appUser(USER_ID, STEAM_ID)));
        when(steamClient.getOwnedLibrary(STEAM_ID)).thenReturn(new OwnedLibrary(false, List.of()));

        assertThatThrownBy(() -> service.sync(USER_ID))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
                    assertThat(ex.getMessageKey()).isEqualTo("error.steam.profilePrivate");
                });

        verify(backlogRepository, never()).save(any(Backlog.class));
    }

    /** Profilo pubblico ma libreria vuota: e' un successo, con zero giochi. */
    @Test
    void syncSucceedsWithZeroGamesWhenPublicLibraryIsEmpty() {
        when(properties.isConfigured()).thenReturn(true);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(appUser(USER_ID, STEAM_ID)));
        when(steamClient.getOwnedLibrary(STEAM_ID)).thenReturn(new OwnedLibrary(true, List.of()));
        when(backlogStatusRepository.findByCode("mai_giocato"))
                .thenReturn(Optional.of(status("mai_giocato")));

        SteamSyncResponse response = service.sync(USER_ID);

        assertThat(response.ownedOnSteam()).isZero();
        assertThat(response.added()).isZero();
        assertThat(response.updated()).isZero();
        assertThat(response.skipped()).isZero();
        verify(backlogRepository, never()).save(any(Backlog.class));
    }

    @Test
    void syncAddsNewUpdatesExistingAndSkipsGamesOutOfCatalog() {
        AppUser user = appUser(USER_ID, STEAM_ID);
        BacklogStatus status = status("mai_giocato");
        Backlog existing = new Backlog(user, game(10L), status); // gioco gia' nel backlog

        when(properties.isConfigured()).thenReturn(true);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(backlogStatusRepository.findByCode("mai_giocato")).thenReturn(Optional.of(status));
        when(steamClient.getOwnedLibrary(STEAM_ID)).thenReturn(new OwnedLibrary(true, List.of(
                new OwnedGame(10L, 120),   // in catalogo, gia' presente -> update
                new OwnedGame(20L, 300),   // in catalogo, nuovo         -> add
                new OwnedGame(99L, 5))));  // fuori catalogo             -> skip
        when(gameRepository.existsById(10L)).thenReturn(true);
        when(gameRepository.existsById(20L)).thenReturn(true);
        when(gameRepository.existsById(99L)).thenReturn(false);
        when(backlogRepository.findById(any())).thenReturn(Optional.empty());
        when(backlogRepository.findById(argThatAppId(10L))).thenReturn(Optional.of(existing));
        lenient().when(userRepository.getReferenceById(anyLong())).thenReturn(user);
        lenient().when(gameRepository.getReferenceById(20L)).thenReturn(game(20L));

        SteamSyncResponse response = service.sync(USER_ID);

        assertThat(response.ownedOnSteam()).isEqualTo(3);
        assertThat(response.added()).isEqualTo(1);
        assertThat(response.updated()).isEqualTo(1);
        assertThat(response.skipped()).isEqualTo(1);
        assertThat(existing.getPlaytimeMinutes()).isEqualTo(120); // tempo aggiornato
        verify(backlogRepository, times(1)).save(any(Backlog.class)); // solo il nuovo
        verify(backlogRepository, never()).delete(any());              // niente cancellazioni
    }

    // ------------------------------------------------------------- helpers

    private static com.ace5.arcadium.entity.BacklogId argThatAppId(long appId) {
        return new com.ace5.arcadium.entity.BacklogId(USER_ID, appId);
    }

    private static AppUser appUser(long id, String steamId) {
        AppUser user = newInstance(AppUser.class);
        setField(user, "id", id);
        if (steamId != null) {
            user.setSteamId(steamId);
        }
        return user;
    }

    private static Game game(long appId) {
        Game game = newInstance(Game.class);
        setField(game, "appId", appId);
        return game;
    }

    private static BacklogStatus status(String code) {
        BacklogStatus status = newInstance(BacklogStatus.class);
        setField(status, "code", code);
        return status;
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
