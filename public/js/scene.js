(function () {
  'use strict';
  var canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  var COUNT = 300;
  var RADIUS = 30;
  var SPREAD = 12;
  var BLUE = new THREE.Color(0x3b82f6);
  var RED = new THREE.Color(0xef4444);
  var PURPLE = new THREE.Color(0xa855f7);

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.z = 50;

  var positions = new Float32Array(COUNT * 3);
  var colors = new Float32Array(COUNT * 3);
  var seeds = new Float32Array(COUNT);

  for (var i = 0; i < COUNT; i++) {
    var i3 = i * 3;
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.acos(2 * Math.random() - 1);
    var r = RADIUS + (Math.random() - 0.5) * SPREAD;
    positions[i3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = r * Math.cos(phi);

    var norm = (positions[i3] + RADIUS + SPREAD * 0.5) / (2 * (RADIUS + SPREAD * 0.5));
    var c = norm < 0.33 ? BLUE.clone().lerp(PURPLE, norm / 0.33)
          : norm > 0.67 ? PURPLE.clone().lerp(RED, (norm - 0.67) / 0.33)
          : PURPLE;
    colors[i3] = c.r; colors[i3 + 1] = c.g; colors[i3 + 2] = c.b;
    seeds[i] = Math.random() * Math.PI * 2;
  }

  var base = new Float32Array(positions);
  var geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  var mat = new THREE.PointsMaterial({
    size: 0.8, vertexColors: true, transparent: true, opacity: 0.4,
    blending: THREE.AdditiveBlending, sizeAttenuation: true, depthWrite: false
  });
  var pts = new THREE.Points(geo, mat);
  scene.add(pts);

  // Sparse connections
  var lv = [], lc = [];
  for (var a = 0; a < COUNT; a++) {
    var a3 = a * 3;
    for (var b = a + 1; b < COUNT; b++) {
      var b3 = b * 3;
      var dx = base[a3] - base[b3], dy = base[a3+1] - base[b3+1], dz = base[a3+2] - base[b3+2];
      var d = Math.sqrt(dx*dx + dy*dy + dz*dz);
      if (d < 4) {
        var al = 1 - d / 4;
        lv.push(base[a3], base[a3+1], base[a3+2], base[b3], base[b3+1], base[b3+2]);
        lc.push(colors[a3]*al, colors[a3+1]*al, colors[a3+2]*al, colors[b3]*al, colors[b3+1]*al, colors[b3+2]*al);
      }
    }
  }

  var lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.Float32BufferAttribute(lv, 3));
  lg.setAttribute('color', new THREE.Float32BufferAttribute(lc, 3));
  var lm = new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.12,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  var lines = new THREE.LineSegments(lg, lm);
  scene.add(lines);

  var mx = 0, my = 0, cmx = 0, cmy = 0;
  document.addEventListener('mousemove', function(e) {
    mx = (e.clientX / window.innerWidth) * 2 - 1;
    my = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  var clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    var t = clock.getElapsedTime();
    cmx += (mx - cmx) * 0.02; cmy += (my - cmy) * 0.02;
    pts.rotation.y = t * 0.03; lines.rotation.y = t * 0.03;

    var p = geo.attributes.position.array;
    for (var i = 0; i < COUNT; i++) {
      var i3 = i * 3, s = seeds[i];
      p[i3] = base[i3] + Math.sin(t * 0.3 + s) * 0.25;
      p[i3+1] = base[i3+1] + Math.cos(t * 0.25 + s * 1.3) * 0.25;
      p[i3+2] = base[i3+2] + Math.sin(t * 0.28 + s * 0.7) * 0.15;
    }
    geo.attributes.position.needsUpdate = true;

    camera.position.x += (cmx * 2 - camera.position.x) * 0.015;
    camera.position.y += (cmy * 1.5 - camera.position.y) * 0.015;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
