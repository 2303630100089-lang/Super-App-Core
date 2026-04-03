import mongoose from 'mongoose';

// Records every meaningful action a user takes across the super-app.
// Each domain service posts an activity entry after a key event.
const userActivitySchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },

  // Which domain generated this activity
  serviceType: {
    type: String,
    required: true,
    enum: ['ride', 'food', 'order', 'marketplace', 'search', 'social', 'hotel', 'dating', 'game', 'story', 'profile_view'],
    index: true,
  },

  // Fine-grained event within the service
  activityType: {
    type: String,
    required: true,
    enum: [
      // ride
      'ride_booked', 'ride_completed', 'ride_cancelled',
      // food
      'food_ordered', 'food_delivered', 'restaurant_viewed',
      // e-commerce order
      'order_placed', 'order_delivered', 'product_viewed', 'product_wishlist',
      // marketplace
      'listing_viewed', 'listing_created', 'bid_placed',
      // search
      'search_performed',
      // social
      'post_liked', 'post_shared', 'post_viewed', 'profile_viewed',
      // hotel
      'hotel_booked', 'hotel_viewed',
      // dating
      'profile_liked', 'match_made',
      // game
      'game_played',
      // story
      'story_viewed',
    ],
  },

  // Flexible payload – store item ids, amounts, categories, query text, etc.
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },

  // Denormalised convenience fields for recommendation queries
  category: { type: String, index: true },  // e.g. food category, product category
  location: {
    city: { type: String },
    state: { type: String },
    country: { type: String, default: 'IN' },
  },

  timestamp: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

userActivitySchema.index({ userId: 1, serviceType: 1, timestamp: -1 });
userActivitySchema.index({ userId: 1, activityType: 1, timestamp: -1 });

export default mongoose.model('UserActivity', userActivitySchema);
