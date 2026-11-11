
package com.tradelogger.service;

import com.tradelogger.dto.TradeResponse;
import com.tradelogger.entity.Trade;
import com.tradelogger.dto.TradeRequest;
import com.tradelogger.exception.ResourceNotFoundException;
import com.tradelogger.repository.TradeRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TradeService {

    private final TradeRepository tradeRepository;

    public TradeService(TradeRepository tradeRepository) {
        this.tradeRepository = tradeRepository;
    }

    public TradeResponse saveTrade(TradeRequest request) {

        Trade trade = new Trade();

        trade.setInstrument(request.getInstrument());
        trade.setDirection(request.getDirection());
        trade.setEntryPrice(request.getEntryPrice());
        trade.setExitPrice(request.getExitPrice());
        trade.setStopLoss(request.getStopLoss());
        trade.setTakeProfit(request.getTakeProfit());
        trade.setQuantity(request.getQuantity());
        trade.setSetupName(request.getSetupName());
        trade.setEntryTime(request.getEntryTime());
        trade.setExitTime(request.getExitTime());
        trade.setProfitLoss(request.getProfitLoss());
        trade.setRiskReward(request.getRiskReward());
        trade.setTradingSession(request.getTradingSession());
        trade.setNotes(request.getNotes());

        Trade savedTrade = tradeRepository.save(trade);

        return convertToResponse(savedTrade);
    }

    public TradeResponse updateTrade(Long id, TradeRequest request) {

        Trade existingTrade = tradeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Trade not found with ID: " + id
                ));

        existingTrade.setInstrument(request.getInstrument());
        existingTrade.setDirection(request.getDirection());
        existingTrade.setEntryPrice(request.getEntryPrice());
        existingTrade.setExitPrice(request.getExitPrice());
        existingTrade.setStopLoss(request.getStopLoss());
        existingTrade.setTakeProfit(request.getTakeProfit());
        existingTrade.setQuantity(request.getQuantity());
        existingTrade.setSetupName(request.getSetupName());
        existingTrade.setEntryTime(request.getEntryTime());
        existingTrade.setExitTime(request.getExitTime());
        existingTrade.setProfitLoss(request.getProfitLoss());
        existingTrade.setRiskReward(request.getRiskReward());
        existingTrade.setTradingSession(request.getTradingSession());
        existingTrade.setNotes(request.getNotes());

        Trade savedTrade = tradeRepository.save(existingTrade);

        return convertToResponse(savedTrade);
    }
    public List<TradeResponse> getAllTrades() {
        return tradeRepository.findAll()
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    public TradeResponse getTradeById(Long id) {
        Trade trade = tradeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Trade not found with ID: " + id
                ));

        return convertToResponse(trade);
    }

    public void deleteTrade(Long id) {
        Trade trade = tradeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Trade not found with ID: " + id
                ));

        tradeRepository.delete(trade);
    }

    private TradeResponse convertToResponse(Trade trade) {

        TradeResponse response = new TradeResponse();

        response.setId(trade.getId());
        response.setInstrument(trade.getInstrument());
        response.setDirection(trade.getDirection());
        response.setEntryPrice(trade.getEntryPrice());
        response.setExitPrice(trade.getExitPrice());
        response.setStopLoss(trade.getStopLoss());
        response.setTakeProfit(trade.getTakeProfit());
        response.setQuantity(trade.getQuantity());
        response.setSetupName(trade.getSetupName());
        response.setEntryTime(trade.getEntryTime());
        response.setExitTime(trade.getExitTime());
        response.setProfitLoss(trade.getProfitLoss());
        response.setRiskReward(trade.getRiskReward());
        response.setTradingSession(trade.getTradingSession());
        response.setNotes(trade.getNotes());

        return response;
    }
}
