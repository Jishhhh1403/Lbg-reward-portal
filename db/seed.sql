-- ILRP Seed Data
-- Inserts all current personas from customer_data.py

-- ============================================================
-- BRANDS
-- ============================================================
INSERT INTO brands (brand_key, name, logo_url, category, points_per_gbp, reward_types) VALUES
    ('alphamedical', 'AlphaMedical', '/images/brands/alphamedical.svg', 'Health & Wellness', 1.5, '["voucher", "cashback", "goal_linked"]'::jsonb),
    ('cavendish_online', 'Cavendish Online', '/images/brands/cavendish-online.svg', 'Retail', 1.2, '["voucher", "instant", "cashback"]'::jsonb),
    ('coffee_house', 'The Coffee House', '/images/brands/coffee-house.svg', 'Food & Drink', 1.0, '["instant", "voucher"]'::jsonb),
    ('travel_plus', 'TravelPlus', '/images/brands/travel-plus.svg', 'Travel', 2.0, '["goal_linked", "voucher", "experience"]'::jsonb),
    ('fitness_first', 'FitnessFirst', '/images/brands/fitness-first.svg', 'Health & Wellness', 1.3, '["voucher", "goal_linked", "challenge"]'::jsonb)
ON CONFLICT (brand_key) DO NOTHING;

-- ============================================================
-- CUSTOMERS
-- ============================================================

-- customer_001: Alex Rivera (Gold, instant gratification)
INSERT INTO customers (customer_id, name, email, points, tier, engagement_score, behaviors, signals, rewards_history, expiring_points, days_until_expiry, goals, challenges_completed, badges, streak_days, leaderboard_rank, personality_insights, motive_scores, alphamed_points, cavendish_points) VALUES
('customer_001', 'Alex Rivera', 'alex@example.com', 4250, 'Gold', 0.820,
 '{"avg_redemption_time_hours": 2.3, "immediate_redemption_rate": 0.89, "goal_completion_rate": 0.12, "days_since_last_activity": 1, "monthly_active_days": 24, "average_session_duration_minutes": 8, "notification_open_rate": 0.45, "redemption_frequency": "HIGH", "preferred_reward_type": "INSTANT"}'::jsonb,
 '["frequent immediate redemptions", "high notification engagement", "short time between earning and redeeming", "responds to flash offers", "session duration suggests quick interactions"]'::jsonb,
 '[{"name": "Coffee Voucher", "points": 200, "claimed_2_hours_after_earning": true}, {"name": "Fast Food Discount", "points": 500, "claimed_immediately": true}, {"name": "Movie Ticket", "points": 1000, "claimed_same_day": true}]'::jsonb,
 0, NULL,
 '[]'::jsonb,
 0, 3, 0, NULL,
 '{"value_explainer_view_count": 1, "cash_equivalent_uses": 2, "partner_comparisons": 0, "probabilities": {"instant_rewards": 0.92, "goal_linked_reward": 0.10, "tangible_value_explainer": 0.25, "partner_conversion": 0.08, "value_explainer": 0.20}, "motive_scores": {"value_explainer": 0.22, "autonomy_preference": 0.70, "progress_orientation": 0.15, "payment_utility": 0.25, "portability_preference": 0.12, "curiosity_response": 0.40}, "predicted_responses": {"tangible_value_explainer": 0.28, "customer_choice_panel": 0.62, "partner_value_comparison": 0.10, "gamification_choice": 0.75}}'::jsonb,
  '{}'::jsonb, 138, 0)
ON CONFLICT (customer_id) DO NOTHING;

