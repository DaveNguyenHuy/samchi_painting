import type { SkPath } from '@shopify/react-native-skia';
import {
  bowl,
  circle,
  drop,
  ellipse,
  fromSvg,
  heart,
  line,
  petalAt,
  polygon,
  ring,
  roundRect,
  star,
} from './shapes';

/**
 * fill – a blank area the child taps to colour.
 * ink  – a solid black shape (eyes, pupils, small dots). Not tappable.
 * line – an open outline drawn as a stroke only (smiles, whiskers). Not tappable.
 */
export type RegionKind = 'fill' | 'ink' | 'line';

export type Region = {
  id: string;
  path: SkPath;
  kind: RegionKind;
  /** starting fill colour for `fill` regions ('#FFFFFF' = blank) */
  initial: string;
};

export type ColoringPage = {
  id: string;
  title: string;
  emoji: string;
  /** builds the region list – called lazily and cached (see `regionsFor`) */
  build: () => Region[];
};

const regionCache = new Map<string, Region[]>();

/** Region list for a page. Built once on first use, then cached. */
export function regionsFor(page: ColoringPage): Region[] {
  let regions = regionCache.get(page.id);
  if (!regions) {
    regions = page.build();
    regionCache.set(page.id, regions);
  }
  return regions;
}

const W = '#FFFFFF';
const K = '#111111';

const F = (id: string, path: SkPath, initial: string = W): Region => ({
  id,
  path,
  kind: 'fill',
  initial,
});
const I = (id: string, path: SkPath): Region => ({ id, path, kind: 'ink', initial: K });
const L = (id: string, path: SkPath): Region => ({ id, path, kind: 'line', initial: K });

const arcBand = (cx: number, cy: number, ro: number, ri: number): SkPath =>
  fromSvg(
    `M ${cx - ro} ${cy} A ${ro} ${ro} 0 0 1 ${cx + ro} ${cy} ` +
      `L ${cx + ri} ${cy} A ${ri} ${ri} 0 0 0 ${cx - ri} ${cy} Z`,
  );

// ── 1. Sun ────────────────────────────────────────────────────────────────────
function sun(): Region[] {
  const cx = 500;
  const cy = 480;
  const rays: Region[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const p1 = [cx + Math.cos(a - 0.32) * 248, cy + Math.sin(a - 0.32) * 248] as [number, number];
    const p2 = [cx + Math.cos(a + 0.32) * 248, cy + Math.sin(a + 0.32) * 248] as [number, number];
    const tip = [cx + Math.cos(a) * 410, cy + Math.sin(a) * 410] as [number, number];
    rays.push(F(`ray${i}`, polygon([p1, tip, p2])));
  }
  return [
    ...rays,
    F('face', circle(cx, cy, 250)),
    I('eyeL', circle(cx - 80, cy - 40, 24)),
    I('eyeR', circle(cx + 80, cy - 40, 24)),
    L('smile', fromSvg('M 400 540 Q 500 640 600 540')),
  ];
}

// ── 2. Flower ─────────────────────────────────────────────────────────────────
function flower(): Region[] {
  const cx = 500;
  const cy = 380;
  const petals: Region[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    petals.push(F(`petal${i}`, circle(cx + Math.cos(a) * 165, cy + Math.sin(a) * 165, 120)));
  }
  return [
    F('stem', roundRect(478, 460, 44, 380, 22)),
    F('leaf', ellipse(610, 650, 120, 62)),
    ...petals,
    F('center', circle(cx, cy, 115)),
  ];
}

// ── 3. House ──────────────────────────────────────────────────────────────────
function house(): Region[] {
  return [
    F('wall', roundRect(250, 430, 500, 430, 8)),
    F('roof', polygon([[190, 440], [500, 170], [810, 440]])),
    F('door', roundRect(430, 640, 150, 220, 12)),
    I('knob', circle(555, 755, 12)),
    F('winL', roundRect(300, 500, 120, 120, 8)),
    F('winR', roundRect(580, 500, 120, 120, 8)),
    F('sun', circle(850, 160, 70)),
  ];
}

// ── 4. Fish ───────────────────────────────────────────────────────────────────
function fish(): Region[] {
  return [
    F('body', ellipse(470, 500, 300, 210)),
    F('tail', polygon([[740, 500], [950, 350], [890, 500], [950, 650]])),
    F('fin', polygon([[470, 660], [580, 800], [360, 760]])),
    F('stripe', fromSvg('M 500 300 Q 560 500 515 700 Q 455 500 455 305 Z')),
    F('eye', circle(320, 445, 42)),
    I('pupil', circle(333, 448, 17)),
    F('bubble1', circle(180, 360, 26)),
    F('bubble2', circle(120, 280, 18)),
  ];
}

// ── 5. Butterfly ──────────────────────────────────────────────────────────────
function butterfly(): Region[] {
  return [
    F('wingUL', ellipse(360, 380, 165, 190)),
    F('wingUR', ellipse(640, 380, 165, 190)),
    F('wingLL', ellipse(390, 610, 130, 150)),
    F('wingLR', ellipse(610, 610, 130, 150)),
    F('body', roundRect(478, 300, 44, 400, 22)),
    L('antL', fromSvg('M 495 305 Q 455 250 430 210')),
    L('antR', fromSvg('M 505 305 Q 545 250 570 210')),
    F('dotUL', circle(360, 360, 45)),
    F('dotUR', circle(640, 360, 45)),
  ];
}

// ── 6. Car ────────────────────────────────────────────────────────────────────
function car(): Region[] {
  return [
    F('body', roundRect(140, 450, 720, 230, 45)),
    F('cabin', polygon([[330, 455], [410, 320], [610, 320], [690, 455]])),
    F('window', polygon([[360, 445], [420, 350], [590, 350], [650, 445]])),
    F('wheelL', circle(330, 700, 92)),
    F('wheelR', circle(670, 700, 92)),
    I('hubL', circle(330, 700, 32)),
    I('hubR', circle(670, 700, 32)),
    F('light', circle(820, 520, 26)),
  ];
}

// ── 7. Princess ───────────────────────────────────────────────────────────────
function princess(): Region[] {
  return [
    F('hairL', ellipse(410, 370, 78, 170)),
    F('hairR', ellipse(590, 370, 78, 170)),
    F('armL', roundRect(320, 500, 66, 230, 33)),
    F('armR', roundRect(614, 500, 66, 230, 33)),
    F('skirt', fromSvg('M 410 545 L 590 545 L 790 875 Q 500 935 210 875 Z')),
    L('fold1', fromSvg('M 470 560 Q 430 720 360 860')),
    L('fold2', fromSvg('M 530 560 Q 570 720 640 860')),
    F('bodice', roundRect(420, 410, 160, 150, 24)),
    F('collar', polygon([[430, 415], [570, 415], [500, 480]])),
    F('face', circle(500, 320, 92)),
    F('crown', polygon([[432, 250], [432, 200], [466, 235], [500, 185], [534, 235], [568, 200], [568, 250]])),
    F('gem', circle(500, 224, 12)),
    I('eyeL', circle(475, 315, 11)),
    I('eyeR', circle(525, 315, 11)),
    L('smile', fromSvg('M 470 352 Q 500 376 530 352')),
    F('belt', roundRect(410, 545, 180, 34, 16)),
  ];
}

// ── 8. Crown ──────────────────────────────────────────────────────────────────
function crown(): Region[] {
  return [
    F('spikes', polygon([
      [200, 560], [300, 320], [390, 540], [500, 280], [610, 540], [700, 320], [800, 560],
    ])),
    F('band', roundRect(200, 560, 600, 150, 24)),
    F('gemL', circle(300, 355, 30)),
    F('gemC', circle(500, 315, 36)),
    F('gemR', circle(700, 355, 30)),
    F('jewel1', circle(320, 635, 26)),
    F('jewel2', circle(500, 635, 26)),
    F('jewel3', circle(680, 635, 26)),
  ];
}

// ── 9. Castle ─────────────────────────────────────────────────────────────────
function castle(): Region[] {
  return [
    F('towerL', roundRect(220, 320, 130, 550, 4)),
    F('towerR', roundRect(650, 320, 130, 550, 4)),
    F('roofL', polygon([[200, 322], [285, 170], [370, 322]])),
    F('roofR', polygon([[630, 322], [715, 170], [800, 322]])),
    F('keep', roundRect(320, 420, 360, 450, 4)),
    F('roofC', polygon([[300, 422], [500, 250], [700, 422]])),
    F('door', fromSvg('M 440 870 L 440 720 Q 500 640 560 720 L 560 870 Z')),
    F('winL', roundRect(258, 430, 54, 80, 6)),
    F('winR', roundRect(688, 430, 54, 80, 6)),
    F('winC', roundRect(468, 470, 64, 90, 6)),
    L('flagpole', line(500, 250, 500, 180)),
    F('flag', polygon([[500, 185], [580, 210], [500, 235]])),
  ];
}

// ── 10. Cat ───────────────────────────────────────────────────────────────────
function cat(): Region[] {
  return [
    F('body', ellipse(500, 790, 190, 170)),
    F('tail', fromSvg('M 660 810 Q 900 780 830 560 Q 815 660 700 690 Z')),
    F('earL', polygon([[345, 330], [305, 150], [475, 300]])),
    F('earR', polygon([[655, 330], [695, 150], [525, 300]])),
    F('head', circle(500, 470, 220)),
    F('earInL', polygon([[370, 320], [345, 210], [450, 300]])),
    F('earInR', polygon([[630, 320], [655, 210], [550, 300]])),
    F('eyeL', ellipse(430, 450, 34, 46)),
    F('eyeR', ellipse(570, 450, 34, 46)),
    I('pupilL', ellipse(430, 452, 11, 24)),
    I('pupilR', ellipse(570, 452, 11, 24)),
    F('nose', polygon([[478, 520], [522, 520], [500, 548]])),
    L('mouth', fromSvg('M 500 548 Q 460 588 425 563 M 500 548 Q 540 588 575 563')),
    L('whiskerL', fromSvg('M 360 520 L 235 495 M 360 545 L 235 555 M 360 570 L 250 605')),
    L('whiskerR', fromSvg('M 640 520 L 765 495 M 640 545 L 765 555 M 640 570 L 750 605')),
  ];
}

// ── 11. Dog ───────────────────────────────────────────────────────────────────
function dog(): Region[] {
  return [
    F('body', ellipse(500, 830, 200, 140)),
    F('earL', ellipse(305, 480, 92, 185)),
    F('earR', ellipse(695, 480, 92, 185)),
    F('head', circle(500, 470, 215)),
    F('snout', ellipse(500, 560, 135, 105)),
    F('nose', ellipse(500, 515, 46, 32)),
    F('eyeL', circle(420, 430, 28)),
    F('eyeR', circle(580, 430, 28)),
    I('pupilL', circle(426, 435, 12)),
    I('pupilR', circle(586, 435, 12)),
    F('tongue', ellipse(500, 650, 42, 62)),
    L('mouth', fromSvg('M 400 585 Q 500 655 600 585')),
  ];
}

