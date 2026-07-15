package com.ace5.arcadium.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Set;

import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.Immutable;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;

/**
 * Entità del catalogo statico Steam (tabella {@code games}, M2-T1).
 *
 * <p>Trenta attributi a valore singolo derivati da steam_games.json (M1-T2 §3),
 * più le associazioni molti-a-molti verso le sei lookup e gli screenshot
 * (entità debole game_screenshot, M1-T3/T4).
 *
 * <p>Il catalogo è di SOLA LETTURA per il backend: lo popola l'ETL (M3).
 * {@link Immutable} vieta a Hibernate qualsiasi UPDATE/DELETE su queste righe;
 * eventuali scritture accidentali vengono ignorate anziché propagate al DB.
 *
 * <p>Chiave primaria naturale {@code app_id} (dal dataset): nessun
 * {@code @GeneratedValue}. Le associazioni sono unidirezionali e LAZY: le join
 * che servono ai singoli endpoint si scrivono nei task successivi (M4-T5+).
 */
@Entity
@Table(name = "games")
@Immutable
public class Game {

    @Id
    @Column(name = "app_id")
    private Long appId;                       // BIGINT, PK naturale (no IDENTITY)

    private String name;                      // TEXT NOT NULL

    // Chiave di ordinamento alfabetico generata dal DB (change request Negozio,
    // migrazione V7): nome minuscolo senza i caratteri iniziali non-lettera,
    // NULL per i titoli senza lettera latina (numeri, cinese/coreano) così
    // finiscono in fondo con "NULLS LAST". SOLA LETTURA: la calcola PostgreSQL.
    @Column(name = "name_sort", insertable = false, updatable = false)
    private String nameSort;

    // Flag generato dal DB (change request Negozio, migrazione V8): true quando
    // il titolo inizia con una lettera europea (latina). La vetrina del Negozio
    // filtra su questo campo quando la ricerca e' vuota, così i titoli asiatici
    // o che iniziano con simboli/cifre restano raggiungibili solo in ricerca.
    // SOLA LETTURA: la calcola PostgreSQL.
    @Column(name = "name_starts_latin", insertable = false, updatable = false)
    private Boolean nameStartsLatin;

    private LocalDate releaseDate;            // DATE, nullable

    private Long ownersMin;                   // BIGINT
    private Long ownersMax;                   // BIGINT
    private Integer peakCcu;                  // INTEGER
    private Short requiredAge;                // SMALLINT -> Short
    private BigDecimal price;                 // NUMERIC(10,2)
    private Short discount;                   // SMALLINT -> Short

    // Colonna generata dal DB (V13, change request Negozio: fix filtro
    // prezzo): round(price * (100-discount) / 100, 2) — il prezzo che la
    // card mostra davvero, non il listino. Fascia di prezzo, stato
    // Gratis/A-pagamento e ordinamento "Prezzo" si basano su questo campo,
    // non su price. SOLA LETTURA: la calcola PostgreSQL.
    @Column(name = "effective_price", insertable = false, updatable = false)
    private BigDecimal effectivePrice;

    private Integer dlcCount;                 // INTEGER

    private String aboutTheGame;             // TEXT
    private String reviews;                   // TEXT
    private String headerImage;               // TEXT (usata da GameImage, M5-T7)
    private String website;                   // TEXT
    private String supportUrl;                // TEXT
    private String supportEmail;              // TEXT

    private Boolean windows;                  // BOOLEAN
    private Boolean mac;                       // BOOLEAN
    private Boolean linux;                     // BOOLEAN

    private Short metacriticScore;            // SMALLINT -> Short (0 = nessun voto)
    private String metacriticUrl;             // TEXT

    private Integer positive;                 // INTEGER
    private Integer negative;                 // INTEGER
    private Integer achievementsCount;        // INTEGER (achievement Steam, != achievement interni T7)
    private Integer recommendations;          // INTEGER
    private String notes;                     // TEXT

    private Integer avgPlaytimeForever;       // INTEGER
    private Integer avgPlaytimeTwoWeeks;      // INTEGER
    private Integer medianPlaytimeForever;    // INTEGER
    private Integer medianPlaytimeTwoWeeks;   // INTEGER

