import type { CSSProperties } from 'react';

type BubbleSpec = {
  left: string;
  size: number;
  bx0: string;
  bx1: string;
  by0: string;
  by1: string;
  bs0: number;
  bs1: number;
  opacity: number;
  durationSec: number;
  delaySec: number;
};

const HERO_BUBBLES: BubbleSpec[] = [
  { left: '6%', size: 52, bx0: '0', bx1: '28px', by0: '92vh', by1: '-18vh', bs0: 0.45, bs1: 1, opacity: 0.42, durationSec: 26, delaySec: 0 },
  { left: '14%', size: 28, bx0: '8px', bx1: '-18px', by0: '88vh', by1: '-12vh', bs0: 0.55, bs1: 0.85, opacity: 0.35, durationSec: 21, delaySec: -4 },
  { left: '22%', size: 64, bx0: '-16px', bx1: '36px', by0: '95vh', by1: '-22vh', bs0: 0.4, bs1: 1.05, opacity: 0.38, durationSec: 32, delaySec: -9 },
  { left: '31%', size: 36, bx0: '12px', bx1: '10px', by0: '90vh', by1: '-15vh', bs0: 0.5, bs1: 0.9, opacity: 0.32, durationSec: 24, delaySec: -2 },
  { left: '38%', size: 18, bx0: '-4px', bx1: '-14px', by0: '85vh', by1: '-8vh', bs0: 0.6, bs1: 0.75, opacity: 0.28, durationSec: 18, delaySec: -11 },
  { left: '45%', size: 72, bx0: '20px', bx1: '-24px', by0: '98vh', by1: '-25vh', bs0: 0.38, bs1: 1.08, opacity: 0.4, durationSec: 34, delaySec: -6 },
  { left: '52%', size: 40, bx0: '-22px', bx1: '18px', by0: '87vh', by1: '-14vh', bs0: 0.48, bs1: 0.92, opacity: 0.33, durationSec: 23, delaySec: -14 },
  { left: '58%', size: 22, bx0: '6px', bx1: '22px', by0: '82vh', by1: '-10vh', bs0: 0.55, bs1: 0.7, opacity: 0.26, durationSec: 19, delaySec: -7 },
  { left: '66%', size: 56, bx0: '-10px', bx1: '32px', by0: '94vh', by1: '-20vh', bs0: 0.42, bs1: 1, opacity: 0.4, durationSec: 28, delaySec: -3 },
  { left: '74%', size: 32, bx0: '14px', bx1: '-12px', by0: '89vh', by1: '-13vh', bs0: 0.52, bs1: 0.88, opacity: 0.3, durationSec: 22, delaySec: -12 },
  { left: '82%', size: 44, bx0: '-18px', bx1: '8px', by0: '91vh', by1: '-16vh', bs0: 0.46, bs1: 0.95, opacity: 0.36, durationSec: 25, delaySec: -5 },
  { left: '90%', size: 26, bx0: '4px', bx1: '-20px', by0: '86vh', by1: '-9vh', bs0: 0.58, bs1: 0.78, opacity: 0.27, durationSec: 20, delaySec: -8 },
  { left: '11%', size: 16, bx0: '-6px', bx1: '14px', by0: '78vh', by1: '-6vh', bs0: 0.65, bs1: 0.65, opacity: 0.22, durationSec: 16, delaySec: -15 },
  { left: '96%', size: 38, bx0: '-12px', bx1: '-4px', by0: '84vh', by1: '-11vh', bs0: 0.5, bs1: 0.82, opacity: 0.29, durationSec: 27, delaySec: -1 },
  { left: '3%', size: 70, bx0: '16px', bx1: '-30px', by0: '96vh', by1: '-24vh', bs0: 0.35, bs1: 1.12, opacity: 0.34, durationSec: 36, delaySec: -10 },
  { left: '49%', size: 14, bx0: '0', bx1: '0', by0: '75vh', by1: '-5vh', bs0: 0.7, bs1: 0.6, opacity: 0.2, durationSec: 15, delaySec: -13 },
];

const SOFT_BUBBLES: BubbleSpec[] = [
  { left: '4%', size: 36, bx0: '0', bx1: '16px', by0: '12vh', by1: '-14vh', bs0: 0.5, bs1: 0.85, opacity: 0.12, durationSec: 40, delaySec: 0 },
  { left: '22%', size: 22, bx0: '6px', bx1: '-10px', by0: '10vh', by1: '-12vh', bs0: 0.55, bs1: 0.75, opacity: 0.1, durationSec: 34, delaySec: -8 },
  { left: '48%', size: 44, bx0: '-12px', bx1: '14px', by0: '14vh', by1: '-16vh', bs0: 0.45, bs1: 0.9, opacity: 0.11, durationSec: 46, delaySec: -14 },
  { left: '72%', size: 28, bx0: '10px', bx1: '-6px', by0: '11vh', by1: '-13vh', bs0: 0.5, bs1: 0.8, opacity: 0.1, durationSec: 38, delaySec: -4 },
  { left: '88%', size: 32, bx0: '-8px', bx1: '0', by0: '13vh', by1: '-15vh', bs0: 0.48, bs1: 0.82, opacity: 0.09, durationSec: 42, delaySec: -20 },
];

function bubbleStyle(b: BubbleSpec): CSSProperties {
  return {
    left: b.left,
    width: b.size,
    height: b.size,
    ['--bx0' as string]: b.bx0,
    ['--bx1' as string]: b.bx1,
    ['--by0' as string]: b.by0,
    ['--by1' as string]: b.by1,
    ['--bs0' as string]: String(b.bs0),
    ['--bs1' as string]: String(b.bs1),
    ['--bo' as string]: String(b.opacity),
    animationDuration: `${b.durationSec}s`,
    animationDelay: `${b.delaySec}s`,
  };
}

type HomeBubblesProps = {
  /** hero = bulles visibles sur le bandeau ; soft = décor léger dans une section */
  variant: 'hero' | 'soft';
};

export function HomeBubbles({ variant }: HomeBubblesProps) {
  const list = variant === 'hero' ? HERO_BUBBLES : SOFT_BUBBLES;
  const cls = variant === 'hero' ? 'ql-home-bubble ql-home-bubble--hero' : 'ql-home-bubble ql-home-bubble--soft';

  return (
    <div className="ql-home-bubble-field" aria-hidden>
      {list.map((b, i) => (
        <span key={i} className={cls} style={bubbleStyle(b)} />
      ))}
    </div>
  );
}
