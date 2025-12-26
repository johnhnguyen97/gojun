-- Drop unused tables from feature cleanup
-- These tables were created for features that have been removed:
-- - Favorites system
-- - Flashcard/SRS system
-- - Workspace layouts
-- - User notes

-- Drop tables in correct order (respecting foreign key dependencies)
DROP TABLE IF EXISTS user_favorites CASCADE;
DROP TABLE IF EXISTS user_flashcards CASCADE;
DROP TABLE IF EXISTS user_srs_cards CASCADE;
DROP TABLE IF EXISTS user_workspace_layouts CASCADE;
DROP TABLE IF EXISTS user_workspace_settings CASCADE;
DROP TABLE IF EXISTS user_notes CASCADE;

-- Also drop any related policies (CASCADE should handle this, but being explicit)
-- The CASCADE keyword will automatically drop dependent policies
