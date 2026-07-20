const MODE_SETTINGS = Object.freeze({
  low: { color: 0xff704f, frequency: 0.7, depth: 0.34 },
  mid: { color: 0x49d3a0, frequency: 1.05, depth: 0.24 },
  high: { color: 0x63bfff, frequency: 1.4, depth: 0.18 }
});

const initializedScenes = new WeakMap();
let threeModulePromise;

function loadThree() {
  if (!threeModulePromise) {
    threeModulePromise = import("./vendor/three.module.min.js");
  }
  return threeModulePromise;
}

function markFallback(container, error) {
  container.classList.remove("is-loading", "is-ready", "is-webgl-ready", "is-dragging");
  container.classList.add("is-fallback");
  container.dataset.renderer = "fallback";
  container.removeAttribute("tabindex");
  container.removeAttribute("aria-busy");
  container.setAttribute("role", "img");
  container.setAttribute("aria-label", "头戴式耳机静态示意图");

  const canvas = container.querySelector("canvas");
  if (canvas) {
    canvas.tabIndex = -1;
    canvas.setAttribute("aria-hidden", "true");
  }

  if (error) {
    console.warn("[headphone-scene] WebGL scene unavailable; using CSS fallback.", error);
  }
}

function buildHeadphones(THREE) {
  const headphones = new THREE.Group();
  headphones.name = "Over-ear headphones";

  const shellMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x1d2321,
    metalness: 0.06,
    roughness: 0.68,
    clearcoat: 0.08,
    clearcoatRoughness: 0.72
  });
  const faceMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x282e2c,
    metalness: 0.04,
    roughness: 0.64,
    clearcoat: 0.06,
    clearcoatRoughness: 0.78
  });
  const armMaterial = new THREE.MeshStandardMaterial({
    color: 0x434b48,
    metalness: 0.32,
    roughness: 0.5
  });
  const detailMaterial = new THREE.MeshStandardMaterial({
    color: 0x101513,
    metalness: 0.03,
    roughness: 0.8
  });
  const cushion = new THREE.MeshPhysicalMaterial({
    color: 0x090c0b,
    metalness: 0,
    roughness: 0.94,
    sheen: 0.16,
    sheenColor: 0x28312e,
    sheenRoughness: 0.88
  });
  const acousticCloth = new THREE.MeshStandardMaterial({
    color: 0x161c1a,
    metalness: 0,
    roughness: 0.96
  });
  const ringMaterial = new THREE.MeshStandardMaterial({
    color: MODE_SETTINGS.mid.color,
    emissive: MODE_SETTINGS.mid.color,
    emissiveIntensity: 0.75,
    metalness: 0,
    roughness: 0.52
  });
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: MODE_SETTINGS.mid.color,
    transparent: true,
    opacity: 0.055,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false
  });

  const makeTube = (points, radius, material, segments = 56) => {
    const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.45);
    const geometry = new THREE.TubeGeometry(curve, segments, radius, 10, false);
    return new THREE.Mesh(geometry, material);
  };

  const makeRoundedRectShape = (width, height, radius) => {
    const shape = new THREE.Shape();
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const corner = Math.min(radius, halfWidth, halfHeight);

    shape.moveTo(-halfWidth + corner, -halfHeight);
    shape.lineTo(halfWidth - corner, -halfHeight);
    shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + corner);
    shape.lineTo(halfWidth, halfHeight - corner);
    shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - corner, halfHeight);
    shape.lineTo(-halfWidth + corner, halfHeight);
    shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - corner);
    shape.lineTo(-halfWidth, -halfHeight + corner);
    shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + corner, -halfHeight);
    shape.closePath();

    return shape;
  };

  const makeRoundedExtrusion = ({ width, height, radius, depth, bevel }) => {
    const geometry = new THREE.ExtrudeGeometry(
      makeRoundedRectShape(width, height, radius),
      {
        depth,
        steps: 1,
        curveSegments: 28,
        bevelEnabled: true,
        bevelSegments: 5,
        bevelSize: bevel,
        bevelThickness: bevel
      }
    );
    geometry.center();
    geometry.computeVertexNormals();
    return geometry;
  };

  const headbandPoints = [
    new THREE.Vector3(-2.02, 1.08, -0.1),
    new THREE.Vector3(-1.94, 1.78, -0.12),
    new THREE.Vector3(-1.4, 2.5, -0.14),
    new THREE.Vector3(-0.7, 2.82, -0.15),
    new THREE.Vector3(0, 2.91, -0.15),
    new THREE.Vector3(0.7, 2.82, -0.15),
    new THREE.Vector3(1.4, 2.5, -0.14),
    new THREE.Vector3(1.94, 1.78, -0.12),
    new THREE.Vector3(2.02, 1.08, -0.1)
  ];
  const headband = makeTube(headbandPoints, 0.145, shellMaterial, 88);
  headband.name = "Headband shell";
  headphones.add(headband);

  const comfortBand = makeTube([
    new THREE.Vector3(-1.18, 2.56, 0.005),
    new THREE.Vector3(-0.62, 2.73, 0.025),
    new THREE.Vector3(0, 2.78, 0.03),
    new THREE.Vector3(0.62, 2.73, 0.025),
    new THREE.Vector3(1.18, 2.56, 0.005)
  ], 0.12, cushion, 56);
  comfortBand.name = "Headband cushion";
  headphones.add(comfortBand);

  const cupShellGeometry = makeRoundedExtrusion({
    width: 1.48,
    height: 1.98,
    radius: 0.58,
    depth: 0.3,
    bevel: 0.09
  });
  const facePlateGeometry = makeRoundedExtrusion({
    width: 1.36,
    height: 1.84,
    radius: 0.53,
    depth: 0.025,
    bevel: 0.035
  });
  const padGeometry = new THREE.TorusGeometry(0.58, 0.16, 18, 64);
  const driverGeometry = new THREE.CircleGeometry(0.48, 56);
  const pivotGeometry = new THREE.CylinderGeometry(0.105, 0.105, 0.07, 32);
  pivotGeometry.rotateX(Math.PI / 2);
  const indicatorHousingGeometry = new THREE.CircleGeometry(0.068, 24);
  const indicatorGeometry = new THREE.CircleGeometry(0.033, 24);
  const indicatorGlowGeometry = new THREE.CircleGeometry(0.115, 32);

  for (const side of [-1, 1]) {
    const cup = new THREE.Group();
    cup.name = side < 0 ? "Left earcup" : "Right earcup";
    cup.position.set(side * 1.56, -0.72, 0);
    cup.rotation.y = side * 0.055;
    cup.rotation.z = side * -0.012;

    const shell = new THREE.Mesh(cupShellGeometry, shellMaterial);
    shell.name = "Earcup shell";
    cup.add(shell);

    const facePlate = new THREE.Mesh(facePlateGeometry, faceMaterial);
    facePlate.position.z = 0.235;
    facePlate.name = "Continuous outer earcup face";
    cup.add(facePlate);

    const driver = new THREE.Mesh(driverGeometry, acousticCloth);
    driver.position.z = -0.405;
    driver.scale.y = 1.26;
    driver.rotation.y = Math.PI;
    driver.name = "Acoustic grille";
    cup.add(driver);

    const pad = new THREE.Mesh(padGeometry, cushion);
    pad.position.z = -0.32;
    pad.scale.set(1, 1.25, 0.66);
    pad.name = "Earpad";
    cup.add(pad);

    const pivotCap = new THREE.Mesh(pivotGeometry, faceMaterial);
    pivotCap.position.set(side * 0.48, 0.7, 0.245);
    pivotCap.name = "Flush swivel cap";
    cup.add(pivotCap);

    if (side > 0) {
      const indicatorHousing = new THREE.Mesh(indicatorHousingGeometry, detailMaterial);
      indicatorHousing.position.set(0.44, -0.7, 0.292);
      indicatorHousing.name = "Sound mode indicator housing";
      cup.add(indicatorHousing);

      const indicator = new THREE.Mesh(indicatorGeometry, ringMaterial);
      indicator.position.set(0.44, -0.7, 0.297);
      indicator.name = "Sound mode indicator";
      cup.add(indicator);

      const indicatorGlow = new THREE.Mesh(indicatorGlowGeometry, glowMaterial);
      indicatorGlow.position.set(0.44, -0.7, 0.294);
      indicatorGlow.renderOrder = 2;
      indicatorGlow.name = "Sound mode indicator glow";
      cup.add(indicatorGlow);
    }

    headphones.add(cup);

    const supportArm = makeTube([
      new THREE.Vector3(side * 2.02, 0.96, -0.06),
      new THREE.Vector3(side * 2.025, 0.62, -0.035),
      new THREE.Vector3(side * 2.02, 0.28, 0),
      new THREE.Vector3(side * 2.04, -0.02, 0.06)
    ], 0.064, armMaterial, 44);
    supportArm.name = "Single earcup support arm";
    headphones.add(supportArm);

    const slider = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.105, 0.34, 8, 20),
      shellMaterial
    );
    slider.position.set(side * 2.02, 1.02, -0.075);
    slider.scale.z = 0.72;
    slider.name = "Seamless headband slider";
    headphones.add(slider);

    const sliderInset = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.034, 0.24, 6, 14),
      armMaterial
    );
    sliderInset.position.set(side * 2.02, 1.015, 0.005);
    headphones.add(sliderInset);
  }

  headphones.position.y = -0.5;

  return {
    object: headphones,
    ringMaterial,
    glowMaterial
  };
}

