package com.ace5.arcadium.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ace5.arcadium.entity.Wishlist;
import com.ace5.arcadium.entity.WishlistId;

/**
 * Repository della wishlist (chiave composta user_id+app_id).
 *
 * <p>save/existsById/deleteById (ereditati, chiave {@link WishlistId}) coprono
 * aggiunta, controllo di presenza e rimozione (M4-T7). La lettura della wishlist
 * di un utente usa una query con fetch join sul gioco, per evitare l'N+1 quando
 * si proietta ogni voce in DTO.
 */
public interface WishlistRepository extends JpaRepository<Wishlist, WishlistId> {

    /**
     * Wishlist di un utente, dal piu' recente al piu' vecchio, con il gioco gia'
     * caricato (join fetch) per la proiezione in {@code WishlistItemResponse}.
     *
     * @param userId id dell'utente proprietario della wishlist
     * @return voci di wishlist dell'utente, ordinate per data di aggiunta discendente
     */
    @Query("select w from Wishlist w join fetch w.game "
            + "where w.user.id = :userId order by w.addedAt desc")
    List<Wishlist> findByUserWithGame(@Param("userId") Long userId);

    /**
     * Numero di giochi nella wishlist di un utente (metrica {@code wishlist_size}
     * delle statistiche personali, M4-T10).
     *
     * @param userId id dell'utente
     * @return dimensione della wishlist
     */
    @Query("select count(w) from Wishlist w where w.user.id = :userId")
    long countByUser(@Param("userId") Long userId);
}
