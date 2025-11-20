-- Migration: Add race_news table for curated race news feed
-- Date: 2025-11-20
-- Purpose: Allow commissioners to curate news items related to races

-- Create race_news table
CREATE TABLE IF NOT EXISTS race_news (
    id SERIAL PRIMARY KEY,
    race_id INTEGER NOT NULL REFERENCES races(id) ON DELETE CASCADE,
    headline VARCHAR(500) NOT NULL,
    description TEXT,
    article_url TEXT,
    image_url TEXT,
    published_date TIMESTAMP WITH TIME ZONE,
    display_order INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient queries
CREATE INDEX idx_race_news_race_id ON race_news(race_id);
CREATE INDEX idx_race_news_published_date ON race_news(published_date DESC);
CREATE INDEX idx_race_news_visible ON race_news(is_visible);
CREATE INDEX idx_race_news_display_order ON race_news(race_id, display_order);

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_race_news_updated_at BEFORE UPDATE ON race_news
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE race_news IS 'Curated news feed items for race events, managed by commissioners';
COMMENT ON COLUMN race_news.display_order IS 'Order in which news items should be displayed (lower numbers first)';
COMMENT ON COLUMN race_news.is_visible IS 'Whether the news item is currently visible to players';
