package com.tradelogger.repository;

import com.tradelogger.entity.Feedback;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    @EntityGraph(attributePaths = {"user"})
    List<Feedback> findAllByOrderByCreatedAtDesc();
}