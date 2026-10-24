import type { SkPath } from '@shopify/react-native-skia';
import type { ColoringPage, Region } from './pages';
import {
  circle,
  dome,
  drop,
  ellipse,
  fromSvg,
  heart,
  petalAt,
  polygon,
  ring,
  roundRect,
  star,
} from './shapes';

// Bigger, busier pages – more little areas to colour than the originals.
// Same 1000×1000 space and region kinds as `pages.ts`.

const W = '#FFFFFF';
const K = '#111111';

const F = (id: string, path: SkPath): Region => ({ id, path, kind: 'fill', initial: W });
const I = (id: string, path: SkPath): Region => ({ id, path, kind: 'ink', initial: K });
const L = (id: string, path: SkPath): Region => ({ id, path, kind: 'line', initial: K });

const { PI, cos, sin } = Math;
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Ellipse rotated by `deg` degrees. */
function oval(cx: number, cy: number, rx: number, ry: number, deg: number): SkPath {
  const a = (deg * PI) / 180;
  const x1 = r1(cx + rx * cos(a));
  const y1 = r1(cy + rx * sin(a));
  const x2 = r1(cx - rx * cos(a));
  const y2 = r1(cy - rx * sin(a));
  return fromSvg(
    `M ${x1} ${y1} A ${rx} ${ry} ${deg} 1 0 ${x2} ${y2} A ${rx} ${ry} ${deg} 1 0 ${x1} ${y1} Z`,
  );
}

/** Puffy cloud with a flat bottom, `w` wide. */
function cloud(cx: number, cy: number, w: number): SkPath {
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  return fromSvg(
    `M ${x0} ${cy} A ${w * 0.17} ${w * 0.17} 0 0 1 ${cx - w * 0.22} ${cy - w * 0.2} ` +
      `A ${w * 0.22} ${w * 0.22} 0 0 1 ${cx + w * 0.16} ${cy - w * 0.24} ` +
      `A ${w * 0.19} ${w * 0.19} 0 0 1 ${x1} ${cy} Z`,
  );
}

/** A little "v" bird. */
const bird = (x: number, y: number, s: number) =>
  fromSvg(`M ${x - s} ${y} Q ${x - s / 2} ${y - s * 0.7} ${x} ${y} Q ${x + s / 2} ${y - s * 0.7} ${x + s} ${y}`);

/** Icing band with drips along its bottom edge, rounded top corners of radius `r`. */
function icing(x0: number, x1: number, top: number, y: number, depth: number, n: number, r: number): SkPath {
  let d = `M ${x0} ${y} L ${x0} ${top + r} Q ${x0} ${top} ${x0 + r} ${top} L ${x1 - r} ${top} Q ${x1} ${top} ${x1} ${top + r} L ${x1} ${y}`;
  for (let i = n; i >= 1; i--) {
    const xa = x0 + ((x1 - x0) * i) / n;
    const xb = x0 + ((x1 - x0) * (i - 1)) / n;
    const dd = depth * (i % 2 ? 1 : 0.55);
    d += ` C ${r1(xa)} ${r1(y + dd * 1.35)} ${r1(xb)} ${r1(y + dd * 1.35)} ${r1(xb)} ${y}`;
  }
  return fromSvg(d + ' Z');
}

/** Bunting: a sagging string with triangular flags hanging off it. */
function bunting(p: string, x0: number, x1: number, y: number, sag: number, n: number): Region[] {
  const out: Region[] = [L(`${p}String`, fromSvg(`M ${x0} ${y} Q ${(x0 + x1) / 2} ${y + sag * 2} ${x1} ${y}`))];
  for (let i = 0; i < n; i++) {
    const t0 = (i + 0.15) / n;
    const t1 = (i + 0.85) / n;
    const at = (t: number): [number, number] => [
      x0 + (x1 - x0) * t,
      y + 2 * sag * 2 * t * (1 - t), // quadratic bezier y with control at sag*2
    ];
    const [ax, ay] = at(t0);
    const [bx, by] = at(t1);
    const mx = (ax + bx) / 2;
    out.push(F(`${p}Flag${i}`, polygon([[ax, ay], [bx, by], [mx, (ay + by) / 2 + 60]])));
  }
  return out;
}

// ── Khinh khí cầu ────────────────────────────────────────────────────────────
function hotAirBalloon(p: string, cx: number, top: number, s: number): Region[] {
  const w = 220 * s; // half width at the widest point
  const h = 480 * s; // top → neck
  const neck = 80 * s; // half width at the neck
  const by = top + h;
  const out: Region[] = [
    F(
      `${p}Env`,
      fromSvg(
        `M ${cx - neck} ${by} C ${cx - w * 1.45} ${top + h * 0.62} ${cx - w * 0.9} ${top} ${cx} ${top} ` +
          `C ${cx + w * 0.9} ${top} ${cx + w * 1.45} ${top + h * 0.62} ${cx + neck} ${by} Z`,
      ),
    ),
  ];
  // vertical gores
  for (let k = 1; k < 6; k++) {
    const t = k / 6;
    const bx = cx - neck + 2 * neck * t;
    const mx = cx + (t - 0.5) * w * 2.1;
    out.push(L(`${p}Gore${k}`, fromSvg(`M ${cx} ${top} Q ${r1(mx)} ${r1(top + h * 0.5)} ${r1(bx)} ${by}`)));
  }
  // a zig-zag band round the middle
  const bandY = top + h * 0.55;
  const zig: string[] = [];
  for (let k = 0; k <= 10; k++) {
    const x = cx - w * 0.98 + (w * 1.96 * k) / 10;
    zig.push(`${k === 0 ? 'M' : 'L'} ${r1(x)} ${r1(bandY + (k % 2 ? -18 : 18) * s)}`);
  }
  out.push(L(`${p}Zig`, fromSvg(zig.join(' '))));
  // ropes + basket
  const bTop = by + 70 * s;
  out.push(
    L(`${p}RopeL`, fromSvg(`M ${cx - neck} ${by} L ${cx - 50 * s} ${bTop}`)),
    L(`${p}RopeR`, fromSvg(`M ${cx + neck} ${by} L ${cx + 50 * s} ${bTop}`)),
    F(`${p}Rim`, roundRect(cx - 62 * s, bTop, 124 * s, 18 * s, 6 * s)),
    F(`${p}Basket`, roundRect(cx - 55 * s, bTop + 18 * s, 110 * s, 62 * s, 8 * s)),
    L(`${p}Weave`, fromSvg(`M ${cx - 55 * s} ${bTop + 49 * s} L ${cx + 55 * s} ${bTop + 49 * s}`)),
  );
  return out;
}

