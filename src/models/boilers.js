import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Metres. Front is +Z. Dimensions follow the specific linked manufacturer drawings,
// rather than mixing the different revisions of the dimensional drawings/manuals.
export const boilerProducts = [
  {
    id: 'twin-bio-16', name: 'Twin Bio Luxury Compact NE 16', shortName: 'Twin Bio Compact',
    category: 'boiler', categoryLabel: 'Kocioł na pellet', powerLabel: '16 kW',
    width: 1.150, height: 1.382, depth: .831,
    sourceUrl: 'https://www.kostrzewa.com.pl/produkty/twin-bio-luxury-compact-ne',
    pdfUrl: 'references/boilers-twin-dimensions.pdf', imageUrl: 'references/boilers-twin.png',
    description: 'Kompaktowa zabudowa z mobilnym, osłoniętym zasobnikiem pelletu i sterownikiem dotykowym.',
    dimensionNote: '1150 × 1382 × 831 mm — zamknięty zestaw według rysunku „Gabaryty 16 kW”.',
    accuracyNote: 'Gabaryty z rysunku producenta; detale obudowy odtworzone ze zdjęcia. Model prezentacyjny, bez wnętrza i dokumentacji wykonawczej.',
  },
  {
    id: 'eei-pellets-16', name: 'EEI Pellets 16', shortName: 'EEI Pellets',
    category: 'boiler', categoryLabel: 'Kocioł na pellet', powerLabel: '15 kW nominalnie',
    width: 1.663, height: 1.381, depth: .894,
    sourceUrl: 'https://www.kostrzewa.com.pl/produkty/eei-pellets',
    pdfUrl: 'references/boilers-eei-dimensions.pdf', imageUrl: 'references/boilers-eei.png',
    description: 'Kocioł z palnikiem Platinum Bio VG, podajnikiem ślimakowym i oddzielnym zasobnikiem 290 l.',
    dimensionNote: '1663 × 1381 × 894 mm — kocioł, zewnętrzny palnik i zasobnik według rysunku „Gabaryty EEI Pellets 16”.',
    accuracyNote: 'Wariant EEI Pellets 16 z konkretnego rysunku gabarytowego. Instrukcja podaje inne gabaryty rewizji; szczegóły w źródłach. Odtworzenie prezentacyjne.',
  },
];

const V = (x, y, z) => new THREE.Vector3(x, y, z);

function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d'); draw(ctx, width, height);
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8; return map;
}

// Exact manufacturer wordmark outline extracted from the vector drawing footer.
// Source: boilers-twin-dimensions.pdf, page 1; reused as a decal, not a substitute font.
const manufacturerWordmark = 'M20.999,18.934L13.170,18.934L6.480,10.250L6.480,18.934L0.000,18.934L0.000,0.285L6.480,0.285L6.480,8.612L13.882,0.285L20.857,0.285L13.100,8.897L20.999,18.934M37.471,9.610C37.471,8.969 37.398,8.328 37.327,7.688C37.896,9.038 39.107,10.180 41.101,11.247C42.666,12.172 43.733,12.599 43.733,13.381C43.733,14.236 43.021,14.663 41.740,14.663C40.458,14.663 38.823,14.023 36.972,12.813C37.327,11.817 37.471,10.748 37.471,9.610M30.992,9.610C30.992,12.031 29.356,13.737 27.148,13.737C25.013,13.737 23.377,12.031 23.377,9.610C23.377,7.190 25.013,5.480 27.148,5.480C29.356,5.480 30.992,7.190 30.992,9.610M141.840,12.172L136.390,12.172L137.025,10.382L139.135,5.267L141.840,12.172M101.318,1.422L101.318,14.236L92.634,14.236L101.318,1.422M77.047,5.765C77.047,7.474 76.049,7.902 73.985,7.902L72.774,7.902L72.774,3.558L74.128,3.558C76.120,3.558 77.047,4.199 77.047,5.765M83.167,4.698L91.781,4.698L84.022,16.088L82.526,12.669C81.957,11.460 81.318,10.536 80.320,9.966C82.242,9.110 83.238,7.758 83.238,5.765C83.238,5.409 83.167,5.054 83.167,4.698M135.127,15.731L143.262,15.731L144.474,18.934L151.022,18.934L142.480,0.285L134.701,0.285L131.499,9.894L129.077,0.285L124.665,0.285L121.958,9.894L119.043,0.285L82.526,0.285L82.526,3.062C81.387,1.137 78.896,0.285 74.839,0.285L48.859,0.285L48.859,1.637C47.223,0.499 45.442,0.000 43.306,0.000C39.535,0.000 36.899,2.349 36.899,5.695L36.899,6.264C36.401,4.912 35.619,3.773 34.481,2.705C32.557,0.925 30.068,0.000 27.148,0.000C24.302,0.000 21.811,0.925 19.818,2.705C17.824,4.556 16.898,6.832 16.898,9.610C16.898,12.385 17.824,14.663 19.818,16.513C21.811,18.292 24.302,19.289 27.148,19.289C30.068,19.289 32.557,18.292 34.481,16.513C35.548,15.516 36.331,14.379 36.829,13.167L36.829,17.868C38.752,18.791 40.603,19.289 42.595,19.289C47.507,19.289 50.140,17.155 50.140,13.666C50.140,10.605 48.219,9.467 45.228,7.902C43.663,7.046 42.808,6.548 42.808,5.695C42.808,4.982 43.378,4.556 44.516,4.556C46.155,4.556 47.647,5.340 49.428,6.905L49.428,5.054L54.696,5.054L54.696,18.934L61.172,18.934L61.172,5.054L66.298,5.054L66.298,18.934L72.774,18.934L72.774,11.104L73.629,11.104C75.266,11.104 75.907,12.172 77.047,14.734L78.896,18.934L82.314,18.934L85.302,18.934L101.318,18.934L101.889,18.934L115.127,18.934L115.127,14.948L107.726,14.948L107.726,11.532L114.630,11.532L114.630,7.617L107.726,7.617L107.726,4.342L113.988,4.342L119.185,18.934L123.953,18.934L126.659,9.610L129.077,18.934L133.990,18.934L135.127,15.731';
function wordmarkTexture() {
  return canvasTexture(1024, 160, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff'; ctx.scale(w / 151.02199172973633, h / 19.28900146484375);
    ctx.fill(new Path2D(manufacturerWordmark), 'evenodd');
  });
}

