import iconGithub from '@/assets/landing-page/integration-icons/icon-github.png';
import iconInstagram from '@/assets/landing-page/integration-icons/icon-instagram.png';
import iconSpotify from '@/assets/landing-page/integration-icons/icon-spotify.png';
import iconThreads from '@/assets/landing-page/integration-icons/icon-threads.png';
import iconTiktok from '@/assets/landing-page/integration-icons/icon-tiktok.png';
import type { StaticImageData } from 'next/image';

/** Colourful brand icons keyed by integration slug. */
export const INTEGRATION_LOGOS: Record<string, StaticImageData> = {
  spotify: iconSpotify,
  instagram: iconInstagram,
  tiktok: iconTiktok,
  threads: iconThreads,
  github: iconGithub,
};
