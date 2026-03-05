-- Migration: Add photo/author/tag support to seo_blog_posts
ALTER TABLE seo_blog_posts
ADD COLUMN IF NOT EXISTS featured_image_url TEXT,
ADD COLUMN IF NOT EXISTS featured_image_alt TEXT,
ADD COLUMN IF NOT EXISTS author_name TEXT DEFAULT 'Grayson Frank',
ADD COLUMN IF NOT EXISTS author_title TEXT DEFAULT 'Founder, Nassau',
ADD COLUMN IF NOT EXISTS reading_time_minutes INTEGER,
ADD COLUMN IF NOT EXISTS tags TEXT[];
