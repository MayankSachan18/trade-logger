package com.tradelogger.repository;

import com.tradelogger.entity.FeedbackReply;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeedbackReplyRepository extends JpaRepository<FeedbackReply, Long> {

    @EntityGraph(attributePaths = {"user"})
    List<FeedbackReply> findByFeedbackIdOrderByCreatedAtAsc(Long feedbackId);
}