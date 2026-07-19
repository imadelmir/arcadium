package com.ace5.arcadium.security;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import com.ace5.arcadium.exception.ApiException;

/**
 * Cifratura simmetrica dei segreti di terze parti conservati nel database.
 *
 * <p>Nasce per la chiave Steam Web API dell'utente (V17): a differenza di una
 * password, che si confronta e basta e quindi si conserva come hash, una chiave
 * API va <em>riusata in chiaro</em> a ogni chiamata verso Steam. Non si puo'
 * hashare: si cifra, e si decifra solo per il tempo della richiesta.
 *
 * <p><b>Algoritmo.</b> AES-256 in modalita' GCM: oltre a cifrare, autentica. Se
 * qualcuno modificasse il valore nel database, la decifratura fallirebbe invece
 * di restituire byte arbitrari. Ogni cifratura usa un IV casuale di 12 byte
 * (raccomandazione NIST per GCM); il valore conservato e' la Base64 di
 * {@code iv || ciphertext+tag}, quindi due cifrature dello stesso testo danno
 * risultati diversi.
 *
 * <p><b>Chiave.</b> Derivata dal segreto applicativo gia' esistente
 * ({@code arcadium.security.jwt.secret}, env {@code JWT_SECRET}) con SHA-256 su
 * un dominio dedicato: {@code SHA-256(DOMAIN + segreto)}. Cosi' non serve una
 * nuova variabile d'ambiente da dimenticare in demo, ma la chiave di cifratura
 * resta <em>distinta</em> da quella di firma dei JWT: il prefisso di dominio
 * impedisce che lo stesso materiale serva a due scopi diversi.
 *
 * <p><b>Conseguenza operativa.</b> Cambiare {@code JWT_SECRET} rende
 * indecifrabili le chiavi gia' salvate: la sync risponde con
 * {@code error.steam.cryptoFailed} e l'utente ricollega Steam incollando di
 * nuovo la propria chiave. E' il comportamento voluto — meglio un errore
 * parlante che un valore silenziosamente sbagliato — ed e' lo stesso effetto che
 * un cambio di segreto ha gia' oggi sui token JWT emessi.
 */
@Component
public class SecretCipher {

    /** Separazione di dominio: distingue questa chiave da quella di firma JWT. */
    private static final String DOMAIN = "arcadium:secret-cipher:v1:";

    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int IV_LENGTH = 12;   // byte, raccomandato per GCM
    private static final int TAG_LENGTH = 128; // bit, tag di autenticazione

    private final SecretKeySpec key;
    private final SecureRandom random = new SecureRandom();

    public SecretCipher(@Value("${arcadium.security.jwt.secret}") String masterSecret) {
        this.key = new SecretKeySpec(derive(masterSecret), "AES");
    }

    /**
     * Cifra un valore in chiaro.
     *
     * @param plaintext valore da proteggere (non nullo)
     * @return Base64 di {@code iv || ciphertext}, da salvare a database
     * @throws ApiException 500 se la cifratura non riesce (guasto della JVM,
     *                      non un errore dell'utente)
     */
    public String encrypt(String plaintext) {
        try {
            byte[] iv = new byte[IV_LENGTH];
            random.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_LENGTH, iv));
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            byte[] payload = new byte[iv.length + ciphertext.length];
            System.arraycopy(iv, 0, payload, 0, iv.length);
            System.arraycopy(ciphertext, 0, payload, iv.length, ciphertext.length);
            return Base64.getEncoder().encodeToString(payload);
        } catch (GeneralSecurityException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "error.internal");
        }
    }

    /**
     * Decifra un valore prodotto da {@link #encrypt(String)}.
     *
     * @param stored valore Base64 letto dal database
     * @return il testo in chiaro
     * @throws ApiException 409 {@code error.steam.cryptoFailed} se il valore e'
     *                      illeggibile (segreto cambiato o dato manomesso):
     *                      l'utente deve ricollegare l'integrazione
     */
    public String decrypt(String stored) {
        try {
            byte[] payload = Base64.getDecoder().decode(stored);
            byte[] iv = new byte[IV_LENGTH];
            System.arraycopy(payload, 0, iv, 0, IV_LENGTH);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_LENGTH, iv));
            byte[] plaintext = cipher.doFinal(payload, IV_LENGTH, payload.length - IV_LENGTH);
            return new String(plaintext, StandardCharsets.UTF_8);
        } catch (GeneralSecurityException | RuntimeException e) {
            // GCM non distingue "chiave sbagliata" da "dato corrotto", e un Base64
            // malformato porta allo stesso punto: in tutti i casi la risposta utile
            // per l'utente e' la stessa, ricollega l'integrazione.
            throw new ApiException(HttpStatus.CONFLICT, "error.steam.cryptoFailed");
        }
    }

    /** SHA-256 del segreto applicativo, con prefisso di dominio: 32 byte = AES-256. */
    private static byte[] derive(String masterSecret) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return digest.digest((DOMAIN + masterSecret).getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 non disponibile nella JVM", e);
        }
    }
}