// ── 12. Rabbit ────────────────────────────────────────────────────────────────
function rabbit(): Region[] {
  return [
    F('body', ellipse(500, 820, 175, 155)),
    F('footL', ellipse(410, 905, 72, 46)),
    F('footR', ellipse(590, 905, 72, 46)),
    F('earL', ellipse(432, 235, 56, 220)),
    F('earR', ellipse(568, 235, 56, 220)),
    F('head', circle(500, 520, 185)),
    F('earInL', ellipse(432, 250, 28, 165)),
    F('earInR', ellipse(568, 250, 28, 165)),
    I('eyeL', circle(445, 500, 20)),
    I('eyeR', circle(555, 500, 20)),
    F('nose', heart(500, 560, 24)),
    L('mouth', fromSvg('M 500 578 L 500 602 M 500 602 Q 470 626 448 610 M 500 602 Q 530 626 552 610')),
    L('whiskers', fromSvg('M 420 560 L 300 545 M 420 585 L 305 600 M 580 560 L 700 545 M 580 585 L 695 600')),
  ];
}

// ── 13. Teddy bear ────────────────────────────────────────────────────────────
function bear(): Region[] {
  return [
    F('earL', circle(360, 275, 72)),
    F('earR', circle(640, 275, 72)),
    F('head', circle(500, 400, 190)),
    F('earInL', circle(360, 275, 38)),
    F('earInR', circle(640, 275, 38)),
    F('snout', ellipse(500, 455, 92, 72)),
    F('nose', ellipse(500, 430, 34, 24)),
    I('eyeL', circle(438, 380, 18)),
    I('eyeR', circle(562, 380, 18)),
    L('mouth', fromSvg('M 500 455 L 500 490 M 500 490 Q 470 515 450 500 M 500 490 Q 530 515 550 500')),
    F('armL', circle(315, 720, 92)),
    F('armR', circle(685, 720, 92)),
    F('legL', circle(405, 930, 82)),
    F('legR', circle(595, 930, 82)),
    F('body', ellipse(500, 790, 205, 185)),
    F('tummy', ellipse(500, 800, 118, 135)),
  ];
}

// ── 14. Duck ──────────────────────────────────────────────────────────────────
function duck(): Region[] {
  return [
    F('tail', polygon([[250, 560], [150, 515], [215, 605]])),
    F('body', ellipse(480, 585, 260, 190)),
    F('wing', fromSvg('M 360 545 Q 520 495 575 630 Q 460 600 360 545 Z')),
    F('head', circle(680, 405, 132)),
    F('beak', polygon([[770, 378], [910, 410], [770, 452]])),
    I('eye', circle(700, 375, 15)),
    L('water', fromSvg('M 140 800 Q 220 760 300 800 T 460 800 T 620 800 T 780 800 T 900 800')),
  ];
}

// ── 15. Owl ───────────────────────────────────────────────────────────────────
function owl(): Region[] {
  return [
    F('branch', roundRect(180, 830, 640, 52, 22)),
    F('tuftL', polygon([[300, 305], [345, 155], [430, 305]])),
    F('tuftR', polygon([[700, 305], [655, 155], [570, 305]])),
    F('body', ellipse(500, 540, 232, 290)),
    F('wingL', ellipse(300, 575, 72, 200)),
    F('wingR', ellipse(700, 575, 72, 200)),
    F('belly', ellipse(500, 640, 122, 185)),
    F('eyeL', circle(410, 445, 92)),
    F('eyeR', circle(590, 445, 92)),
    I('pupilL', circle(415, 455, 34)),
    I('pupilR', circle(585, 455, 34)),
    F('beak', polygon([[472, 490], [528, 490], [500, 560]])),
    L('feet', fromSvg('M 430 828 L 430 790 M 410 828 L 410 792 M 450 828 L 450 792 M 570 828 L 570 790 M 550 828 L 550 792 M 590 828 L 590 792')),
  ];
}

// ── 16. Bee ───────────────────────────────────────────────────────────────────
function bee(): Region[] {
  return [
    F('wingL', ellipse(430, 320, 125, 95)),
    F('wingR', ellipse(590, 320, 125, 95)),
    F('stinger', polygon([[262, 520], [180, 498], [180, 542]])),
    F('body', ellipse(490, 525, 250, 175)),
    F('stripe1', fromSvg('M 405 375 Q 382 525 405 675 Q 465 682 478 675 Q 456 525 478 375 Q 435 368 405 375 Z')),
    F('stripe2', fromSvg('M 545 375 Q 522 525 545 675 Q 605 682 618 675 Q 596 525 618 375 Q 575 368 545 375 Z')),
    F('head', circle(715, 525, 95)),
    L('antL', fromSvg('M 745 452 Q 778 384 758 352')),
    L('antR', fromSvg('M 704 452 Q 714 380 746 358')),
    I('eye', circle(735, 508, 16)),
    L('smile', fromSvg('M 700 552 Q 732 580 766 556')),
  ];
}

// ── 17. Ladybug ───────────────────────────────────────────────────────────────
function ladybug(): Region[] {
  const spots = [
    [400, 470], [610, 470], [360, 620], [650, 620], [500, 720], [500, 500],
  ].map(([x, y], i) => F(`spot${i}`, circle(x, y, 42)));
  return [
    L('legs', fromSvg('M 300 470 L 200 420 M 290 560 L 175 560 M 320 660 L 225 720 M 700 470 L 800 420 M 710 560 L 825 560 M 680 660 L 775 720')),
    F('body', circle(500, 560, 250)),
    F('head', fromSvg('M 330 400 A 190 190 0 0 1 670 400 Z')),
    L('split', line(500, 380, 500, 800)),
    ...spots,
    I('eyeL', circle(430, 350, 13)),
    I('eyeR', circle(570, 350, 13)),
  ];
}

// ── 18. Snail ─────────────────────────────────────────────────────────────────
function snail(): Region[] {
  return [
    F('body', fromSvg('M 360 520 Q 190 520 190 670 Q 190 750 320 750 L 640 750 Q 690 750 690 695 L 690 560 Q 620 610 540 590 Z')),
    L('stalkL', fromSvg('M 300 470 Q 280 380 320 340')),
    L('stalkR', fromSvg('M 360 470 Q 380 390 430 360')),
    I('eyeL', circle(320, 335, 16)),
    I('eyeR', circle(432, 356, 16)),
    F('shell', circle(560, 470, 210)),
    L('spiral', fromSvg('M 560 470 m -130 0 a 130 130 0 1 0 260 0 a 95 95 0 1 0 -190 0 a 60 60 0 1 0 120 0 a 28 28 0 1 0 -56 0')),
    L('smile', fromSvg('M 250 660 Q 285 690 325 665')),
  ];
}

// ── 19. Turtle ────────────────────────────────────────────────────────────────
function turtle(): Region[] {
  const cx = 460;
  const cy = 520;
  const hex = (r: number, ry = r) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (i * Math.PI) / 3 - Math.PI / 2;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * ry] as [number, number];
    });
  const inner = hex(70);
  const outer = hex(210, 155);
  const plates: Region[] = [];
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    plates.push(F(`plate${i}`, polygon([inner[i], outer[i], outer[j], inner[j]])));
  }
  return [
    F('legFL', ellipse(300, 430, 72, 52)),
    F('legFR', ellipse(620, 430, 72, 52)),
    F('legBL', ellipse(300, 630, 72, 52)),
    F('legBR', ellipse(620, 630, 72, 52)),
    F('tail', polygon([[250, 520], [175, 495], [180, 545]])),
    F('head', circle(720, 520, 76)),
    I('eye', circle(745, 500, 11)),
    L('smile', fromSvg('M 748 540 Q 768 558 788 540')),
    F('shell', ellipse(cx, cy, 240, 180)),
    F('shellCenter', polygon(inner)),
    ...plates,
  ];
}

// ── 20. Whale ─────────────────────────────────────────────────────────────────
function whale(): Region[] {
  return [
    F('fluke', polygon([[650, 480], [885, 400], [795, 535], [885, 670], [650, 590]])),
    F('body', fromSvg('M 175 560 Q 155 370 390 362 Q 560 358 645 430 Q 705 478 705 535 Q 705 600 640 655 Q 545 720 390 715 Q 155 725 175 560 Z')),
    F('fin', polygon([[350, 690], [285, 795], [445, 770]])),
    L('spout', fromSvg('M 245 368 Q 215 295 232 214 M 248 368 Q 250 285 258 205 M 250 368 Q 288 298 306 236')),
    I('eye', circle(285, 520, 15)),
    L('smile', fromSvg('M 200 570 Q 300 632 402 572')),
    L('waves', fromSvg('M 120 855 Q 210 820 300 855 T 480 855 T 660 855 T 840 855 T 960 855')),
  ];
}

// ── 21. Star ──────────────────────────────────────────────────────────────────
function starPage(): Region[] {
  return [
    F('outer', star(500, 500, 390, 165, 5)),
    F('inner', star(500, 500, 205, 90, 5)),
    I('eyeL', circle(455, 470, 15)),
    I('eyeR', circle(545, 470, 15)),
    L('smile', fromSvg('M 450 520 Q 500 560 550 520')),
  ];
}

// ── 22. Rainbow ───────────────────────────────────────────────────────────────
function rainbow(): Region[] {
  const cx = 500;
  const cy = 760;
  const bands: Region[] = [];
  for (let i = 0; i < 6; i++) {
    const ro = 420 - i * 58;
    bands.push(F(`band${i}`, arcBand(cx, cy, ro, ro - 58)));
  }
  return [
    ...bands,
    F('cloudL1', circle(160, 760, 90)),
    F('cloudL2', circle(250, 730, 110)),
    F('cloudR1', circle(840, 760, 90)),
    F('cloudR2', circle(750, 730, 110)),
  ];
}

// ── 23. Tree ──────────────────────────────────────────────────────────────────
function tree(): Region[] {
  return [
    F('trunk', roundRect(452, 540, 96, 350, 12)),
    F('leaf1', circle(390, 420, 155)),
    F('leaf2', circle(610, 420, 155)),
    F('leaf3', circle(500, 290, 175)),
    F('apple1', circle(400, 470, 34)),
    F('apple2', circle(600, 440, 34)),
    F('apple3', circle(500, 350, 34)),
    L('grass', fromSvg('M 300 890 Q 340 840 380 890 M 400 890 Q 440 840 480 890 M 520 890 Q 560 840 600 890 M 620 890 Q 660 840 700 890')),
  ];
}

// ── 24. Mushroom ──────────────────────────────────────────────────────────────
function mushroom(): Region[] {
  return [
    F('stem', fromSvg('M 395 560 Q 385 810 435 870 L 565 870 Q 615 810 605 560 Z')),
    F('cap', fromSvg('M 210 580 Q 500 210 790 580 Q 500 520 210 580 Z')),
    F('spot1', ellipse(370, 470, 55, 40)),
    F('spot2', ellipse(560, 430, 62, 44)),
    F('spot3', ellipse(650, 540, 46, 34)),
    F('spot4', ellipse(300, 545, 40, 30)),
    I('eyeL', circle(455, 700, 13)),
    I('eyeR', circle(545, 700, 13)),
    L('smile', fromSvg('M 455 745 Q 500 775 545 745')),
  ];
}

// ── 25. Ice cream ─────────────────────────────────────────────────────────────
function iceCream(): Region[] {
  return [
    F('cone', polygon([[360, 560], [640, 560], [500, 940]])),
    L('coneLines', fromSvg('M 390 620 L 470 560 M 430 700 L 560 560 M 470 780 L 610 620 M 510 860 L 620 720')),
    F('scoopL', circle(428, 490, 128)),
    F('scoopR', circle(572, 490, 128)),
    F('scoopT', circle(500, 360, 138)),
    F('cherry', circle(500, 250, 46)),
    L('stem', fromSvg('M 500 210 Q 520 150 570 150')),
  ];
}

