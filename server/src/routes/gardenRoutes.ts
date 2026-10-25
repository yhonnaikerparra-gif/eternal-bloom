import { Router, Request, Response } from 'express';
import { GardenService } from '../services/gardenService.js';

export const gardenRouter = Router();

// Public: Get garden stage and telemetry
gardenRouter.get('/state', (req: Request, res: Response): void => {
  try {
    const state = GardenService.getGardenState();
    res.json(state);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Public: Get all 3D elements (flowers, stars) with linked letter contents for interactive clicking
gardenRouter.get('/elements', (req: Request, res: Response): void => {
  try {
    const elements = GardenService.getAllElements();
    res.json(elements);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