function paintTexture() {
  const map = canvasTexture(128, 128, (ctx, w, h) => {
    const pixels = ctx.createImageData(w, h); let seed = 56213;
    for (let i = 0; i < pixels.data.length; i += 4) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const n = 216 + (seed % 28);
      pixels.data.set([n, n, n, 255], i);
    }
    ctx.putImageData(pixels, 0, 0);
  });
  map.colorSpace = THREE.NoColorSpace; map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(8, 8); return map;
}

function makeMaterials() {
  const powder = paintTexture();
  const paint = new THREE.MeshPhysicalMaterial({ name: 'Lakier proszkowy — korpus', color: '#26282a', metalness: .24, roughness: .47, roughnessMap: powder, clearcoat: .12, clearcoatRoughness: .4 });
  const metal = new THREE.MeshStandardMaterial({ name: 'Ocynk — zasobnik i rama', color: '#c8cccb', metalness: .7, roughness: .43 });
  const black = new THREE.MeshStandardMaterial({ name: 'ABS i gumowe uszczelnienia', color: '#111519', metalness: .08, roughness: .57 });
  const shadow = new THREE.MeshStandardMaterial({ name: 'Wnętrze szczelin', color: '#060809', roughness: .97 });
  const steel = new THREE.MeshStandardMaterial({ name: 'Stal nierdzewna — okucia', color: '#bdc4c7', metalness: .9, roughness: .28 });
  const darkMetal = new THREE.MeshStandardMaterial({ name: 'Stal palnika', color: '#222629', metalness: .6, roughness: .48 });
  const screen = new THREE.MeshPhysicalMaterial({ name: 'Szkło ekranu', color: '#d7e3e2', metalness: .12, roughness: .13, clearcoat: .9, clearcoatRoughness: .08 });
  const whiteLogo = new THREE.MeshStandardMaterial({ name: 'Oznaczenia producenta', color: '#f5f5f2', roughness: .55, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const green = new THREE.MeshStandardMaterial({ name: 'Zielony znak Platinum Bio VG', color: '#77bf32', roughness: .54 });
  return { paint, metal, black, shadow, steel, darkMetal, screen, whiteLogo, green };
}

function builder(root, materials) {
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const cylinderCache = new Map();
  function add(name, geometry, material, p = [0, 0, 0], rotation) {
    const mesh = new THREE.Mesh(geometry, material); mesh.name = name;
    mesh.position.set(...p); if (rotation) mesh.rotation.set(...rotation);
    mesh.castShadow = true; mesh.receiveShadow = true; root.add(mesh); return mesh;
  }
  function box(name, size, pos, mat = materials.paint, radius = .0015) {
    if (radius > 0) return add(name, new RoundedBoxGeometry(...size, 2, Math.min(radius, ...size.map(n => n / 2.1))), mat, pos);
    const mesh = add(name, unitBox, mat, pos); mesh.scale.set(...size); return mesh;
  }
  function cylinder(name, radius, length, position, mat = materials.steel, axis = 'y', segments = 32) {
    const key = `${radius}/${length}/${segments}`;
    if (!cylinderCache.has(key)) cylinderCache.set(key, new THREE.CylinderGeometry(radius, radius, length, segments));
    const mesh = add(name, cylinderCache.get(key), mat, position);
    if (axis === 'z') mesh.rotation.x = Math.PI / 2;
    if (axis === 'x') mesh.rotation.z = Math.PI / 2;
    return mesh;
  }
  function pipe(name, a, b, radius, mat = materials.steel, segments = 24) {
    const av = V(...a), bv = V(...b), delta = bv.clone().sub(av);
    const mesh = cylinder(name, radius, delta.length(), av.add(bv).multiplyScalar(.5).toArray(), mat, 'y', segments);
    mesh.quaternion.setFromUnitVectors(V(0, 1, 0), delta.normalize()); return mesh;
  }
  function torus(name, radius, tube, pos, mat = materials.steel, axis = 'z', radial = 8, tubular = 36) {
    const mesh = add(name, new THREE.TorusGeometry(radius, tube, radial, tubular), mat, pos);
    if (axis === 'x') mesh.rotation.y = Math.PI / 2;
    if (axis === 'y') mesh.rotation.x = Math.PI / 2;
    return mesh;
  }
  function bolt(name, x, y, z, axis = 'z', mat = materials.steel, r = .0035) {
    const mesh = cylinder(name, r, .0022, [x, y, z], mat, axis, 12);
    // Small machined recess; no painted oversized black circles.
    const recess = box(`${name} / drážka`, [.0045, .00065, .00045], [x, y, z + .0013], materials.shadow, 0);
    if (axis === 'x') { recess.position.set(x - .0013, y, z); recess.rotation.y = Math.PI / 2; }
    if (axis === 'y') { recess.position.set(x, y + .0013, z); recess.rotation.x = -Math.PI / 2; }
    return mesh;
  }
  function plane(name, width, height, position, mat, rotation) {
    const mesh = add(name, new THREE.PlaneGeometry(width, height), mat, position, rotation);
    mesh.castShadow = false; return mesh;
  }
  function text(name, words, width, height, position, opts = {}) {
    const map = canvasTexture(1024, 192, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#fff'; ctx.font = `${opts.italic ? 'italic ' : ''}900 ${opts.fontSize || 132}px Arial`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(words, w / 2, h / 2, w - 10);
    });
    const mat = materials.whiteLogo.clone(); mat.map = map;
    if (opts.green) mat.color.copy(materials.green.color);
    const mesh = plane(name, width, height, position, mat, opts.rotation); return mesh;
  }
  function quad(name, points, mat = materials.paint) {
    const p = points.flat(); const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    geometry.setIndex([0, 1, 2, 0, 2, 3]); geometry.computeVertexNormals();
    return add(name, geometry, mat);
  }
  return { add, box, cylinder, pipe, torus, bolt, plane, text, quad };
}

function controlPanel(b, m, x, h, front) {
  b.box('Sterownik / gumowa uszczelka obwodowa', [.166, .115, .008], [x, h, front - .002], m.black, .010);
  b.box('Sterownik / grafitowa ramka ABS', [.158, .107, .007], [x, h, front + .001], m.darkMetal, .008);
  const map = canvasTexture(768, 448, (ctx, w, h) => {
    ctx.fillStyle = '#202728'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e8eee8'; ctx.fillRect(30, 54, w - 60, h - 112);
    ctx.fillStyle = '#d9dedc'; ctx.font = 'bold 20px Arial'; ctx.fillText('PLATINUM BIO', 35, 31);
    ctx.textAlign = 'right'; ctx.fillText('ecoMAX', w - 32, 31);
    // A neutral controller home view: real interface elements, no fabricated telemetry.
    ctx.fillStyle = '#f4f7ef'; ctx.fillRect(39, 64, w - 78, h - 135);
    ctx.strokeStyle = '#79ae46'; ctx.fillStyle = '#79ae46'; ctx.lineWidth = 5;
    for (let i = 0; i < 5; i++) {
      const px = 112 + i * 134, py = 220;
      ctx.beginPath(); ctx.arc(px, py, 22, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px - 12, py); ctx.lineTo(px + 12, py); ctx.moveTo(px, py - 12); ctx.lineTo(px, py + 12); ctx.stroke();
      if (i < 4) { ctx.beginPath(); ctx.moveTo(px + 27, py); ctx.lineTo(px + 105, py); ctx.stroke(); }
    }
    ctx.fillStyle = '#dbe2de';
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(115 + i * 134, h - 31, 10, 0, Math.PI * 2); ctx.fill(); }
  });
  const mat = new THREE.MeshBasicMaterial({ name: 'Wyświetlacz ecoMAX — neutralny ekran', map, toneMapped: false });
  b.plane('Sterownik / powierzchnia dotykowa', .133, .080, [x, h, front + .005], mat);
}