// ── 26. Cupcake ───────────────────────────────────────────────────────────────
function cupcake(): Region[] {
  return [
    F('wrap', polygon([[320, 560], [680, 560], [622, 885], [378, 885]])),
    L('wrapLines', fromSvg('M 400 566 L 388 880 M 470 566 L 466 882 M 540 566 L 544 882 M 610 566 L 622 880')),
    F('frostL', circle(390, 500, 112)),
    F('frostR', circle(610, 500, 112)),
    F('frostM', circle(500, 470, 122)),
    F('frostT', circle(500, 370, 118)),
    F('cherry', circle(500, 290, 48)),
    L('sprinkles', fromSvg('M 430 470 l 20 -14 M 520 500 l 14 -20 M 470 400 l -16 -18 M 560 430 l 20 12 M 400 540 l 22 6')),
  ];
}

// ── 27. Balloon ───────────────────────────────────────────────────────────────
function balloon(): Region[] {
  return [
    L('string', fromSvg('M 500 700 Q 570 800 470 880 Q 400 950 500 995')),
    F('balloon', ellipse(500, 400, 225, 275)),
    F('knot', polygon([[472, 662], [528, 662], [500, 706]])),
    F('shine', ellipse(420, 300, 45, 70)),
  ];
}

// ── 28. Sailboat ──────────────────────────────────────────────────────────────
function boat(): Region[] {
  return [
    F('water', roundRect(80, 760, 840, 150, 30)),
    F('hull', polygon([[200, 640], [800, 640], [720, 795], [280, 795]])),
    F('mast', roundRect(490, 150, 20, 490, 10)),
    F('sailL', polygon([[500, 175], [500, 600], [235, 600]])),
    F('sailR', polygon([[520, 220], [520, 585], [755, 585]])),
    F('flag', polygon([[500, 150], [585, 175], [500, 200]])),
    L('waves', fromSvg('M 130 850 Q 210 815 290 850 T 450 850 T 610 850 T 770 850 T 900 850')),
  ];
}

// ── 29. Rocket ────────────────────────────────────────────────────────────────
function rocket(): Region[] {
  return [
    F('flameOuter', polygon([[410, 660], [500, 900], [590, 660]])),
    F('flameInner', polygon([[450, 660], [500, 800], [550, 660]])),
    F('finL', polygon([[380, 500], [270, 690], [380, 630]])),
    F('finR', polygon([[620, 500], [730, 690], [620, 630]])),
    F('body', fromSvg('M 500 110 Q 622 260 622 610 L 378 610 Q 378 260 500 110 Z')),
    F('base', roundRect(378, 605, 244, 60, 12)),
    F('window', circle(500, 350, 72)),
    F('star1', star(200, 260, 34, 15, 5)),
    F('star2', star(810, 340, 30, 13, 5)),
    F('star3', star(760, 150, 26, 11, 5)),
  ];
}

// ── 30. Heart ─────────────────────────────────────────────────────────────────
function heartPage(): Region[] {
  return [
    F('outer', heart(500, 470, 300)),
    F('inner', heart(500, 455, 175)),
    F('mini1', heart(210, 260, 70)),
    F('mini2', heart(800, 300, 60)),
    F('mini3', heart(760, 720, 55)),
  ];
}

// ── 31. Elephant ──────────────────────────────────────────────────────────────
function elephant(): Region[] {
  return [
    F('earL', ellipse(285, 445, 165, 185)),
    F('earR', ellipse(715, 445, 165, 185)),
    F('body', ellipse(500, 770, 210, 165)),
    F('head', circle(500, 470, 220)),
    F('earInL', ellipse(300, 455, 95, 115)),
    F('earInR', ellipse(700, 455, 95, 115)),
    F('trunk', fromSvg('M 442 620 Q 378 770 422 895 Q 450 955 514 925 Q 470 850 482 745 Q 492 665 548 635 Z')),
    F('tuskL', polygon([[432, 660], [404, 780], [456, 692]])),
    F('tuskR', polygon([[600, 660], [628, 780], [576, 692]])),
    I('eyeL', circle(440, 440, 20)),
    I('eyeR', circle(600, 440, 20)),
    F('footL', roundRect(360, 815, 95, 150, 20)),
    F('footR', roundRect(545, 815, 95, 150, 20)),
  ];
}

// ── 32. Lion ──────────────────────────────────────────────────────────────────
function lion(): Region[] {
  const mane: Region[] = [];
  for (let i = 0; i < 12; i++) {
    mane.push(F(`mane${i}`, petalAt(500, 475, (i * Math.PI) / 6, 235, 95)));
  }
  return [
    ...mane,
    F('head', circle(500, 475, 180)),
    F('earL', circle(378, 340, 44)),
    F('earR', circle(622, 340, 44)),
    F('muzzle', ellipse(500, 545, 115, 88)),
    I('nose', polygon([[468, 508], [532, 508], [500, 540]])),
    L('mouth', fromSvg('M 500 540 L 500 566 M 500 566 Q 463 590 442 568 M 500 566 Q 537 590 558 568')),
    I('eyeL', circle(455, 458, 16)),
    I('eyeR', circle(545, 458, 16)),
  ];
}

// ── 33. Pig ───────────────────────────────────────────────────────────────────
function pig(): Region[] {
  return [
    F('earL', polygon([[352, 352], [312, 248], [446, 332]])),
    F('earR', polygon([[648, 352], [688, 248], [554, 332]])),
    F('body', ellipse(500, 785, 200, 150)),
    F('head', circle(500, 485, 205)),
    F('snout', ellipse(500, 535, 112, 84)),
    I('nostrilL', circle(478, 535, 13)),
    I('nostrilR', circle(522, 535, 13)),
    I('eyeL', circle(442, 445, 17)),
    I('eyeR', circle(558, 445, 17)),
    L('smile', fromSvg('M 440 605 Q 500 645 560 605')),
    L('tail', fromSvg('M 692 785 q 62 -8 52 -60 q -10 -42 -46 -24')),
    F('footL', roundRect(400, 850, 72, 105, 16)),
    F('footR', roundRect(528, 850, 72, 105, 16)),
  ];
}

// ── 34. Frog ──────────────────────────────────────────────────────────────────
function frog(): Region[] {
  return [
    F('eyeDomeL', circle(392, 322, 92)),
    F('eyeDomeR', circle(608, 322, 92)),
    F('body', fromSvg('M 210 520 Q 210 360 500 360 Q 790 360 790 520 Q 790 770 500 770 Q 210 770 210 520 Z')),
    I('eyeL', circle(392, 318, 34)),
    I('eyeR', circle(608, 318, 34)),
    L('mouth', fromSvg('M 310 560 Q 500 690 690 560')),
    F('footL', fromSvg('M 300 740 Q 235 815 165 795 Q 220 780 250 720 Z')),
    F('footR', fromSvg('M 700 740 Q 765 815 835 795 Q 780 780 750 720 Z')),
    F('legL', ellipse(345, 745, 95, 70)),
    F('legR', ellipse(655, 745, 95, 70)),
  ];
}

// ── 35. Penguin ───────────────────────────────────────────────────────────────
function penguin(): Region[] {
  return [
    F('body', fromSvg('M 500 190 Q 735 190 735 520 Q 735 855 500 855 Q 265 855 265 520 Q 265 190 500 190 Z')),
    F('belly', fromSvg('M 500 300 Q 632 300 632 560 Q 632 785 500 785 Q 368 785 368 560 Q 368 300 500 300 Z')),
    F('wingL', fromSvg('M 285 420 Q 215 560 300 705 Q 322 575 322 440 Z')),
    F('wingR', fromSvg('M 715 420 Q 785 560 700 705 Q 678 575 678 440 Z')),
    F('beak', polygon([[452, 402], [548, 402], [500, 472]])),
    I('eyeL', circle(455, 370, 16)),
    I('eyeR', circle(545, 370, 16)),
    F('footL', fromSvg('M 425 845 Q 385 905 320 895 Q 365 855 405 835 Z')),
    F('footR', fromSvg('M 575 845 Q 615 905 680 895 Q 635 855 595 835 Z')),
  ];
}

// ── 36. Chick ─────────────────────────────────────────────────────────────────
function chick(): Region[] {
  return [
    F('body', ellipse(500, 560, 235, 245)),
    F('head', circle(500, 350, 165)),
    F('wingL', fromSvg('M 300 540 Q 235 620 305 700 Q 320 610 340 560 Z')),
    F('wingR', fromSvg('M 700 540 Q 765 620 695 700 Q 680 610 660 560 Z')),
    F('beak', polygon([[452, 350], [452, 392], [510, 371]])),
    I('eyeL', circle(462, 330, 15)),
    I('eyeR', circle(542, 330, 15)),
    F('footL', fromSvg('M 445 795 L 445 855 M 445 855 L 405 895 M 445 855 L 445 900 M 445 855 L 485 895')),
    F('footR', fromSvg('M 555 795 L 555 855 M 555 855 L 515 895 M 555 855 L 555 900 M 555 855 L 595 895')),
    F('tuft', fromSvg('M 470 190 Q 480 130 500 175 Q 520 130 530 190 Z')),
  ];
}

// ── 37. Panda ─────────────────────────────────────────────────────────────────
function panda(): Region[] {
  return [
    F('earL', circle(345, 320, 78)),
    F('earR', circle(655, 320, 78)),
    F('body', ellipse(500, 790, 210, 165)),
    F('armL', circle(320, 760, 82)),
    F('armR', circle(680, 760, 82)),
    F('head', circle(500, 460, 215)),
    F('patchL', ellipse(415, 460, 66, 82)),
    F('patchR', ellipse(585, 460, 66, 82)),
    I('eyeL', circle(415, 460, 24)),
    I('eyeR', circle(585, 460, 24)),
    F('nose', ellipse(500, 540, 34, 24)),
    L('mouth', fromSvg('M 500 560 L 500 585 M 500 585 Q 468 610 448 592 M 500 585 Q 532 610 552 592')),
  ];
}

// ── 38. Monkey ────────────────────────────────────────────────────────────────
function monkey(): Region[] {
  return [
    F('earL', circle(305, 470, 82)),
    F('earR', circle(695, 470, 82)),
    F('body', ellipse(500, 800, 185, 150)),
    F('head', circle(500, 470, 205)),
    F('face', ellipse(500, 520, 145, 155)),
    I('eyeL', circle(455, 480, 18)),
    I('eyeR', circle(545, 480, 18)),
    F('muzzle', ellipse(500, 560, 90, 70)),
    I('nostrilL', circle(485, 555, 9)),
    I('nostrilR', circle(515, 555, 9)),
    L('smile', fromSvg('M 452 590 Q 500 625 548 590')),
    F('tail', fromSvg('M 680 830 Q 850 800 830 630 Q 815 720 720 730 Z')),
  ];
}