function hotAirBalloons(): Region[] {
  return [
    F('hillBack', fromSvg('M 0 900 Q 220 780 460 870 T 1000 840 L 1000 1000 L 0 1000 Z')),
    F('hillFront', fromSvg('M 0 950 Q 300 880 600 940 T 1000 930 L 1000 1000 L 0 1000 Z')),
    F('cloudA', cloud(160, 520, 210)),
    F('cloudB', cloud(860, 200, 190)),
    F('cloudC', cloud(720, 760, 170)),
    ...hotAirBalloon('big', 480, 60, 0.95),
    ...hotAirBalloon('left', 150, 120, 0.42),
    ...hotAirBalloon('right', 850, 360, 0.48),
    L('birdA', bird(330, 120, 22)),
    L('birdB', bird(390, 160, 16)),
    L('birdC', bird(690, 110, 18)),
  ];
}

// ── Bánh sinh nhật ───────────────────────────────────────────────────────────
function birthdayCake(): Region[] {
  const out: Region[] = [
    ...bunting('bunt', 40, 960, 60, 40, 9),
    // only the rim shows below the cake
    F('plate', fromSvg('M 200 900 Q 140 900 140 910 A 360 38 0 0 0 860 910 Q 860 900 800 900 Z')),
    // bottom tier
    F('tier1', roundRect(200, 650, 600, 250, 30)),
    F('icing1', icing(200, 800, 650, 715, 34, 10, 30)),
    // middle tier
    F('tier2', roundRect(290, 470, 420, 180, 26)),
    F('icing2', icing(290, 710, 470, 525, 30, 8, 26)),
    // top tier
    F('tier3', roundRect(370, 330, 260, 140, 22)),
    F('icing3', icing(370, 630, 330, 375, 26, 6, 22)),
  ];
  // polka dots on the bottom tier
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 7 - row; i++) {
      out.push(F(`dot${row}${i}`, circle(255 + i * 82 + row * 41, 790 + row * 62, 17)));
    }
  }
  // hearts on the middle tier
  for (let i = 0; i < 5; i++) out.push(F(`heart${i}`, heart(345 + i * 77, 595, 22)));
  // stars on the top tier
  for (let i = 0; i < 3; i++) out.push(F(`star${i}`, star(420 + i * 80, 425, 26, 11)));
  // candles
  for (let i = 0; i < 5; i++) {
    const x = 400 + i * 50;
    out.push(
      F(`candle${i}`, roundRect(x - 11, 245, 22, 85, 6)),
      L(`candleStripe${i}`, fromSvg(`M ${x - 11} 275 L ${x + 11} 260 M ${x - 11} 305 L ${x + 11} 290`)),
      F(`flame${i}`, drop(x, 222, 12, 22)),
    );
  }
  // confetti
  const confetti: [number, number][] = [[110, 300], [170, 460], [90, 600], [880, 320], [830, 470], [910, 610]];
  confetti.forEach(([x, y], i) => out.push(F(`confetti${i}`, i % 2 ? star(x, y, 24, 10) : circle(x, y, 16))));
  return out;
}

// ── Xứ sở kẹo ngọt ───────────────────────────────────────────────────────────
function lollipop(p: string, cx: number, cy: number, r: number, stickTo: number): Region[] {
  // spiral drawn as a line inside the candy disc
  let d = `M ${cx} ${cy}`;
  for (let t = 0.3; t <= 4 * PI; t += 0.3) {
    const rr = (r * 0.92 * t) / (4 * PI);
    d += ` L ${r1(cx + cos(t) * rr)} ${r1(cy + sin(t) * rr)}`;
  }
  return [
    F(`${p}Stick`, roundRect(cx - 9, cy + r, 18, stickTo - cy - r, 6)),
    F(`${p}Candy`, circle(cx, cy, r)),
    L(`${p}Swirl`, fromSvg(d)),
  ];
}

function candyCane(p: string, x: number, top: number, bottom: number, r: number): Region[] {
  const t = 26; // cane thickness
  const out: Region[] = [
    F(
      `${p}Cane`,
      fromSvg(
        `M ${x} ${bottom} L ${x} ${top} A ${r} ${r} 0 0 1 ${x + 2 * r} ${top} L ${x + 2 * r} ${top + 40} ` +
          `L ${x + 2 * r - t} ${top + 40} L ${x + 2 * r - t} ${top} A ${r - t} ${r - t} 0 0 0 ${x + t} ${top} ` +
          `L ${x + t} ${bottom} Z`,
      ),
    ),
  ];
  for (let y = top + 30; y < bottom - 10; y += 46) {
    out.push(L(`${p}Stripe${y}`, fromSvg(`M ${x} ${y + 18} L ${x + t} ${y}`)));
  }
  return out;
}

