'use client';

import iconGithub from '@/assets/landing-page/integration-icons/icon-github.png';
import iconInstagram from '@/assets/landing-page/integration-icons/icon-instagram.png';
import iconSnapchat from '@/assets/landing-page/integration-icons/icon-snapchat.png';
import iconSpotify from '@/assets/landing-page/integration-icons/icon-spotify.png';
import iconThreads from '@/assets/landing-page/integration-icons/icon-threads.png';
import iconTiktok from '@/assets/landing-page/integration-icons/icon-tiktok.png';
import iconTwitch from '@/assets/landing-page/integration-icons/icon-twitch.png';
import iconYoutube from '@/assets/landing-page/integration-icons/icon-youtube.png';
import { motion, useTransform, useScroll, MotionValue } from 'framer-motion';
import React from 'react';

/**
 * One icon, as its own component so the useTransform calls sit at the top
 * level of a component rather than inside a .map callback. The transforms are
 * unchanged - this only moves where the hooks are called.
 */
function FloatingIcon({
  index,
  src,
  style,
  scrollYProgress,
}: {
  index: number;
  src: string;
  style: React.CSSProperties;
  scrollYProgress: MotionValue<number>;
}) {
  // Animate from outside the viewport to their position
  const y = useTransform(
    scrollYProgress,
    [0, 0.3 + index * 0.05],
    [index % 2 === 0 ? -120 : 120, 0]
  );
  const opacity = useTransform(
    scrollYProgress,
    [0.1 + index * 0.05, 0.4 + index * 0.05],
    [0, 1]
  );

  return (
    <motion.img
      src={src}
      alt=""
      style={{
        position: 'absolute',
        width: 64,
        height: 64,
        ...style,
        y,
        opacity,
        zIndex: 1,
      }}
      aria-hidden="true"
      draggable={false}
    />
  );
}

// FloatingIcons component
export function FloatingIcons() {
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Example icon positions and transforms
  const icons = [
    { src: iconGithub, style: { top: '-40px', left: '10%' } },
    { src: iconSnapchat, style: { top: '10%', right: '-60px' } },
    { src: iconSpotify, style: { bottom: '15%', left: '-50px' } },
    { src: iconInstagram, style: { bottom: '-40px', right: '15%' } },
    { src: iconThreads, style: { top: '50%', left: '-60px' } },
    { src: iconTiktok, style: { bottom: '10%', right: '5%' } },
    { src: iconYoutube, style: { top: '20%', left: '80%' } },
    { src: iconTwitch, style: { top: '30%', left: '50%' } },
  ];

  return (
    <div
      ref={ref}
      className="pointer-events-none sticky top-0 w-full h-screen z-0"
    >
      {icons.map((icon, i) => (
        <FloatingIcon
          key={i}
          index={i}
          src={icon.src.src}
          style={icon.style}
          scrollYProgress={scrollYProgress}
        />
      ))}
    </div>
  );
}