// ── 39. Cow ───────────────────────────────────────────────────────────────────
function cow(): Region[] {
  return [
    F('hornL', fromSvg('M 360 300 Q 300 250 320 200 Q 350 245 390 285 Z')),
    F('hornR', fromSvg('M 640 300 Q 700 250 680 200 Q 650 245 610 285 Z')),
    F('earL', ellipse(320, 400, 70, 45)),
    F('earR', ellipse(680, 400, 70, 45)),
    F('body', ellipse(500, 790, 210, 160)),
    F('head', fromSvg('M 260 420 Q 260 260 500 260 Q 740 260 740 420 Q 740 560 500 560 Q 260 560 260 420 Z')),
    F('muzzle', fromSvg('M 360 560 Q 360 470 500 470 Q 640 470 640 560 Q 640 660 500 660 Q 360 660 360 560 Z')),
    I('nostrilL', ellipse(462, 590, 20, 13)),
    I('nostrilR', ellipse(538, 590, 20, 13)),
    I('eyeL', circle(430, 400, 20)),
    I('eyeR', circle(570, 400, 20)),
    F('spot1', ellipse(400, 800, 70, 55)),
    F('spot2', ellipse(600, 760, 55, 45)),
    F('legL', roundRect(410, 850, 70, 110, 14)),
    F('legR', roundRect(520, 850, 70, 110, 14)),
  ];
}

// ── 40. Horse ─────────────────────────────────────────────────────────────────
function horse(): Region[] {
  return [
    F('earL', polygon([[430, 250], [408, 160], [478, 235]])),
    F('earR', polygon([[570, 250], [592, 160], [522, 235]])),
    F('mane', fromSvg('M 360 240 Q 300 400 340 620 Q 380 460 420 300 Z')),
    F('head', fromSvg('M 400 230 Q 610 230 640 430 Q 660 620 560 760 Q 500 820 440 760 Q 400 640 400 470 Z')),
    F('snout', ellipse(500, 720, 100, 90)),
    I('nostril', ellipse(500, 730, 22, 15)),
    I('eye', circle(560, 400, 20)),
    F('forelock', fromSvg('M 470 210 Q 500 150 530 210 Q 520 260 500 290 Q 480 260 470 210 Z')),
    L('mouth', fromSvg('M 455 765 Q 500 790 545 765')),
  ];
}

// ── 41. Octopus ───────────────────────────────────────────────────────────────
function octopus(): Region[] {
  const legs: Region[] = [];
  for (let i = 0; i < 6; i++) {
    const x = 250 + i * 100;
    const dir = i % 2 === 0 ? 1 : -1;
    legs.push(
      F(
        `leg${i}`,
        fromSvg(
          `M ${x - 45} 560 Q ${x - 60} 780 ${x + dir * 30} 860 Q ${x + dir * 55} 900 ${x + dir * 20} 850 Q ${x - 5} 770 ${x + 45} 560 Z`,
        ),
      ),
    );
  }
  return [
    ...legs,
    F('head', fromSvg('M 260 480 Q 260 250 500 250 Q 740 250 740 480 Q 740 620 500 620 Q 260 620 260 480 Z')),
    I('eyeL', circle(440, 440, 30)),
    I('eyeR', circle(560, 440, 30)),
    L('smile', fromSvg('M 440 520 Q 500 570 560 520')),
    F('cheekL', circle(390, 505, 22)),
    F('cheekR', circle(610, 505, 22)),
  ];
}

// ── 42. Crab ──────────────────────────────────────────────────────────────────
function crab(): Region[] {
  return [
    F('legL1', fromSvg('M 300 560 Q 180 560 150 470 Q 220 520 320 520 Z')),
    F('legL2', fromSvg('M 300 610 Q 180 640 160 720 Q 230 650 320 660 Z')),
    F('legR1', fromSvg('M 700 560 Q 820 560 850 470 Q 780 520 680 520 Z')),
    F('legR2', fromSvg('M 700 610 Q 820 640 840 720 Q 770 650 680 660 Z')),
    F('clawL', fromSvg('M 290 470 Q 190 400 210 300 Q 250 360 300 380 Q 260 320 300 280 Q 350 360 340 460 Z')),
    F('clawR', fromSvg('M 710 470 Q 810 400 790 300 Q 750 360 700 380 Q 740 320 700 280 Q 650 360 660 460 Z')),
    F('shell', fromSvg('M 300 640 Q 300 460 500 460 Q 700 460 700 640 Q 700 730 500 730 Q 300 730 300 640 Z')),
    I('eyeStalkL', fromSvg('M 445 470 L 435 385')),
    I('eyeStalkR', fromSvg('M 555 470 L 565 385')),
    I('eyeL', circle(433, 372, 24)),
    I('eyeR', circle(567, 372, 24)),
    L('smile', fromSvg('M 430 600 Q 500 655 570 600')),
  ];
}

// ── 43. Dolphin ───────────────────────────────────────────────────────────────
function dolphin(): Region[] {
  return [
    F('tail', polygon([[720, 500], [900, 430], [830, 520], [900, 640], [720, 570]])),
    F('body', fromSvg('M 180 560 Q 240 330 520 340 Q 760 350 780 530 Q 782 555 760 575 Q 620 690 400 680 Q 220 672 180 560 Z')),
    F('finTop', polygon([[470, 350], [560, 250], [575, 360]])),
    F('finSide', fromSvg('M 360 610 Q 340 720 430 760 Q 420 660 420 600 Z')),
    F('belly', fromSvg('M 240 590 Q 420 700 700 610 Q 460 660 240 590 Z')),
    I('eye', circle(300, 500, 15)),
    L('smile', fromSvg('M 195 560 Q 270 610 350 555')),
    L('waves', fromSvg('M 120 850 Q 210 815 300 850 T 480 850 T 660 850 T 840 850 T 960 850')),
  ];
}

// ── 44. Dinosaur ──────────────────────────────────────────────────────────────
function dino(): Region[] {
  const plates: Region[] = [];
  for (let i = 0; i < 5; i++) {
    const x = 360 + i * 90;
    plates.push(F(`plate${i}`, polygon([[x - 45, 470], [x, 380], [x + 45, 470]])));
  }
  return [
    F('tail', fromSvg('M 760 620 Q 900 600 940 500 Q 860 560 780 540 Z')),
    F('neck', fromSvg('M 250 560 Q 180 380 260 250 Q 320 360 340 500 Z')),
    F('head', circle(255, 235, 95)),
    F('body', fromSvg('M 300 470 Q 320 350 540 350 Q 780 350 800 560 Q 800 700 540 700 Q 320 700 300 470 Z')),
    ...plates,
    I('eye', circle(230, 215, 16)),
    L('smile', fromSvg('M 175 250 Q 230 285 290 255')),
    F('legF', roundRect(400, 660, 80, 150, 16)),
    F('legB', roundRect(650, 660, 80, 150, 16)),
  ];
}

// ── 45. Unicorn ───────────────────────────────────────────────────────────────
function unicorn(): Region[] {
  return [
    F('horn', polygon([[500, 90], [458, 260], [542, 260]])),
    L('hornLine1', fromSvg('M 470 200 L 530 185')),
    L('hornLine2', fromSvg('M 478 150 L 522 138')),
    F('earL', polygon([[420, 270], [398, 175], [468, 258]])),
    F('earR', polygon([[580, 270], [602, 175], [532, 258]])),
    F('mane', fromSvg('M 360 250 Q 280 430 330 660 Q 380 480 430 320 Z')),
    F('head', fromSvg('M 400 250 Q 615 250 645 450 Q 665 640 560 780 Q 500 840 440 780 Q 400 660 400 480 Z')),
    F('snout', ellipse(505, 740, 100, 88)),
    I('nostril', ellipse(505, 750, 20, 14)),
    I('eye', circle(560, 430, 22)),
    L('lashes', fromSvg('M 540 405 L 522 388 M 560 400 L 552 380 M 580 405 L 592 388')),
    F('cheekStar', star(430, 520, 34, 15, 5)),
  ];
}

// ── 46. Snowman ───────────────────────────────────────────────────────────────
function snowman(): Region[] {
  return [
    F('bottom', circle(500, 760, 200)),
    F('middle', circle(500, 480, 155)),
    F('head', circle(500, 260, 115)),
    L('armL', fromSvg('M 350 470 L 190 400 M 190 400 L 150 350 M 190 400 L 140 420')),
    L('armR', fromSvg('M 650 470 L 810 400 M 810 400 L 850 350 M 810 400 L 860 420')),
    F('hatBrim', roundRect(390, 175, 220, 34, 10)),
    F('hatTop', roundRect(420, 60, 160, 125, 8)),
    F('nose', polygon([[500, 260], [610, 275], [500, 295]])),
    I('eyeL', circle(470, 235, 13)),
    I('eyeR', circle(530, 235, 13)),
    I('mouth1', circle(455, 300, 8)),
    I('mouth2', circle(485, 312, 8)),
    I('mouth3', circle(515, 312, 8)),
    I('mouth4', circle(545, 300, 8)),
    F('button1', circle(500, 430, 20)),
    F('button2', circle(500, 500, 20)),
    F('button3', circle(500, 570, 20)),
  ];
}

// ── 47. Ghost ─────────────────────────────────────────────────────────────────
function ghost(): Region[] {
  return [
    F('body', fromSvg('M 250 460 Q 250 170 500 170 Q 750 170 750 460 L 750 840 Q 690 760 630 840 Q 570 760 510 840 Q 450 760 390 840 Q 330 760 270 840 L 250 460 Z')),
    I('eyeL', ellipse(420, 400, 42, 58)),
    I('eyeR', ellipse(580, 400, 42, 58)),
    I('mouth', ellipse(500, 560, 55, 75)),
    F('cheekL', circle(360, 520, 26)),
    F('cheekR', circle(640, 520, 26)),
  ];
}

// ── 48. Robot ─────────────────────────────────────────────────────────────────
function robot(): Region[] {
  return [
    L('antenna', fromSvg('M 500 210 L 500 130')),
    F('antennaBall', circle(500, 115, 30)),
    F('head', roundRect(340, 210, 320, 260, 30)),
    F('eyeL', circle(430, 320, 45)),
    F('eyeR', circle(570, 320, 45)),
    I('pupilL', circle(430, 320, 18)),
    I('pupilR', circle(570, 320, 18)),
    L('mouth', fromSvg('M 420 410 L 580 410 M 450 410 L 450 440 M 500 410 L 500 440 M 550 410 L 550 440 M 420 440 L 580 440')),
    F('body', roundRect(310, 480, 380, 340, 24)),
    F('screen', roundRect(390, 540, 220, 130, 12)),
    F('btn1', circle(430, 730, 24)),
    F('btn2', circle(500, 730, 24)),
    F('btn3', circle(570, 730, 24)),
    F('armL', roundRect(210, 520, 90, 220, 24)),
    F('armR', roundRect(700, 520, 90, 220, 24)),
    F('legL', roundRect(370, 820, 90, 130, 18)),
    F('legR', roundRect(540, 820, 90, 130, 18)),
  ];
}

// ── 49. Train ─────────────────────────────────────────────────────────────────
function train(): Region[] {
  return [
    F('engine', roundRect(170, 440, 420, 300, 24)),
    F('cab', roundRect(430, 330, 200, 240, 20)),
    F('cabWin', roundRect(470, 370, 120, 110, 12)),
    F('funnel', fromSvg('M 250 440 L 250 300 Q 250 260 320 260 Q 320 300 320 440 Z')),
    F('smoke', circle(285, 210, 55)),
    F('light', circle(210, 560, 42)),
    F('carriage', roundRect(660, 470, 260, 260, 20)),
    F('carWin', roundRect(700, 510, 180, 110, 12)),
    F('wheelBig', circle(310, 780, 88)),
    F('wheelMid', circle(500, 780, 66)),
    F('wheelCar', circle(790, 780, 66)),
    I('hubBig', circle(310, 780, 28)),
    I('hubMid', circle(500, 780, 22)),
    I('hubCar', circle(790, 780, 22)),
  ];
}