function cabinet(b, m, { x, width, height, front, back, label }) {
  const left = x - width / 2, right = x + width / 2, depth = front - back;
  const sheet = .0018, coreFront = front - .030;
  // The dark backing sits behind the sheet-metal joints and genuine vent openings.
  b.box(`${label} / podkład obudowy`, [width - .012, height - .065, depth - .040], [x, (height + .045) / 2, (back + front - .025) / 2], m.shadow, .004);
  for (const side of [-1, 1]) {
    const sx = x + side * (width / 2 - sheet / 2);
    b.box(`${label} / boczna blacha ${side}`, [sheet, height - .128, depth - .034], [sx, (height - .128) / 2 + .050, (front + back) / 2 - .009], m.paint, .0005);
    // Top apron, formed with real through-holes, backed by a shadow gap.
    const sh = new THREE.Shape(); const dw = depth - .038, dh = .066;
    sh.moveTo(-dw / 2, -dh / 2); sh.lineTo(dw / 2, -dh / 2); sh.lineTo(dw / 2, dh / 2); sh.lineTo(-dw / 2, dh / 2); sh.closePath();
    for (let i = 0; i < 8; i++) {
      const cx = side * (-.235 + i * .024), hw = .0025, hh = .0058;
      const hole = new THREE.Path(); hole.moveTo(cx - hw, -hh); hole.lineTo(cx - hw, hh); hole.lineTo(cx + hw, hh); hole.lineTo(cx + hw, -hh); hole.closePath(); sh.holes.push(hole);
    }
    const vent = b.add(`${label} / perforowany fartuch górny ${side}`, new THREE.ExtrudeGeometry(sh, { depth: sheet, bevelEnabled: false, curveSegments: 1 }), m.paint, [sx - side * .001, height - .043, (front + back) / 2 - .011]);
    vent.rotation.y = side * Math.PI / 2;
    // A recessed carrying grip visible in the manufacturer's exterior image.
    b.box(`${label} / uchwyt boczny — gniazdo ${side}`, [.0024, .029, .065], [sx + side * .0012, height - .050, back + .255], m.black, .002);
    b.box(`${label} / uchwyt boczny — chwyt ${side}`, [.005, .010, .048], [sx + side * .001, height - .046, back + .255], m.darkMetal, .002);
  }
  b.box(`${label} / tylna osłona`, [width - .008, height - .079, sheet], [x, (height - .079) / 2 + .05, back + .001], m.paint, .0005);
  b.box(`${label} / pokrywa wymiennika`, [width, .012, depth * .60], [x, height - .006, back + depth * .30], m.paint, .002);
  b.box(`${label} / przednia pokrywa górna`, [width, .011, depth * .40 - .003], [x, height - .0065, back + depth * .80 + .0015], m.paint, .002);
  b.box(`${label} / zawinięcie górnej krawędzi`, [width - .004, .026, .022], [x, height - .013, front - .014], m.paint, .003);
  for (const dx of [-width * .36, width * .36]) b.bolt(`${label} / śruba pokrywy`, x + dx, height - .0005, front - .12, 'y');
  b.cylinder(`${label} / trzpień pokrywy`, .005, .011, [x - width * .34, height - .001, front - .155], m.black);
  b.torus(`${label} / podkładka pokrywy`, .007, .0012, [x - width * .34, height - .005, front - .155], m.darkMetal, 'y');

  const doorHeight = height - .076, doorY = .047 + doorHeight / 2;
  b.box(`${label} / szczelina drzwi`, [width - .015, doorHeight + .004, .012], [x, doorY, coreFront + .006], m.black, .004);
  b.box(`${label} / drzwi frontowe`, [width - .021, doorHeight, .024], [x, doorY, front - .016], m.paint, .005);
  b.box(`${label} / dolne zawinięcie drzwi`, [width - .023, .014, .026], [x, .054, front - .015], m.paint, .002);
  for (const hy of [.18, height * .64]) {
    b.box(`${label} / pióro zawiasu`, [.018, .051, .008], [left + .011, hy, front - .014], m.darkMetal, .002);
    b.cylinder(`${label} / trzpień zawiasu`, .005, .053, [left + .009, hy, front - .006], m.black, 'y', 16);
    for (const dy of [-.017, .017]) b.bolt(`${label} / śruba zawiasu`, left + .016, hy + dy, front - .008, 'z', m.darkMetal, .0022);
  }
  const handleX = left + .047, handleY = height * .60;
  b.box(`${label} / wpuszczany uchwyt drzwi`, [.020, .112, .005], [handleX, handleY, front - .0015], m.black, .003);
  b.box(`${label} / uchwyt — wnętrze`, [.010, .092, .002], [handleX + .002, handleY, front + .001], m.shadow, .001);
  b.box(`${label} / uchwyt — krawędź chwytu`, [.005, .095, .004], [handleX - .006, handleY, front + .001], m.darkMetal, .001);
  controlPanel(b, m, x + width * .04, height - .198, front - .004);
  const logoMaterial = m.whiteLogo.clone(); logoMaterial.map = wordmarkTexture();
  b.plane(`${label} / znak KOSTRZEWA`, .151, .0193, [x + width * .04, height - .302, front - .003], logoMaterial);

  // Lower side service cover, including its three actual visible fittings.
  b.box(`${label} / pokrywa rewizyjna`, [.003, .24, .23], [left + .001, .225, back + .31], m.black, .002);
  b.box(`${label} / blacha rewizyjna`, [.003, .235, .225], [left - .0005, .225, back + .31], m.paint, .002);
  for (const [dy, dz] of [[.045, -.060], [.045, .060], [-.003, .0]]) {
    b.cylinder(`${label} / tuleja rewizji`, .004, .005, [left - .003, .225 + dy, back + .31 + dz], m.steel, 'x', 12);
    b.bolt(`${label} / mocowanie rewizji`, left - .005, .225 + dy, back + .31 + dz, 'x', m.steel, .0035);
  }
  // Two runners, four level-adjustable feet. Their bottom is exactly Y = 0.
  for (const fx of [left + .052, right - .052]) {
    b.box(`${label} / płoza`, [.038, .018, depth - .08], [fx, .031, (front + back) / 2 - .01], m.darkMetal, .004);
    for (const fz of [back + .09, front - .10]) {
      b.cylinder(`${label} / śruba stopki`, .007, .030, [fx, .024, fz], m.steel, 'y', 12);
      b.cylinder(`${label} / stopka gumowa`, .019, .012, [fx, .006, fz], m.black, 'y', 24);
    }
  }
  // Rear hydraulic/flue positions are explicitly dimensioned in the drawing.
  const rearEnd = back - .067;
  const flueY = label === 'TBLC 16' ? 1.106 : 1.105;
  b.cylinder(`${label} / czopuch Ø159`, .0795, .064, [x, flueY, back - .032], m.darkMetal, 'z', 48);
  b.torus(`${label} / krawędź czopucha`, .0775, .002, [x, flueY, rearEnd + .002], m.steel, 'z');
  b.cylinder(`${label} / światło czopucha`, .074, .001, [x, flueY, rearEnd + .003], m.shadow, 'z', 48);
  const yTop = label === 'TBLC 16' ? 1.2095 : 1.207;
  for (const [px, py, radius, length, part] of [
    [x + .171, yTop, .024, .065, 'zasilanie 1½'],
    [x, .1535, .024, .065, 'powrót 1½'],
    [x + .195, flueY, .0105, .030, 'mufa zabezpieczenia'],
    [x + .176, .153, .0105, .030, 'mufa spustowa'],
  ]) {
    b.cylinder(`${label} / ${part}`, radius, length, [px, py, back - length / 2], m.steel, 'z', 24);
    b.torus(`${label} / ${part} — gwint`, radius - .001, .0015, [px, py, back - length], m.steel, 'z', 6, 28);
    b.cylinder(`${label} / ${part} — wylot`, radius - .004, .001, [px, py, back - length - .001], m.shadow, 'z', 24);
    for (let i = 0; i < 4; i++) b.torus(`${label} / ${part} — zwój ${i}`, radius, .00065, [px, py, back - length + .0025 + i * .0025], m.steel, 'z', 4, 24);
  }
  b.box(`${label} / tylna osłona elektryczna`, [.077, .102, .011], [left + .09, height - .185, back - .006], m.darkMetal, .004);
  for (const dx of [-.025, .025]) for (const dy of [-.037, .037]) b.bolt(`${label} / śruba osłony`, left + .09 + dx, height - .185 + dy, back - .013, 'z', m.steel, .0023);
}

