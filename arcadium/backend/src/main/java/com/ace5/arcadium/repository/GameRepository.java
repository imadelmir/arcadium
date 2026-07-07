package com.ace5.arcadium.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.ace5.arcadium.entity.Game;

/**
 * Repository del catalogo giochi (chiave naturale app_id).
 *
 * <p>Estende {@link JpaSpecificationExecutor} per il catalogo filtrabile (M4-T5):
 * i filtri dinamici (nome, genere, piattaforma, stato) sono costruiti come
 * {@link org.springframework.data.jpa.domain.Specification} in
 * {@code GameSpecifications} ed eseguiti con {@code findAll(spec, pageable)}.
 */
public interface GameRepository extends JpaRepository<Game, Long>, JpaSpecificationExecutor<Game> {
}
