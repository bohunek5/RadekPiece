import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Exterior reconstructed from the manufacturer's dimensional drawing (10.07.2025)
// and service manual (04.2026), pp. 15, 19, 35–37, 42–43. Dimensions are metres.
// All three HPR Deluxe outputs share one casing; no invented visual differences.
const sourceUrl = 'https://www.kostrzewa.com.pl/produkty/hpr-deluxe-hb';
const pdfUrl = 'references/pumps-hpr-dimensions.pdf';
const manualUrl = 'references/pumps-hpr-manual.pdf';

export const heatPumpProducts = [
  { id: 'hpr-400-deluxe', name: 'HPR 400 Deluxe', shortName: 'HPR 400', category: 'pump', categoryLabel: 'Pompa ciepła', powerLabel: '10,87 kW · A7/W35', width: .977, height: 1.718, depth: .977,
    sourceUrl, pdfUrl, manualUrl, imageUrl: 'references/pumps-hpr-deluxe.png',
    description: 'Powietrzna pompa ciepła R290. Jednostka zewnętrzna w obudowie INOX, z dwoma pasami pionowej perforacji.',
    dimensionNote: '977 × 977 × 1718 mm według rysunku gabarytowego producenta z 10.07.2025. Instrukcja 04.2026 zaokrągla wysokość do 1720 mm.',
    accuracyNote: 'HPR 400 i HPR 600 mają wspólną obudowę. Gabaryty potwierdzone; drobne detale odtworzone z fotografii i rysunków. To rekonstrukcja wizualna jednostki zewnętrznej, bez hydroboxu.' },
  { id: 'hpr-600-deluxe', name: 'HPR 600 Deluxe', shortName: 'HPR 600', category: 'pump', categoryLabel: 'Pompa ciepła', powerLabel: '15,76 kW · A7/W35', width: .977, height: 1.718, depth: .977,
    sourceUrl, pdfUrl, manualUrl, imageUrl: 'references/pumps-hpr-deluxe.png',
    description: 'Mocniejszy wariant HPR Deluxe z czynnikiem R290. Ta sama obudowa INOX i geometria zewnętrzna jak HPR 400.',
    dimensionNote: '977 × 977 × 1718 mm według rysunku gabarytowego producenta z 10.07.2025. Instrukcja 04.2026 zaokrągla wysokość do 1720 mm.',
    accuracyNote: 'Wspólne gabaryty HPR 400/500/600 potwierdza jeden rysunek producenta. Moc podana dla A7/W35 z instrukcji 04.2026, s. 15. Detale nie są fabrycznym modelem CAD.' },
];

function physical(name, color, metalness = 0, roughness = .45) {
  return new THREE.MeshPhysicalMaterial({ name, color, metalness, roughness, clearcoat: .10, clearcoatRoughness: .30 });
}