-- customer_002: Sarah Chen (Platinum, goal-oriented saver)
INSERT INTO customers (customer_id, name, email, points, tier, engagement_score, behaviors, signals, rewards_history, expiring_points, days_until_expiry, goals, challenges_completed, badges, streak_days, leaderboard_rank, personality_insights, motive_scores, alphamed_points) VALUES
('customer_002', 'Sarah Chen', 'sarah@example.com', 6820, 'Platinum', 0.910,
 '{"avg_redemption_time_hours": 168, "immediate_redemption_rate": 0.15, "goal_completion_rate": 0.78, "days_since_last_activity": 2, "monthly_active_days": 20, "average_session_duration_minutes": 12, "notification_open_rate": 0.62, "redemption_frequency": "MEDIUM", "preferred_reward_type": "GOAL_LINKED"}'::jsonb,
 '["frequent goal-linked redemptions", "consistent monthly accumulation", "high goal completion behavior", "checks progress regularly", "saves points for larger rewards"]'::jsonb,
 '[{"name": "Flight Discount", "points": 5000, "saved_for": "Japan Trip"}, {"name": "Hotel Voucher", "points": 3000, "saved_for": "Japan Trip"}]'::jsonb,
 0, NULL,
 '[{"name": "Japan Vacation", "target_value": 2500, "current_value": 1680, "progress": 67}, {"name": "New Phone", "target_value": 1200, "current_value": 890, "progress": 74}, {"name": "Emergency Fund", "target_value": 3000, "current_value": 1350, "progress": 45}]'::jsonb,
 0, 5, 0, NULL,
 '{"value_explainer_view_count": 5, "cash_equivalent_uses": 4, "partner_comparisons": 3, "probabilities": {"instant_rewards": 0.12, "goal_linked_reward": 0.90, "tangible_value_explainer": 0.60, "partner_conversion": 0.35, "value_explainer": 0.58}, "motive_scores": {"value_explainer": 0.55, "autonomy_preference": 0.60, "progress_orientation": 0.92, "payment_utility": 0.30, "portability_preference": 0.25, "curiosity_response": 0.48}, "predicted_responses": {"tangible_value_explainer": 0.62, "customer_choice_panel": 0.66, "partner_value_comparison": 0.40, "gamification_choice": 0.35}}'::jsonb,
  '{}'::jsonb, 450)
ON CONFLICT (customer_id) DO NOTHING;

-- customer_003: David Park (Diamond, long-term planner)
INSERT INTO customers (customer_id, name, email, points, tier, engagement_score, behaviors, signals, rewards_history, expiring_points, days_until_expiry, goals, challenges_completed, badges, streak_days, leaderboard_rank, personality_insights, motive_scores, alphamed_points) VALUES
('customer_003', 'David Park', 'david@example.com', 28400, 'Diamond', 0.760,
 '{"avg_redemption_time_hours": 2160, "immediate_redemption_rate": 0.03, "goal_completion_rate": 0.92, "days_since_last_activity": 5, "monthly_active_days": 15, "average_session_duration_minutes": 18, "notification_open_rate": 0.38, "redemption_frequency": "LOW", "preferred_reward_type": "LONG_TERM"}'::jsonb,
 '["long-term accumulation pattern", "rarely redeems for small rewards", "interested in investment-like rewards", "reads educational content", "values future projections"]'::jsonb,
 '[{"name": "Retirement Bonus", "points": 15000, "saved_for": "Retirement Fund"}]'::jsonb,
 0, NULL,
 '[{"name": "Retirement Fund", "target_value": 100000, "current_value": 28400, "progress": 28}, {"name": "Children Education Fund", "target_value": 50000, "current_value": 20500, "progress": 41}, {"name": "Dream Home Deposit", "target_value": 75000, "current_value": 11250, "progress": 15}]'::jsonb,
 0, 8, 0, NULL,
 '{"value_explainer_view_count": 8, "cash_equivalent_uses": 1, "partner_comparisons": 2, "probabilities": {"instant_rewards": 0.03, "goal_linked_reward": 0.85, "tangible_value_explainer": 0.80, "partner_conversion": 0.20, "value_explainer": 0.82}, "motive_scores": {"value_explainer": 0.80, "autonomy_preference": 0.75, "progress_orientation": 0.88, "payment_utility": 0.15, "portability_preference": 0.30, "curiosity_response": 0.78}, "predicted_responses": {"tangible_value_explainer": 0.82, "customer_choice_panel": 0.55, "partner_value_comparison": 0.25, "gamification_choice": 0.10}}'::jsonb,
  '{}'::jsonb, 720)
ON CONFLICT (customer_id) DO NOTHING;

