package com.ace5.arcadium.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.ace5.arcadium.dto.SteamConnectRequest;
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
import com.ace5.arcadium.security.SecretCipher;
import com.ace5.arcadium.steam.SteamClient;
import com.ace5.arcadium.steam.SteamClient.OwnedGame;
import com.ace5.arcadium.steam.SteamClient.OwnedLibrary;
import com.ace5.arcadium.steam.SteamClient.SteamProfile;

/**
 * Test del servizio di integrazione Steam, senza rete: {@link SteamClient} e
 * {@link SecretCipher} sono mockati.
 *
 * <p>Coprono le due meta' del comportamento: il <b>collegamento</b> (forme
 * accettate del profilo, validazione della chiave, unicita' dell'account) e la
 * <b>sincronizzazione</b> (profilo privato, libreria vuota, aggiunte/aggiornamenti
 * e giochi fuori catalogo).
 */
@ExtendWith(MockitoExtension.class)
class SteamIntegrationServiceTest {

    private static final Long USER_ID = 7L;
    private static final String STEAM_ID = "76561198000000000";
    private static final String API_KEY = "A1B2C3D4E5F60718293A4B5C6D7E8F90";
    private static final String API_KEY_ENC = "chiave-cifrata";
    private static final String PERSONA = "GamerACE5";

    @Mock
    private SteamClient steamClient;
    @Mock
    private SecretCipher cipher;
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

    // ------------------------------------------------------------------ connect

    /**
     * Lo SteamID a 17 cifre si usa cosi' com'e': nessuna chiamata a
     * ResolveVanityURL. La chiave viene salvata solo cifrata.
     */
    @Test
    void connectAcceptsSteamId64AndStoresEncryptedKey() {
        AppUser user = appUser(USER_ID, null);
        when(steamClient.getPlayerSummary(API_KEY, STEAM_ID))
                .thenReturn(Optional.of(new SteamProfile(STEAM_ID, PERSONA)));
        when(userRepository.findBySteamId(STEAM_ID)).thenReturn(Optional.empty());
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(cipher.encrypt(API_KEY)).thenReturn(API_KEY_ENC);

        SteamConnectResponse response = service.connect(USER_ID,
                new SteamConnectRequest(STEAM_ID, API_KEY));

        assertThat(response.steamId()).isEqualTo(STEAM_ID);
        assertThat(response.personaName()).isEqualTo(PERSONA);
        assertThat(user.getSteamId()).isEqualTo(STEAM_ID);
        assertThat(user.getSteamApiKey()).isEqualTo(API_KEY_ENC); // mai in chiaro
        verify(steamClient, never()).resolveVanityUrl(anyString(), anyString());
    }

    /** L'URL del profilo con l'ID numerico dentro viene normalizzato a SteamID64. */
    @Test
    void connectAcceptsProfileUrl() {
        when(steamClient.getPlayerSummary(API_KEY, STEAM_ID))
                .thenReturn(Optional.of(new SteamProfile(STEAM_ID, PERSONA)));
        when(userRepository.findBySteamId(STEAM_ID)).thenReturn(Optional.empty());
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(appUser(USER_ID, null)));
        when(cipher.encrypt(API_KEY)).thenReturn(API_KEY_ENC);

        SteamConnectResponse response = service.connect(USER_ID, new SteamConnectRequest(
                "https://steamcommunity.com/profiles/" + STEAM_ID + "/", API_KEY));

