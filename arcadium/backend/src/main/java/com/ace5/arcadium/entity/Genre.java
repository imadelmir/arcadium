package com.ace5.arcadium.entity;

import org.hibernate.annotations.Immutable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Lookup genre del catalogo (M2-T2). Chiave surrogata id (INTEGER IDENTITY),
 * name univoco. Immutabile: popolata dall'ETL (M3), sola lettura per il backend.
 */
@Entity
@Table(name = "genre")
@Immutable
public class Genre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;                       // INTEGER GENERATED ALWAYS AS IDENTITY

    @Column(unique = true)
    private String name;                      // TEXT NOT NULL UNIQUE

    protected Genre() {
        // Costruttore richiesto da JPA.
    }

    public Integer getId() { return id; }
    public String getName() { return name; }
}
