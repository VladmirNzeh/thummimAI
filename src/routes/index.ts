import { Router, Request, Response } from 'express';
import chatRoutes from './chat';
const router = Router();

router.get('/', (req: Request, res: Response) => {
    res.json({message: 'Thummim AI Backend Running...'});
});

// Mount chat routes
router.use('/chat', chatRoutes);

export default router;