function compactBin(b, m) {
  const x = .271, width = .608, depth = .670, z = -.0095, h = 1.382;
  const left = x - width / 2, right = x + width / 2, front = z + depth / 2, back = z - depth / 2;
  b.box('Zasobnik Compact / górny korpus zasobnika', [width - .010, .550, depth - .010], [x, h - .291, z], m.shadow, .003);
  b.box('Zasobnik Compact / front', [width, h - .093, .004], [x, (h - .093) / 2 + .080, front - .002], m.paint, .0015);
  for (const side of [-1, 1]) b.box('Zasobnik Compact / bok', [.004, h - .093, depth - .008], [x + side * (width / 2 - .002), (h - .093) / 2 + .080, z], m.paint, .0015);
  b.box('Zasobnik Compact / górna część tylna', [width - .004, .55, .004], [x, h - .291, back + .002], m.paint, .001);
  b.box('Zasobnik Compact / tylna poprzeczka', [width - .008, .042, .008], [x, .105, back + .001], m.darkMetal, .002);
  // The manufacturer rear elevation shows an open lower service bay. Its
  // visible hopper, short auger and burner are reproduced instead of inventing
  // a solid rear cover. The other three faces remain factory-enclosed.
  for (const sx of [left + .012, right - .012]) b.box('Zasobnik Compact / tylny słupek', [.020, .72, .018], [sx, .45, back + .010], m.paint, .001);
  const hopperMetal = m.metal.clone(); hopperMetal.side = THREE.DoubleSide;
  const a = [[left + .024, .808, front - .024], [right - .024, .808, front - .024], [right - .024, .808, back + .024], [left + .024, .808, back + .024]];
  const outX = right - .104, outZ = back + .13;
  const c = [[outX - .047, .371, outZ + .046], [outX + .047, .371, outZ + .046], [outX + .047, .371, outZ - .046], [outX - .047, .371, outZ - .046]];
  for (let i = 0; i < 4; i++) b.quad(`Zasobnik Compact / blacha leja ${i}`, [a[i], a[(i + 1) % 4], c[(i + 1) % 4], c[i]], hopperMetal);
  const augerStart = [right - .074, .267, back + .068], augerEnd = [left + .087, .731, back + .068];
  b.pipe('Zasobnik Compact / krótki podajnik ślimakowy', augerStart, augerEnd, .028, m.steel, 24);
  const motor = b.box('Zasobnik Compact / motoreduktor', [.114, .130, .105], [right - .102, .270, back + .072], m.darkMetal, .004);
  motor.rotation.z = -.72;
  const burnerShape = new THREE.Shape();
  burnerShape.moveTo(left + .071, .132); burnerShape.lineTo(right - .080, .132); burnerShape.lineTo(right - .080, .165); burnerShape.lineTo(right - .220, .328); burnerShape.lineTo(left + .071, .328); burnerShape.closePath();
  b.add('Zasobnik Compact / osłona Platinum Bio VG', new THREE.ExtrudeGeometry(burnerShape, { depth: .262, bevelEnabled: true, bevelSize: .002, bevelThickness: .002, bevelSegments: 2 }), m.darkMetal, [0, 0, back + .035]);
  b.box('Zasobnik Compact / osłona króćca palnika', [.125, .196, .270], [left + .074, .230, back + .169], m.darkMetal, .003);
  b.text('Zasobnik Compact / znak palnika VG', 'VG', .105, .045, [x + .045, .248, back + .032], { green: true, italic: true, rotation: [0, Math.PI, 0] });
  const hoseCurve = new THREE.CatmullRomCurve3([V(left + .090, .705, back + .102), V(left + .081, .611, back + .118), V(left + .096, .480, back + .124), V(left + .083, .351, back + .124)], false, 'centripetal');
  b.add('Zasobnik Compact / przewód elastyczny', new THREE.TubeGeometry(hoseCurve, 32, .029, 14, false), m.black);
  const rib = new THREE.TorusGeometry(.030, .0016, 5, 24);
  for (let i = 1; i < 30; i++) {
    const ring = b.add('Zasobnik Compact / karb przewodu', rib, m.darkMetal, hoseCurve.getPointAt(i / 30).toArray());
    ring.quaternion.setFromUnitVectors(V(0, 0, 1), hoseCurve.getTangentAt(i / 30));
  }
  for (const t of [.035, .965]) {
    const clamp = b.torus('Zasobnik Compact / opaska przewodu', .031, .0022, hoseCurve.getPointAt(t).toArray(), m.steel);
    clamp.quaternion.setFromUnitVectors(V(0, 0, 1), hoseCurve.getTangentAt(t));
  }
  // Two folded sheets and a front opening lid, with a narrow continuous gasket.
  b.box('Zasobnik Compact / górna uszczelka', [width - .013, .004, depth - .015], [x, h - .012, z], m.black, .001);
  b.box('Zasobnik Compact / pokrywa tylna', [width, .009, .296], [x, h - .0045, back + .148], m.paint, .0015);
  b.box('Zasobnik Compact / uchylna pokrywa zasypowa', [width - .024, .009, .348], [x, h - .0085, front - .190], m.paint, .0015);
  b.box('Zasobnik Compact / wpuszczany uchwyt zasypu', [.086, .003, .027], [x, h - .0025, front - .052], m.black, .004);
  b.box('Zasobnik Compact / zagłębienie uchwytu', [.066, .001, .013], [x, h - .0005, front - .052], m.shadow, .002);
  for (const hx of [x - .19, x + .19]) {
    b.box('Zasobnik Compact / zawias klapy', [.035, .004, .018], [hx, h - .005, back + .304], m.darkMetal, .001);
    b.cylinder('Zasobnik Compact / oś zawiasu', .003, .038, [hx, h - .002, back + .304], m.black, 'x', 12);
  }
  for (const fx of [left + .043, right - .043]) for (const fz of [back + .055, front - .055]) {
    b.box('Zasobnik Compact / jarzmo kółka', [.024, .041, .031], [fx, .0555, fz], m.steel, .002);
    b.cylinder('Zasobnik Compact / kółko gumowe', .027, .016, [fx, .027, fz], m.black, 'x', 28);
    b.cylinder('Zasobnik Compact / oś kółka', .006, .024, [fx, .027, fz], m.steel, 'x', 16);
  }
  for (const px of [left + .025, right - .025]) for (const py of [.13, .65, h - .04]) b.bolt('Zasobnik Compact / mocowanie tylnej osłony', px, py, back - .001, 'z', m.steel, .0028);
}

