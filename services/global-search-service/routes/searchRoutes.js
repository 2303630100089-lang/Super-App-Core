import express from 'express';
import searchController from '../controllers/searchController.js';

const router = express.Router();

router.get('/', searchController.globalSearch);
router.get('/trending', searchController.getTrending);
router.get('/history/:userId', searchController.getSearchHistory);
router.delete('/history/:userId', searchController.clearSearchHistory);

export default router;