function candyLand(): Region[] {
  const out: Region[] = [
    F('rainbowOuter', fromSvg('M 80 520 A 420 420 0 0 1 920 520 L 860 520 A 360 360 0 0 0 140 520 Z')),
    F('rainbowMid', fromSvg('M 140 520 A 360 360 0 0 1 860 520 L 800 520 A 300 300 0 0 0 200 520 Z')),
    F('rainbowInner', fromSvg('M 200 520 A 300 300 0 0 1 800 520 L 740 520 A 240 240 0 0 0 260 520 Z')),
    F('cloudL', cloud(150, 540, 220)),
    F('cloudR', cloud(850, 540, 220)),
    F('ground', fromSvg('M 0 760 Q 250 700 500 750 T 1000 740 L 1000 1000 L 0 1000 Z')),
  ];
  // winding path of round sweets
  const stones: [number, number][] = [
    [470, 975], [540, 925], [520, 870], [450, 830], [470, 785],
  ];
  stones.forEach(([x, y], i) => out.push(F(`sweet${i}`, ellipse(x, y, 46 - i * 4, 22 - i * 2))));
  out.push(
    ...lollipop('popA', 200, 600, 80, 900),
    ...lollipop('popB', 790, 640, 64, 900),
    ...candyCane('caneA', 320, 640, 860, 46),
    ...candyCane('caneB', 640, 690, 880, 40),
  );
  // gumdrops
  const drops: [number, number, number][] = [
    [90, 940, 52], [330, 950, 40], [680, 960, 46], [900, 930, 58],
  ];
  drops.forEach(([x, y, r], i) => {
    out.push(F(`gum${i}`, dome(x, y, r)), L(`gumShine${i}`, fromSvg(`M ${x - r * 0.45} ${y - r * 0.45} q ${r * 0.15} ${-r * 0.25} ${r * 0.35} ${-r * 0.3}`)));
  });
  // wrapped sweets in the sky
  const wraps: [number, number][] = [[480, 330], [330, 400], [640, 400]];
  wraps.forEach(([x, y], i) => {
    out.push(
      F(`wrap${i}`, ellipse(x, y, 40, 26)),
      F(`wrapL${i}`, polygon([[x - 38, y], [x - 72, y - 24], [x - 72, y + 24]])),
      F(`wrapR${i}`, polygon([[x + 38, y], [x + 72, y - 24], [x + 72, y + 24]])),
    );
  });
  return out;
}

// ── Nhà trên cây ─────────────────────────────────────────────────────────────
function treehouse(): Region[] {
  const out: Region[] = [
    F('sun', circle(100, 100, 56)),
    F('cloud', cloud(870, 130, 180)),
    F('ground', fromSvg('M 0 900 Q 500 850 1000 900 L 1000 1000 L 0 1000 Z')),
    F('trunk', fromSvg('M 430 905 Q 455 760 450 626 L 550 626 Q 545 760 600 905 Z')),
    L('bark', fromSvg('M 480 700 q 10 30 0 60 M 520 800 q -10 25 0 50')),
    // leaves wrap round the house: the bottom edge follows the house outline
    F(
      'canopy',
      fromSvg(
        'M 300 600 A 80 80 0 0 1 200 470 A 100 100 0 0 1 240 290 A 130 130 0 0 1 400 150 ' +
          'A 130 130 0 0 1 610 140 A 120 120 0 0 1 770 280 A 100 100 0 0 1 800 470 A 80 80 0 0 1 700 600 ' +
          'L 620 600 L 620 475 L 645 475 L 490 380 L 335 475 L 360 475 L 360 600 Z',
      ),
    ),
    // platform + house
    F('platform', roundRect(300, 600, 400, 26, 6)),
    F('houseWall', roundRect(360, 470, 260, 130, 6)),
    F('roof', polygon([[335, 475], [490, 380], [645, 475]])),
    F('roofWindow', circle(490, 440, 18)),
    F('door', fromSvg('M 400 600 L 400 530 Q 430 500 460 530 L 460 600 Z')),
    F('window', roundRect(500, 500, 80, 60, 8)),
    L('windowX', fromSvg('M 540 500 L 540 560 M 500 530 L 580 530')),
    I('doorKnob', circle(450, 565, 5)),
    // ladder
    L('ladderL', fromSvg('M 640 626 L 700 905')),
    L('ladderR', fromSvg('M 690 626 L 750 905')),
  ];
  for (let i = 1; i <= 6; i++) {
    const t = i / 7;
    out.push(L(`rung${i}`, fromSvg(`M ${640 + 60 * t} ${626 + 279 * t} L ${690 + 60 * t} ${626 + 279 * t}`)));
  }
  // swing hanging under the platform
  out.push(
    L('swingL', fromSvg('M 330 626 L 330 780')),
    L('swingR', fromSvg('M 410 626 L 410 780')),
    F('swingSeat', roundRect(310, 780, 120, 20, 6)),
  );
  // apples in the canopy
  const apples: [number, number][] = [[260, 430], [290, 300], [410, 220], [590, 210], [720, 320], [740, 470], [500, 290], [400, 330], [610, 330]];
  apples.forEach(([x, y], i) => out.push(F(`apple${i}`, circle(x, y, 20))));
  // flowers
  for (let f = 0; f < 4; f++) {
    const x = 90 + f * 80 + (f > 1 ? 580 : 0);
    const y = 940;
    for (let k = 0; k < 5; k++) {
      const a = (k * 2 * PI) / 5 - PI / 2;
      out.push(F(`fl${f}p${k}`, circle(x + cos(a) * 20, y + sin(a) * 20, 13)));
    }
    out.push(F(`fl${f}c`, circle(x, y, 9)));
  }
  return out;
}

// ── Cỗ xe bí ngô ─────────────────────────────────────────────────────────────
function wheel(p: string, cx: number, cy: number, r: number): Region[] {
  const out: Region[] = [F(`${p}Tyre`, ring(cx, cy, r, r - 16)), F(`${p}Hub`, circle(cx, cy, r * 0.22))];
  for (let k = 0; k < 8; k++) {
    const a = (k * PI) / 4;
    out.push(
      L(
        `${p}Spoke${k}`,
        fromSvg(
          `M ${r1(cx + cos(a) * r * 0.22)} ${r1(cy + sin(a) * r * 0.22)} L ${r1(cx + cos(a) * (r - 16))} ${r1(cy + sin(a) * (r - 16))}`,
        ),
      ),
    );
  }
  return out;
}