-- customer_004: Jessica Martinez (Silver, churn risk)
INSERT INTO customers (customer_id, name, email, points, tier, engagement_score, behaviors, signals, rewards_history, expiring_points, days_until_expiry, goals, challenges_completed, badges, streak_days, leaderboard_rank, personality_insights, motive_scores, alphamed_points) VALUES
('customer_004', 'Jessica Martinez', 'jessica@example.com', 1850, 'Silver', 0.230,
 '{"avg_redemption_time_hours": 720, "immediate_redemption_rate": 0.08, "goal_completion_rate": 0.0, "days_since_last_activity": 45, "monthly_active_days": 3, "average_session_duration_minutes": 2, "notification_open_rate": 0.05, "redemption_frequency": "VERY_LOW", "preferred_reward_type": "NONE"}'::jsonb,
 '["declining engagement over 60 days", "unused expiring points", "stopped opening notifications", "has not logged in for 45 days", "multiple unused rewards", "points expiring soon"]'::jsonb,
 '[{"name": "Retail Discount", "points": 300, "never_claimed": true}]'::jsonb,
 1850, 12,
 '[]'::jsonb,
 0, 2, 0, NULL,
 '{"value_explainer_view_count": 0, "cash_equivalent_uses": 0, "partner_comparisons": 0, "probabilities": {"instant_rewards": 0.20, "goal_linked_reward": 0.05, "tangible_value_explainer": 0.30, "partner_conversion": 0.10, "value_explainer": 0.28}, "motive_scores": {"value_explainer": 0.25, "autonomy_preference": 0.50, "progress_orientation": 0.08, "payment_utility": 0.35, "portability_preference": 0.20, "curiosity_response": 0.12}, "predicted_responses": {"tangible_value_explainer": 0.32, "customer_choice_panel": 0.25, "partner_value_comparison": 0.12, "gamification_choice": 0.08}}'::jsonb,
  '{}'::jsonb, 95)
ON CONFLICT (customer_id) DO NOTHING;

-- customer_005: Marcus Johnson (Gold, gamification motivated)
INSERT INTO customers (customer_id, name, email, points, tier, engagement_score, behaviors, signals, rewards_history, expiring_points, days_until_expiry, goals, challenges_completed, badges, streak_days, leaderboard_rank, personality_insights, motive_scores, alphamed_points) VALUES
('customer_005', 'Marcus Johnson', 'marcus@example.com', 8750, 'Gold', 0.950,
 '{"avg_redemption_time_hours": 48, "immediate_redemption_rate": 0.45, "goal_completion_rate": 0.35, "days_since_last_activity": 0, "monthly_active_days": 28, "average_session_duration_minutes": 15, "notification_open_rate": 0.78, "redemption_frequency": "HIGH", "preferred_reward_type": "CHALLENGE"}'::jsonb,
 '["completes challenges regularly", "checks leaderboard daily", "longest active streak in program", "participates in community events", "earns badges frequently", "shares achievements socially"]'::jsonb,
 '[{"name": "Challenge Winner Bonus", "points": 2000}, {"name": "Streak Reward", "points": 500}, {"name": "Community Badge", "points": 300}]'::jsonb,
 0, NULL,
 '[]'::jsonb,
 12, 15, 34, 3,
 '{"value_explainer_view_count": 2, "cash_equivalent_uses": 3, "partner_comparisons": 1, "probabilities": {"instant_rewards": 0.55, "goal_linked_reward": 0.40, "tangible_value_explainer": 0.20, "partner_conversion": 0.15, "value_explainer": 0.22}, "motive_scores": {"value_explainer": 0.20, "autonomy_preference": 0.40, "progress_orientation": 0.85, "payment_utility": 0.20, "portability_preference": 0.10, "curiosity_response": 0.60}, "predicted_responses": {"tangible_value_explainer": 0.22, "customer_choice_panel": 0.50, "partner_value_comparison": 0.15, "gamification_choice": 0.95}}'::jsonb,
  '{}'::jsonb, 320)
ON CONFLICT (customer_id) DO NOTHING;

