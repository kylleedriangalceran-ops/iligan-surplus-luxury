-- Iligan Surplus Luxury
-- PostgreSQL Initialization Schema

CREATE TYPE user_role AS ENUM ('MERCHANT', 'CUSTOMER', 'ADMIN');
CREATE TYPE reservation_status AS ENUM ('PENDING', 'CLAIMED', 'CANCELLED');

CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role user_role DEFAULT 'CUSTOMER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    iligan_barangay_location VARCHAR(255) NOT NULL,
    aesthetic_cover_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(merchant_id) -- Assuming 1 merchant has 1 primary store in this mvp
);

CREATE TABLE IF NOT EXISTS surplus_listings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    original_price DECIMAL(10, 2) NOT NULL,
    reserved_price DECIMAL(10, 2) NOT NULL,
    quantity_available INT NOT NULL DEFAULT 0,
    pickup_time_window VARCHAR(255) NOT NULL, -- e.g., "6:00 PM - 8:00 PM"
    aesthetic_cover_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    listing_id UUID NOT NULL REFERENCES surplus_listings(id) ON DELETE RESTRICT,
    status reservation_status DEFAULT 'PENDING',
    reservation_token VARCHAR(6) NOT NULL, -- Secure 6-digit code e.g., "A7X9K2"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_reservations_token ON reservations(reservation_token);
CREATE INDEX IF NOT EXISTS idx_surplus_listings_store_id ON surplus_listings(store_id);