function pumpkinCarriage(): Region[] {
  const out: Region[] = [
    F('moon', fromSvg('M 900 60 A 70 70 0 1 0 930 190 A 56 56 0 1 1 900 60 Z')),
    F('road', fromSvg('M 0 880 Q 500 840 1000 880 L 1000 1000 L 0 1000 Z')),
    // pumpkin body: an outer shell with ribs
    F('body', fromSvg('M 500 230 C 820 220 860 700 640 760 L 360 760 C 140 700 180 220 500 230 Z')),
    L('ribL2', fromSvg('M 430 236 C 250 330 260 680 380 760')),
    L('ribL1', fromSvg('M 470 232 C 380 360 390 660 440 760')),
    L('ribR1', fromSvg('M 530 232 C 620 360 610 660 560 760')),
    L('ribR2', fromSvg('M 570 236 C 750 330 740 680 620 760')),
    // window + door cut into the pumpkin
    F('window', fromSvg('M 420 470 L 420 400 Q 500 320 580 400 L 580 470 Z')),
    L('windowBars', fromSvg('M 500 345 L 500 470 M 420 430 L 580 430')),
    F('curtainL', fromSvg('M 422 402 Q 450 430 440 470 L 422 470 Z')),
    F('curtainR', fromSvg('M 578 402 Q 550 430 560 470 L 578 470 Z')),
    F('door', roundRect(440, 520, 120, 170, 14)),
    I('doorKnob', circle(540, 610, 6)),
    // stalk, crown and curly vines on top
    F('stalk', fromSvg('M 480 236 L 470 180 Q 500 160 530 180 L 520 236 Z')),
    F('crown', polygon([[430, 180], [440, 110], [470, 150], [500, 90], [530, 150], [560, 110], [570, 180]])),
    F('crownGem', circle(500, 160, 10)),
    L('vineL', fromSvg('M 470 210 Q 400 170 380 220 Q 370 260 410 250')),
    L('vineR', fromSvg('M 530 210 Q 600 170 620 220 Q 630 260 590 250')),
    F('leafL', petalAt(400, 195, PI * 1.1, 60, 22)),
    F('leafR', petalAt(600, 195, -PI * 0.1, 60, 22)),
    // footboard + coach lamps
    F('footboard', roundRect(320, 755, 360, 26, 10)),
    F('lampL', roundRect(250, 520, 36, 56, 8)),
    F('lampLTop', polygon([[244, 520], [268, 494], [292, 520]])),
    F('lampR', roundRect(714, 520, 36, 56, 8)),
    F('lampRTop', polygon([[708, 520], [732, 494], [756, 520]])),
    ...wheel('wheelL', 300, 820, 92),
    ...wheel('wheelR', 700, 820, 92),
  ];
  const stars: [number, number, number][] = [[90, 90, 24], [220, 160, 16], [120, 330, 18], [760, 120, 18], [880, 320, 22], [640, 60, 14]];
  stars.forEach(([x, y, r], i) => out.push(F(`star${i}`, star(x, y, r, r * 0.45))));
  return out;
}

// ── Tiệc trà ─────────────────────────────────────────────────────────────────
function teacup(p: string, cx: number, y: number, s: number): Region[] {
  return [
    F(`${p}Saucer`, ellipse(cx, y + 92 * s, 110 * s, 22 * s)),
    F(`${p}Cup`, fromSvg(`M ${cx - 80 * s} ${y} L ${cx + 80 * s} ${y} Q ${cx + 76 * s} ${y + 90 * s} ${cx} ${y + 90 * s} Q ${cx - 76 * s} ${y + 90 * s} ${cx - 80 * s} ${y} Z`)),
    F(`${p}Handle`, ring(cx + 86 * s, y + 34 * s, 26 * s, 13 * s)),
    F(`${p}Rim`, ellipse(cx, y, 80 * s, 14 * s)),
    F(`${p}Heart`, heart(cx, y + 46 * s, 18 * s)),
    L(`${p}Steam`, fromSvg(`M ${cx - 20 * s} ${y - 20 * s} q -18 -30 0 -60 q 18 -30 0 -60 M ${cx + 22 * s} ${y - 20 * s} q -18 -30 0 -60 q 18 -30 0 -60`)),
  ];
}

function teaParty(): Region[] {
  const out: Region[] = [
    ...bunting('bunt', 0, 1000, 50, 36, 10),
    // table with a scalloped cloth
    F('table', roundRect(60, 640, 880, 40, 10)),
  ];
  let cloth = 'M 60 680 L 940 680 L 940 760';
  for (let i = 10; i >= 1; i--) {
    const xa = 60 + 88 * i;
    const xb = 60 + 88 * (i - 1);
    cloth += ` Q ${(xa + xb) / 2} 810 ${xb} 760`;
  }
  out.push(F('cloth', fromSvg(cloth + ' Z')));
  for (let i = 0; i < 10; i++) out.push(F(`clothDot${i}`, circle(104 + 88 * i, 740, 12)));
  out.push(
    F('legL', roundRect(110, 790, 30, 200, 8)),
    F('legR', roundRect(860, 790, 30, 200, 8)),
    // teapot
    F('potBody', fromSvg('M 330 640 C 200 640 200 420 330 400 L 470 400 C 600 420 600 640 470 640 Z')),
    F('potLid', dome(400, 400, 70)),
    F('potKnob', circle(400, 318, 16)),
    F('potSpout', fromSvg('M 236 470 Q 200 450 185 385 L 212 378 Q 222 430 240 445 Z')),
    F('potHandle', fromSvg('M 562 440 Q 650 440 650 510 Q 650 585 560 592 L 562 566 Q 624 556 624 510 Q 624 466 564 466 Z')),
    F('potBand', fromSvg('M 245 500 Q 400 530 555 500 L 557 540 Q 400 570 243 540 Z')),
  );
  for (let i = 0; i < 4; i++) out.push(F(`potFlower${i}`, star(310 + i * 60, 600, 20, 11, 6)));
  out.push(...teacup('cupA', 720, 530, 0.7), ...teacup('cupB', 140, 560, 0.55));
  // cake stand with cupcakes
  out.push(
    F('standPlate', ellipse(870, 470, 90, 16)),
    F('standStem', roundRect(860, 486, 20, 70, 6)),
    F('standBase', ellipse(870, 568, 60, 14)),
  );
  // cookies on the cloth
  const cookies: [number, number][] = [[600, 618], [650, 622], [560, 624]];
  cookies.forEach(([x, y], i) => {
    out.push(F(`cookie${i}`, circle(x, y, 22)));
    for (let k = 0; k < 3; k++) out.push(I(`chip${i}${k}`, circle(x - 8 + k * 8, y - 6 + (k % 2) * 12, 3.5)));
  });
  // cupcakes on the stand
  [830, 910].forEach((x, i) => {
    out.push(
      F(`ccCase${i}`, polygon([[x - 34, 410], [x + 34, 410], [x + 26, 454], [x - 26, 454]])),
      F(`ccTop${i}`, fromSvg(`M ${x - 38} 412 Q ${x - 42} 366 ${x} 356 Q ${x + 42} 366 ${x + 38} 412 Z`)),
      F(`ccCherry${i}`, circle(x, 346, 11)),
    );
  });
  return out;
}

