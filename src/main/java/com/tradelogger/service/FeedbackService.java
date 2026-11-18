package com.tradelogger.service;

import com.tradelogger.entity.Feedback;
import com.tradelogger.entity.FeedbackReply;
import com.tradelogger.entity.User;
import com.tradelogger.repository.FeedbackRepository;
import com.tradelogger.repository.FeedbackReplyRepository;
import com.tradelogger.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final FeedbackReplyRepository feedbackReplyRepository;
    private final UserRepository userRepository;

    public FeedbackService(
            FeedbackRepository feedbackRepository,
            FeedbackReplyRepository feedbackReplyRepository,
            UserRepository userRepository) {

        this.feedbackRepository = feedbackRepository;
        this.feedbackReplyRepository = feedbackReplyRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Feedback saveFeedback(
            String username,
            Feedback.Category category,
            Integer rating,
            String message) {

        User user = getUser(username);

        Feedback feedback = new Feedback();
        feedback.setUser(user);
        feedback.setCategory(category);
        feedback.setRating(rating);
        feedback.setMessage(message);

        return feedbackRepository.save(feedback);
    }

    @Transactional(readOnly = true)
    public List<Feedback> getAllFeedback() {
        return feedbackRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public FeedbackReply saveReply(
            Long feedbackId,
            String username,
            String message) {

        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Feedback not found"
                ));

        User user = getUser(username);

        FeedbackReply reply = new FeedbackReply();
        reply.setFeedback(feedback);
        reply.setUser(user);
        reply.setMessage(message);

        return feedbackReplyRepository.save(reply);
    }

    @Transactional(readOnly = true)
    public List<FeedbackReply> getReplies(Long feedbackId) {
        return feedbackReplyRepository
                .findByFeedbackIdOrderByCreatedAtAsc(feedbackId);
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException(
                        "User not found"
                ));
    }
}