async function createScene(container) {
  container.classList.remove("is-fallback");
  container.classList.add("is-loading");
  container.dataset.renderer = "loading";
  container.setAttribute("aria-busy", "true");

  let THREE;
  try {
    THREE = await loadThree();
  } catch (error) {
    markFallback(container, error);
    return null;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
      premultipliedAlpha: true
    });
  } catch (error) {
    markFallback(container, error);
    return null;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  const layoutRoot = new THREE.Group();
  const revealRoot = new THREE.Group();
  const interactionRoot = new THREE.Group();
  const model = buildHeadphones(THREE);
  const modelBounds = new THREE.Box3().setFromObject(model.object);
  const modelHalfWidth = (modelBounds.max.x - modelBounds.min.x) / 2;
  interactionRoot.add(model.object);
  revealRoot.add(interactionRoot);
  layoutRoot.add(revealRoot);
  scene.add(layoutRoot);

  const hemisphere = new THREE.HemisphereLight(0xe8fff6, 0x17211e, 2.4);
  const keyLight = new THREE.DirectionalLight(0xffffff, 3.3);
  const fillLight = new THREE.DirectionalLight(0x87cdb7, 1.85);
  const edgeLight = new THREE.DirectionalLight(0x7fb7db, 2.1);
  keyLight.position.set(-3.8, 5.2, 7.5);
  fillLight.position.set(5.4, 1.4, 4.2);
  edgeLight.position.set(1.5, 3.2, -5.5);
  scene.add(hemisphere, keyLight, fillLight, edgeLight);

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const canvas = renderer.domElement;
  canvas.className = "headphone-scene__canvas";
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "可拖动旋转的头戴式耳机三维模型");
  canvas.setAttribute("aria-keyshortcuts", "ArrowLeft ArrowRight");
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.touchAction = "pan-y";
  container.prepend(canvas);
  const fallbackArtwork = container.querySelector(".guide-headphone-fallback");
  if (fallbackArtwork) fallbackArtwork.style.pointerEvents = "none";
  container.removeAttribute("tabindex");

  container.classList.remove("is-loading");
  container.classList.add("is-ready", "is-webgl-ready");
  container.dataset.renderer = "webgl";
  container.removeAttribute("aria-busy");

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = reducedMotionQuery.matches;
  let documentVisible = !document.hidden;
  let inViewport = true;
  let frameRequest = 0;
  let lastFrameTime = performance.now();
  let elapsed = 0;
  let modeChangedAt = lastFrameTime - 2000;
  let dragging = false;
  let activePointer = null;
  let previousPointerX = 0;
  let previousPointerY = 0;
  let previousPointerTime = 0;
  let targetYaw = 0;
  let currentYaw = 0;
  let targetPitch = 0;
  let currentPitch = 0;
  let yawVelocity = 0;
  let targetParallaxX = 0;
  let targetParallaxY = 0;
  let parallaxX = 0;
  let parallaxY = 0;
  let layoutX = 0.38;
  let layoutY = 0.04;
  let visibleHeight = 6;
  let introScaleBase = 1;
  let introState = container.dataset.presentation === "intro" ? "waiting" : "normal";
  let introStartedAt = 0;
  let introResolve = null;
  let introPromise = null;
  let webglUnavailable = false;
  let currentMode = "mid";
  const currentRingColor = new THREE.Color(MODE_SETTINGS.mid.color);
  const targetRingColor = currentRingColor.clone();

  const initialStateHost = container.closest("[data-scene]");
  const stateHosts = new Set([container]);
  if (initialStateHost) stateHosts.add(initialStateHost);

  const preferredControlRoot = initialStateHost && initialStateHost !== container
    ? initialStateHost
    : container.parentElement;
  let modeButtons = preferredControlRoot
    ? [...preferredControlRoot.querySelectorAll("[data-sound-mode]")]
    : [];
  if (!modeButtons.length) {
    modeButtons = [...document.querySelectorAll("[data-sound-mode]")];
  }
  modeButtons = modeButtons.filter(button => MODE_SETTINGS[button.dataset.soundMode]);

  const configuredMode = [
    container.dataset.scene,
    initialStateHost && initialStateHost.dataset.scene,
    modeButtons.find(button => button.getAttribute("aria-pressed") === "true")?.dataset.soundMode,
    modeButtons.find(button => button.classList.contains("is-active"))?.dataset.soundMode
  ].find(mode => MODE_SETTINGS[mode]);

  const completeIntroMotion = () => {
    introState = "settled";
    container.dataset.introState = "settled";
    if (introResolve) {
      introResolve();
      introResolve = null;
      introPromise = null;
    }
  };

  const canAnimate = () => (
    !webglUnavailable
    && documentVisible
    && inViewport
    && (introState === "playing" || (introState === "normal" && !reducedMotion))
  );

  const renderFrame = now => {
    frameRequest = 0;
    if (webglUnavailable) return;
    const delta = Math.min(Math.max((now - lastFrameTime) / 1000, 0), 0.05);
    lastFrameTime = now;
    elapsed += delta;

    if (!dragging && !reducedMotion && Math.abs(yawVelocity) > 0.0001) {
      targetYaw += yawVelocity * delta;
      yawVelocity *= Math.exp(-5.5 * delta);
    }

    const rotationEase = reducedMotion ? 1 : 1 - Math.exp(-11 * delta);
    const parallaxEase = reducedMotion ? 1 : 1 - Math.exp(-8 * delta);
    currentYaw += (targetYaw - currentYaw) * rotationEase;
    currentPitch += (targetPitch - currentPitch) * rotationEase;
    parallaxX += (targetParallaxX - parallaxX) * parallaxEase;
    parallaxY += (targetParallaxY - parallaxY) * parallaxEase;

    const introActive = introState !== "normal";
    const idleYaw = reducedMotion || introActive ? 0 : Math.sin(elapsed * 0.42) * 0.035;
    const idlePitch = reducedMotion || introActive ? 0 : Math.sin(elapsed * 0.31 + 0.8) * 0.012;
    const floatY = reducedMotion || introActive ? 0 : Math.sin(elapsed * 0.62) * 0.025;
    interactionRoot.rotation.x = 0.025 + currentPitch + parallaxY * 0.045 + idlePitch;
    interactionRoot.rotation.y = -0.14 + currentYaw + parallaxX * 0.065 + idleYaw;
    interactionRoot.rotation.z = parallaxX * -0.012;
    layoutRoot.position.set(layoutX, layoutY + floatY, 0);

    if (introState === "waiting") {
      revealRoot.visible = false;
      revealRoot.position.set(0, 0, 0);
      revealRoot.rotation.set(0, 0, 0);
      revealRoot.scale.setScalar(introScaleBase);
    } else if (introState === "playing") {
      const age = Math.max(0, (now - introStartedAt) / 1000);
      revealRoot.visible = age >= 0.18;

      if (age < 1.18) {
        const fall = THREE.MathUtils.clamp((age - 0.18) / 1, 0, 1);
        const gravity = Math.pow(fall, 2.35);
        revealRoot.position.y = THREE.MathUtils.lerp(
          visibleHeight * 0.92,
          visibleHeight * -0.2,
          gravity
        );
        revealRoot.rotation.x = THREE.MathUtils.lerp(-0.08, 0.045, fall);
        revealRoot.rotation.z = THREE.MathUtils.lerp(-0.15, 0.075, fall);
        revealRoot.scale.setScalar(introScaleBase * THREE.MathUtils.lerp(0.86, 0.98, fall));
      } else {
        const rise = THREE.MathUtils.clamp((age - 1.18) / 1.48, 0, 1);
        const damping = Math.exp(-4.65 * rise);
        const spring = 1 - damping * Math.cos(9.4 * rise);
        revealRoot.position.y = THREE.MathUtils.lerp(
          visibleHeight * -0.2,
          visibleHeight * 0.045,
          spring
        );
        revealRoot.rotation.x = 0.045 * damping * Math.cos(8.2 * rise);
        revealRoot.rotation.z = 0.075 * damping * Math.cos(9.4 * rise);
        revealRoot.scale.setScalar(introScaleBase * (0.98 + Math.min(spring, 1.12) * 0.02));
      }

      if (age >= 2.85) completeIntroMotion();
    } else if (introState === "settled") {
      revealRoot.visible = true;
      revealRoot.position.set(0, visibleHeight * 0.045, 0);
      revealRoot.rotation.set(0, 0, 0);
      revealRoot.scale.setScalar(introScaleBase);
    } else {
      revealRoot.visible = true;
      revealRoot.position.set(0, 0, 0);
      revealRoot.rotation.set(0, 0, 0);
      revealRoot.scale.setScalar(1);
    }

    const settings = MODE_SETTINGS[currentMode];
    const colorEase = reducedMotion ? 1 : 1 - Math.exp(-9 * delta);
    currentRingColor.lerp(targetRingColor, colorEase);
    model.ringMaterial.color.copy(currentRingColor).multiplyScalar(0.88);
    model.ringMaterial.emissive.copy(currentRingColor);
    model.glowMaterial.color.copy(currentRingColor);

    const wave = reducedMotion
      ? 0.5
      : (Math.sin(elapsed * settings.frequency * Math.PI * 2) + 1) / 2;
    const changeAge = Math.max(0, (now - modeChangedAt) / 1000);
    const changePulse = reducedMotion || changeAge >= 0.85
      ? 0
      : Math.sin((changeAge / 0.85) * Math.PI) * (1 - changeAge / 0.85);
    model.ringMaterial.emissiveIntensity = 0.36 + settings.depth * 0.22 * wave + changePulse * 0.5;
    model.glowMaterial.opacity = 0.015 + settings.depth * 0.05 * wave + changePulse * 0.045;

    renderer.render(scene, camera);

    if (canAnimate()) {
      frameRequest = requestAnimationFrame(renderFrame);
    }
  };

  const requestRender = () => {
    if (webglUnavailable || !documentVisible || !inViewport || frameRequest) return;
    frameRequest = requestAnimationFrame(renderFrame);
  };

  const stopRendering = () => {
    if (!frameRequest) return;
    cancelAnimationFrame(frameRequest);
    frameRequest = 0;
  };

  const prepareIntro = () => {
    if (introResolve) introResolve();
    introResolve = null;
    introPromise = null;
    introState = "waiting";
    container.dataset.introState = "waiting";
    targetYaw = 0;
    currentYaw = 0;
    targetPitch = 0;
    currentPitch = 0;
    yawVelocity = 0;
    canvas.tabIndex = -1;
    canvas.setAttribute("aria-hidden", "true");
    requestRender();
  };

  const playIntro = () => {
    if (introState === "playing" && introPromise) return introPromise;
    if (reducedMotion) {
      completeIntroMotion();
      requestRender();
      return Promise.resolve();
    }

    introState = "playing";
    introStartedAt = performance.now();
    container.dataset.introState = "playing";
    lastFrameTime = introStartedAt;
    introPromise = new Promise(resolve => {
      introResolve = resolve;
    });
    requestRender();
    return introPromise;
  };

  const finishIntro = () => {
    if (introResolve) introResolve();
    introResolve = null;
    introPromise = null;
    introState = "normal";
    container.dataset.introState = "interactive";
    revealRoot.visible = true;
    revealRoot.position.set(0, 0, 0);
    revealRoot.rotation.set(0, 0, 0);
    revealRoot.scale.setScalar(1);
    if (container.classList.contains("is-fallback")) {
      canvas.tabIndex = -1;
      canvas.setAttribute("aria-hidden", "true");
    } else {
      canvas.tabIndex = 0;
      canvas.removeAttribute("aria-hidden");
    }
    requestAnimationFrame(() => {
      resize();
      requestRender();
    });
  };

  const setMode = (mode, announceChange = false) => {
    if (!MODE_SETTINGS[mode]) return;
    currentMode = mode;
    targetRingColor.setHex(MODE_SETTINGS[mode].color);
    if (announceChange) modeChangedAt = performance.now();

    stateHosts.forEach(host => {
      host.dataset.scene = mode;
    });
    modeButtons.forEach(button => {
      const active = button.dataset.soundMode === mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    requestRender();
  };

  modeButtons.forEach(button => {
    button.addEventListener("click", () => setMode(button.dataset.soundMode, true));
  });
  setMode(configuredMode || "mid");

  const resize = () => {
    if (webglUnavailable) return;
    const rect = container.getBoundingClientRect();
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
    if (width < 2 || height < 2) return;

    const mobile = width <= 640;
    const compact = width <= 980;
    const shortMobile = mobile && height < 540;
    const introPresentation = container.dataset.presentation === "intro";
    const pixelRatioLimit = mobile ? 1.45 : 1.75;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioLimit));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;

    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const frameHeight = introPresentation
      ? (mobile ? 8.8 : compact ? 7.5 : 7)
      : mobile ? (shortMobile ? 14.4 : 11.3) : compact ? 10.2 : 5.62;
    const frameWidth = introPresentation
      ? (mobile ? 4.8 : compact ? 6.2 : 6.5)
      : mobile ? 5.2 : compact ? 9.2 : 6.3;
    const distanceForHeight = frameHeight / (2 * Math.tan(verticalFov / 2));
    const distanceForWidth = frameWidth / (2 * Math.tan(verticalFov / 2) * camera.aspect);
    const cameraDistance = Math.max(distanceForHeight, distanceForWidth);
    camera.position.set(0, 0, cameraDistance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    visibleHeight = 2 * cameraDistance * Math.tan(verticalFov / 2);
    const visibleWidth = visibleHeight * camera.aspect;
    if (introPresentation) {
      layoutX = 0;
      layoutY = 0;
      introScaleBase = mobile ? 1 : compact ? 1.05 : 1.15;
    } else if (mobile) {
      layoutX = 0;
      layoutY = visibleHeight * (shortMobile ? -0.3 : -0.27);
      introScaleBase = 1;
    } else {
      const preferredRightPosition = visibleWidth * (compact ? 0.3 : 0.23);
      const completeModelLimit = visibleWidth / 2 - modelHalfWidth - 0.16;
      layoutX = Math.max(0, Math.min(preferredRightPosition, completeModelLimit));
      layoutY = compact ? -0.08 : 0.04;
      introScaleBase = 1;
    }
    requestRender();
  };

  const resizeObserver = typeof ResizeObserver === "function"
    ? new ResizeObserver(resize)
    : null;
  if (resizeObserver) resizeObserver.observe(container);
  window.addEventListener("resize", resize, { passive: true });

  const resetParallax = () => {
    targetParallaxX = 0;
    targetParallaxY = 0;
    requestRender();
  };

  canvas.addEventListener("pointerdown", event => {
    if (introState !== "normal") return;
    if (activePointer !== null) return;
    activePointer = event.pointerId;
    dragging = true;
    previousPointerX = event.clientX;
    previousPointerY = event.clientY;
    previousPointerTime = event.timeStamp;
    yawVelocity = 0;
    canvas.setPointerCapture(event.pointerId);
    container.classList.add("is-dragging");
    canvas.focus({ preventScroll: true });
    event.preventDefault();
  });

  canvas.addEventListener("pointermove", event => {
    if (introState !== "normal") return;
    if (dragging && event.pointerId === activePointer) {
      const deltaX = event.clientX - previousPointerX;
      const deltaY = event.clientY - previousPointerY;
      const elapsedPointer = Math.max(event.timeStamp - previousPointerTime, 8);
      targetYaw += deltaX * 0.008;
      targetPitch = THREE.MathUtils.clamp(targetPitch + deltaY * 0.006, -0.42, 0.38);
      yawVelocity = reducedMotion ? 0 : (deltaX * 0.008 / elapsedPointer) * 1000;
      previousPointerX = event.clientX;
      previousPointerY = event.clientY;
      previousPointerTime = event.timeStamp;
      if (reducedMotion) {
        currentYaw = targetYaw;
        currentPitch = targetPitch;
      }
      requestRender();
      event.preventDefault();
      return;
    }

    if (event.pointerType === "touch" || reducedMotion) return;
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    targetParallaxX = THREE.MathUtils.clamp(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -1,
      1
    );
    targetParallaxY = THREE.MathUtils.clamp(
      ((event.clientY - bounds.top) / bounds.height) * 2 - 1,
      -1,
      1
    );
    requestRender();
  });

  const finishPointer = event => {
    if (event.pointerId !== activePointer) return;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    dragging = false;
    activePointer = null;
    if (reducedMotion) yawVelocity = 0;
    container.classList.remove("is-dragging");
    resetParallax();
  };
  canvas.addEventListener("pointerup", finishPointer);
  canvas.addEventListener("pointercancel", finishPointer);
  canvas.addEventListener("pointerleave", event => {
    if (!dragging || event.pointerId !== activePointer) resetParallax();
  });

  canvas.addEventListener("keydown", event => {
    if (introState !== "normal") return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    targetYaw += event.key === "ArrowLeft" ? -0.2 : 0.2;
    yawVelocity = 0;
    if (reducedMotion) currentYaw = targetYaw;
    requestRender();
  });

  const handleVisibilityChange = () => {
    documentVisible = !document.hidden;
    if (documentVisible) {
      lastFrameTime = performance.now();
      requestRender();
    } else {
      stopRendering();
    }
  };
  document.addEventListener("visibilitychange", handleVisibilityChange);

  const intersectionObserver = typeof IntersectionObserver === "function"
    ? new IntersectionObserver(entries => {
      inViewport = entries.some(entry => entry.isIntersecting);
      if (inViewport) {
        lastFrameTime = performance.now();
        requestRender();
      } else {
        stopRendering();
      }
    }, { rootMargin: "120px 0px" })
    : null;
  if (intersectionObserver) intersectionObserver.observe(container);

  const handleMotionPreference = event => {
    reducedMotion = event.matches;
    yawVelocity = 0;
    targetParallaxX = 0;
    targetParallaxY = 0;
    if (reducedMotion) {
      stopRendering();
      if (introState === "playing") completeIntroMotion();
    }
    lastFrameTime = performance.now();
    requestRender();
  };
  if (typeof reducedMotionQuery.addEventListener === "function") {
    reducedMotionQuery.addEventListener("change", handleMotionPreference);
  } else {
    reducedMotionQuery.addListener(handleMotionPreference);
  }

  canvas.addEventListener("webglcontextlost", event => {
    event.preventDefault();
    webglUnavailable = true;
    stopRendering();
    canvas.hidden = true;
    markFallback(container, new Error("WebGL context lost"));
  });

  if (introState === "waiting") {
    container.dataset.introState = "waiting";
    canvas.tabIndex = -1;
    canvas.setAttribute("aria-hidden", "true");
  } else {
    container.dataset.introState = "interactive";
  }

  resize();
  requestRender();

  return {
    container,
    canvas,
    renderer,
    scene,
    camera,
    setMode,
    prepareIntro,
    playIntro,
    finishIntro
  };
}

export function initHeadphoneScene(container) {
  if (!container || typeof container !== "object") return Promise.resolve(null);
  if (!initializedScenes.has(container)) {
    initializedScenes.set(container, createScene(container));
  }
  return initializedScenes.get(container);
}

export function initHeadphoneScenes(root = document) {
  const containers = [...root.querySelectorAll("[data-headphone-scene]")];
  return Promise.all(containers.map(initHeadphoneScene));
}

function boot() {
  initHeadphoneScenes().catch(error => {
    document.querySelectorAll("[data-headphone-scene]").forEach(container => {
      markFallback(container, error);
    });
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
}