// ── Ao sen ───────────────────────────────────────────────────────────────────
function lilyPad(p: string, cx: number, cy: number, rx: number, ry: number): Region {
  // a pad with a wedge cut out
  return F(
    p,
    fromSvg(
      `M ${cx} ${cy} L ${cx + rx * 0.3} ${cy - ry} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy - ry * 0.2} Z`,
    ),
  );
}

/**
 * Front-view lotus: petals fanned like a hand of cards, each sharing its
 * side edges with its neighbours so no outline crosses another.
 */
function lotus(p: string, cx: number, cy: number, s: number): Region[] {
  const polar = (a: number, r: number) => `${r1(cx + cos(a) * r)} ${r1(cy + sin(a) * r)}`;
  const n = 5;
  const a0 = -PI + 0.3;
  const a1 = -0.3;
  const out: Region[] = [];
  for (let k = 0; k < n; k++) {
    const t1 = a0 + ((a1 - a0) * k) / n;
    const t2 = a0 + ((a1 - a0) * (k + 1)) / n;
    const mid = (t1 + t2) / 2;
    const tipR = (k === 2 ? 150 : k === 1 || k === 3 ? 125 : 95) * s;
    const shoulder = tipR * 0.45;
    out.push(
      F(
        `${p}Petal${k}`,
        fromSvg(
          `M ${cx} ${cy} L ${polar(t1, shoulder)} Q ${polar(t1 + 0.05, tipR * 0.85)} ${polar(mid, tipR)} ` +
            `Q ${polar(t2 - 0.05, tipR * 0.85)} ${polar(t2, shoulder)} Z`,
        ),
      ),
    );
  }
  out.push(F(`${p}Cup`, fromSvg(`M ${cx - 70 * s} ${cy} Q ${cx} ${cy + 50 * s} ${cx + 70 * s} ${cy} Z`)));
  return out;
}

function dragonfly(p: string, x: number, y: number, s: number): Region[] {
  return [
    F(`${p}WingTL`, oval(x - 50 * s, y - 18 * s, 50 * s, 16 * s, 20)),
    F(`${p}WingTR`, oval(x + 50 * s, y - 18 * s, 50 * s, 16 * s, -20)),
    F(`${p}WingBL`, oval(x - 44 * s, y + 14 * s, 42 * s, 13 * s, -15)),
    F(`${p}WingBR`, oval(x + 44 * s, y + 14 * s, 42 * s, 13 * s, 15)),
    F(`${p}Body`, roundRect(x - 7 * s, y - 20 * s, 14 * s, 110 * s, 7 * s)),
    F(`${p}Head`, circle(x, y - 30 * s, 14 * s)),
  ];
}

function lotusPond(): Region[] {
  const out: Region[] = [
    F('pond', fromSvg('M 0 520 Q 500 470 1000 520 L 1000 1000 L 0 1000 Z')),
    F('sun', circle(820, 140, 70)),
  ];
  const waves: [number, number][] = [[440, 580], [860, 800], [60, 900], [360, 970], [900, 960]];
  waves.forEach(([x, y], i) => out.push(L(`wave${i}`, fromSvg(`M ${x} ${y} q 30 -16 60 0 q 30 16 60 0`))));
  out.push(
    lilyPad('padA', 280, 790, 200, 66),
    lilyPad('padB', 730, 720, 160, 52),
    lilyPad('padC', 600, 900, 120, 40),
    lilyPad('padD', 120, 620, 90, 30),
    ...lotus('lotusA', 280, 760, 1),
    ...lotus('lotusB', 730, 700, 0.7),
    F('bud', drop(880, 520, 26, 50)),
    L('budStem', fromSvg('M 880 570 Q 890 620 870 680')),
  );
  // reeds on the left bank
  for (let i = 0; i < 4; i++) {
    const x = 40 + i * 45;
    const tip = 340 - (i % 2) * 30;
    out.push(L(`reed${i}`, fromSvg(`M ${x} 512 Q ${x + 8} 430 ${x} ${tip + 70}`)), F(`cattail${i}`, roundRect(x - 11, tip, 22, 70, 11)));
  }
  // frog on the small pad
  out.push(
    F('frogBody', ellipse(600, 860, 60, 40)),
    F('frogEyeL', circle(570, 815, 18)),
    F('frogEyeR', circle(630, 815, 18)),
    I('frogPupilL', circle(570, 815, 7)),
    I('frogPupilR', circle(630, 815, 7)),
    L('frogSmile', fromSvg('M 575 860 Q 600 880 625 860')),
    ...dragonfly('dfly', 500, 300, 1),
    ...dragonfly('dflySmall', 650, 420, 0.6),
  );
  return out;
}