// ── 50. Airplane ──────────────────────────────────────────────────────────────
function airplane(): Region[] {
  return [
    F('wingTop', polygon([[470, 470], [560, 250], [610, 470]])),
    F('wingBot', polygon([[470, 560], [560, 800], [610, 560]])),
    F('body', fromSvg('M 130 520 Q 200 430 560 430 Q 760 430 850 500 Q 880 520 850 540 Q 760 610 560 610 Q 200 610 130 520 Z')),
    F('tailFin', polygon([[760, 440], [880, 330], [850, 470]])),
    F('nose', fromSvg('M 130 520 Q 90 480 90 520 Q 90 560 130 520 Z')),
    F('win1', circle(300, 520, 28)),
    F('win2', circle(400, 520, 28)),
    F('win3', circle(500, 520, 28)),
    F('win4', circle(600, 520, 28)),
    L('clouds', fromSvg('M 150 800 Q 230 760 310 800 T 470 800 M 560 830 Q 640 790 720 830 T 880 830')),
  ];
}

// ── 51. Bus ───────────────────────────────────────────────────────────────────
function bus(): Region[] {
  return [
    F('body', roundRect(110, 360, 780, 420, 40)),
    F('win1', roundRect(170, 420, 130, 150, 14)),
    F('win2', roundRect(330, 420, 130, 150, 14)),
    F('win3', roundRect(490, 420, 130, 150, 14)),
    F('door', roundRect(660, 420, 170, 300, 14)),
    F('stripe', roundRect(110, 620, 780, 60, 0)),
    F('light', circle(150, 720, 34)),
    F('wheelL', circle(300, 800, 90)),
    F('wheelR', circle(700, 800, 90)),
    I('hubL', circle(300, 800, 30)),
    I('hubR', circle(700, 800, 30)),
  ];
}

// ── 52. Bicycle ───────────────────────────────────────────────────────────────
function bicycle(): Region[] {
  return [
    F('wheelL', ring(300, 640, 150, 95)),
    F('wheelR', ring(700, 640, 150, 95)),
    L('frame', fromSvg('M 300 640 L 480 380 L 700 640 M 480 380 L 560 380 M 300 640 L 560 380 M 560 380 L 620 300')),
    L('seat', fromSvg('M 452 362 L 512 358')),
    L('bars', fromSvg('M 598 292 L 662 288 M 620 300 L 620 268')),
    I('pedal', circle(480, 640, 26)),
    I('hubL', circle(300, 640, 18)),
    I('hubR', circle(700, 640, 18)),
  ];
}

// ── 53. Kite ──────────────────────────────────────────────────────────────────
function kite(): Region[] {
  return [
    F('top', polygon([[500, 130], [340, 420], [500, 470]])),
    F('right', polygon([[500, 130], [660, 420], [500, 470]])),
    F('left', polygon([[340, 420], [500, 470], [420, 700]])),
    F('botR', polygon([[660, 420], [500, 470], [580, 700]])),
    L('spine', fromSvg('M 500 130 L 500 700 M 340 420 L 660 420')),
    L('string', fromSvg('M 500 700 Q 560 800 470 870 Q 400 930 500 990')),
    F('bow1', polygon([[485, 730], [455, 710], [485, 750], [455, 770]])),
    F('bow2', polygon([[478, 830], [448, 810], [478, 850], [448, 870]])),
  ];
}

// ── 54. Umbrella ──────────────────────────────────────────────────────────────
function umbrella(): Region[] {
  return [
    F('canopy', fromSvg('M 130 470 Q 130 180 500 180 Q 870 180 870 470 Q 760 400 650 470 Q 540 400 430 470 Q 320 400 210 470 Q 170 450 130 470 Z')),
    L('rib1', fromSvg('M 320 435 Q 350 300 430 200')),
    L('rib2', fromSvg('M 540 200 Q 560 320 560 445')),
    L('rib3', fromSvg('M 680 435 Q 650 300 570 200')),
    L('pole', fromSvg('M 500 200 L 500 820')),
    F('handle', fromSvg('M 500 820 Q 500 900 420 900 Q 350 900 350 830 Q 400 850 440 830 Q 470 810 460 820 Z')),
    F('tip', polygon([[490, 190], [510, 190], [500, 150]])),
  ];
}

// ── 55. Gift ──────────────────────────────────────────────────────────────────
function gift(): Region[] {
  return [
    F('box', roundRect(230, 400, 540, 470, 16)),
    F('lid', roundRect(200, 320, 600, 120, 16)),
    F('ribbonV', roundRect(460, 320, 80, 550, 4)),
    F('ribbonH', roundRect(200, 500, 600, 70, 4)),
    F('bowL', fromSvg('M 500 320 Q 360 200 340 300 Q 340 370 500 340 Z')),
    F('bowR', fromSvg('M 500 320 Q 640 200 660 300 Q 660 370 500 340 Z')),
    F('bowKnot', circle(500, 320, 34)),
  ];
}

// ── 56. Cloud ─────────────────────────────────────────────────────────────────
function cloud(): Region[] {
  return [
    F('cloud', fromSvg('M 260 560 Q 200 560 200 490 Q 200 400 300 400 Q 320 300 440 320 Q 480 220 620 270 Q 740 240 760 360 Q 850 370 850 470 Q 850 560 770 560 Z')),
    I('eyeL', circle(430, 440, 18)),
    I('eyeR', circle(560, 440, 18)),
    L('smile', fromSvg('M 430 500 Q 495 545 560 500')),
    F('dropL', drop(360, 680, 30, 55)),
    F('dropM', drop(500, 720, 30, 55)),
    F('dropR', drop(640, 680, 30, 55)),
  ];
}

// ── 57. Moon ──────────────────────────────────────────────────────────────────
function moon(): Region[] {
  return [
    F('moon', fromSvg('M 620 130 Q 340 200 340 500 Q 340 800 620 870 Q 400 720 400 500 Q 400 280 620 130 Z')),
    I('eye', circle(470, 430, 20)),
    L('smile', fromSvg('M 430 520 Q 490 570 545 515')),
    F('cheek', circle(415, 500, 24)),
    F('star1', star(760, 260, 46, 20, 5)),
    F('star2', star(700, 620, 34, 15, 5)),
    F('star3', star(820, 460, 28, 12, 5)),
  ];
}

// ── 58. Apple ─────────────────────────────────────────────────────────────────
function apple(): Region[] {
  return [
    F('body', fromSvg('M 500 300 Q 400 220 300 300 Q 200 400 240 620 Q 280 850 500 850 Q 720 850 760 620 Q 800 400 700 300 Q 600 220 500 300 Z')),
    L('cleft', fromSvg('M 500 300 Q 500 360 500 400')),
    F('leaf', fromSvg('M 520 250 Q 620 180 700 230 Q 620 300 520 280 Z')),
    L('stem', fromSvg('M 500 300 Q 495 240 520 210')),
    F('shine', ellipse(400, 420, 45, 70)),
  ];
}

// ── 59. Watermelon ────────────────────────────────────────────────────────────
function watermelon(): Region[] {
  const seeds: Region[] = [];
  const pts: [number, number][] = [
    [420, 560], [500, 540], [580, 560], [455, 660], [545, 660], [500, 760],
  ];
  pts.forEach(([x, y], i) => seeds.push(I(`seed${i}`, ellipse(x, y, 16, 26))));
  return [
    F('rind', bowl(500, 450, 350, 420)),
    F('flesh', bowl(500, 480, 285, 340)),
    ...seeds,
  ];
}

// ── 60. Donut ─────────────────────────────────────────────────────────────────
function donut(): Region[] {
  return [
    F('base', ring(500, 520, 300, 115)),
    F('icing', fromSvg(
      'M 500 240 Q 660 240 740 330 Q 810 410 770 520 Q 800 560 755 585 ' +
        'Q 710 520 630 555 Q 560 515 500 575 Q 440 515 370 555 Q 290 520 245 585 ' +
        'Q 200 560 230 520 Q 190 410 260 330 Q 340 240 500 240 Z',
    )),
    F('hole', circle(500, 520, 115)),
    L('sprinkle1', fromSvg('M 380 330 l 26 -14')),
    L('sprinkle2', fromSvg('M 560 300 l 10 -28')),
    L('sprinkle3', fromSvg('M 680 400 l 28 8')),
    L('sprinkle4', fromSvg('M 330 460 l 20 22')),
    L('sprinkle5', fromSvg('M 640 480 l -8 28')),
    L('sprinkle6', fromSvg('M 470 290 l -18 -22')),
  ];
}

// ── 61. Fox ───────────────────────────────────────────────────────────────────
function fox(): Region[] {
  return [
    F('tail', fromSvg('M 340 780 Q 130 760 170 540 Q 210 660 340 690 Q 402 720 380 792 Z')),
    F('tailTip', fromSvg('M 172 546 Q 150 472 210 452 Q 252 500 240 572 Q 200 592 172 546 Z')),
    F('body', ellipse(530, 780, 175, 150)),
    F('legL', roundRect(452, 850, 55, 100, 16)),
    F('legR', roundRect(560, 850, 55, 100, 16)),
    F('earL', polygon([[370, 310], [310, 140], [480, 300]])),
    F('earR', polygon([[630, 310], [690, 140], [520, 300]])),
    F('earInL', polygon([[390, 300], [350, 200], [455, 292]])),
    F('earInR', polygon([[610, 300], [650, 200], [545, 292]])),
    F('head', fromSvg('M 310 400 Q 310 250 500 250 Q 690 250 690 400 Q 690 490 600 530 L 500 620 L 400 530 Q 310 490 310 400 Z')),
    F('cheekL', fromSvg('M 400 530 Q 330 546 312 470 Q 366 510 426 496 Z')),
    F('cheekR', fromSvg('M 600 530 Q 670 546 688 470 Q 634 510 574 496 Z')),
    F('snout', fromSvg('M 440 500 Q 440 560 500 616 Q 560 560 560 500 Q 500 482 440 500 Z')),
    I('nose', ellipse(500, 604, 24, 18)),
    I('eyeL', ellipse(432, 430, 18, 24)),
    I('eyeR', ellipse(568, 430, 18, 24)),
    L('mouth', fromSvg('M 500 616 L 500 646 M 500 646 Q 470 670 448 654 M 500 646 Q 530 670 552 654')),
  ];
}

