import type { SkPath } from '@shopify/react-native-skia';
import { circle, ellipse, fromSvg, heart, line, polygon, roundRect, star } from './shapes';

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
    F('wingL', ellipse(430, 330, 120, 90)),
    F('wingR', ellipse(590, 330, 120, 90)),
    F('stinger', polygon([[305, 520], [210, 497], [210, 543]])),
    F('seg1', fromSvg('M 300 430 Q 300 610 380 640 L 380 400 Q 340 405 300 430 Z')),
    F('seg2', roundRect(380, 388, 130, 264, 10)),
    F('seg3', roundRect(510, 388, 120, 264, 10)),
    F('head', circle(700, 520, 92)),
    L('antL', fromSvg('M 730 445 Q 760 380 740 350')),
    L('antR', fromSvg('M 690 445 Q 700 375 730 355')),
    I('eye', circle(720, 505, 15)),
    L('smile', fromSvg('M 690 545 Q 720 573 752 550')),
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
];