// ── Đảo nhiệt đới ────────────────────────────────────────────────────────────
function tropicalIsland(): Region[] {
  // island is a half-ellipse centred (660, 760), rx 300, ry 220 – it pokes above
  // the horizon (y 600) between x ≈ 454 and 866, so the horizon stops there
  const out: Region[] = [
    F('sun', circle(160, 160, 80)),
    F('cloudA', cloud(820, 150, 220)),
    F('cloudB', cloud(340, 250, 150)),
    L('horizonL', fromSvg('M 0 600 L 454 600')),
    L('horizonR', fromSvg('M 866 600 L 1000 600')),
    F('island', fromSvg('M 360 760 A 300 220 0 0 1 960 760 Z')),
  ];
  // palm trunk in segments, rooted on the island's top edge
  for (let i = 0; i < 6; i++) {
    const y0 = 548 - i * 50;
    const x0 = 690 - i * 12;
    out.push(F(`trunk${i}`, polygon([[x0 - 24, y0], [x0 + 24, y0], [x0 + 12, y0 - 50], [x0 - 36, y0 - 50]])));
  }
  const top: [number, number] = [612, 252];
  const fronds = [PI + 0.25, PI - 0.35, -PI / 2 - 0.75, -PI / 2 + 0.15, -0.35, 0.3];
  fronds.forEach((a, i) => out.push(F(`frond${i}`, petalAt(top[0], top[1], a, 190, 40))));
  out.push(F('coconutA', circle(596, 280, 20)), F('coconutB', circle(634, 282, 20)), F('coconutC', circle(615, 306, 20)));
  // waves
  const waves: [number, number][] = [
    [20, 640], [330, 650], [60, 800], [300, 820], [560, 840], [800, 820],
    [150, 900], [420, 920], [700, 960], [880, 900],
  ];
  waves.forEach(([x, y], i) => out.push(L(`wave${i}`, fromSvg(`M ${x} ${y} q 25 -18 50 0 q 25 18 50 0`))));
  // sailboat
  out.push(
    F('hull', fromSvg('M 80 720 L 300 720 L 260 770 L 120 770 Z')),
    F('sailBig', polygon([[195, 710], [195, 470], [290, 710]])),
    F('sailSmall', polygon([[185, 710], [185, 500], [110, 710]])),
    F('flag', polygon([[195, 470], [195, 440], [235, 455]])),
    // starfish + shell on the island
    F('starfish', star(520, 715, 30, 13)),
    F('shell', fromSvg('M 820 740 Q 850 690 880 740 Z')),
    L('shellLines', fromSvg('M 850 703 L 835 740 M 850 703 L 850 740 M 850 703 L 865 740')),
    L('gullA', bird(420, 110, 24)),
    L('gullB', bird(500, 80, 18)),
    F('fish', ellipse(600, 900, 44, 24)),
    F('fishTail', polygon([[644, 900], [680, 878], [680, 922]])),
    I('fishEye', circle(575, 894, 5)),
  );
  return out;
}

// ── Nông trại ────────────────────────────────────────────────────────────────
function chicken(p: string, x: number, y: number, s: number): Region[] {
  return [
    F(`${p}Body`, fromSvg(`M ${x - 50 * s} ${y} Q ${x - 60 * s} ${y + 60 * s} ${x} ${y + 60 * s} Q ${x + 60 * s} ${y + 60 * s} ${x + 55 * s} ${y - 10 * s} L ${x + 80 * s} ${y - 40 * s} L ${x + 40 * s} ${y - 20 * s} Q ${x} ${y - 10 * s} ${x - 50 * s} ${y} Z`)),
    F(`${p}Head`, circle(x - 50 * s, y - 25 * s, 28 * s)),
    F(`${p}Comb`, fromSvg(`M ${x - 68 * s} ${y - 48 * s} Q ${x - 70 * s} ${y - 72 * s} ${x - 55 * s} ${y - 60 * s} Q ${x - 50 * s} ${y - 80 * s} ${x - 40 * s} ${y - 60 * s} Q ${x - 28 * s} ${y - 70 * s} ${x - 32 * s} ${y - 48 * s} Z`)),
    F(`${p}Beak`, polygon([[x - 76 * s, y - 30 * s], [x - 96 * s, y - 22 * s], [x - 76 * s, y - 14 * s]])),
    F(`${p}Wing`, fromSvg(`M ${x - 15 * s} ${y + 15 * s} Q ${x + 10 * s} ${y + 50 * s} ${x + 35 * s} ${y + 15 * s} Z`)),
    I(`${p}Eye`, circle(x - 56 * s, y - 30 * s, 4.5 * s)),
    L(`${p}Legs`, fromSvg(`M ${x - 12 * s} ${y + 60 * s} l 0 ${26 * s} m 20 ${-26 * s} l 0 ${26 * s}`)),
  ];
}

function farm(): Region[] {
  const out: Region[] = [
    F('sun', circle(880, 110, 64)),
    F('cloud', cloud(560, 120, 200)),
    F('cloudB', cloud(260, 170, 160)),
    F('field', fromSvg('M 0 640 L 1000 640 L 1000 1000 L 0 1000 Z')),
    // barn with a gambrel roof
    F('barn', fromSvg('M 140 640 L 140 430 L 200 330 L 300 290 L 400 330 L 460 430 L 460 640 Z')),
    F('roofTrim', fromSvg('M 125 440 L 190 325 L 300 278 L 410 325 L 475 440 L 460 452 L 400 345 L 300 305 L 200 345 L 140 452 Z')),
    F('loft', fromSvg('M 260 420 L 260 370 Q 300 340 340 370 L 340 420 Z')),
    F('barnDoor', roundRect(220, 490, 160, 150, 4)),
    L('doorX', fromSvg('M 220 490 L 380 640 M 380 490 L 220 640 M 300 490 L 300 640')),
    // silo
    F('silo', roundRect(470, 380, 90, 260, 6)),
    F('siloTop', dome(515, 380, 45)),
    L('siloBands', fromSvg('M 470 450 L 560 450 M 470 520 L 560 520 M 470 590 L 560 590')),
    // tree
    F('treeTop', fromSvg('M 640 500 A 70 70 0 0 1 680 370 A 90 90 0 0 1 840 360 A 70 70 0 0 1 880 500 Z')),
    F('treeTrunk', roundRect(740, 500, 40, 140, 8)),
  ];
  // fence across the field
  for (let i = 0; i < 12; i++) {
    const x = 20 + i * 85;
    out.push(F(`post${i}`, fromSvg(`M ${x} 790 L ${x} 700 L ${x + 15} 685 L ${x + 30} 700 L ${x + 30} 790 Z`)));
  }
  out.push(F('railTop', roundRect(0, 715, 1000, 18, 4)), F('railLow', roundRect(0, 755, 1000, 18, 4)));
  out.push(...chicken('hen', 300, 860, 1), ...chicken('chick', 620, 900, 0.6));
  // flowers + grass tufts
  const flowers: [number, number][] = [[100, 900], [480, 940], [820, 880], [900, 960]];
  flowers.forEach(([x, y], f) => {
    for (let k = 0; k < 6; k++) {
      const a = (k * PI) / 3;
      out.push(F(`fl${f}p${k}`, circle(x + cos(a) * 16, y + sin(a) * 16, 11)));
    }
    out.push(F(`fl${f}c`, circle(x, y, 9)));
  });
  return out;
}

