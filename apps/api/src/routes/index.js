import { Router } from 'express';
import healthCheck from './health-check.js';
import { jadwal, kota } from './sholat.js';

const router = Router();

export default () => {
    router.get('/health', healthCheck);
    router.get('/sholat/jadwal', jadwal);
    router.get('/sholat/kota', kota);

    return router;
};
