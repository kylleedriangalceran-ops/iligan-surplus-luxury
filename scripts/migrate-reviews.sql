-- Iligan Surplus Luxury
-- Reviews Migration
-- Run this in your PostgreSQL database

CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES surplus_listings(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Each customer can only review a listing once
    UNIQUE(customer_id, listing_id)
);

-- Fast aggregation queries per listing
CREATE INDEX IF NOT EXISTS idx_reviews_listing_id ON reviews(listing_id);

-- Fast lookup for "has user reviewed this listing?"
CREATE INDEX IF NOT EXISTS idx_reviews_customer_listing ON reviews(customer_id, listing_id);