// ── Mạn đà la hoa sen ────────────────────────────────────────────────────────
function lotusMandala(): Region[] {
  const cx = 500;
  const cy = 500;
  const polar = (a: number, r: number): [number, number] => [r1(cx + cos(a) * r), r1(cy + sin(a) * r)];
  const out: Region[] = [F('outerRing', ring(cx, cy, 470, 450))];
  // outer pointed petals (12) sitting between two radii
  for (let i = 0; i < 12; i++) {
    const a1 = (i * PI) / 6;
    const a2 = ((i + 1) * PI) / 6;
    const mid = (a1 + a2) / 2;
    const [x1, y1] = polar(a1, 330);
    const [x2, y2] = polar(a2, 330);
    const [tx, ty] = polar(mid, 440);
    const [c1x, c1y] = polar(a1 + 0.05, 420);
    const [c2x, c2y] = polar(a2 - 0.05, 420);
    out.push(F(`outer${i}`, fromSvg(`M ${x1} ${y1} Q ${c1x} ${c1y} ${tx} ${ty} Q ${c2x} ${c2y} ${x2} ${y2} Z`)));
    const [dx, dy] = polar(mid, 375);
    out.push(F(`outerDrop${i}`, circle(dx, dy, 16)));
  }
  out.push(F('scallopRing', ring(cx, cy, 330, 300)));
  // 24 scallops
  for (let i = 0; i < 24; i++) {
    const a1 = (i * PI) / 12;
    const a2 = ((i + 1) * PI) / 12;
    const [x1, y1] = polar(a1, 300);
    const [x2, y2] = polar(a2, 300);
    const [mx, my] = polar((a1 + a2) / 2, 262);
    out.push(F(`scallop${i}`, fromSvg(`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2} Z`)));
  }
  // 8 lotus petals round a ring, neighbours sharing their edges, each with a vein
  for (let i = 0; i < 8; i++) {
    const t1 = (i * PI) / 4;
    const t2 = ((i + 1) * PI) / 4;
    const mid = (t1 + t2) / 2;
    const [ax, ay] = polar(t1, 100);
    const [bx, by] = polar(t2, 100);
    const [c1x, c1y] = polar(t1, 215);
    const [c2x, c2y] = polar(t2, 215);
    const [tx, ty] = polar(mid, 258);
    out.push(F(`petal${i}`, fromSvg(`M ${ax} ${ay} Q ${c1x} ${c1y} ${tx} ${ty} Q ${c2x} ${c2y} ${bx} ${by} A 100 100 0 0 0 ${ax} ${ay} Z`)));
    const [vx, vy] = polar(mid, 125);
    const [l1x, l1y] = polar(mid - 0.14, 190);
    const [l2x, l2y] = polar(mid + 0.14, 190);
    const [vtx, vty] = polar(mid, 232);
    out.push(F(`vein${i}`, fromSvg(`M ${vx} ${vy} Q ${l1x} ${l1y} ${vtx} ${vty} Q ${l2x} ${l2y} ${vx} ${vy} Z`)));
  }
  out.push(F('centerRing', ring(cx, cy, 100, 72)), F('center', star(cx, cy, 64, 34, 8)), F('centerDot', circle(cx, cy, 20)));
  return out;
}