// ── 62. Deer ──────────────────────────────────────────────────────────────────
function deer(): Region[] {
  return [
    F('legFL', roundRect(432, 850, 46, 105, 12)),
    F('legFR', roundRect(524, 850, 46, 105, 12)),
    F('body', ellipse(500, 785, 170, 150)),
    L('antlerL', fromSvg('M 420 300 Q 372 200 392 116 M 400 190 Q 352 156 320 172 M 412 240 Q 372 214 342 232')),
    L('antlerR', fromSvg('M 580 300 Q 628 200 608 116 M 600 190 Q 648 156 680 172 M 588 240 Q 628 214 658 232')),
    F('earL', ellipse(392, 322, 52, 92)),
    F('earR', ellipse(608, 322, 52, 92)),
    F('head', fromSvg('M 400 300 Q 610 300 620 432 Q 624 542 540 620 Q 500 650 460 620 Q 376 542 380 432 Q 390 300 400 300 Z')),
    F('snout', ellipse(500, 598, 78, 68)),
    I('nose', ellipse(500, 582, 30, 22)),
    I('eyeL', circle(452, 442, 17)),
    I('eyeR', circle(548, 442, 17)),
    L('smile', fromSvg('M 470 636 Q 500 656 530 636')),
    F('spot1', circle(452, 760, 18)),
    F('spot2', circle(534, 735, 15)),
    F('spot3', circle(498, 800, 13)),
  ];
}

// ── 63. Koala ─────────────────────────────────────────────────────────────────
function koala(): Region[] {
  return [
    F('branch', roundRect(120, 850, 760, 42, 21)),
    F('earL', circle(320, 360, 115)),
    F('earR', circle(680, 360, 115)),
    F('earInL', circle(320, 360, 62)),
    F('earInR', circle(680, 360, 62)),
    F('body', ellipse(500, 800, 185, 165)),
    F('armL', fromSvg('M 350 730 Q 260 770 258 858 Q 312 842 372 800 Z')),
    F('armR', fromSvg('M 650 730 Q 740 770 742 858 Q 688 842 628 800 Z')),
    F('head', circle(500, 470, 210)),
    F('nose', fromSvg('M 432 420 Q 432 560 500 600 Q 568 560 568 420 Q 500 392 432 420 Z')),
    I('eyeL', circle(408, 440, 22)),
    I('eyeR', circle(592, 440, 22)),
    L('mouth', fromSvg('M 500 600 Q 468 632 446 616 M 500 600 Q 532 632 554 616')),
  ];
}

// ── 64. Hedgehog ──────────────────────────────────────────────────────────────
function hedgehog(): Region[] {
  const cx = 540;
  const cy = 540;
  const spikes: Region[] = [];
  for (let i = 0; i < 11; i++) {
    const a = (-160 + i * 18) * (Math.PI / 180);
    const b1: [number, number] = [cx + Math.cos(a - 0.12) * 160, cy + Math.sin(a - 0.12) * 160];
    const b2: [number, number] = [cx + Math.cos(a + 0.12) * 160, cy + Math.sin(a + 0.12) * 160];
    const tip: [number, number] = [cx + Math.cos(a) * 270, cy + Math.sin(a) * 270];
    spikes.push(F(`spike${i}`, polygon([b1, tip, b2])));
  }
  return [
    ...spikes,
    F('body', ellipse(cx, cy, 168, 150)),
    F('face', fromSvg('M 300 560 Q 300 448 420 440 Q 512 436 528 528 Q 532 616 440 672 Q 336 700 300 560 Z')),
    F('footL', ellipse(430, 720, 42, 28)),
    F('footR', ellipse(545, 720, 42, 28)),
    I('nose', circle(316, 566, 24)),
    I('eye', circle(430, 520, 15)),
    L('smile', fromSvg('M 350 606 Q 392 636 432 610')),
  ];
}

// ── 65. Sheep ─────────────────────────────────────────────────────────────────
function sheep(): Region[] {
  return [
    F('legL', roundRect(430, 820, 44, 110, 12)),
    F('legR', roundRect(528, 820, 44, 110, 12)),
    F('bodyBase', ellipse(500, 620, 205, 165)),
    F('wool1', circle(360, 560, 100)),
    F('wool2', circle(485, 520, 115)),
    F('wool3', circle(615, 555, 100)),
    F('wool4', circle(345, 675, 95)),
    F('wool5', circle(500, 705, 110)),
    F('wool6', circle(650, 670, 92)),
    F('earL', ellipse(360, 415, 68, 40)),
    F('earR', ellipse(640, 415, 68, 40)),
    F('curlL', circle(438, 322, 52)),
    F('curlC', circle(500, 300, 58)),
    F('curlR', circle(562, 322, 52)),
    F('face', ellipse(500, 430, 118, 140)),
    I('eyeL', circle(466, 424, 15)),
    I('eyeR', circle(534, 424, 15)),
    L('smile', fromSvg('M 468 486 Q 500 512 532 486')),
  ];
}

// ── 66. Hamster ───────────────────────────────────────────────────────────────
function hamster(): Region[] {
  return [
    F('body', fromSvg('M 262 560 Q 262 322 500 322 Q 738 322 738 560 Q 738 800 500 800 Q 262 800 262 560 Z')),
    F('earL', circle(362, 344, 68)),
    F('earR', circle(638, 344, 68)),
    F('earInL', circle(362, 344, 36)),
    F('earInR', circle(638, 344, 36)),
    F('cheekL', circle(330, 566, 128)),
    F('cheekR', circle(670, 566, 128)),
    F('belly', ellipse(500, 640, 150, 180)),
    F('handL', ellipse(432, 662, 44, 40)),
    F('handR', ellipse(568, 662, 44, 40)),
    F('seed', ellipse(500, 686, 34, 46)),
    F('footL', ellipse(432, 800, 54, 34)),
    F('footR', ellipse(568, 800, 54, 34)),
    I('eyeL', circle(440, 500, 24)),
    I('eyeR', circle(560, 500, 24)),
    I('nose', polygon([[482, 556], [518, 556], [500, 578]])),
    L('mouth', fromSvg('M 500 578 L 500 598 M 500 598 Q 472 620 452 604 M 500 598 Q 528 620 548 604')),
  ];
}

// ── 67. Squirrel ──────────────────────────────────────────────────────────────
function squirrel(): Region[] {
  return [
    F('tail', fromSvg('M 620 800 Q 900 780 880 480 Q 866 300 690 300 Q 830 356 810 520 Q 792 682 626 706 Q 560 780 620 800 Z')),
    F('body', fromSvg('M 380 800 Q 336 570 420 428 Q 470 348 560 388 Q 626 520 606 704 Q 596 806 480 812 Q 412 812 380 800 Z')),
    F('legF', ellipse(430, 800, 50, 32)),
    F('legB', ellipse(542, 802, 50, 32)),
    F('armL', fromSvg('M 470 470 Q 520 520 512 606 Q 470 580 452 520 Q 448 480 470 470 Z')),
    F('earL', polygon([[392, 246], [362, 146], [462, 244]])),
    F('earR', polygon([[552, 246], [582, 146], [482, 244]])),
    F('head', circle(470, 366, 148)),
    F('cheek', ellipse(468, 424, 108, 88)),
    F('acorn', ellipse(556, 626, 54, 44)),
    F('acornCap', fromSvg('M 502 606 Q 556 566 610 606 Q 556 626 502 606 Z')),
    I('eye', circle(452, 352, 22)),
    I('nose', circle(360, 424, 17)),
    L('smile', fromSvg('M 380 452 Q 420 482 460 456')),
  ];
}

// ── 68. Raccoon ───────────────────────────────────────────────────────────────
function raccoon(): Region[] {
  return [
    F('tail', fromSvg('M 640 800 Q 860 800 860 600 Q 840 500 740 500 Q 800 560 790 640 Q 770 720 660 730 Q 600 760 640 800 Z')),
    L('tailRing1', fromSvg('M 690 520 Q 740 560 770 620')),
    L('tailRing2', fromSvg('M 660 620 Q 720 660 760 700')),
    F('body', ellipse(500, 800, 190, 160)),
    F('armL', circle(330, 780, 68)),
    F('armR', circle(670, 780, 68)),
    F('earL', polygon([[350, 300], [318, 168], [468, 306]])),
    F('earR', polygon([[650, 300], [682, 168], [532, 306]])),
    F('earInL', polygon([[372, 300], [352, 220], [452, 300]])),
    F('earInR', polygon([[628, 300], [648, 220], [548, 300]])),
    F('head', circle(500, 450, 208)),
    F('mask', fromSvg('M 336 424 Q 400 384 460 424 Q 500 452 540 424 Q 600 384 664 424 Q 662 506 580 514 Q 500 484 420 514 Q 338 506 336 424 Z')),
    F('snout', fromSvg('M 420 486 Q 420 590 500 628 Q 580 590 580 486 Q 500 466 420 486 Z')),
    I('nose', ellipse(500, 598, 28, 22)),
    I('eyeL', circle(436, 450, 19)),
    I('eyeR', circle(564, 450, 19)),
    L('mouth', fromSvg('M 500 628 L 500 654 M 500 654 Q 472 678 452 662 M 500 654 Q 528 678 548 662')),
  ];
}

// ── 69. Flamingo ──────────────────────────────────────────────────────────────
function flamingo(): Region[] {
  return [
    L('legL', fromSvg('M 470 660 L 456 850 M 456 850 L 410 882 M 456 850 L 500 882')),
    L('legR', fromSvg('M 540 660 L 556 830 M 556 830 L 512 862 M 556 830 L 600 862')),
    F('body', ellipse(520, 520, 200, 158)),
    F('wing', fromSvg('M 360 500 Q 540 438 626 596 Q 486 578 360 500 Z')),
    F('neck', fromSvg('M 470 400 Q 372 300 414 178 Q 436 96 520 108 Q 566 176 542 286 Q 528 362 560 424 Q 510 452 470 400 Z')),
    F('head', circle(506, 128, 74)),
    F('beak', fromSvg('M 476 150 Q 402 176 380 232 Q 442 210 502 198 Q 500 168 476 150 Z')),
    I('beakTip', fromSvg('M 380 232 Q 400 210 424 208 Q 414 232 380 232 Z')),
    I('eye', circle(520, 118, 13)),
    L('water', fromSvg('M 150 850 Q 250 818 350 850 T 550 850 T 750 850 T 920 850')),
  ];
}

// ── 70. Swan ──────────────────────────────────────────────────────────────────
function swan(): Region[] {
  return [
    L('water', fromSvg('M 130 820 Q 240 786 350 820 T 570 820 T 790 820 T 940 820')),
    F('body', fromSvg('M 220 630 Q 220 466 470 456 Q 646 450 706 546 Q 726 586 694 626 Q 770 560 812 604 Q 748 728 520 728 Q 258 738 220 630 Z')),
    F('wing', fromSvg('M 300 606 Q 424 484 606 526 Q 522 606 420 646 Q 350 656 300 606 Z')),
    F('neck', fromSvg('M 432 486 Q 320 384 362 242 Q 384 158 474 150 Q 526 160 524 224 Q 502 328 546 428 Q 496 460 432 486 Z')),
    F('head', circle(478, 150, 60)),
    F('beak', polygon([[424, 138], [352, 164], [426, 186]])),
    I('beakDot', circle(430, 150, 10)),
    I('eye', circle(492, 140, 12)),
  ];
}

