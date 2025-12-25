# Favorites Feature Setup

## Database Setup

To enable the favorites feature, you need to run the SQL migration in your Supabase project:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the SQL in `supabase/migrations/create_favorites_table.sql`

This will create:
- `user_favorites` table to store favorited words
- Proper indexes for fast queries
- Row Level Security (RLS) policies so users can only see their own favorites

## How It Works

### Auto-Categorization

When a user favorites a word, the system automatically categorizes it based on keywords:

- **Food**: food, eat, drink, rice, fish, meat, etc.
- **Animals**: cat, dog, bird, fish, animal, etc.
- **Everyday**: yes, no, please, thank, hello, goodbye, etc.
- **Time**: time, hour, day, week, morning, afternoon, etc.
- **Places**: home, school, work, office, store, restaurant, etc.
- **Numbers**: one, two, three, 一二三, etc.
- **Family**: mother, father, sister, brother, etc.
- **Colors**: red, blue, green, yellow, etc.
- **Verbs**: words ending in common verb patterns
- **Vocabulary**: default category for everything else

### Features

1. **Favorite Button**: Click ★ on any word in the word bank to save it
2. **Favorites Viewer**: Access from toolbox (bottom-right button → Favorites)
3. **Category Filter**: View all favorites or filter by category
4. **Auto-Sync**: Favorites are stored in Supabase and sync across devices
5. **Remove**: Click the ❤️ button in favorites viewer to remove

## API Endpoints

- `POST /api/save-favorite` - Save a word to favorites
- `GET /api/get-favorites` - Retrieve all favorites
- `DELETE /api/delete-favorite` - Remove a favorite

All endpoints require authentication via Bearer token.