function pelletTexture() {
  return canvasTexture(256, 512, (ctx, w, h) => {
    ctx.fillStyle = '#59452f'; ctx.fillRect(0, 0, w, h); let seed = 3817;
    function rand() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }
    for (let i = 0; i < 380; i++) {
      const x = rand() * w, y = rand() * h, length = 12 + rand() * 29, thick = 5 + rand() * 5;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rand() * Math.PI);
      ctx.fillStyle = ['#ad8852', '#8f6b42', '#c09b65', '#755735'][i % 4];
      ctx.beginPath(); ctx.roundRect(-length / 2, -thick / 2, length, thick, thick * .3); ctx.fill();
      ctx.strokeStyle = '#d1b684'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-length * .4, -thick * .23); ctx.lineTo(length * .4, -thick * .23); ctx.stroke(); ctx.restore();
    }
  });
}

function eeiHopper(b, m) {
  const x = .5305, w = .602, d = .735, z = -.040, top = 1.333, shoulder = .767, low = .325;
  const left = x - w / 2, right = x + w / 2, front = z + d / 2, back = z - d / 2;
  const metalSheet = m.metal.clone(); metalSheet.side = THREE.DoubleSide;
  // Actual front wall with two inspection windows, not painted rectangles.
  const sh = new THREE.Shape(); sh.moveTo(-w / 2 + .014, shoulder); sh.lineTo(w / 2 - .014, shoulder); sh.lineTo(w / 2 - .014, top - .012); sh.lineTo(-w / 2 + .014, top - .012); sh.closePath();
  const windowCenters = [1.177, .976];
  for (const cy of windowCenters) {
    const hole = new THREE.Path(); hole.moveTo(-.033, cy - .077); hole.lineTo(-.033, cy + .077); hole.lineTo(.033, cy + .077); hole.lineTo(.033, cy - .077); hole.closePath(); sh.holes.push(hole);
  }
  b.add('Zasobnik 290 l / front z oknami rewizyjnymi', new THREE.ExtrudeGeometry(sh, { depth: .0015, bevelEnabled: false, curveSegments: 1 }), metalSheet, [x, 0, front - .0015]);
  const pellets = new THREE.MeshStandardMaterial({ name: 'Pellet w oknach kontrolnych', map: pelletTexture(), roughness: .9 });
  for (const cy of windowCenters) {
    b.plane('Zasobnik 290 l / pellet za wziernikiem', .066, .154, [x, cy, front - .005], pellets);
    const glass = new THREE.MeshPhysicalMaterial({ name: 'Wziernik poliwęglanowy', color: '#bac8c2', metalness: .04, roughness: .15, transparent: true, opacity: .15, depthWrite: false, clearcoat: .9 });
    b.plane('Zasobnik 290 l / przeszklenie wziernika', .068, .156, [x, cy, front + .0015], glass);
    for (const px of [x - .045, x + .045]) for (const py of [cy - .077, cy + .077]) b.bolt('Zasobnik 290 l / śruba wziernika', px, py, front + .002, 'z', m.steel, .003);
  }
  for (const side of [-1, 1]) b.box('Zasobnik 290 l / bok górny', [.0015, top - shoulder - .025, d - .023], [x + side * (w / 2 - .011), (top + shoulder - .025) / 2, z], m.metal, .0004);
  b.box('Zasobnik 290 l / tylna ścianka', [w - .022, top - shoulder - .025, .0015], [x, (top + shoulder - .025) / 2, back + .011], m.metal, .0004);
  const upper = [[left + .012, shoulder, front - .010], [right - .012, shoulder, front - .010], [right - .012, shoulder, back + .010], [left + .012, shoulder, back + .010]];
  const lower = [[x - .065, low, z + .065], [x + .065, low, z + .065], [x + .065, low, z - .065], [x - .065, low, z - .065]];
  for (let i = 0; i < 4; i++) b.quad(`Zasobnik 290 l / lej ${i + 1}`, [upper[i], upper[(i + 1) % 4], lower[(i + 1) % 4], lower[i]], metalSheet);
  b.box('Zasobnik 290 l / szyjka leja', [.133, .085, .133], [x, low - .0425, z], m.metal, .002);
  b.box('Zasobnik 290 l / dolna komora podajnika', [.151, .095, .233], [x, low - .088, z - .052], m.metal, .003);
  for (const px of [left + .013, right - .013]) for (const pz of [back + .013, front - .013]) {
    b.box('Zasobnik 290 l / noga — profil L', [.026, top - .018, .003], [px, (top - .018) / 2, pz], m.metal, .0005);
    b.box('Zasobnik 290 l / noga — zagięcie', [.003, top - .018, .026], [px + (px < x ? -.0115 : .0115), (top - .018) / 2, pz - (pz > z ? .0115 : -.0115)], m.metal, .0005);
    b.box('Zasobnik 290 l / stopa ramy', [.030, .004, .035], [px, .002, pz - (pz > z ? .009 : -.009)], m.metal, .0005);
    for (const py of [.08, .42, .785, 1.29]) b.bolt('Zasobnik 290 l / połączenie ramy', px, py, pz + (pz > z ? .003 : -.003), 'z', m.steel, .0028);
  }
  for (const py of [.035, .765]) {
    for (const pz of [front - .013, back + .013]) b.box('Zasobnik 290 l / poprzeczka', [w - .015, .022, .003], [x, py, pz], m.metal, .0005);
    for (const px of [left + .013, right - .013]) b.box('Zasobnik 290 l / wspornik boczny', [.003, .022, d - .035], [px, py, z], m.metal, .0005);
  }
  // Shallow cross-folded lid, with its real lifting handle.
  const lidY = 1.321;
  const corners = [[left, lidY, front], [right, lidY, front], [right, lidY, back], [left, lidY, back]];
  for (let i = 0; i < 4; i++) {
    const pts = [corners[i], corners[(i + 1) % 4], [x, 1.333, z]];
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3)); g.computeVertexNormals(); b.add(`Zasobnik 290 l / przetłoczenie pokrywy ${i + 1}`, g, metalSheet);
  }
  for (const px of [x - .030, x + .030]) b.box('Zasobnik 290 l / podstawa uchwytu', [.014, .011, .018], [px, 1.337, z + .075], m.black, .003);
  b.pipe('Zasobnik 290 l / uchwyt pokrywy', [x - .030, 1.345, z + .075], [x + .030, 1.345, z + .075], .006, m.black);
  for (const px of [left + .028, x - .14, x + .14, right - .028]) b.bolt('Zasobnik 290 l / połączenie blachy czołowej', px, shoulder + .013, front + .002, 'z', m.steel, .0028);
}

