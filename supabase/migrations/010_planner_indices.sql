-- ADD UNIQUE CONSTRAINT TO DAILY BRIEFINGS FOR UPSERTS
ALTER TABLE daily_briefings DROP CONSTRAINT IF EXISTS daily_briefings_profile_id_briefing_date_key;
ALTER TABLE daily_briefings ADD CONSTRAINT daily_briefings_profile_id_briefing_date_key UNIQUE (profile_id, briefing_date);