        assertThat(response.steamId()).isEqualTo(STEAM_ID);
    }

    /** Il nome personalizzato viene risolto da Steam in SteamID64. */
    @Test
    void connectResolvesVanityName() {
        when(steamClient.resolveVanityUrl(API_KEY, "gamerace5")).thenReturn(Optional.of(STEAM_ID));
        when(steamClient.getPlayerSummary(API_KEY, STEAM_ID))
                .thenReturn(Optional.of(new SteamProfile(STEAM_ID, PERSONA)));
        when(userRepository.findBySteamId(STEAM_ID)).thenReturn(Optional.empty());
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(appUser(USER_ID, null)));
        when(cipher.encrypt(API_KEY)).thenReturn(API_KEY_ENC);

        SteamConnectResponse response = service.connect(USER_ID, new SteamConnectRequest(
                "https://steamcommunity.com/id/gamerace5", API_KEY));

        assertThat(response.steamId()).isEqualTo(STEAM_ID);
    }

    /**
     * Chiave malformata: si scarta prima di spendere una chiamata di rete, cosi'
     * l'errore e' immediato anche se Steam e' lento o irraggiungibile.
     */
    @Test
    void connectRejectsMalformedApiKeyWithoutCallingSteam() {
        assertThatThrownBy(() -> service.connect(USER_ID,
                new SteamConnectRequest(STEAM_ID, "chiave-troppo-corta")))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(ex.getMessageKey()).isEqualTo("error.steam.invalidKey");
                });

        verifyNoInteractions(steamClient);
    }

    /** Profilo in una forma che non sappiamo interpretare: 400 parlante. */
    @Test
    void connectRejectsUnrecognisedProfile() {
        assertThatThrownBy(() -> service.connect(USER_ID,
                new SteamConnectRequest("non e' un profilo", API_KEY)))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(ex.getMessageKey()).isEqualTo("error.steam.invalidProfile");
                });
    }

    /** Chiave valida ma SteamID inesistente: Steam torna nessun profilo. */
    @Test
    void connectFailsWhenSteamProfileDoesNotExist() {
        when(steamClient.getPlayerSummary(API_KEY, STEAM_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.connect(USER_ID, new SteamConnectRequest(STEAM_ID, API_KEY)))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(ex.getMessageKey()).isEqualTo("error.steam.profileNotFound");
                });
    }

    /** Un account Steam appartiene a un solo utente Arcadium. */
    @Test
    void connectRejectsSteamIdAlreadyLinkedToAnotherUser() {
        when(steamClient.getPlayerSummary(API_KEY, STEAM_ID))
                .thenReturn(Optional.of(new SteamProfile(STEAM_ID, PERSONA)));
        when(userRepository.findBySteamId(STEAM_ID)).thenReturn(Optional.of(appUser(99L, STEAM_ID)));

        assertThatThrownBy(() -> service.connect(USER_ID, new SteamConnectRequest(STEAM_ID, API_KEY)))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(ex.getMessageKey()).isEqualTo("error.steam.alreadyLinked");
                });

        verify(cipher, never()).encrypt(anyString());
    }

    // --------------------------------------------------------------------- sync

    /** Senza chiave salvata non c'e' collegamento, anche se lo SteamID c'e'. */
    @Test
    void syncFailsWhenNoSteamAccountLinked() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(appUser(USER_ID, null)));

        assertThatThrownBy(() -> service.sync(USER_ID))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(ex.getMessageKey()).isEqualTo("error.steam.notConnected");
                });
    }

    /**
     * Profilo Steam privato. Steam risponde 200 con un involucro vuoto e il client
     * lo segnala con visible=false: dev'essere un 422 parlante, non un successo
     * con zero giochi indistinguibile da una libreria vuota.
     */
    @Test
    void syncFailsWhenSteamProfileIsPrivate() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(collegato()));
        when(cipher.decrypt(API_KEY_ENC)).thenReturn(API_KEY);
        when(steamClient.getOwnedLibrary(API_KEY, STEAM_ID)).thenReturn(new OwnedLibrary(false, List.of()));

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
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(collegato()));
        when(cipher.decrypt(API_KEY_ENC)).thenReturn(API_KEY);
        when(steamClient.getOwnedLibrary(API_KEY, STEAM_ID)).thenReturn(new OwnedLibrary(true, List.of()));
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
        AppUser user = collegato();
        BacklogStatus status = status("mai_giocato");
        Backlog existing = new Backlog(user, game(10L), status); // gioco gia' nel backlog

        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(cipher.decrypt(API_KEY_ENC)).thenReturn(API_KEY);
        when(backlogStatusRepository.findByCode("mai_giocato")).thenReturn(Optional.of(status));
        when(steamClient.getOwnedLibrary(API_KEY, STEAM_ID)).thenReturn(new OwnedLibrary(true, List.of(
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

    // ------------------------------------------------------------------- unlink

    /** Scollegare cancella anche la chiave: non deve sopravvivere al collegamento. */
    @Test
    void unlinkClearsSteamIdAndApiKey() {
        AppUser user = collegato();
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        service.unlink(USER_ID);

        assertThat(user.getSteamId()).isNull();
        assertThat(user.getSteamApiKey()).isNull();
    }

    // ------------------------------------------------------------------ helpers

    /** Utente con Steam collegato: SteamID + chiave cifrata. */
    private static AppUser collegato() {
        AppUser user = appUser(USER_ID, STEAM_ID);
        user.setSteamApiKey(API_KEY_ENC);
        return user;
    }

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