function burnerAndAuger(b, m) {
  // The exposed Platinum Bio VG is mounted on the left boiler wall. Its housing
  // is a folded sheet profile, not an invented box around an unspecified mechanism.
  const profile = new THREE.Shape();
  profile.moveTo(-.8315, .143); profile.lineTo(-.8315, .228); profile.lineTo(-.690, .405); profile.lineTo(-.320, .405); profile.lineTo(-.320, .143); profile.closePath();
  b.add('Platinum Bio VG / gięta osłona palnika', new THREE.ExtrudeGeometry(profile, { depth: .266, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .0015, bevelThickness: .0015 }), m.darkMetal, [0, 0, -.260]);
  b.box('Platinum Bio VG / kołnierz montażowy', [.030, .294, .294], [-.302, .274, -.127], m.darkMetal, .003);
  b.box('Platinum Bio VG / czarna uszczelka kołnierza', [.008, .301, .301], [-.288, .274, -.127], m.black, .001);
  for (const px of [-.794, -.705, -.545, -.360]) for (const py of [.157, .387]) {
    if (px < -.75 && py > .25) continue;
    b.bolt('Platinum Bio VG / wkręt osłony', px, py, .008, 'z', m.steel, .0026);
  }
  for (const py of [.178, .362]) for (const pz of [-.242, -.012]) b.bolt('Platinum Bio VG / mocowanie kołnierza', -.319, py, pz, 'x', m.steel, .0033);
  // Green laser-cut brand emblem and the manufacturer's identification plate.
  b.text('Platinum Bio VG / znak VG', 'VG', .131, .077, [-.656, .284, .009], { green: true, italic: true, fontSize: 152 });
  const plateMap = canvasTexture(384, 288, (ctx, w, h) => {
    ctx.fillStyle = '#d6d8d6'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#35393b'; ctx.font = 'bold 25px Arial'; ctx.fillText('KOSTRZEWA', 16, 31);
    ctx.font = '18px Arial'; ctx.fillText('PLATINUM BIO VG', 16, 59); ctx.strokeStyle = '#6c7270'; ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(15, 82 + i * 24); ctx.lineTo(w - 15, 82 + i * 24); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(155, 82); ctx.lineTo(155, h - 13); ctx.stroke();
  });
  const plateMat = new THREE.MeshStandardMaterial({ name: 'Tabliczka palnika — bez numeru seryjnego', map: plateMap, metalness: .4, roughness: .45 });
  b.plane('Platinum Bio VG / tabliczka producenta', .069, .063, [-.403, .264, .009], plateMat);
  b.box('Platinum Bio VG / dolny wlot powietrza', [.004, .037, .188], [-.833, .179, -.127], m.shadow, .001);
  for (let i = 0; i < 7; i++) b.box('Platinum Bio VG / szczelina boczna', [.038, .002, .0008], [-.529 + (i % 2) * .025, .311 - i * .009, .009], m.green, .0003);

  const augerBase = [.525, .294, -.407], augerTop = [-.674, 1.243, -.407];
  b.pipe('Podajnik / rura ślimaka', augerBase, augerTop, .034, m.steel, 36);
  b.pipe('Podajnik / mocowanie przy zasobniku', [.525, .294, -.407], [.525, .277, -.170], .039, m.steel, 28);
  const direction = V(...augerTop).sub(V(...augerBase)).normalize();
  const motorCenter = V(...augerTop).addScaledVector(direction, .052);
  motorCenter.z = -.378; // Gearbox casing is offset towards the boiler; stays within the 894 mm envelope.
  const motor = b.box('Podajnik / obudowa motoreduktora', [.144, .147, .138], motorCenter.toArray(), m.darkMetal, .005);
  motor.quaternion.setFromUnitVectors(V(0, 1, 0), direction);
  b.pipe('Podajnik / kołnierz motoreduktora', V(...augerTop).addScaledVector(direction, -.025).toArray(), V(...augerTop).addScaledVector(direction, .015).toArray(), .047, m.black, 28);
  for (let i = 0; i < 5; i++) {
    const vent = b.box('Podajnik / wentylacja motoreduktora', [.007, .026, .001], [-.746 + i * .015, 1.292, -.3085], m.shadow, .0007);
    vent.rotation.z = -.25;
  }
  // Both endpoints connect to physical fittings. The auger sits behind the boiler,
  // while the flexible drop tube remains entirely outside the left side panel.
  const hosePoints = [V(-.654, 1.191, -.378), V(-.684, 1.075, -.300), V(-.632, .905, -.235), V(-.568, .728, -.165), V(-.514, .577, -.127), V(-.512, .478, -.127)];
  const path = new THREE.CatmullRomCurve3(hosePoints, false, 'centripetal');
  b.add('Podajnik / elastyczny przewód zrzutowy Ø70', new THREE.TubeGeometry(path, 64, .035, 16, false), m.black);
  // Shared geometry for the actual hose corrugations, oriented along the tangent.
  const ribGeometry = new THREE.TorusGeometry(.036, .00165, 5, 24);
  for (let i = 1; i < 70; i++) {
    const t = i / 70, pos = path.getPointAt(t), tangent = path.getTangentAt(t);
    const rib = b.add('Podajnik / karb przewodu', ribGeometry, m.darkMetal, pos.toArray()); rib.quaternion.setFromUnitVectors(V(0, 0, 1), tangent);
  }
  b.cylinder('Platinum Bio VG / sztywny króciec zasypu', .034, .105, [-.512, .451, -.127], m.darkMetal, 'y', 32);
  b.torus('Podajnik / dolna opaska zaciskowa', .036, .0023, [-.512, .498, -.127], m.steel, 'y');
  const upperClamp = b.torus('Podajnik / górna opaska zaciskowa', .036, .0023, hosePoints[0].toArray(), m.steel);
  upperClamp.quaternion.setFromUnitVectors(V(0, 0, 1), path.getTangentAt(0));
}

