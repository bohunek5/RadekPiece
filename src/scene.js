import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {FXAAShader} from 'three/addons/shaders/FXAAShader.js';
import {getProduct,buildProduct} from './catalog.js';

function disposeTree(root){
 const geometries=new Set(),materials=new Set(),textures=new Set();
 root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});
 geometries.forEach(x=>x.dispose());materials.forEach(x=>x.dispose());textures.forEach(x=>x.dispose());
}

export class Studio{
 constructor(container,state){
  this.container=container;this.state=state;this.view='studio';this.dirty=true;this.disposed=false;
  const w=container.clientWidth,h=container.clientHeight;
  this.renderer=new T.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio,innerWidth>800?1.5:1),1.75));this.renderer.setSize(w,h);
  this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.08;
  this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.shadowMap.autoUpdate=false;
  const canvas=this.renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Model 3D urządzenia KOSTRZEWA. Przeciągnij, aby obrócić; przewijaj, aby przybliżyć. Strzałki obracają, plus i minus zmieniają przybliżenie.');container.append(canvas);
  this.scene=new T.Scene();this.scene.background=new T.Color('#e9ebe7');
  this.camera=new T.PerspectiveCamera(34,w/h,.015,60);
  this.controls=new OrbitControls(this.camera,canvas);this.controls.enableDamping=true;this.controls.dampingFactor=.12;this.controls.minDistance=.45;this.controls.maxDistance=12;this.controls.maxPolarAngle=Math.PI*.495;this.controls.screenSpacePanning=true;
  this.controls.addEventListener('change',()=>this.dirty=true);this.controls.addEventListener('start',()=>this.transition=null);
  canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(e.key))return;e.preventDefault();this.transition=null;const spherical=new T.Spherical().setFromVector3(this.camera.position.clone().sub(this.controls.target));if(e.key==='ArrowLeft')spherical.theta-=.12;if(e.key==='ArrowRight')spherical.theta+=.12;if(e.key==='ArrowUp')spherical.phi=Math.max(.03,spherical.phi-.08);if(e.key==='ArrowDown')spherical.phi=Math.min(Math.PI*.495,spherical.phi+.08);if(e.key==='+'||e.key==='=')spherical.radius*=.9;if(e.key==='-')spherical.radius*=1.1;spherical.radius=T.MathUtils.clamp(spherical.radius,.45,12);this.camera.position.copy(this.controls.target).add(new T.Vector3().setFromSpherical(spherical));this.dirty=true;});
  const generator=new T.PMREMGenerator(this.renderer),room=new RoomEnvironment();this.env=generator.fromScene(room,.04);this.scene.environment=this.env.texture;room.dispose();generator.dispose();this.scene.environmentIntensity=.85;
  this.environmentReady=new Promise(resolve=>new HDRLoader().load(`${import.meta.env.BASE_URL}studio.hdr`,tex=>{if(this.disposed){tex.dispose();resolve(false);return;}const p=new T.PMREMGenerator(this.renderer);this.env.dispose();this.env=p.fromEquirectangular(tex);this.scene.environment=this.env.texture;tex.dispose();p.dispose();this.dirty=true;resolve(true);},undefined,()=>resolve(false)));
  this.scene.add(new T.HemisphereLight('#f5f9fc','#899188',.95));
  const sun=new T.DirectionalLight('#fff8ef',2.1);sun.position.set(-3.2,5,4.2);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-2.4,right:2.4,top:2.8,bottom:-2.8,near:.1,far:15});sun.shadow.bias=-.0001;sun.shadow.normalBias=.008;sun.shadow.radius=3;this.scene.add(sun);
  const fill=new T.DirectionalLight('#d9e5ed',1.25);fill.position.set(3.5,2.4,-2.5);this.scene.add(fill);
  this.ground=new T.Mesh(new T.PlaneGeometry(100,100),new T.ShadowMaterial({color:'#788279',opacity:.20}));this.ground.rotation.x=-Math.PI/2;this.ground.position.y=-.007;this.ground.receiveShadow=true;this.scene.add(this.ground);
  this.composer=new EffectComposer(this.renderer);this.composer.renderTarget1.samples=4;this.composer.renderTarget2.samples=4;this.composer.addPass(new RenderPass(this.scene,this.camera));
  this.ao=new GTAOPass(this.scene,this.camera,w,h);this.ao.output=GTAOPass.OUTPUT.Default;this.ao.updateGtaoMaterial({radius:.045,distanceExponent:1.6,thickness:.10,scale:.65});this.composer.addPass(this.ao);this.composer.addPass(new OutputPass());this.fxaa=new ShaderPass(FXAAShader);this.composer.addPass(this.fxaa);
  const aoRender=this.ao.render.bind(this.ao);this.ao.render=(...args)=>{this.ground.visible=false;try{aoRender(...args)}finally{this.ground.visible=true;}};
  this.loadProduct(state.product);this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.resize();this.setView('studio',false);
  this.renderer.setAnimationLoop(()=>{this.controls.update();if(this.transition){const t=T.MathUtils.clamp((performance.now()-this.transition.start)/650,0,1),e=1-(1-t)**3;this.camera.position.lerpVectors(this.transition.from,this.transition.to,e);this.controls.target.lerpVectors(this.transition.fromTarget,this.transition.toTarget,e);this.camera.lookAt(this.controls.target);this.dirty=true;if(t>=1)this.transition=null;}if(this.dirty&&!document.hidden){this.composer.render();this.dirty=false;}});
 }
 loadProduct(id){
  if(this.boat){this.scene.remove(this.boat.root);disposeTree(this.boat.root);}
  if(this.dimensions){this.scene.remove(this.dimensions);disposeTree(this.dimensions);}
  this.product=getProduct(id);this.boat=buildProduct(this.product.id,this.state);this.scene.add(this.boat.root);this.boat.root.updateMatrixWorld(true);
  this.bounds=new T.Box3().setFromObject(this.boat.root);this.makeDimensions();this.dimensions.visible=!!this.state.dimensions;this.renderer.shadowMap.needsUpdate=true;this.dirty=true;
 }
 resize(){const w=this.container.clientWidth,h=this.container.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.composer.setSize(w,h);this.fxaa.uniforms.resolution.value.set(1/(w*this.renderer.getPixelRatio()),1/(h*this.renderer.getPixelRatio()));this.dirty=true;}
 setView(id,animate=true){
  this.view=['studio','front','side','rear','detail'].includes(id)?id:'studio';
  const p=this.product,h=p.height,target=new T.Vector3(0,h*.50,0);
  const directions={studio:[p.category==='boiler'?-1.4:1.4,.75,2.1],front:[0,.05,1],side:[1,.08,0],rear:[-1.25,.65,-2.1],detail:[.55,.25,1]};
  const dir=new T.Vector3(...directions[this.view]).normalize();const right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),dir).normalize();const up=new T.Vector3().crossVectors(dir,right).normalize();
  const fov=T.MathUtils.degToRad(this.camera.fov)/2,tan=Math.tan(fov);let distance=0;
  for(const x of [this.bounds.min.x,this.bounds.max.x])for(const y of[this.bounds.min.y,this.bounds.max.y])for(const z of[this.bounds.min.z,this.bounds.max.z]){const offset=new T.Vector3(x,y,z).sub(target);distance=Math.max(distance,offset.dot(dir)+Math.max(Math.abs(offset.dot(up))/tan,Math.abs(offset.dot(right))/(tan*this.camera.aspect)));}
  distance*=1.22;if(this.view==='detail'){target.set(0,h*.72,p.depth*.30);distance=h*1.3;if(this.camera.aspect<1)distance*=1.1;}
  const to=target.clone().addScaledVector(dir,distance);
  if(animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches)this.transition={start:performance.now(),from:this.camera.position.clone(),to,fromTarget:this.controls.target.clone(),toTarget:target};
  else{this.transition=null;this.camera.position.copy(to);this.controls.target.copy(target);this.camera.lookAt(target);this.controls.update();}this.dirty=true;
 }
 update(state){const changed=state.product!==this.product.id;this.state=state;if(changed){this.loadProduct(state.product);this.setView('studio',false);}else this.boat.update(state);this.dimensions.visible=!!state.dimensions;this.renderer.shadowMap.needsUpdate=true;this.dirty=true;}
 makeDimensions(){
  const {width:w,height:h,depth:d}=this.product;this.dimensions=new T.Group();this.dimensions.name='Wymiary katalogowe';this.scene.add(this.dimensions);
  const mat=new T.LineBasicMaterial({color:'#647469'}),gap=.16;
  const line=points=>this.dimensions.add(new T.Line(new T.BufferGeometry().setFromPoints(points.map(v=>new T.Vector3(...v))),mat));
  line([[-w/2,.02,d/2+gap],[w/2,.02,d/2+gap]]);for(const x of[-w/2,w/2])line([[x,.02,d/2+gap-.045],[x,.02,d/2+gap+.045]]);
  line([[-w/2-gap,0,0],[-w/2-gap,h,0]]);for(const y of[0,h])line([[-w/2-gap-.045,y,0],[-w/2-gap+.045,y,0]]);
  line([[w/2+gap,.02,-d/2],[w/2+gap,.02,d/2]]);for(const z of[-d/2,d/2])line([[w/2+gap-.045,.02,z],[w/2+gap+.045,.02,z]]);
  const tag=(text,p)=>{const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#f5f6ef';ctx.fillRect(0,0,512,128);ctx.fillStyle='#3b5149';ctx.font='500 60px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,64);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const sprite=new T.Sprite(new T.SpriteMaterial({map:tex,depthTest:false}));sprite.position.set(...p);sprite.scale.set(.35,.0875,1);sprite.renderOrder=10;this.dimensions.add(sprite);};
  tag(`${Math.round(w*1000)} mm`,[0,.06,d/2+gap]);tag(`${Math.round(h*1000)} mm`,[-w/2-gap,h*.55,0]);tag(`${Math.round(d*1000)} mm`,[w/2+gap,.06,0]);
 }
 async glb(){await this.environmentReady;this.boat.root.userData={...this.boat.root.userData,units:'metres',product:this.product.name,configuration:{...this.state},reference:this.product.sourceUrl,accuracy:'External reconstruction from manufacturer drawings and photographs; not factory CAD'};return new GLTFExporter().parseAsync(this.boat.root,{binary:true,onlyVisible:true,maxTextureSize:2048});}
 async png(width=3840,height=2160){await this.environmentReady;const w=this.container.clientWidth,h=this.container.clientHeight,ratio=this.renderer.getPixelRatio(),aspect=this.camera.aspect,position=this.camera.position.clone(),target=this.controls.target.clone();try{this.transition=null;this.renderer.setPixelRatio(1);this.renderer.setSize(width,height,false);this.composer.setPixelRatio(1);this.composer.setSize(width,height);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.fxaa.uniforms.resolution.value.set(1/width,1/height);this.composer.render();return await new Promise((resolve,reject)=>this.renderer.domElement.toBlob(b=>b?resolve(b):reject(new Error('Nie udało się utworzyć PNG.')),'image/png'));}finally{this.renderer.setPixelRatio(ratio);this.renderer.setSize(w,h);this.composer.setPixelRatio(ratio);this.composer.setSize(w,h);this.camera.aspect=aspect;this.camera.position.copy(position);this.controls.target.copy(target);this.camera.updateProjectionMatrix();this.fxaa.uniforms.resolution.value.set(1/(w*ratio),1/(h*ratio));this.dirty=true;}}
 metrics(){let objects=0,vertices=0,triangles=0,invalid=0;this.boat.root.traverse(o=>{if(!o.isMesh)return;objects++;const p=o.geometry.attributes.position;vertices+=p.count;triangles+=(o.geometry.index?.count??p.count)/3;for(const v of p.array)if(!Number.isFinite(v))invalid++;});const bounds=new T.Box3().setFromObject(this.boat.root);return{product:this.product.id,objects,vertices,triangles,invalid,min:bounds.min.toArray(),max:bounds.max.toArray(),size:bounds.getSize(new T.Vector3()).toArray(),catalogue:[this.product.width,this.product.height,this.product.depth]};}
 dispose(){if(this.disposed)return;this.disposed=true;this.renderer.setAnimationLoop(null);this.resizeObserver.disconnect();this.controls.dispose();disposeTree(this.scene);this.env.dispose();this.composer.dispose();this.renderer.dispose();}
}
