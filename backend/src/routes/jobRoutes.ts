import { Router } from 'express';
import {
  searchJobs,
  getJobDetails,
  bookmarkJob,
  getBookmarkedJobs,
  getJobStats,
  triggerAggregation
} from '../controllers/jobController';
import { protect } from '../middlewares/auth';

const router = Router();

// Public routes
router.get('/', searchJobs);
router.get('/stats', getJobStats);
router.get('/:id', getJobDetails);

// Protected routes (require authentication)
router.post('/:id/bookmark', protect, bookmarkJob);
router.get('/user/bookmarked', protect, getBookmarkedJobs);

// Admin routes (TODO: Add admin middleware)
router.post('/aggregate', protect, triggerAggregation);

export default router;