-- customer_006: Priya Sharma (Platinum, mixed profile)
INSERT INTO customers (customer_id, name, email, points, tier, engagement_score, behaviors, signals, rewards_history, expiring_points, days_until_expiry, goals, challenges_completed, badges, streak_days, leaderboard_rank, personality_insights, motive_scores, alphamed_points) VALUES
('customer_006', 'Priya Sharma', 'priya@example.com', 15400, 'Platinum', 0.880,
 '{"avg_redemption_time_hours": 96, "immediate_redemption_rate": 0.38, "goal_completion_rate": 0.71, "days_since_last_activity": 1, "monthly_active_days": 26, "average_session_duration_minutes": 14, "notification_open_rate": 0.74, "redemption_frequency": "MEDIUM", "preferred_reward_type": "MIXED"}'::jsonb,
 '["balances instant fun with long-term saving", "maintains multiple active goals across time horizons", "completes challenges while accumulating toward goals", "active streak combined with steady goal contributions", "checks leaderboard and goal progress in same sessions", "earns badges frequently without redeeming them immediately", "responds to both challenge invites and milestone celebrations"]'::jsonb,
 '[{"name": "Challenge Winner Bonus", "points": 1500, "claimed_same_week": true}, {"name": "Flight Discount", "points": 4000, "saved_for": "Bali Trip"}, {"name": "Milestone Bonus", "points": 2000, "saved_for": "Retirement Fund"}]'::jsonb,
 0, NULL,
 '[{"name": "Bali Trip", "target_value": 4000, "current_value": 2900, "progress": 72}, {"name": "New Laptop", "target_value": 2500, "current_value": 1500, "progress": 60}, {"name": "Retirement Fund", "target_value": 80000, "current_value": 15400, "progress": 19}, {"name": "Home Deposit", "target_value": 50000, "current_value": 11000, "progress": 22}]'::jsonb,
 9, 11, 21, 7,
 '{"value_explainer_view_count": 4, "cash_equivalent_uses": 4, "partner_comparisons": 3, "probabilities": {"instant_rewards": 0.45, "goal_linked_reward": 0.75, "tangible_value_explainer": 0.55, "partner_conversion": 0.30, "value_explainer": 0.52}, "motive_scores": {"value_explainer": 0.50, "autonomy_preference": 0.65, "progress_orientation": 0.80, "payment_utility": 0.35, "portability_preference": 0.30, "curiosity_response": 0.68}, "predicted_responses": {"tangible_value_explainer": 0.56, "customer_choice_panel": 0.78, "partner_value_comparison": 0.35, "gamification_choice": 0.72}}'::jsonb,
  '{}'::jsonb, 580)
ON CONFLICT (customer_id) DO NOTHING;

-- customer_007: Elena Vasquez (Diamond, at-risk long-term saver)
INSERT INTO customers (customer_id, name, email, points, tier, engagement_score, behaviors, signals, rewards_history, expiring_points, days_until_expiry, goals, challenges_completed, badges, streak_days, leaderboard_rank, personality_insights, motive_scores, alphamed_points) VALUES
('customer_007', 'Elena Vasquez', 'elena@example.com', 24500, 'Diamond', 0.280,
 '{"avg_redemption_time_hours": 1560, "immediate_redemption_rate": 0.05, "goal_completion_rate": 0.64, "days_since_last_activity": 34, "monthly_active_days": 4, "average_session_duration_minutes": 11, "notification_open_rate": 0.07, "redemption_frequency": "VERY_LOW", "preferred_reward_type": "LONG_TERM"}'::jsonb,
 '["strong long-term accumulation history now stalled", "retirement fund contributions untouched for over a month", "large points balance sitting idle above 20k", "stopped opening notifications after years of steady saving", "significant points expiring while saving toward long-horizon goals", "historically responded well to projected-value and educational content", "declining logins threaten an otherwise disciplined savings journey"]'::jsonb,
 '[{"name": "Retirement Bonus", "points": 12000, "saved_for": "Retirement Fund"}, {"name": "Education Contribution", "points": 5000, "saved_for": "Children Education Fund"}, {"name": "Cashback Voucher", "points": 400, "expired_unused": true}]'::jsonb,
 2400, 9,
 '[{"name": "Retirement Fund", "target_value": 100000, "current_value": 24500, "progress": 25}, {"name": "Children Education Fund", "target_value": 50000, "current_value": 18500, "progress": 37}, {"name": "Dream Home Deposit", "target_value": 75000, "current_value": 9000, "progress": 12}]'::jsonb,
 0, 6, 0, NULL,
 '{"value_explainer_view_count": 6, "cash_equivalent_uses": 1, "partner_comparisons": 2, "probabilities": {"instant_rewards": 0.04, "goal_linked_reward": 0.72, "tangible_value_explainer": 0.78, "partner_conversion": 0.18, "value_explainer": 0.76}, "motive_scores": {"value_explainer": 0.74, "autonomy_preference": 0.70, "progress_orientation": 0.70, "payment_utility": 0.18, "portability_preference": 0.28, "curiosity_response": 0.55}, "predicted_responses": {"tangible_value_explainer": 0.80, "customer_choice_panel": 0.45, "partner_value_comparison": 0.22, "gamification_choice": 0.06}}'::jsonb,
  '{}'::jsonb, 890)
