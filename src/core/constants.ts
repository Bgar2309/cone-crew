// core/constants.ts — réglages globaux figés.
export const TICK = 1 / 60;            // pas de temps fixe (s)
export const TILE = { w: 64, h: 32 };  // dimensions d'un losange iso (px)
export const PLACE_TIME = 0.8;         // durée de pose, ouvrier vulnérable (s)
export const WORKER_SPEED = 3.2;       // cases/s
export const INVULN_TIME = 1.2;        // i-frames après un choc (s)
export const CONE_FRICTION = 6.0;      // décélération des cônes renversés (cases/s²)
export const CONE_TOPPLE_IMPULSE = 4.0;// vitesse initiale d'un cône percuté (cases/s)
