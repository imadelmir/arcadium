package com.ace5.arcadium.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ace5.arcadium.entity.Wishlist;
import com.ace5.arcadium.entity.WishlistId;

/**
 * Repository della wishlist (chiave composta user_id+app_id).
 * I metodi di query specifici arrivano coi rispettivi endpoint (M4-T7+).
 */
public interface WishlistRepository extends JpaRepository<Wishlist, WishlistId> {
}