ON CONFLICT (customer_id) DO NOTHING;

-- customer_008: Ryan Okafor (Gold, at-risk instant)
INSERT INTO customers (customer_id, name, email, points, tier, engagement_score, behaviors, signals, rewards_history, expiring_points, days_until_expiry, goals, challenges_completed, badges, streak_days, leaderboard_rank, personality_insights, motive_scores, alphamed_points) VALUES
('customer_008', 'Ryan Okafor', 'ryan@example.com', 3600, 'Gold', 0.260,
 '{"avg_redemption_time_hours": 6, "immediate_redemption_rate": 0.85, "goal_completion_rate": 0.1, "days_since_last_activity": 41, "monthly_active_days": 2, "average_session_duration_minutes": 3, "notification_open_rate": 0.06, "redemption_frequency": "VERY_LOW", "preferred_reward_type": "INSTANT"}'::jsonb,
 '["historically redeemed points within hours of earning", "responds strongly to flash offers and instant vouchers", "inactive for over a month after months of daily visits", "1,500 points expiring within a week", "stopped opening notifications", "small instant rewards drove past engagement spikes"]'::jsonb,
 '[{"name": "Coffee Voucher", "points": 200, "claimed_immediately": true}, {"name": "Flash Deal Snack Box", "points": 350, "claimed_same_hour": true}, {"name": "Retail Discount", "points": 300, "never_claimed": true}]'::jsonb,
 1500, 7,
 '[]'::jsonb,
 1, 3, 0, NULL,
 '{"value_explainer_view_count": 1, "cash_equivalent_uses": 1, "partner_comparisons": 0, "probabilities": {"instant_rewards": 0.88, "goal_linked_reward": 0.08, "tangible_value_explainer": 0.22, "partner_conversion": 0.06, "value_explainer": 0.18}, "motive_scores": {"value_explainer": 0.18, "autonomy_preference": 0.65, "progress_orientation": 0.12, "payment_utility": 0.28, "portability_preference": 0.10, "curiosity_response": 0.45}, "predicted_responses": {"tangible_value_explainer": 0.25, "customer_choice_panel": 0.55, "partner_value_comparison": 0.08, "gamification_choice": 0.80}}'::jsonb,
  '{}'::jsonb, 210)
ON CONFLICT (customer_id) DO NOTHING;