    // --- Associazioni molti-a-molti verso le lookup (ponte del catalogo) ---
    // Unidirezionali, LAZY, con @JoinTable esplicito: il default userebbe
    // 'games_language' ecc., mentre le tabelle reali sono 'game_language' ...

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "game_language",
            joinColumns = @JoinColumn(name = "app_id"),
            inverseJoinColumns = @JoinColumn(name = "language_id"))
    private Set<Language> supportedLanguages = new LinkedHashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "game_audio_language",
            joinColumns = @JoinColumn(name = "app_id"),
            inverseJoinColumns = @JoinColumn(name = "language_id"))
    private Set<Language> audioLanguages = new LinkedHashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "game_developer",
            joinColumns = @JoinColumn(name = "app_id"),
            inverseJoinColumns = @JoinColumn(name = "developer_id"))
    private Set<Developer> developers = new LinkedHashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "game_publisher",
            joinColumns = @JoinColumn(name = "app_id"),
            inverseJoinColumns = @JoinColumn(name = "publisher_id"))
    private Set<Publisher> publishers = new LinkedHashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "game_category",
            joinColumns = @JoinColumn(name = "app_id"),
            inverseJoinColumns = @JoinColumn(name = "category_id"))
    private Set<Category> categories = new LinkedHashSet<>();

    // @BatchSize (change request Negozio): i generi compaiono ora anche nella
    // card sintetica del catalogo (GameSummaryResponse), per mostrare quali
    // filtri "spiegano" ogni risultato. Senza questa annotazione, caricare i
    // generi per una pagina di 300 giochi farebbe 300 query separate (N+1);
    // con @BatchSize Hibernate le raggruppa in blocchi da 50
    // (WHERE app_id IN (...50 valori...)), riducendole a poche query totali.
    @ManyToMany(fetch = FetchType.LAZY)
    @BatchSize(size = 50)
    @JoinTable(
            name = "game_genre",
            joinColumns = @JoinColumn(name = "app_id"),
            inverseJoinColumns = @JoinColumn(name = "genre_id"))
    private Set<Genre> genres = new LinkedHashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "game_tag",
            joinColumns = @JoinColumn(name = "app_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id"))
    private Set<Tag> tags = new LinkedHashSet<>();

    // --- Screenshot: entità debole (app_id, url) come element collection ---
    // La PK composta (app_id, url) combacia col modello @ElementCollection<String>.

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "game_screenshot",
            joinColumns = @JoinColumn(name = "app_id"))
    @Column(name = "url")
    private Set<String> screenshots = new LinkedHashSet<>();

    protected Game() {
        // Costruttore richiesto da JPA.
    }

    public Long getAppId() { return appId; }
    public String getName() { return name; }
    public Boolean getNameStartsLatin() { return nameStartsLatin; }
    public LocalDate getReleaseDate() { return releaseDate; }
    public Long getOwnersMin() { return ownersMin; }
    public Long getOwnersMax() { return ownersMax; }
    public Integer getPeakCcu() { return peakCcu; }
    public Short getRequiredAge() { return requiredAge; }
    public BigDecimal getPrice() { return price; }
    public Short getDiscount() { return discount; }
    public BigDecimal getEffectivePrice() { return effectivePrice; }
    public Integer getDlcCount() { return dlcCount; }
    public String getAboutTheGame() { return aboutTheGame; }
    public String getReviews() { return reviews; }
    public String getHeaderImage() { return headerImage; }
    public String getWebsite() { return website; }
    public String getSupportUrl() { return supportUrl; }
    public String getSupportEmail() { return supportEmail; }
    public Boolean getWindows() { return windows; }
    public Boolean getMac() { return mac; }
    public Boolean getLinux() { return linux; }
    public Short getMetacriticScore() { return metacriticScore; }
    public String getMetacriticUrl() { return metacriticUrl; }
    public Integer getPositive() { return positive; }
    public Integer getNegative() { return negative; }
    public Integer getAchievementsCount() { return achievementsCount; }
    public Integer getRecommendations() { return recommendations; }
    public String getNotes() { return notes; }
    public Integer getAvgPlaytimeForever() { return avgPlaytimeForever; }
    public Integer getAvgPlaytimeTwoWeeks() { return avgPlaytimeTwoWeeks; }
    public Integer getMedianPlaytimeForever() { return medianPlaytimeForever; }
    public Integer getMedianPlaytimeTwoWeeks() { return medianPlaytimeTwoWeeks; }

    public Set<Language> getSupportedLanguages() { return supportedLanguages; }
    public Set<Language> getAudioLanguages() { return audioLanguages; }
    public Set<Developer> getDevelopers() { return developers; }
    public Set<Publisher> getPublishers() { return publishers; }
    public Set<Category> getCategories() { return categories; }
    public Set<Genre> getGenres() { return genres; }
    public Set<Tag> getTags() { return tags; }
    public Set<String> getScreenshots() { return screenshots; }
}