function optimizeStatic(root) {
  // One geometry per material for fast phone rendering. Keep source part names
  // in extras so exported GLBs remain auditable even after draw-call batching.
  root.updateMatrixWorld(true);
  const buckets = new Map();
  for (const mesh of [...root.children]) {
    if (!mesh.isMesh || Array.isArray(mesh.material) || mesh.material.transparent || mesh.material.map) continue;
    const key = mesh.material.uuid;
    if (!buckets.has(key)) buckets.set(key, { material: mesh.material, meshes: [] });
    buckets.get(key).meshes.push(mesh);
  }
  for (const { material, meshes } of buckets.values()) {
    if (meshes.length < 3) continue;
    const geometries = meshes.map(mesh => {
      let g = mesh.geometry.clone(); g.applyMatrix4(mesh.matrixWorld);
      if (g.index) g = g.toNonIndexed();
      for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      return g;
    });
    const geometry = mergeGeometries(geometries, false);
    if (!geometry) { geometries.forEach(g => g.dispose()); continue; }
    const combined = new THREE.Mesh(geometry, material); combined.name = material.name;
    combined.userData.parts = meshes.map(mesh => mesh.name); combined.castShadow = true; combined.receiveShadow = true;
    for (const mesh of meshes) root.remove(mesh);
    root.add(combined); geometries.forEach(g => g.dispose());
  }
}