-- customer_009: Maya Thompson (Gold, value certainty seeker)
INSERT INTO customers (customer_id, name, email, points, tier, engagement_score, behaviors, signals, rewards_history, expiring_points, days_until_expiry, goals, challenges_completed, badges, streak_days, leaderboard_rank, personality_insights, motive_scores, alphamed_points) VALUES
('customer_009', 'Maya Thompson', 'maya@example.com', 5600, 'Gold', 0.710,
 '{"avg_redemption_time_hours": 72, "immediate_redemption_rate": 0.22, "goal_completion_rate": 0.41, "days_since_last_activity": 2, "monthly_active_days": 17, "average_session_duration_minutes": 11, "notification_open_rate": 0.52, "redemption_frequency": "MEDIUM", "preferred_reward_type": "VALUE_CLARITY"}'::jsonb,
 '["repeatedly asks what points are worth in pounds before redeeming", "abandons redemptions when value is unclear", "compares partner rates across visits before committing", "prefers exact monetary equivalents over point abstractions", "responds poorly to countdown or urgency framing"]'::jsonb,
 '[{"name": "Supermarket Voucher", "points": 1500, "checked_gbp_value_first": true}]'::jsonb,
 0, NULL,
 '[]'::jsonb,
 0, 4, 0, NULL,
 '{"value_explainer_view_count": 12, "cash_equivalent_uses": 5, "partner_comparisons": 11, "probabilities": {"instant_rewards": 0.15, "goal_linked_reward": 0.42, "tangible_value_explainer": 0.93, "partner_conversion": 0.48, "value_explainer": 0.95}, "motive_scores": {"value_explainer": 0.94, "autonomy_preference": 0.58, "progress_orientation": 0.35, "payment_utility": 0.32, "portability_preference": 0.40, "curiosity_response": 0.44}, "predicted_responses": {"tangible_value_explainer": 0.92, "customer_choice_panel": 0.86, "partner_value_comparison": 0.88, "gamification_choice": 0.08}}'::jsonb,
  '{"valueCertainty": 0.91, "valueConfusionRisk": 0.81, "probNeedValueExplanation": 0.88, "spendRisk": 0.12, "rewardChasingRisk": 0.10}'::jsonb, 275)
ON CONFLICT (customer_id) DO NOTHING;

-- customer_010: Daniel Brooks (Platinum, payment utility focused)
INSERT INTO customers (customer_id, name, email, points, tier, engagement_score, behaviors, signals, rewards_history, expiring_points, days_until_expiry, goals, challenges_completed, badges, streak_days, leaderboard_rank, personality_insights, motive_scores, alphamed_points) VALUES
('customer_010', 'Daniel Brooks', 'daniel@example.com', 7300, 'Platinum', 0.840,
 '{"avg_redemption_time_hours": 24, "immediate_redemption_rate": 0.48, "goal_completion_rate": 0.58, "days_since_last_activity": 1, "monthly_active_days": 21, "average_session_duration_minutes": 7, "notification_open_rate": 0.66, "redemption_frequency": "HIGH", "preferred_reward_type": "PAYMENT_LINKED"}'::jsonb,
 '["redeems almost exclusively as statement credits on linked card", "checks cashback earned alongside balance every visit", "sets allocation of earned points to automatic payment rewards", "uninterested in vouchers or experiences, wants money off bills", "values predictable, guaranteed reward rates"]'::jsonb,
 '[{"name": "Statement Credit", "points": 2500, "applied_to_card": true}, {"name": "Statement Credit", "points": 1800, "applied_to_card": true}]'::jsonb,
 0, NULL,
 '[{"name": "Holiday Spending Money", "target_value": 1200, "current_value": 640, "progress": 53}]'::jsonb,
 2, 5, 4, NULL,
 '{"value_explainer_view_count": 2, "cash_equivalent_uses": 14, "partner_comparisons": 2, "probabilities": {"instant_rewards": 0.35, "goal_linked_reward": 0.55, "tangible_value_explainer": 0.70, "partner_conversion": 0.25, "value_explainer": 0.66}, "motive_scores": {"value_explainer": 0.60, "autonomy_preference": 0.72, "progress_orientation": 0.55, "payment_utility": 0.95, "portability_preference": 0.20, "curiosity_response": 0.30}, "predicted_responses": {"tangible_value_explainer": 0.72, "customer_choice_panel": 0.60, "partner_value_comparison": 0.28, "gamification_choice": 0.18}}'::jsonb,
  '{"paymentUtility": 0.92, "probPreferPaymentLinkedReward": 0.87, "spendRisk": 0.18, "rewardChasingRisk": 0.14}'::jsonb, 410)
ON CONFLICT (customer_id) DO NOTHING;