// ── Cá vảy cầu vồng ──────────────────────────────────────────────────────────
function rainbowFish(): Region[] {
  const out: Region[] = [
    // fins and tail close along the body's edge so no outline crosses it
    F('tail', fromSvg('M 725 441 L 900 340 Q 860 500 900 660 L 725 559 A 270 180 0 0 0 725 441 Z')),
    L('tailRibs', fromSvg('M 745 500 L 880 400 M 745 500 L 870 500 M 745 500 L 880 600')),
    F('finTop', fromSvg('M 380 330 Q 440 170 620 350 A 270 180 0 0 0 380 330 Z')),
    F('finBottom', fromSvg('M 420 677 Q 500 800 600 658 A 270 180 0 0 1 420 677 Z')),
    F('body', ellipse(470, 500, 270, 180)),
    F('face', fromSvg('M 310 356 Q 250 500 310 644 Q 200 610 200 500 Q 200 390 310 356 Z')),
    F('eye', circle(265, 470, 30)),
    I('pupil', circle(258, 468, 13)),
    L('smile', fromSvg('M 215 545 Q 235 565 260 552')),
    F('sideFin', fromSvg('M 360 520 Q 430 560 400 620 Q 350 590 360 520 Z')),
  ];
  // scales: rows of arcs inside the body
  for (let row = 0; row < 5; row++) {
    const y = 400 + row * 52;
    const off = row % 2 ? 30 : 0;
    for (let i = 0; i < 6; i++) {
      const x = 400 + off + i * 60;
      // keep inside the body ellipse
      const nx = (x + 30 - 470) / 270;
      const ny = (y + 20 - 500) / 180;
      if (nx * nx + ny * ny > 0.82 || x < 400) continue;
      out.push(F(`scale${row}${i}`, fromSvg(`M ${x} ${y} Q ${x + 30} ${y + 50} ${x + 60} ${y} Z`)));
    }
  }
  // bubbles, seaweed and shells
  const bubbles: [number, number, number][] = [[160, 300, 22], [130, 220, 14], [180, 160, 10], [820, 180, 18], [860, 120, 11]];
  bubbles.forEach(([x, y, r], i) => out.push(F(`bubble${i}`, circle(x, y, r))));
  for (let i = 0; i < 3; i++) {
    const x = 70 + i * 40;
    out.push(F(`weed${i}`, fromSvg(`M ${x} 1000 Q ${x - 40} 900 ${x} 820 Q ${x + 30} 760 ${x + 5} 700 Q ${x + 45} 760 ${x + 20} 830 Q ${x + 10} 900 ${x + 24} 1000 Z`)));
  }
  out.push(
    F('sand', fromSvg('M 0 930 Q 500 880 1000 930 L 1000 1000 L 0 1000 Z')),
    F('shellA', fromSvg('M 520 930 Q 560 860 600 930 Z')),
    L('shellALines', fromSvg('M 560 895 L 545 930 M 560 895 L 560 930 M 560 895 L 575 930')),
    F('starfish', star(820, 935, 34, 15)),
  );
  return out;
}

// ── Cú mèo đêm trăng ─────────────────────────────────────────────────────────
function owlNight(): Region[] {
  const out: Region[] = [
    F('moon', circle(220, 210, 140)),
    F('branch', fromSvg('M 0 760 Q 300 720 600 760 Q 800 790 1000 740 L 1000 790 Q 800 840 600 810 Q 300 770 0 810 Z')),
    F('twig', fromSvg('M 780 770 Q 850 700 900 690 L 905 705 Q 860 720 800 785 Z')),
    // body + belly
    F('body', fromSvg('M 500 360 C 700 360 690 760 500 770 C 310 760 300 360 500 360 Z')),
    F('belly', ellipse(500, 620, 95, 135)),
    // ear tufts
    F('earL', polygon([[395, 400], [380, 300], [450, 370]])),
    F('earR', polygon([[605, 400], [620, 300], [550, 370]])),
    // wings
    F('wingL', fromSvg('M 390 480 Q 340 600 400 720 Q 430 600 390 480 Z')),
    F('wingR', fromSvg('M 610 480 Q 660 600 600 720 Q 570 600 610 480 Z')),
    // eyes
    F('eyeRingL', circle(444, 450, 56)),
    F('eyeRingR', circle(556, 450, 56)),
    F('eyeL', circle(445, 450, 34)),
    F('eyeR', circle(555, 450, 34)),
    I('pupilL', circle(450, 455, 15)),
    I('pupilR', circle(550, 455, 15)),
    F('beak', polygon([[485, 505], [515, 505], [500, 540]])),
    // feet on the branch
    F('footL', fromSvg('M 450 765 l -14 22 l 14 -6 l 0 10 l 10 -10 l 10 8 l -4 -24 Z')),
    F('footR', fromSvg('M 530 765 l -14 22 l 14 -6 l 0 10 l 10 -10 l 10 8 l -4 -24 Z')),
  ];
  // feather scallops on the belly
  for (let row = 0; row < 4; row++) {
    const y = 545 + row * 45;
    const n = row === 0 || row === 3 ? 3 : 4;
    for (let i = 0; i < n; i++) {
      const x = 500 - (n * 40) / 2 + i * 40;
      out.push(F(`feather${row}${i}`, fromSvg(`M ${x} ${y} Q ${x + 20} ${y + 32} ${x + 40} ${y} Z`)));
    }
  }
  // leaves on the branch
  const leaves: [number, number, number][] = [[150, 735, -2.2], [230, 745, -1.0], [760, 790, 1.2], [880, 760, -1.9], [940, 700, -0.6]];
  leaves.forEach(([x, y, a], i) => out.push(F(`leaf${i}`, petalAt(x, y, a, 70, 24))));
  const stars: [number, number, number][] = [[450, 90, 22], [640, 200, 16], [100, 450, 20], [880, 120, 22], [920, 400, 18], [820, 560, 14], [260, 520, 16]];
  stars.forEach(([x, y, r], i) => out.push(F(`star${i}`, star(x, y, r, r * 0.45))));
  return out;
}

export const MORE_PAGES: ColoringPage[] = [
  { id: 'hotAirBalloons', title: 'Khinh khí cầu', emoji: '🎈', build: hotAirBalloons },
  { id: 'birthdayCake', title: 'Bánh sinh nhật', emoji: '🎂', build: birthdayCake },
  { id: 'candyLand', title: 'Xứ sở kẹo ngọt', emoji: '🍭', build: candyLand },
  { id: 'treehouse', title: 'Nhà trên cây', emoji: '🌳', build: treehouse },
  { id: 'pumpkinCarriage', title: 'Cỗ xe bí ngô', emoji: '🎃', build: pumpkinCarriage },
  { id: 'teaParty', title: 'Tiệc trà', emoji: '🫖', build: teaParty },
  { id: 'lotusPond', title: 'Ao sen', emoji: '🪷', build: lotusPond },
  { id: 'tropicalIsland', title: 'Đảo nhiệt đới', emoji: '🏝️', build: tropicalIsland },
  { id: 'farm', title: 'Nông trại', emoji: '🐔', build: farm },
  { id: 'lotusMandala', title: 'Mạn đà la hoa sen', emoji: '🪷', build: lotusMandala },
  { id: 'rainbowFish', title: 'Cá vảy cầu vồng', emoji: '🐠', build: rainbowFish },
  { id: 'owlNight', title: 'Cú mèo đêm trăng', emoji: '🦉', build: owlNight },
];