export function buildBoiler(id, state = {}) {
  const product = boilerProducts.find(p => p.id === id);
  if (!product) throw new Error(`Nieznany model kotła: ${id}`);
  const root = new THREE.Group(); root.name = `KOSTRZEWA ${product.name}`;
  root.userData = { units: 'metres', sourceUrl: product.sourceUrl, dimensionDrawing: product.pdfUrl, accuracy: product.accuracyNote, designDimensions: { width: product.width, height: product.height, depth: product.depth } };
  const materials = makeMaterials(), b = builder(root, materials);
  if (id === 'twin-bio-16') {
    cabinet(b, materials, { x: -.304, width: .542, height: 1.382, front: .4155, back: -.3485, label: 'TBLC 16' });
    compactBin(b, materials);
  } else {
    cabinet(b, materials, { x: -.029, width: .517, height: 1.381, front: .447, back: -.351, label: 'EEI 16' });
    eeiHopper(b, materials); burnerAndAuger(b, materials);
  }
  const logoMaterials = [];
  root.traverse(obj => { if (obj.isMesh && obj.name.includes('znak KOSTRZEWA')) logoMaterials.push(obj.material); });
  optimizeStatic(root);
  const bounds = new THREE.Box3().setFromObject(root), actual = bounds.getSize(new THREE.Vector3());
  // Small fastener and folded-sheet overhangs are fitted to the presentation
  // envelope; the published drawing envelope is retained exactly, on all views.
  root.scale.set(product.width / actual.x, product.height / actual.y, product.depth / actual.z);
  const center = bounds.getCenter(new THREE.Vector3());
  root.position.set(-center.x * root.scale.x, -bounds.min.y * root.scale.y, -center.z * root.scale.z);
  root.updateMatrixWorld(true);
  root.userData.meshEnvelope = { width: product.width, height: product.height, depth: product.depth };
  function update(next = {}) {
    const finish = next.finish || state.finish || 'factory', sheen = next.sheen || state.sheen || 'satin';
    materials.paint.color.set(finish === 'white' ? '#e4e4df' : finish === 'graphite' ? '#3d454a' : '#26282a');
    materials.paint.roughness = sheen === 'gloss' ? .23 : .49;
    materials.paint.clearcoat = sheen === 'gloss' ? .7 : .12;
    materials.paint.clearcoatRoughness = sheen === 'gloss' ? .17 : .4;
    for (const mat of logoMaterials) mat.color.set(finish === 'white' ? '#252a2d' : '#f5f5f2');
  }
  update(state);
  return { root, update, materials, dimensions: { width: product.width, height: product.height, depth: product.depth } };
}