-- customer_011: Sophie Williams (Gold, educational competence)
INSERT INTO customers (customer_id, name, email, points, tier, engagement_score, behaviors, signals, rewards_history, expiring_points, days_until_expiry, goals, challenges_completed, badges, streak_days, leaderboard_rank, personality_insights, motive_scores, alphamed_points) VALUES
('customer_011', 'Sophie Williams', 'sophie@example.com', 3900, 'Gold', 0.790,
 '{"avg_redemption_time_hours": 120, "immediate_redemption_rate": 0.12, "goal_completion_rate": 0.62, "days_since_last_activity": 1, "monthly_active_days": 19, "average_session_duration_minutes": 16, "notification_open_rate": 0.71, "redemption_frequency": "MEDIUM", "preferred_reward_type": "EDUCATIONAL"}'::jsonb,
 '["completes every financial literacy module to 100%", "retakes quizzes until concepts are fully understood", "spends longest session time on educational content", "motivated by mastering topics rather than winning them", "avoids timed challenges and public rankings"]'::jsonb,
 '[{"name": "Academy Module Bonus", "points": 300, "earned_via_course": true}]'::jsonb,
 0, NULL,
 '[{"name": "First Home Savings Knowledge", "target_value": 2000, "current_value": 1250, "progress": 63}]'::jsonb,
 6, 9, 8, NULL,
 '{"value_explainer_view_count": 9, "cash_equivalent_uses": 1, "partner_comparisons": 1, "probabilities": {"instant_rewards": 0.08, "goal_linked_reward": 0.60, "tangible_value_explainer": 0.75, "partner_conversion": 0.12, "value_explainer": 0.80}, "motive_scores": {"value_explainer": 0.78, "autonomy_preference": 0.50, "progress_orientation": 0.82, "payment_utility": 0.12, "portability_preference": 0.15, "curiosity_response": 0.94}, "predicted_responses": {"tangible_value_explainer": 0.74, "customer_choice_panel": 0.50, "partner_value_comparison": 0.18, "gamification_choice": 0.55}}'::jsonb,
     '{"competenceMotivation": 0.93, "probPreferEducationReward": 0.86}'::jsonb, 200)
ON CONFLICT (customer_id) DO NOTHING;

-- customer_012: Leo Morgan (Platinum, portability/interoperability seeker)
INSERT INTO customers (customer_id, name, email, points, tier, engagement_score, behaviors, signals, rewards_history, expiring_points, days_until_expiry, goals, challenges_completed, badges, streak_days, leaderboard_rank, personality_insights, motive_scores, alphamed_points) VALUES
('customer_012', 'Leo Morgan', 'leo@example.com', 11200, 'Platinum', 0.740,
 '{"avg_redemption_time_hours": 240, "immediate_redemption_rate": 0.15, "goal_completion_rate": 0.55, "days_since_last_activity": 3, "monthly_active_days": 16, "average_session_duration_minutes": 13, "notification_open_rate": 0.49, "redemption_frequency": "MEDIUM", "preferred_reward_type": "PORTABLE"}'::jsonb,
 '["holds reward balances across three partner programmes", "frequently asks about moving points between programmes", "wants one combined view of all earned rewards", "prefers simple plain-English explanations of transfers", "put off by technical jargon and complex terms"]'::jsonb,
 '[{"name": "Partner Transfer Bonus", "points": 1000, "transferred_to_partner": true}]'::jsonb,
 0, NULL,
 '[{"name": "Family Holiday Fund", "target_value": 3000, "current_value": 1750, "progress": 58}]'::jsonb,
 1, 6, 0, NULL,
 '{"value_explainer_view_count": 4, "cash_equivalent_uses": 2, "partner_comparisons": 13, "probabilities": {"instant_rewards": 0.10, "goal_linked_reward": 0.48, "tangible_value_explainer": 0.68, "partner_conversion": 0.90, "value_explainer": 0.62}, "motive_scores": {"value_explainer": 0.58, "autonomy_preference": 0.62, "progress_orientation": 0.45, "payment_utility": 0.25, "portability_preference": 0.93, "curiosity_response": 0.40}, "predicted_responses": {"tangible_value_explainer": 0.66, "customer_choice_panel": 0.58, "partner_value_comparison": 0.91, "gamification_choice": 0.12}}'::jsonb,
  '{"portabilityPreference": 0.90, "consolidatedRewardWallet": 0.88, "dltConfusionRisk": 0.61, "trustRiskWithTechnicalLanguage": 0.57}'::jsonb, 630)
ON CONFLICT (customer_id) DO NOTHING;

