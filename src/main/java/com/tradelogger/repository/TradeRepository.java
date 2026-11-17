
package com.tradelogger.repository;

import com.tradelogger.entity.Trade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TradeRepository extends JpaRepository<Trade, Long> {

    List<Trade> findAllByUserId(Long userId);

    Optional<Trade> findByIdAndUserId(Long id, Long userId);

}
