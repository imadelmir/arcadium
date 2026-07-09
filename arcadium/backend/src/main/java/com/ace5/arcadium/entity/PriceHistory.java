package com.ace5.arcadium.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

/**
 * Storico prezzi di un gioco nel tempo (tabella {@code price_history}, M2-T9).
 * Base per le notifiche di calo prezzo (future-ready, M4-T13).
 *
 * <p>PK composta (app_id, recorded_at) come {@link PriceHistoryId}: una
 * rilevazione per gioco e istante. {@code app_id} è legato a {@link Game} via
 * @MapsId (LAZY); {@code recorded_at} è una componente dell'id valorizzata dal
 * job che scrive. Popolato a runtime, non da seed.
 */
@Entity
@Table(name = "price_history")
public class PriceHistory {

    @EmbeddedId
    private PriceHistoryId id;

    @MapsId("appId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "app_id")
    private Game game;

    private BigDecimal price;                 // NUMERIC(10,2) NOT NULL (>= 0)
    private Short discount;                   // SMALLINT, nullable (0-100)

    public PriceHistory() {
        // Costruttore richiesto da JPA.
    }

    /**
     * Crea una rilevazione di prezzo per un gioco a un dato istante (usato dal
     * job di M4-T13). {@code recorded_at} fa parte della chiave e va valorizzato
     * qui, non dal DEFAULT del DB.
     *
     * @param game       gioco rilevato
     * @param recordedAt istante della rilevazione (componente della PK)
     * @param price      prezzo rilevato
     * @param discount   sconto percentuale al momento, o null
     */
    public PriceHistory(Game game, LocalDateTime recordedAt, BigDecimal price, Short discount) {
        this.game = game;
        this.price = price;
        this.discount = discount;
        this.id = new PriceHistoryId(game.getAppId(), recordedAt);
    }

    public PriceHistoryId getId() { return id; }

    public Game getGame() { return game; }
    public void setGame(Game game) { this.game = game; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public Short getDiscount() { return discount; }
    public void setDiscount(Short discount) { this.discount = discount; }
}