// ── 71. Peacock ───────────────────────────────────────────────────────────────
function peacock(): Region[] {
  const cx = 500;
  const cy = 660;
  const plumes: Region[] = [];
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + ((i - 4) * 20 * Math.PI) / 180;
    const tx = cx + Math.cos(a) * 330;
    const ty = cy + Math.sin(a) * 330;
    plumes.push(F(`plume${i}`, petalAt(cx, cy, a, 330, 42)));
    plumes.push(F(`plumeEye${i}`, circle(tx, ty, 34)));
    plumes.push(F(`plumeDot${i}`, circle(tx, ty, 15)));
  }
  return [
    ...plumes,
    F('body', ellipse(cx, 650, 92, 150)),
    F('head', circle(cx, 430, 58)),
    F('beak', polygon([[cx - 12, 452], [cx + 12, 452], [cx, 486]])),
    I('eyeL', circle(cx - 20, 424, 9)),
    I('eyeR', circle(cx + 20, 424, 9)),
    L('crest', fromSvg('M 474 380 L 466 330 M 500 372 L 500 318 M 526 380 L 534 330')),
    F('crestDotL', circle(466, 322, 12)),
    F('crestDotC', circle(500, 310, 12)),
    F('crestDotR', circle(534, 322, 12)),
    F('footL', fromSvg('M 470 800 L 470 850 M 470 850 L 445 880 M 470 850 L 495 880')),
    F('footR', fromSvg('M 530 800 L 530 850 M 530 850 L 505 880 M 530 850 L 555 880')),
  ];
}

// ── 72. Seahorse ──────────────────────────────────────────────────────────────
function seahorse(): Region[] {
  return [
    F('bubble1', circle(710, 220, 24)),
    F('bubble2', circle(756, 158, 15)),
    F('body', fromSvg('M 500 200 Q 624 214 634 344 Q 640 446 560 522 Q 500 572 522 662 Q 544 762 624 782 Q 540 824 468 782 Q 416 740 428 648 Q 440 536 398 456 Q 356 352 420 256 Q 452 208 500 200 Z')),
    F('snout', fromSvg('M 500 202 Q 562 172 624 192 Q 602 232 542 236 Q 510 232 500 202 Z')),
    F('finBack', fromSvg('M 612 322 Q 692 344 702 434 Q 650 402 610 402 Q 602 360 612 322 Z')),
    F('finBelly', ellipse(420, 470, 44, 68)),
    L('crest', fromSvg('M 430 244 L 452 214 M 470 214 L 496 190 M 520 200 L 552 184 M 590 260 L 616 244 M 616 320 L 646 312')),
    L('rings', fromSvg('M 440 320 Q 500 300 560 330 M 428 400 Q 500 380 570 412 M 444 480 Q 504 462 558 490')),
    I('eye', circle(470, 262, 19)),
  ];
}

// ── 73. Mermaid ───────────────────────────────────────────────────────────────
function mermaid(): Region[] {
  return [
    F('tailFin', fromSvg('M 372 858 Q 500 754 628 858 Q 566 924 500 892 Q 434 924 372 858 Z')),
    F('tail', fromSvg('M 428 556 Q 398 720 400 802 Q 460 842 540 842 Q 602 802 600 720 Q 588 618 560 556 Q 500 536 428 556 Z')),
    L('scales', fromSvg('M 440 600 Q 470 620 500 600 Q 530 620 560 600 M 434 660 Q 468 682 500 660 Q 532 682 566 660 M 440 720 Q 470 740 500 720 Q 530 740 560 720')),
    F('body', fromSvg('M 432 400 Q 432 340 500 340 Q 568 340 568 400 L 568 562 Q 500 540 432 560 Z')),
    F('shellL', fromSvg('M 466 452 Q 430 410 462 384 Q 496 410 494 452 Q 480 468 466 452 Z')),
    F('shellR', fromSvg('M 534 452 Q 570 410 538 384 Q 504 410 506 452 Q 520 468 534 452 Z')),
    F('armL', fromSvg('M 448 400 Q 360 440 336 540 Q 376 520 420 470 Q 444 436 448 400 Z')),
    F('armR', fromSvg('M 552 400 Q 640 440 664 540 Q 624 520 580 470 Q 556 436 552 400 Z')),
    F('hairL', fromSvg('M 430 240 Q 340 320 330 500 Q 300 620 360 700 Q 380 560 400 460 Q 410 340 430 240 Z')),
    F('hairR', fromSvg('M 570 240 Q 660 320 670 500 Q 700 620 640 700 Q 620 560 600 460 Q 590 340 570 240 Z')),
    F('head', circle(500, 268, 88)),
    F('starHair', star(414, 214, 30, 13, 5)),
    I('eyeL', circle(476, 264, 10)),
    I('eyeR', circle(524, 264, 10)),
    L('smile', fromSvg('M 478 298 Q 500 318 522 298')),
  ];
}

// ── 74. Fairy ─────────────────────────────────────────────────────────────────
function fairy(): Region[] {
  return [
    F('wingUL', fromSvg('M 466 430 Q 300 306 258 466 Q 250 566 378 546 Q 458 508 466 430 Z')),
    F('wingUR', fromSvg('M 534 430 Q 700 306 742 466 Q 750 566 622 546 Q 542 508 534 430 Z')),
    F('wingLL', ellipse(372, 604, 88, 118)),
    F('wingLR', ellipse(628, 604, 88, 118)),
    F('dress', fromSvg('M 430 470 L 570 470 L 662 726 Q 500 786 338 726 Z')),
    L('dressHem', fromSvg('M 348 712 Q 400 748 452 712 Q 500 748 548 712 Q 600 748 652 712')),
    F('bodice', roundRect(442, 384, 116, 108, 22)),
    F('legL', roundRect(456, 720, 38, 118, 18)),
    F('legR', roundRect(506, 720, 38, 118, 18)),
    F('armR', roundRect(566, 400, 46, 150, 23)),
    L('wand', fromSvg('M 588 430 L 686 300')),
    F('wandStar', star(690, 286, 40, 17, 5)),
    F('armL', roundRect(388, 400, 46, 150, 23)),
    F('hair', fromSvg('M 418 250 Q 380 360 396 470 Q 440 430 458 330 Z M 582 250 Q 620 360 604 470 Q 560 430 542 330 Z')),
    F('bun', circle(500, 232, 46)),
    F('head', circle(500, 306, 82)),
    I('eyeL', circle(478, 304, 9)),
    I('eyeR', circle(522, 304, 9)),
    L('smile', fromSvg('M 480 334 Q 500 350 520 334')),
  ];
}

// ── 75. Ballerina ─────────────────────────────────────────────────────────────
function ballerina(): Region[] {
  return [
    F('legL', fromSvg('M 480 600 Q 470 720 442 850 Q 434 874 456 872 Q 484 754 508 636 Z')),
    F('legR', fromSvg('M 522 600 Q 566 700 646 782 Q 664 796 668 776 Q 596 700 548 604 Z')),
    F('shoeL', ellipse(448, 872, 42, 22)),
    F('shoeR', ellipse(658, 786, 42, 22)),
    L('ribbonL', fromSvg('M 424 800 L 470 828 M 424 828 L 470 800')),
    L('ribbonR', fromSvg('M 620 748 L 664 776 M 620 776 L 664 748')),
    F('tutu', fromSvg('M 352 566 Q 500 500 648 566 Q 620 652 500 626 Q 380 652 352 566 Z')),
    L('tutuLine', fromSvg('M 372 590 Q 500 560 628 590')),
    F('bodice', fromSvg('M 452 396 Q 500 376 548 396 L 538 566 Q 500 548 462 566 Z')),
    F('armL', fromSvg('M 456 420 Q 356 400 296 316 Q 288 296 306 300 Q 384 358 472 384 Z')),
    F('armR', fromSvg('M 544 420 Q 644 400 704 316 Q 712 296 694 300 Q 616 358 528 384 Z')),
    F('bun', circle(500, 246, 52)),
    F('head', circle(500, 322, 76)),
    I('eyeL', circle(480, 320, 9)),
    I('eyeR', circle(520, 320, 9)),
    L('smile', fromSvg('M 482 346 Q 500 362 518 346')),
  ];
}

// ── 76. Kitty (bow) ───────────────────────────────────────────────────────────
function kittyBow(): Region[] {
  return [
    F('earL', polygon([[350, 306], [300, 178], [474, 322]])),
    F('earR', polygon([[650, 306], [700, 178], [526, 322]])),
    F('head', fromSvg('M 262 470 Q 262 306 500 306 Q 738 306 738 470 Q 738 646 500 666 Q 262 646 262 470 Z')),
    F('bowKnot', circle(694, 356, 28)),
    F('bowL', polygon([[694, 356], [604, 300], [604, 420]])),
    F('bowR', polygon([[694, 356], [784, 300], [784, 420]])),
    F('body', fromSvg('M 386 664 Q 366 824 404 904 L 596 904 Q 634 824 614 664 Z')),
    F('armL', roundRect(298, 700, 96, 62, 26)),
    F('armR', roundRect(606, 700, 96, 62, 26)),
    F('legL', roundRect(404, 890, 80, 54, 20)),
    F('legR', roundRect(516, 890, 80, 54, 20)),
    F('pocket', roundRect(452, 762, 96, 74, 12)),
    F('pocketFlower', circle(500, 800, 18)),
    I('eyeL', ellipse(430, 476, 22, 32)),
    I('eyeR', ellipse(570, 476, 22, 32)),
    I('nose', ellipse(500, 516, 26, 19)),
    L('whiskerL', fromSvg('M 344 476 L 232 456 M 344 506 L 228 512 M 348 536 L 244 562')),
    L('whiskerR', fromSvg('M 656 476 L 768 456 M 656 506 L 772 512 M 652 536 L 756 562')),
  ];
}

// ── 77. Robot cat ─────────────────────────────────────────────────────────────
function robotCat(): Region[] {
  return [
    F('head', circle(500, 380, 248)),
    F('face', fromSvg('M 300 432 Q 300 250 500 250 Q 700 250 700 432 Q 700 620 500 640 Q 300 620 300 432 Z')),
    F('eyeL', ellipse(456, 322, 54, 68)),
    F('eyeR', ellipse(544, 322, 54, 68)),
    I('pupilL', circle(470, 336, 13)),
    I('pupilR', circle(530, 336, 13)),
    I('nose', circle(500, 404, 32)),
    L('noseLine', fromSvg('M 500 436 L 500 500')),
    L('mouth', fromSvg('M 344 500 Q 500 660 656 500')),
    L('whiskerL', fromSvg('M 360 424 L 250 396 M 360 456 L 246 462 M 362 488 L 258 516')),
    L('whiskerR', fromSvg('M 640 424 L 750 396 M 640 456 L 754 462 M 638 488 L 742 516')),
    F('body', fromSvg('M 322 676 Q 300 878 360 958 L 640 958 Q 700 878 678 676 Q 500 736 322 676 Z')),
    F('collar', fromSvg('M 306 632 Q 500 690 694 632 Q 694 680 500 720 Q 306 680 306 632 Z')),
    F('bell', circle(500, 700, 44)),
    L('bellLine', fromSvg('M 458 692 L 542 692')),
    I('bellHole', circle(500, 716, 9)),
    F('tummy', circle(500, 836, 118)),
    F('pocket', fromSvg('M 402 812 Q 500 906 598 812 Z')),
    F('armL', circle(300, 782, 68)),
    F('armR', circle(700, 782, 68)),
    F('legL', roundRect(388, 948, 104, 40, 20)),
    F('legR', roundRect(508, 948, 104, 40, 20)),
  ];
}

