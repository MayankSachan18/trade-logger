
package com.tradelogger.controller;

import com.tradelogger.dto.TradeResponse;
import com.tradelogger.dto.TradeRequest;
import jakarta.validation.Valid;
import com.tradelogger.entity.Trade;
import com.tradelogger.service.TradeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trades")
public class TradeController {

    private final TradeService tradeService;

    public TradeController(TradeService tradeService) {
        this.tradeService = tradeService;
    }

    // Create a new trade
    @PostMapping
    public ResponseEntity<TradeResponse> createTrade(
            @Valid @RequestBody TradeRequest tradeRequest) {

        return ResponseEntity.ok(tradeService.saveTrade(tradeRequest));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TradeResponse> updateTrade(
            @PathVariable Long id,
            @Valid @RequestBody TradeRequest tradeRequest) {

        return ResponseEntity.ok(
                tradeService.updateTrade(id, tradeRequest)
        );
    }

    // Get all trades
    @GetMapping
    public ResponseEntity<List<TradeResponse>> getAllTrades() {
        return ResponseEntity.ok(tradeService.getAllTrades());
    }

    // Get trade by ID
    @GetMapping("/{id}")
    public ResponseEntity<TradeResponse> getTradeById(@PathVariable Long id) {
        return ResponseEntity.ok(tradeService.getTradeById(id));
    }

    // Delete trade
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTrade(@PathVariable Long id) {
        tradeService.deleteTrade(id);
        return ResponseEntity.noContent().build();
    }
}
