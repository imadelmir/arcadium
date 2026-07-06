package com.ace5.arcadium.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ace5.arcadium.entity.Language;

/**
 * Repository della lookup lingue.
 * I metodi di query specifici (ricerca, filtri) arrivano coi rispettivi
 * endpoint (M4-T5+).
 */
public interface LanguageRepository extends JpaRepository<Language, Integer> {
}
