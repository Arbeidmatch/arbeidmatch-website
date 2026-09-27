import * as THREE from '/recos-experience/three.module.min.js';

// Real browser captures of an isolated, fictional RecOS interface demonstration.
export async function createUniverse(host) {
 const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
 renderer.setPixelRatio(Math.min(2, Math.max(devicePixelRatio, innerWidth < 901 ? 1.5 : 1.75)));
 renderer.setSize(innerWidth, innerHeight); renderer.outputColorSpace = THREE.SRGBColorSpace;
 renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
 host.append(renderer.domElement); renderer.domElement.id = 'world-canvas';
 const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x050a0e, .014);
 const camera = new THREE.PerspectiveCamera(47, innerWidth / innerHeight, .1, 180);
 const mint = 0x9cffe1;
 const metal = new THREE.MeshStandardMaterial({ color: 0x19342f, metalness: .75, roughness: .28 });
 const edgeMat = new THREE.MeshBasicMaterial({ color: 0x7bcab0, transparent: true, opacity: .6, toneMapped: false });
 scene.add(new THREE.HemisphereLight(0xd5fbea, 0x12342b, 2));
 const sun = new THREE.DirectionalLight(0xe2fff2, 3); sun.position.set(2, 8, 8); scene.add(sun);
 const rim = new THREE.DirectionalLight(0x639dbe, 2); rim.position.set(-5, 2, -5); scene.add(rim);
 const loader = new THREE.TextureLoader(), textures = {};
 const names = ['overview', 'candidates', 'pipeline', 'messages', 'clients', 'presentations', 'assistant', ...Array.from({ length: 8 }, (_, i) => 'team-' + (i + 1))];
 await Promise.all(names.map(async name => { const texture = await loader.loadAsync('/recos-experience/assets/recos-' + name + '.png'); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = renderer.capabilities.getMaxAnisotropy(); textures[name] = texture; }));
 function mesh(parent, geometry, material, x = 0, y = 0, z = 0) { const object = new THREE.Mesh(geometry, material); object.position.set(x, y, z); parent.add(object); return object; }
 function box(parent, w, h, d, material, x = 0, y = 0, z = 0) { return mesh(parent, new THREE.BoxGeometry(w, h, d), material, x, y, z); }
 const glowCanvas = document.createElement('canvas'); glowCanvas.width = glowCanvas.height = 128;
 const ctx = glowCanvas.getContext('2d'), gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
 gradient.addColorStop(0, '#9cffda70'); gradient.addColorStop(.35, '#42bb9820'); gradient.addColorStop(1, '#42bb9800');
 ctx.fillStyle = gradient; ctx.fillRect(0, 0, 128, 128); const glowTexture = new THREE.CanvasTexture(glowCanvas);
 function glow(parent, size, opacity) { const o = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending })); o.scale.set(size, size, 1); parent.add(o); return o; }
 function label(parent, text, x, y, z, width = 2) {
  const c = document.createElement('canvas'); c.width = 768; c.height = 96; const g = c.getContext('2d');
  g.fillStyle = '#aacabb'; g.font = '500 29px Arial'; g.textAlign = 'center'; g.fillText(text, 384, 60);
  const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace;
  return mesh(parent, new THREE.PlaneGeometry(width, width / 8), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false }), x, y, z);
 }
 function screen(parent, texture, width = 8) {
  const g = new THREE.Group(); parent.add(g); const height = width / 1.6;
  box(g, width + .16, height + .16, .14, metal);
  box(g, width + .09, height + .09, .018, new THREE.MeshBasicMaterial({ color: 0x050d13 }), 0, 0, .08);
  const face = mesh(g, new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, transparent: true, toneMapped: false, fog: false }), 0, 0, .10);
  const border = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(width + .17, height + .17, .14)), edgeMat); g.add(border);
  box(g, width * .24, .017, .018, new THREE.MeshBasicMaterial({ color: mint, toneMapped: false }), 0, -height / 2 - .08, .09);
  const outgoing = mesh(g, new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, fog: false }), 0, 0, .115);
  return { g, face, border, outgoing };
 }
 const depths = [0, -24, -55, -79, -117];
 const layouts = ['arrival', 'workspace', 'team', 'connections', 'invitation'];
 const sideOf = index => index % 2 === 0 ? 1 : -1;
 const defaultViews = ['overview', 'clients', 'team', 'presentations', 'overview'];
 const selectedViews = [...defaultViews], stations = [], cards = [], seats = [], labels = [];
 let seatCount = 1, activeStation = 0, activeView = 'overview', transitionStart = -10000;
 function textureFor(view) { return textures[view === 'team' ? 'team-' + seatCount : view]; }
 for (let i = 0; i < 5; i++) {
  const group = new THREE.Group(); group.position.set(sideOf(i) * 4.05, .2, depths[i]); scene.add(group); stations.push(group);
  const aura = glow(group, 16, .36); aura.position.set(0, 0, -2.5);
  const card = screen(group, textureFor(defaultViews[i])); card.g.rotation.y = -.16; cards.push(card);
  card.g.userData.preview = true;
  labels.push(label(group, ['YOUR FIRST RECRUITER SEAT', 'A WORKSPACE OF YOUR OWN', 'GROW YOUR TEAM', 'CONNECTED RECRUITMENT', 'YOUR NEXT CHAPTER'][i], 0, 3.2, -.1, 5.8));
  // A restrained plinth and a dim reflection keep the product screens in space.
  const plinth = mesh(group, new THREE.CylinderGeometry(4.9, 5.1, .06, 80), metal, 0, -3.25, -.6); plinth.scale.z = .40; plinth.visible = false;
  const reflection = mesh(group, new THREE.PlaneGeometry(8, 5), new THREE.MeshBasicMaterial({ map: textureFor(defaultViews[i]), transparent: true, opacity: .065, depthWrite: false, toneMapped: false }), 0, -4.65, -.4); reflection.rotation.x = -Math.PI / 2;
  card.reflection = reflection; reflection.visible = false;
 }
 const seatGroup = new THREE.Group(); stations[2].add(seatGroup); seatGroup.visible = false;
 for (let i = 0; i < 8; i++) {
  const pod = screen(seatGroup, textures.overview, .67); pod.g.position.set((i - 3.5) * .89, -2.96, .55); pod.g.userData.seat = i + 1; seats.push(pod);
 }
 function setSeats(count) { seatCount = Math.max(1, Math.min(8, count)); seats.forEach((pod, i) => { pod.g.visible = i < seatCount; pod.g.position.x = (i - (seatCount - 1) / 2) * .89; }); cards.forEach((card, i) => { if (selectedViews[i] === 'team') card.face.material.map = card.reflection.material.map = textureFor('team'); }); }
 function setView(view, chapter = activeStation, instant = false) { if (!['overview', 'candidates', 'clients', 'presentations', 'pipeline', 'messages', 'assistant', 'team'].includes(view)) return; cards[chapter].outgoing.material.map = cards[chapter].face.material.map; selectedViews[chapter] = view; activeView = view; cards[chapter].face.material.map = cards[chapter].reflection.material.map = textureFor(view); transitionStart = instant ? -10000 : performance.now(); }
 function setActivity(index) { setView(['clients', 'presentations', 'assistant', 'pipeline'][index], 3); }
 setSeats(1);
 const travelFrames = [];
 for (let chapter = 0; chapter < 4; chapter++) for (let j = 0; j < chapter % 3 + 2; j++) {
  const t = (j + 1) / (chapter % 3 + 3);
  const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(13, 10, .06)), new THREE.LineBasicMaterial({ color: chapter === 1 ? 0xc9a84c : mint, transparent: true, opacity: .15 }));
  frame.position.set(Math.sin((chapter + t) * Math.PI) * 2.5, .2, THREE.MathUtils.lerp(depths[chapter], depths[chapter + 1], t));
  frame.rotation.z = (chapter % 2 ? -1 : 1) * (j + 1) * .12;
  scene.add(frame); travelFrames.push(frame);
 }
 const finale = new THREE.Group(); finale.position.z = depths[4] - 4; scene.add(finale);
 for (let i = 0; i < 3; i++) {
  const doorway = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(11 + i * 2, 9 + i * 2, .08)), new THREE.LineBasicMaterial({ color: mint, transparent: true, opacity: .14 - i * .035 }));
  doorway.position.z = -i * 4; finale.add(doorway);
 }
 const orbit = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 100 }, (_, i) => new THREE.Vector3(Math.cos(i / 100 * Math.PI * 2) * 5.4, Math.sin(i / 100 * Math.PI * 2) * 3.5, -1))), new THREE.LineBasicMaterial({ color: mint, transparent: true, opacity: .22 }));
 stations[2].add(orbit);
 const floor = mesh(scene, new THREE.PlaneGeometry(90, 190), new THREE.MeshBasicMaterial({ color: 0x061014 }), 0, -4, -53); floor.rotation.x = -Math.PI / 2;
 const grid = new THREE.GridHelper(180, 90, 0x286454, 0x12332c); grid.position.set(0, -3.98, -55); grid.material.transparent = true; grid.material.opacity = .055; scene.add(grid);
 for (const x of [-4.6, 4.6]) box(scene, .018, .018, 135, edgeMat, x, -3.95, -48);
 let seed = 1463; const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
 const positions = new Float32Array(700 * 3); for (let i = 0; i < 700; i++) { positions[i * 3] = (random() - .5) * 80; positions[i * 3 + 1] = (random() - .5) * 35; positions[i * 3 + 2] = 20 - random() * 165; }
 const starsGeometry = new THREE.BufferGeometry(); starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
 const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: 0xb0eedd, size: .035, transparent: true, opacity: .48 })); scene.add(stars);
 const target = new THREE.Vector3(), pointer = new THREE.Vector2(), raycaster = new THREE.Raycaster();
 let dragStart = null, dragRotation = 0, currentDrag = 0, disposed = false, lost = false;
 renderer.domElement.style.cursor = 'grab';
 renderer.domElement.addEventListener('pointerdown', event => { if (event.pointerType !== 'mouse') return; dragStart = { x: event.clientX, y: event.clientY }; currentDrag = dragRotation; renderer.domElement.setPointerCapture(event.pointerId); });
 renderer.domElement.addEventListener('pointermove', event => { if (dragStart) dragRotation = THREE.MathUtils.clamp(currentDrag + (event.clientX - dragStart.x) * .004, -.6, .6); });
 renderer.domElement.addEventListener('pointerup', event => {
  const wasDrag = dragStart && Math.hypot(event.clientX - dragStart.x, event.clientY - dragStart.y) > 5; dragStart = null;
  if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
  if (wasDrag || event.pointerType !== 'mouse') return;
  raycaster.setFromCamera(new THREE.Vector2(event.clientX / innerWidth * 2 - 1, 1 - event.clientY / innerHeight * 2), camera);
  const hits = raycaster.intersectObjects(stations[activeStation].children, true);
  let object = hits.find(hit => { for (let p = hit.object; p; p = p.parent) if (!p.visible) return false; return hit.object.isMesh && !hit.object.isSprite; })?.object;
  while (object && object !== scene) { if (object.userData.seat !== undefined) { host.dispatchEvent(new CustomEvent('seatselected', { detail: object.userData.seat })); break; } if (object.userData.preview) { host.dispatchEvent(new CustomEvent('screenselected', { detail: object.userData.view || selectedViews[activeStation] })); break; } object = object.parent; }
 });
 renderer.domElement.addEventListener('pointercancel', () => { dragStart = null; });
 renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); lost = true; host.dispatchEvent(new CustomEvent('sceneunavailable')); });
 renderer.domElement.addEventListener('webglcontextrestored', () => { lost = false; host.dispatchEvent(new CustomEvent('scenerestored')); });
 function resize() { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
 function render(progress, time, moving, pointerX, pointerY) {
  if (disposed || lost) return;
  const mobile = innerWidth < 901, fraction = progress % 1, travel = Math.sin(fraction * Math.PI);
  activeStation = Math.round(progress); activeView = selectedViews[activeStation];
  pointer.lerp(new THREE.Vector2(pointerX, pointerY), .04);
  const depth = THREE.MathUtils.lerp(depths[Math.floor(progress)], depths[Math.min(4, Math.ceil(progress))], fraction);
  const entrance = moving ? Math.pow(Math.max(0, 1 - time / 2.4), 3) * 6 : 0;
  camera.position.set(Math.sin(progress * Math.PI) * (mobile ? .4 : 2.5) + (moving ? pointer.x * .12 : 0), (mobile ? 3.2 : .65) + Math.sin(progress * Math.PI * 1.5) * .65, 13 + depth + entrance);
  target.set(mobile ? 3.15 : Math.sin(progress * Math.PI) * .6, mobile ? 3.3 : .1, depth); camera.lookAt(target);
  if (!mobile && moving) camera.rotateZ(Math.sin(progress * Math.PI) * .035);
  camera.fov = (mobile ? 68 : 47) + (moving ? travel * 8 : 0); camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  const copyRect = mobile ? document.querySelector('.chapter.active .chapter-copy')?.getBoundingClientRect() : null;
  const controlRect = document.querySelector('.product-controls')?.getBoundingClientRect();
  const swap = moving ? Math.max(0, 1 - (performance.now() - transitionStart) / 600) : 0;
  stations.forEach((station, i) => {
   const side = sideOf(i);
   station.position.x = mobile ? 3.5 : side * 4.05; station.position.y = mobile ? (innerHeight < 740 ? 1.15 : 1.65) : .45;
   station.scale.setScalar(mobile ? (innerHeight < 740 ? .70 : .80) : 1); station.visible = i !== 4 && i === activeStation; labels[i].visible = false;
   if (!mobile) {
    const span = 2 * 13 * Math.tan(THREE.MathUtils.degToRad(47 / 2));
    const controlsTop = controlRect?.height ? controlRect.top : innerHeight - 225;
    const heroBottom = document.querySelector('.chapter[data-chapter="0"] .chapter-copy').getBoundingClientRect().bottom;
    let pixelWidth = Math.min(innerWidth * .43, Math.max(180, controlsTop - 180) * 1.6);
    let centerX = side * .2, pixelY = controlsTop - 32 - pixelWidth / 3.2;
    if (i === 0) { pixelWidth = Math.min(innerWidth * .40, Math.max(130, controlsTop - heroBottom - 55) * 1.6); centerX = 0; pixelY = controlsTop - 22 - pixelWidth / 3.2; }
    station.position.x = centerX * innerWidth * span / innerHeight;
    station.position.y = .1 + (.5 - pixelY / innerHeight) * span;
    station.scale.setScalar(pixelWidth * span / innerHeight / 8);
   }
   station.rotation.y = dragRotation;
   cards[i].g.rotation.y = (mobile ? -.035 : -side * .07 + (i - progress) * .28) + Math.sin(time * .22 + i) * .028 + (i === activeStation ? Math.sin(swap * Math.PI) * .15 : 0);
   cards[i].g.position.y = Math.sin(time * .55 + i) * .055;
   cards[i].g.position.z = (i === activeStation ? -Math.sin(swap * Math.PI) * .65 : 0);
   cards[i].face.material.opacity = Math.max(.06, 1 - Math.abs(progress - i) * 1.8); cards[i].outgoing.material.opacity = i === activeStation ? swap : 0;
   if (mobile && copyRect && controlRect?.height && i !== 4) {
    const top = copyRect.bottom + 20, bottom = controlRect.top - 14;
    const width = Math.min(innerWidth - 48, Math.max(85, bottom - top) * 1.6);
    const pixelY = (top + bottom) / 2;
    const direction = new THREE.Vector3(0, 1 - pixelY / innerHeight * 2, .5).unproject(camera).sub(camera.position).normalize();
    const distance = (station.position.z - camera.position.z) / direction.z;
    const center = camera.position.clone().addScaledVector(direction, distance);
    station.position.x = center.x; station.position.y = center.y;
    const depth = center.clone().sub(camera.position).dot(camera.getWorldDirection(new THREE.Vector3()));
    station.scale.setScalar(width * 2 * depth * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / innerHeight / 8);
    cards[i].g.quaternion.copy(camera.quaternion); cards[i].g.position.y = 0;
   }
  });
  travelFrames.forEach((f, i) => { f.visible = travel > .12; f.rotation.y = Math.sin(time * .18 + i) * .045; f.material.opacity = .045 + travel * .38; });
  finale.visible = progress > 3.1; floor.material.color.set(progress > 2.8 ? 0x0a1719 : 0x061814);
  stars.rotation.z = Math.sin(time * .045) * .005;
  renderer.render(scene, camera);
  const screenBounds = cards.filter((card, i) => card.g.visible && stations[i].visible).map(card => {
   const { width, height } = card.face.geometry.parameters;
   const points = [[-1,-1],[-1,1],[1,-1],[1,1]].map(([x,y]) => new THREE.Vector3(x * width / 2, y * height / 2, 0).applyMatrix4(card.face.matrixWorld).project(camera));
   return { left: Math.min(...points.map(p => (p.x + 1) * innerWidth / 2)), right: Math.max(...points.map(p => (p.x + 1) * innerWidth / 2)), top: Math.min(...points.map(p => (1 - p.y) * innerHeight / 2)), bottom: Math.max(...points.map(p => (1 - p.y) * innerHeight / 2)) };
  });
  renderer.domElement.dataset.screenBounds = JSON.stringify(screenBounds);
  Object.assign(renderer.domElement.dataset, { camera: camera.position.toArray().map(n => n.toFixed(3)).join(','), time: time.toFixed(3), seats: String(seatCount), progress: progress.toFixed(3), view: activeView, screens: '15', layout: layouts[activeStation], side: mobile || activeStation === 0 || activeStation === 4 ? 'center' : sideOf(activeStation) > 0 ? 'right' : 'left' });
 }
 function dispose() { disposed = true; const geometries = new Set(), materials = new Set(), maps = new Set(Object.values(textures)); scene.traverse(object => { if (object.geometry) geometries.add(object.geometry); if (object.material) materials.add(object.material); }); geometries.forEach(g => g.dispose()); materials.forEach(m => { if (m.map) maps.add(m.map); m.dispose(); }); maps.forEach(t => t.dispose()); renderer.dispose(); }
 return { render, resize, setSeats, setActivity, setView, dispose };
}
