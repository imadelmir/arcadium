package com.ace5.arcadium.entity;

import org.hibernate.annotations.Immutable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Lookup degli stati del backlog (tabella {@code backlog_status}, M2-T4).
 *
 * <p>Modellata come tabella (non enum) per l'i18n IT/EN e l'estensibilità
 * (M1-T5 §3). Popolata da seed (R__backlog_status.sql): mai_giocato, in_corso,
 * finito, abbandonato. Il backend non la scrive → {@link Immutable}.
 */
@Entity
@Table(name = "backlog_status")
@Immutable
public class BacklogStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;                          // BIGINT GENERATED ALWAYS AS IDENTITY

    @Column(unique = true)
    private String code;                      // TEXT NOT NULL UNIQUE ('mai_giocato'...)

    private String labelIt;                   // TEXT NOT NULL (etichetta IT)
    private String labelEn;                   // TEXT NOT NULL (etichetta EN)
    private Short sortOrder;                  // SMALLINT NOT NULL -> Short (ordinamento UI)

    protected BacklogStatus() {
        // Costruttore richiesto da JPA.
    }

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getLabelIt() { return labelIt; }
    public String getLabelEn() { return labelEn; }
    public Short getSortOrder() { return sortOrder; }
}