-- customer_013: Amelia Carter (Gold, preview/guaranteed value)
INSERT INTO customers (customer_id, name, email, points, tier, engagement_score, behaviors, signals, rewards_history, expiring_points, days_until_expiry, goals, challenges_completed, badges, streak_days, leaderboard_rank, personality_insights, motive_scores, alphamed_points) VALUES
('customer_013', 'Amelia Carter', 'amelia@example.com', 6450, 'Gold', 0.680,
 '{"avg_redemption_time_hours": 96, "immediate_redemption_rate": 0.20, "goal_completion_rate": 0.47, "days_since_last_activity": 2, "monthly_active_days": 14, "average_session_duration_minutes": 9, "notification_open_rate": 0.44, "redemption_frequency": "MEDIUM", "preferred_reward_type": "PREVIEW"}'::jsonb,
 '["always previews a reward before committing points", "abandons flows that hide the final value until after selection", "gravitates to offers labelled guaranteed or fixed value", "reads full terms before redeeming anything", "dislikes surprise deductions or variable conversion rates"]'::jsonb,
 '[{"name": "Guaranteed Value Voucher", "points": 2000, "previewed_first": true}]'::jsonb,
 0, NULL,
 '[]'::jsonb,
 2, 5, 0, NULL,
 '{"value_explainer_view_count": 7, "cash_equivalent_uses": 4, "partner_comparisons": 5, "probabilities": {"instant_rewards": 0.12, "goal_linked_reward": 0.45, "tangible_value_explainer": 0.88, "partner_conversion": 0.38, "value_explainer": 0.85}, "motive_scores": {"value_explainer": 0.86, "autonomy_preference": 0.55, "progress_orientation": 0.40, "payment_utility": 0.30, "portability_preference": 0.35, "curiosity_response": 0.38}, "predicted_responses": {"tangible_value_explainer": 0.89, "customer_choice_panel": 0.82, "partner_value_comparison": 0.55, "gamification_choice": 0.10}}'::jsonb,
  '{"probPreferRewardPreview": 0.91, "probPreferGuaranteedValue": 0.84}'::jsonb, 340)
ON CONFLICT (customer_id) DO NOTHING;

-- ============================================================
-- INITIAL TRANSACTIONS (sample history)
-- ============================================================
INSERT INTO transactions (customer_id, tx_type, points, description, status, created_at) VALUES
    ('customer_001', 'EARN', 200, 'Coffee purchase - The Coffee House', 'COMPLETED', NOW() - INTERVAL '2 hours'),
    ('customer_001', 'EARN', 500, 'Monthly loyalty bonus', 'COMPLETED', NOW() - INTERVAL '5 days'),
    ('customer_002', 'EARN', 4000, 'Flight booking - TravelPlus', 'COMPLETED', NOW() - INTERVAL '30 days'),
    ('customer_002', 'REDEEM', 3000, 'Hotel voucher redemption', 'COMPLETED', NOW() - INTERVAL '15 days'),
    ('customer_003', 'EARN', 15000, 'Annual retirement contribution', 'COMPLETED', NOW() - INTERVAL '90 days'),
    ('customer_005', 'EARN', 2000, 'Challenge completion bonus', 'COMPLETED', NOW() - INTERVAL '1 day'),
    ('customer_005', 'EARN', 500, '34-day streak reward', 'COMPLETED', NOW() - INTERVAL '1 day'),
    ('customer_006', 'EARN', 4000, 'Flight booking - TravelPlus', 'COMPLETED', NOW() - INTERVAL '60 days'),
    ('customer_006', 'EARN', 1500, 'Challenge winner bonus', 'COMPLETED', NOW() - INTERVAL '7 days'),
    ('customer_009', 'EARN', 1500, 'Monthly grocery spend', 'COMPLETED', NOW() - INTERVAL '3 days'),
    ('customer_010', 'REDEEM', 2500, 'Statement credit applied', 'COMPLETED', NOW() - INTERVAL '20 days'),
    ('customer_010', 'REDEEM', 1800, 'Statement credit applied', 'COMPLETED', NOW() - INTERVAL '10 days'),
    ('customer_012', 'EARN', 1000, 'Partner transfer bonus', 'COMPLETED', NOW() - INTERVAL '45 days')
ON CONFLICT DO NOTHING;