// ── 78. Angel ─────────────────────────────────────────────────────────────────
function angel(): Region[] {
  return [
    F('halo', ring(500, 150, 92, 66)),
    F('wingL', fromSvg('M 444 430 Q 262 348 244 528 Q 246 606 362 586 Q 442 548 444 430 Z')),
    F('wingR', fromSvg('M 556 430 Q 738 348 756 528 Q 754 606 638 586 Q 558 548 556 430 Z')),
    F('gown', fromSvg('M 420 404 L 580 404 L 700 864 Q 500 922 300 864 Z')),
    L('gownFold', fromSvg('M 480 424 Q 452 644 404 852 M 520 424 Q 548 644 596 852')),
    F('armL', roundRect(330, 440, 54, 200, 26)),
    F('armR', roundRect(616, 440, 54, 200, 26)),
    F('hairL', fromSvg('M 412 262 Q 380 384 402 452 Q 442 412 460 322 Z')),
    F('hairR', fromSvg('M 588 262 Q 620 384 598 452 Q 558 412 540 322 Z')),
    F('head', circle(500, 288, 84)),
    I('eyeL', circle(478, 286, 9)),
    I('eyeR', circle(522, 286, 9)),
    L('smile', fromSvg('M 480 316 Q 500 332 520 316')),
    F('cheekL', circle(456, 308, 15)),
    F('cheekR', circle(544, 308, 15)),
    F('star1', star(232, 258, 26, 11, 5)),
    F('star2', star(772, 300, 22, 9, 5)),
  ];
}

// ── 79. Strawberry ────────────────────────────────────────────────────────────
function strawberry(): Region[] {
  const seeds: Region[] = [];
  const pts: [number, number][] = [
    [400, 470], [590, 470], [360, 560], [630, 560], [380, 660], [610, 660],
    [460, 740], [540, 740], [500, 800],
  ];
  pts.forEach(([x, y], i) => seeds.push(I(`seed${i}`, ellipse(x, y, 13, 20))));
  return [
    F('body', fromSvg('M 500 330 Q 360 305 300 425 Q 250 560 385 720 Q 460 815 500 850 Q 540 815 615 720 Q 750 560 700 425 Q 640 305 500 330 Z')),
    F('leafL', polygon([[500, 330], [400, 250], [470, 340]])),
    F('leafC', polygon([[500, 320], [500, 215], [548, 300]])),
    F('leafR', polygon([[500, 330], [600, 250], [530, 340]])),
    L('stem', fromSvg('M 500 300 Q 498 250 512 220')),
    ...seeds,
    I('eyeL', circle(452, 545, 20)),
    I('eyeR', circle(548, 545, 20)),
    L('smile', fromSvg('M 448 600 Q 500 642 552 600')),
    F('cheekL', circle(405, 588, 22)),
    F('cheekR', circle(595, 588, 22)),
  ];
}

// ── 80. Chubby cat ────────────────────────────────────────────────────────────
function chubbyCat(): Region[] {
  return [
    F('tail', fromSvg('M 768 706 Q 862 706 860 604 Q 830 664 770 652 Q 720 660 768 706 Z')),
    F('body', fromSvg('M 220 622 Q 220 458 500 448 Q 780 458 780 622 Q 780 784 500 794 Q 220 784 220 622 Z')),
    F('earL', polygon([[322, 470], [300, 372], [412, 456]])),
    F('earR', polygon([[678, 470], [700, 372], [588, 456]])),
    F('footFL', ellipse(392, 792, 54, 30)),
    F('footFR', ellipse(500, 796, 54, 30)),
    F('footBR', ellipse(700, 782, 54, 30)),
    L('stripeHead', fromSvg('M 442 472 L 432 502 M 500 466 L 500 498 M 558 472 L 568 502')),
    L('stripeTail', fromSvg('M 800 660 L 818 650 M 812 686 L 832 680')),
    I('eyeL', circle(432, 560, 16)),
    I('eyeR', circle(568, 560, 16)),
    L('mouth', fromSvg('M 478 600 Q 500 618 522 600')),
    L('whiskerL', fromSvg('M 360 582 L 268 566 M 360 606 L 268 618')),
    L('whiskerR', fromSvg('M 640 582 L 732 566 M 640 606 L 732 618')),
  ];
}

export const PAGES: ColoringPage[] = [
  { id: 'sun', title: 'Ông mặt trời', emoji: '☀️', build: sun },
  { id: 'flower', title: 'Bông hoa', emoji: '🌸', build: flower },
  { id: 'butterfly', title: 'Bươm bướm', emoji: '🦋', build: butterfly },
  { id: 'rainbow', title: 'Cầu vồng', emoji: '🌈', build: rainbow },
  { id: 'star', title: 'Ngôi sao', emoji: '⭐', build: starPage },
  { id: 'heart', title: 'Trái tim', emoji: '❤️', build: heartPage },
  { id: 'tree', title: 'Cây táo', emoji: '🌳', build: tree },
  { id: 'mushroom', title: 'Cây nấm', emoji: '🍄', build: mushroom },
  { id: 'house', title: 'Ngôi nhà', emoji: '🏠', build: house },
  { id: 'castle', title: 'Lâu đài', emoji: '🏰', build: castle },
  { id: 'princess', title: 'Công chúa', emoji: '👸', build: princess },
  { id: 'crown', title: 'Vương miện', emoji: '👑', build: crown },
  { id: 'cat', title: 'Chú mèo', emoji: '🐱', build: cat },
  { id: 'dog', title: 'Chú chó', emoji: '🐶', build: dog },
  { id: 'rabbit', title: 'Chú thỏ', emoji: '🐰', build: rabbit },
  { id: 'bear', title: 'Gấu bông', emoji: '🧸', build: bear },
  { id: 'fish', title: 'Chú cá', emoji: '🐟', build: fish },
  { id: 'whale', title: 'Cá voi', emoji: '🐳', build: whale },
  { id: 'turtle', title: 'Rùa con', emoji: '🐢', build: turtle },
  { id: 'duck', title: 'Vịt con', emoji: '🦆', build: duck },
  { id: 'owl', title: 'Cú mèo', emoji: '🦉', build: owl },
  { id: 'bee', title: 'Ong vàng', emoji: '🐝', build: bee },
  { id: 'ladybug', title: 'Bọ rùa', emoji: '🐞', build: ladybug },
  { id: 'snail', title: 'Ốc sên', emoji: '🐌', build: snail },
  { id: 'car', title: 'Ô tô', emoji: '🚗', build: car },
  { id: 'boat', title: 'Thuyền buồm', emoji: '⛵', build: boat },
  { id: 'rocket', title: 'Tên lửa', emoji: '🚀', build: rocket },
  { id: 'balloon', title: 'Bóng bay', emoji: '🎈', build: balloon },
  { id: 'iceCream', title: 'Kem ốc quế', emoji: '🍦', build: iceCream },
  { id: 'cupcake', title: 'Bánh cupcake', emoji: '🧁', build: cupcake },
  { id: 'elephant', title: 'Voi con', emoji: '🐘', build: elephant },
  { id: 'lion', title: 'Sư tử', emoji: '🦁', build: lion },
  { id: 'pig', title: 'Heo con', emoji: '🐷', build: pig },
  { id: 'frog', title: 'Ếch xanh', emoji: '🐸', build: frog },
  { id: 'penguin', title: 'Chim cánh cụt', emoji: '🐧', build: penguin },
  { id: 'chick', title: 'Gà con', emoji: '🐤', build: chick },
  { id: 'panda', title: 'Gấu trúc', emoji: '🐼', build: panda },
  { id: 'monkey', title: 'Khỉ con', emoji: '🐵', build: monkey },
  { id: 'cow', title: 'Bò sữa', emoji: '🐮', build: cow },
  { id: 'horse', title: 'Ngựa con', emoji: '🐴', build: horse },
  { id: 'octopus', title: 'Bạch tuộc', emoji: '🐙', build: octopus },
  { id: 'crab', title: 'Cua biển', emoji: '🦀', build: crab },
  { id: 'dolphin', title: 'Cá heo', emoji: '🐬', build: dolphin },
  { id: 'dino', title: 'Khủng long', emoji: '🦕', build: dino },
  { id: 'unicorn', title: 'Kỳ lân', emoji: '🦄', build: unicorn },
  { id: 'snowman', title: 'Người tuyết', emoji: '⛄', build: snowman },
  { id: 'ghost', title: 'Ma vui', emoji: '👻', build: ghost },
  { id: 'robot', title: 'Người máy', emoji: '🤖', build: robot },
  { id: 'train', title: 'Tàu hoả', emoji: '🚂', build: train },
  { id: 'airplane', title: 'Máy bay', emoji: '✈️', build: airplane },
  { id: 'bus', title: 'Xe buýt', emoji: '🚌', build: bus },
  { id: 'bicycle', title: 'Xe đạp', emoji: '🚲', build: bicycle },
  { id: 'kite', title: 'Cánh diều', emoji: '🪁', build: kite },
  { id: 'umbrella', title: 'Chiếc ô', emoji: '☂️', build: umbrella },
  { id: 'gift', title: 'Hộp quà', emoji: '🎁', build: gift },
  { id: 'cloud', title: 'Đám mây', emoji: '☁️', build: cloud },
  { id: 'moon', title: 'Mặt trăng', emoji: '🌙', build: moon },
  { id: 'apple', title: 'Quả táo', emoji: '🍎', build: apple },
  { id: 'watermelon', title: 'Dưa hấu', emoji: '🍉', build: watermelon },
  { id: 'donut', title: 'Bánh vòng', emoji: '🍩', build: donut },
  { id: 'fox', title: 'Cáo con', emoji: '🦊', build: fox },
  { id: 'deer', title: 'Nai con', emoji: '🦌', build: deer },
  { id: 'koala', title: 'Gấu koala', emoji: '🐨', build: koala },
  { id: 'hedgehog', title: 'Nhím con', emoji: '🦔', build: hedgehog },
  { id: 'sheep', title: 'Cừu con', emoji: '🐑', build: sheep },
  { id: 'hamster', title: 'Chuột hamster', emoji: '🐹', build: hamster },
  { id: 'squirrel', title: 'Sóc con', emoji: '🐿️', build: squirrel },
  { id: 'raccoon', title: 'Gấu mèo', emoji: '🦝', build: raccoon },
  { id: 'flamingo', title: 'Hồng hạc', emoji: '🦩', build: flamingo },
  { id: 'swan', title: 'Thiên nga', emoji: '🦢', build: swan },
  { id: 'peacock', title: 'Chim công', emoji: '🦚', build: peacock },
  { id: 'seahorse', title: 'Cá ngựa', emoji: '🌊', build: seahorse },
  { id: 'mermaid', title: 'Nàng tiên cá', emoji: '🧜‍♀️', build: mermaid },
  { id: 'fairy', title: 'Cô tiên', emoji: '🧚‍♀️', build: fairy },
  { id: 'ballerina', title: 'Vũ công ba lê', emoji: '🩰', build: ballerina },
  { id: 'kittyBow', title: 'Mèo nơ hồng', emoji: '🎀', build: kittyBow },
  { id: 'robotCat', title: 'Mèo máy', emoji: '🔔', build: robotCat },
  { id: 'angel', title: 'Thiên thần nhỏ', emoji: '😇', build: angel },
  { id: 'strawberry', title: 'Bé dâu tây', emoji: '🍓', build: strawberry },
  { id: 'chubbyCat', title: 'Mèo mập', emoji: '🐈', build: chubbyCat },
];
