import express from 'express';
import postController from '../controllers/postController.js';
import storyController from '../controllers/storyController.js';

const router = express.Router();

// Posts - specific routes BEFORE parameterized routes
router.post('/posts', postController.createPost);
router.post('/posts/like', postController.likePost);
router.post('/posts/react', postController.reactToPost);         // Facebook-style reactions
router.post('/posts/bookmark', postController.toggleBookmark);   // Save / bookmark
router.post('/posts/vote-post', postController.votePost);        // Reddit voting
router.post('/posts/award', postController.awardPost);           // Reddit awards
router.post('/posts/interest', postController.toggleInterest);
router.post('/posts/vote', postController.votePoll);
router.post('/posts/comment', postController.addComment);
router.put('/posts/comment/:commentId', postController.editComment);
router.delete('/posts/comment/:commentId', postController.deleteComment);
router.post('/posts/comment/vote', postController.voteComment);  // Reddit comment voting
router.post('/posts/comment/pin', postController.pinComment);    // Pin comment
router.post('/posts/repost', postController.repostPost);
router.post('/posts/share', postController.sharePost);
router.post('/posts/report', postController.reportPost);
router.post('/posts/delete', postController.deletePost);
// Parameterized routes after specific ones
router.get('/posts/user/:userId', postController.getUserPosts);
router.get('/posts/:postId/comments', postController.getComments);
router.get('/posts/:postId/reports', postController.getPostReports);
router.get('/posts/:postId', postController.getPost);
router.put('/posts/:postId', postController.editPost);

router.get('/search/hashtag', postController.searchHashtag);
router.get('/search/mentions', postController.searchMentions);
router.post('/feed', postController.getFeed);
router.get('/feed/bookmarks', postController.getBookmarks);      // Get saved/bookmarked posts
router.get('/explore', postController.getExplore);
router.get('/reels', postController.getReels);
router.get('/trending/hashtags', postController.getTrendingHashtags); // Trending hashtags

// Stories
router.post('/stories', storyController.createStory);
router.post('/stories/view', storyController.viewStory);
router.post('/stories/feed', storyController.getStories);

export default router;