function canvasTexture(draw, width = 1024, height = 256) {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const context = canvas.getContext('2d'); draw(context, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8;
  return texture;
}

function labelTexture(number) {
  return canvasTexture((c,w,h) => {
    c.clearRect(0,0,w,h); c.fillStyle = '#fff'; c.textBaseline = 'alphabetic';
    c.font = '700 150px Arial, sans-serif'; c.fillText('HPR',0,142);
    c.font = '400 150px Arial, sans-serif'; c.fillText(number,325,142);
    c.fillRect(0,165,642,7);
    c.save(); c.scale(.90,1); c.font = '900 64px Arial, sans-serif'; c.fillText('KOSTRZEWA',0,244); c.restore();
  },1024,256);
}

function rectangle(x0,y0,x1,y1) {
  const s = new THREE.Shape(); s.moveTo(x0,y0); s.lineTo(x1,y0); s.lineTo(x1,y1); s.lineTo(x0,y1); s.closePath(); return s;
}

function slotPath(x,y,width,height) {
  const p = new THREE.Path(); const r = Math.min(width/2,.0021); const l=x-width/2,b=y-height/2,t=y+height/2,rr=x+width/2;
  p.moveTo(l+r,b); p.lineTo(rr-r,b); p.quadraticCurveTo(rr,b,rr,b+r); p.lineTo(rr,t-r); p.quadraticCurveTo(rr,t,rr-r,t);
  p.lineTo(l+r,t); p.quadraticCurveTo(l,t,l,t-r); p.lineTo(l,b+r); p.quadraticCurveTo(l,b,l+r,b); p.closePath(); return p;
}

function perforatedPanelGeometry() {
  const s = rectangle(-.434,.038,.434,1.692);
  // Slot openings cut the sheet itself. They are not dark lines painted on a box.
  // The staggered vertical slot pattern and band proportions follow the photos.
  const columns=48, span=.748, pitch=span/columns, slitWidth=.0084;
  for (const [bottom,top,rows] of [[.062,.315,7],[.706,1.166,12]]) {
    const cell=(top-bottom)/rows;
    for(let col=0;col<columns;col++) {
      const x=-span/2+pitch*(col+.5);
      const stagger=(col%2)*cell/2;
      for(let row=-1;row<=rows;row++) {
        const lo=Math.max(bottom,bottom+row*cell+stagger+.0024), hi=Math.min(top,bottom+(row+1)*cell+stagger-.0024);
        if(hi-lo>.005) s.holes.push(slotPath(x,(lo+hi)/2,slitWidth,hi-lo));
      }
    }
  }
  const g = new THREE.ExtrudeGeometry(s,{depth:.0018,bevelEnabled:false,curveSegments:2,steps:1});
  g.translate(0,0,-.0009); return g;
}

function chamferedSection(half, chamfer) {
  const s = new THREE.Shape();
  s.moveTo(-half+chamfer,-half); s.lineTo(half-chamfer,-half);s.lineTo(half,-half+chamfer);s.lineTo(half,half-chamfer);
  s.lineTo(half-chamfer,half);s.lineTo(-half+chamfer,half);s.lineTo(-half,half-chamfer);s.lineTo(-half,-half+chamfer);s.closePath();return s;
}

export function buildHeatPump(id, state={}) {
  const product=heatPumpProducts.find(p=>p.id===id);
  if(!product) throw new Error(`Unknown heat pump: ${id}`);
  const root=new THREE.Group(); root.name=id;
  root.userData={units:'metres',product:product.name,sourceUrl,pdfUrl,manualUrl,accuracyNote:product.accuracyNote,dimensions:{width:.977,height:1.718,depth:.977}};
  const casing=physical('HPR brushed stainless casing', '#c5c9c9',.92,.36);
  const frame=physical('Stainless internal supports', '#6f777b',.90,.36);
  const dark=physical('Recessed dark heat exchanger', '#222a2e',.55,.54);
  const rubber=physical('Rubber feet and panel seals', '#202525',0,.76);
  const hardware=physical('Stainless fasteners', '#9ba0a3',.94,.27);
  const label=new THREE.MeshStandardMaterial({name:'HPR product marking',map:labelTexture(id.includes('400')?'400':'600'),color:'#111819',transparent:true,alphaTest:.08,roughness:.6,depthWrite:false});
  const materials={casing,frame,dark,rubber,hardware,label};
  const staticGroups=new Map();
  const screws=[];
  const mesh=(name,geometry,material,parent=root)=>{
    const m=new THREE.Mesh(geometry,material); m.name=name;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  };
  const box=(name,w,h,d,x,y,z,material,parent=root,radius=0)=>{
    const g=radius?new RoundedBoxGeometry(w,h,d,2,radius):new THREE.BoxGeometry(w,h,d);
    const m=mesh(name,g,material,parent);m.position.set(x,y,z);return m;
  };
  const bake=(m)=>{
    m.updateMatrix();const g=m.geometry.clone().applyMatrix4(m.matrix);
    const list=staticGroups.get(m.material)||[];list.push(g);staticGroups.set(m.material,list);m.removeFromParent();m.geometry.dispose();
  };
  const staticBox=(...args)=>{const m=box(...args);bake(m);return m;};
  const screw=(x,y,z,axis=new THREE.Vector3(0,0,1),radius=.0038)=>{
    const g=new THREE.CylinderGeometry(radius,radius,.0022,12);g.rotateX(Math.PI/2);
    const m=mesh('Socket-head panel screw',g,hardware);m.position.set(x,y,z);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),axis);bake(m);
    const recess=new THREE.CylinderGeometry(radius*.42,radius*.42,.0004,6);recess.rotateX(Math.PI/2);
    const n=mesh('Hex socket',recess,dark);n.position.copy(new THREE.Vector3(x,y,z).addScaledVector(axis,.0013));n.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),axis);bake(n);
    screws.push([x,y,z]);
  };

  // Four adjustable supports. No invented plinth or wall bracket.
  for(const x of [-.418,.418]) for(const z of [-.418,.418]) {
    const pad=mesh('Rubber support foot',new THREE.CylinderGeometry(.025,.027,.010,24),rubber);pad.position.set(x,.005,z);bake(pad);
    const stud=mesh('Foot adjustment stud',new THREE.CylinderGeometry(.006,.006,.027,12),hardware);stud.position.set(x,.0235,z);bake(stud);
    const nut=mesh('Foot locknut',new THREE.CylinderGeometry(.011,.011,.006,6),hardware);nut.position.set(x,.030,z);bake(nut);
  }

  // Folded bottom tray and top rain cover retain the exact 977 × 977 footprint.
  const trayGeometry=new THREE.ExtrudeGeometry(chamferedSection(.475,.027),{depth:.014,bevelEnabled:false});trayGeometry.rotateX(-Math.PI/2);trayGeometry.translate(0,.030,0);
  mesh('Folded base tray',trayGeometry,casing);
  const capGeometry=new THREE.ExtrudeGeometry(chamferedSection(.4885,.018),{depth:.014,bevelEnabled:true,bevelThickness:.001,bevelSize:.001,bevelSegments:2});
  capGeometry.rotateX(-Math.PI/2);capGeometry.translate(0,1.703,0);
  // Bevel extends the extrusion by 1 mm; keep overall height exactly 1718 mm.
  capGeometry.computeBoundingBox();const capBB=capGeometry.boundingBox;
  const capScale=.977/(capBB.max.x-capBB.min.x);capGeometry.scale(capScale,1,capScale);
  mesh('Removable top cover with folded lip',capGeometry,casing);
  box('Shadow under top cover',.954,.004,.954,0,1.698,0,rubber);

  const panelGeometry=perforatedPanelGeometry();
  const faceNames=['Front','Right','Rear','Left'];
  for(let side=0;side<4;side++) {
    const rotation=side*Math.PI/2;
    const face=new THREE.Group();face.name=`${faceNames[side]} removable perforated sheet`;face.rotation.y=rotation;root.add(face);
    const panel=mesh('Laser-cut slotted stainless panel',panelGeometry,casing,face);panel.position.z=.482;
    // Folded panel edges and the reveal between sheet and corner rails.
    box('Left vertical gasket',.005,1.654,.003,-.439,.865,.476,rubber,face);
    box('Right vertical gasket',.005,1.654,.003,.439,.865,.476,rubber,face);
    box('Folded left sheet edge',.011,1.654,.015,-.429,.865,.475,casing,face);
    box('Folded right sheet edge',.011,1.654,.015,.429,.865,.475,casing,face);
    // Fine exchanger fins sit well inside the real openings, rather than over
    // them. The machinery is only a subdued silhouette behind the closed case.
    box('Recessed exchanger face',.797,.49,.015,0,.931,.350,dark,face);
    const fins=new THREE.InstancedMesh(new THREE.BoxGeometry(.0015,.471,.012),frame,100);
    fins.name='Heat-exchanger fins behind upper grille';const matrix=new THREE.Matrix4();
    for(let i=0;i<100;i++){matrix.makeTranslation(-.391+i*.0079,.931,.361);fins.setMatrixAt(i,matrix);}
    fins.castShadow=false;fins.receiveShadow=true;face.add(fins);
    // Sheet fasteners match the middle fixing and lid bolts in the manual.
    for(const [localX,localY] of [[0,.646],[-.265,1.708],[.265,1.708]]) {
      const p=new THREE.Vector3(localX,localY,.484).applyAxisAngle(new THREE.Vector3(0,1,0),rotation);
      const n=new THREE.Vector3(0,0,1).applyAxisAngle(new THREE.Vector3(0,1,0),rotation);screw(p.x,p.y,p.z,n,localY>1.7?.0028:.0038);
    }
    for(const x of [-.452,.452]) for(const y of [.126,.657,1.628]) {
      const recess=box('Rail mounting aperture',.0045,.007,.001,x,y,.481,dark,face);
      recess.castShadow=false;
    }
  }

  // Narrow chamfered corner pillars, reconstructed from the orthographic views.
  for(let corner=0;corner<4;corner++) {
    const g=new THREE.Group();g.name='Folded corner rail';g.rotation.y=corner*Math.PI/2;root.add(g);
    box('Front return of corner rail',.034,1.658,.009,.459,.866,.478,casing,g);
    box('Side return of corner rail',.009,1.658,.034,.478,.866,.459,casing,g);
    const diagonal=box('Chamfered corner',.026,1.658,.006,.475,.866,.475,casing,g);diagonal.rotation.y=Math.PI/4;
  }

  // Lower open grille reveals the real structural tray and recessed vertical-axis
  // fan. No front-facing fan or exterior refrigerant pipes exist on this casing.
  for(const x of [-.398,.398]) for(const z of [-.398,.398]) staticBox('Inner frame upright',.025,1.627,.025,x,.855,z,frame);
  for(const y of [.062,.343,.691,1.659]) {
    staticBox('Internal crossmember',.805,.020,.022,0,y,-.398,frame);
    staticBox('Internal crossmember',.805,.020,.022,0,y,.398,frame);
    staticBox('Internal side member',.022,.020,.805,-.398,y,0,frame);
    staticBox('Internal side member',.022,.020,.805,.398,y,0,frame);
  }
  const shroud=mesh('Recessed horizontal fan shroud',new THREE.CylinderGeometry(.337,.337,.094,80,1,true),dark);shroud.position.y=.337;
  const fanRing=mesh('Fan housing rim',new THREE.TorusGeometry(.331,.007,8,80),frame);fanRing.rotation.x=Math.PI/2;fanRing.position.y=.293;
  const hub=mesh('Concealed fan hub',new THREE.CylinderGeometry(.078,.085,.060,32),dark);hub.position.y=.327;
  // Blades remain static: this is an exterior product model, not an operating claim.
  const bladeShape=new THREE.Shape();bladeShape.moveTo(.065,-.012);bladeShape.bezierCurveTo(.12,-.11,.24,-.13,.315,-.073);bladeShape.bezierCurveTo(.30,.015,.20,.075,.082,.043);bladeShape.closePath();
  const bladeGeo=new THREE.ExtrudeGeometry(bladeShape,{depth:.004,bevelEnabled:false,curveSegments:12});bladeGeo.rotateX(-Math.PI/2);
  for(let i=0;i<5;i++){const blade=mesh('Fan blade behind lower grille',bladeGeo,dark);blade.rotation.y=i*Math.PI*2/5;blade.position.y=.321;}
  // Closed rear break-out port and small service identification plate, documented
  // on the rear orthographic drawing. No fictitious external plumbing attached.
  box('Closed rear utility passthrough reveal',.145,.089,.002,-.303,.420,-.484,dark);
  box('Closed rear utility passthrough',.136,.080,.002,-.303,.420,-.4855,casing);
  box('Rear service plate',.102,.119,.001,-.303,.557,-.484,frame);
  // Product marking is printed directly on the upper front sheet.
  const badge=mesh('HPR model designation and manufacturer',new THREE.PlaneGeometry(.264,.066),label);
  badge.position.set(-.241,1.611,.4842);badge.castShadow=false;badge.renderOrder=2;
  badge.userData.label=product.name;

  // Consolidate small fixed fasteners and frame parts without baking away the
  // distinct large panels; instanced exchanger fins use just four draw calls.
  for(const [mat,geometries] of staticGroups) {
    const merged=mergeGeometries(geometries,false);
    if(merged) mesh(`${mat.name} details`,merged,mat);
    geometries.forEach(g=>g.dispose());
  }
  root.userData.confirmedDetails=['977 × 977 mm footprint','1718 mm drawing height','Two slotted bands on all four faces','Removable solid top cover','Four levelling feet','Rear closed passthrough','HPR designation above manufacturer','Concealed downward fan'];
  root.userData.approximatedDetails=['Slot count and corner bend radii interpreted from photographs','Small fastener spacing and internal silhouettes','Wordmark typography reconstructed'];
  root.userData.fastenerCount=screws.length;
  const update=(next={})=>{
    const finish=next.finish||'factory', glossy=next.sheen==='gloss';
    const inox=finish==='factory'||finish==='inox';
    casing.color.set(inox?'#c5c9c9':finish==='graphite'?'#353b40':'#e8e9e6');
    casing.metalness=inox?.92:finish==='graphite'?.65:.20;
    casing.roughness=glossy?.20:inox?.36:.43;
    casing.clearcoat=glossy?.30:.08;label.color.set(finish==='graphite'?'#e9edeb':'#111819');
    root.userData.finish=finish;root.userData.sheen=next.sheen||'satin';
  };
  update(state);
  return {root,update,materials,dimensions:{width:.977,height:1.718,depth:.977},product};
}
