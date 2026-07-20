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

  const graphite = new THREE.MeshPhysicalMaterial({
    color: 0x17201e,
    metalness: 0.68,
    roughness: 0.3,
    clearcoat: 0.42,
    clearcoatRoughness: 0.28
  });
  const graphiteEdge = new THREE.MeshStandardMaterial({
    color: 0x34413d,
    metalness: 0.88,
    roughness: 0.23
  });
  const brushedMetal = new THREE.MeshStandardMaterial({
    color: 0x82918b,
    metalness: 0.94,
    roughness: 0.2
  });
  const cushion = new THREE.MeshStandardMaterial({
    color: 0x090d0c,
    metalness: 0.02,
    roughness: 0.94
  });
  const acousticCloth = new THREE.MeshStandardMaterial({
    color: 0x202b28,
    metalness: 0.18,
    roughness: 0.86
  });
  const ringMaterial = new THREE.MeshStandardMaterial({
    color: MODE_SETTINGS.mid.color,
    emissive: MODE_SETTINGS.mid.color,
    emissiveIntensity: 1.35,
    metalness: 0.28,
    roughness: 0.3
  });
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: MODE_SETTINGS.mid.color,
    transparent: true,
    opacity: 0.09,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false
  });

  const makeTube = (points, radius, material, segments = 56) => {
    const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.45);
    const geometry = new THREE.TubeGeometry(curve, segments, radius, 10, false);
    return new THREE.Mesh(geometry, material);
  };

  const makeDepthCylinder = (radiusFront, radiusBack, depth, segments = 48) => {
    const geometry = new THREE.CylinderGeometry(
      radiusFront,
      radiusBack,
      depth,
      segments,
      1,
      false
    );
    geometry.rotateX(Math.PI / 2);
    return geometry;
  };

  const headbandPoints = [
    new THREE.Vector3(-2.37, 1.24, -0.14),
    new THREE.Vector3(-2.2, 1.95, -0.15),
    new THREE.Vector3(-1.4, 2.64, -0.16),
    new THREE.Vector3(0, 2.91, -0.16),
    new THREE.Vector3(1.4, 2.64, -0.16),
    new THREE.Vector3(2.2, 1.95, -0.15),
    new THREE.Vector3(2.37, 1.24, -0.14)
  ];
  const headband = makeTube(headbandPoints, 0.22, graphite, 84);
  headband.name = "Headband shell";
  headphones.add(headband);

  const headbandHighlight = makeTube(
    headbandPoints.map(point => new THREE.Vector3(point.x, point.y, point.z + 0.2)),
    0.026,
    brushedMetal,
    84
  );
  headbandHighlight.name = "Headband metal trim";
  headphones.add(headbandHighlight);

  const comfortBand = makeTube([
    new THREE.Vector3(-1.63, 2.42, 0.02),
    new THREE.Vector3(-0.88, 2.61, 0.06),
    new THREE.Vector3(0, 2.67, 0.07),
    new THREE.Vector3(0.88, 2.61, 0.06),
    new THREE.Vector3(1.63, 2.42, 0.02)
  ], 0.14, cushion, 52);
  comfortBand.name = "Headband cushion";
  headphones.add(comfortBand);

  const cupShellGeometry = makeDepthCylinder(0.94, 1.01, 0.58, 64);
  const frontBezelGeometry = makeDepthCylinder(0.83, 0.88, 0.15, 64);
  const rearPlateGeometry = makeDepthCylinder(0.68, 0.7, 0.075, 48);
  const padGeometry = new THREE.TorusGeometry(0.7, 0.19, 16, 64);
  const trimGeometry = new THREE.TorusGeometry(0.91, 0.03, 8, 64);
  const glowGeometry = new THREE.TorusGeometry(0.91, 0.07, 8, 64);
  const driverGeometry = new THREE.CircleGeometry(0.55, 64);
  const driverTrimGeometry = new THREE.TorusGeometry(0.51, 0.018, 8, 48);
  const rearTrimGeometry = new THREE.TorusGeometry(0.6, 0.027, 8, 48);
  const pivotGeometry = makeDepthCylinder(0.16, 0.16, 0.105, 32);

  for (const side of [-1, 1]) {
    const cup = new THREE.Group();
    cup.name = side < 0 ? "Left earcup" : "Right earcup";
    cup.position.set(side * 1.66, -0.78, 0);
    cup.rotation.y = side * 0.075;

    const shell = new THREE.Mesh(cupShellGeometry, graphite);
    shell.scale.set(1, 1.16, 1);
    shell.name = "Earcup shell";
    cup.add(shell);

    const bezel = new THREE.Mesh(frontBezelGeometry, graphiteEdge);
    bezel.position.z = 0.34;
    bezel.scale.set(1, 1.16, 1);
    bezel.name = "Front bezel";
    cup.add(bezel);

    const driver = new THREE.Mesh(driverGeometry, acousticCloth);
    driver.position.z = 0.515;
    driver.scale.y = 1.16;
    driver.name = "Acoustic grille";
    cup.add(driver);

    const driverTrim = new THREE.Mesh(driverTrimGeometry, graphiteEdge);
    driverTrim.position.z = 0.527;
    driverTrim.scale.y = 1.16;
    cup.add(driverTrim);

    const pad = new THREE.Mesh(padGeometry, cushion);
    pad.position.z = 0.49;
    pad.scale.y = 1.16;
    pad.name = "Earpad";
    cup.add(pad);

    const lightRing = new THREE.Mesh(trimGeometry, ringMaterial);
    lightRing.position.z = 0.565;
    lightRing.scale.y = 1.16;
    lightRing.name = "Sound mode ring";
    cup.add(lightRing);

    const ringGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    ringGlow.position.z = 0.555;
    ringGlow.scale.y = 1.16;
    ringGlow.renderOrder = 2;
    cup.add(ringGlow);

    const rearPlate = new THREE.Mesh(rearPlateGeometry, graphiteEdge);
    rearPlate.position.z = -0.32;
    rearPlate.scale.set(1, 1.16, 1);
    rearPlate.name = "Rear earcup plate";
    cup.add(rearPlate);

    const rearTrim = new THREE.Mesh(rearTrimGeometry, brushedMetal);
    rearTrim.position.z = -0.365;
    rearTrim.scale.y = 1.16;
    rearTrim.name = "Rear trim";
    cup.add(rearTrim);

    const hingeFront = new THREE.Mesh(pivotGeometry, brushedMetal);
    hingeFront.position.set(side * 0.985, 0.36, 0.26);
    hingeFront.name = "Front hinge";
    cup.add(hingeFront);

    const hingeRear = hingeFront.clone();
    hingeRear.position.z = -0.26;
    hingeRear.name = "Rear hinge";
    cup.add(hingeRear);

    headphones.add(cup);

    for (const z of [-0.25, 0.25]) {
      const yoke = makeTube([
        new THREE.Vector3(side * 2.64, -0.43, z),
        new THREE.Vector3(side * 2.72, 0.16, z),
        new THREE.Vector3(side * 2.5, 0.71, z),
        new THREE.Vector3(side * 2.36, 1.08, z)
      ], 0.064, brushedMetal, 40);
      yoke.name = "Earcup connector arm";
      headphones.add(yoke);
    }

    const slider = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.64, 0.16),
      graphiteEdge
    );
    slider.position.set(side * 2.36, 1.23, -0.04);
    slider.rotation.z = side * -0.055;
    slider.name = "Headband slider";
    headphones.add(slider);

    const sliderInset = new THREE.Mesh(
      new THREE.BoxGeometry(0.075, 0.48, 0.18),
      brushedMetal
    );
    sliderInset.position.set(side * 2.36, 1.26, -0.035);
    sliderInset.rotation.z = side * -0.055;
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
  const pivot = new THREE.Group();
  const model = buildHeadphones(THREE);
  pivot.add(model.object);
  scene.add(pivot);

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

  const canAnimate = () => documentVisible && inViewport && !reducedMotion;

  const renderFrame = now => {
    frameRequest = 0;
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

    const idleYaw = reducedMotion ? 0 : Math.sin(elapsed * 0.42) * 0.035;
    const idlePitch = reducedMotion ? 0 : Math.sin(elapsed * 0.31 + 0.8) * 0.012;
    const floatY = reducedMotion ? 0 : Math.sin(elapsed * 0.62) * 0.025;
    pivot.rotation.x = 0.025 + currentPitch + parallaxY * 0.045 + idlePitch;
    pivot.rotation.y = -0.17 + currentYaw + parallaxX * 0.065 + idleYaw;
    pivot.rotation.z = parallaxX * -0.012;
    pivot.position.set(layoutX, layoutY + floatY, 0);

    const settings = MODE_SETTINGS[currentMode];
    const colorEase = reducedMotion ? 1 : 1 - Math.exp(-9 * delta);
    currentRingColor.lerp(targetRingColor, colorEase);
    model.ringMaterial.color.copy(currentRingColor).multiplyScalar(0.78);
    model.ringMaterial.emissive.copy(currentRingColor);
    model.glowMaterial.color.copy(currentRingColor);

    const wave = reducedMotion
      ? 0.5
      : (Math.sin(elapsed * settings.frequency * Math.PI * 2) + 1) / 2;
    const changeAge = Math.max(0, (now - modeChangedAt) / 1000);
    const changePulse = reducedMotion || changeAge >= 0.85
      ? 0
      : Math.sin((changeAge / 0.85) * Math.PI) * (1 - changeAge / 0.85);
    model.ringMaterial.emissiveIntensity = 1.25 + settings.depth * wave + changePulse * 1.05;
    model.glowMaterial.opacity = 0.055 + settings.depth * 0.12 * wave + changePulse * 0.11;

    renderer.render(scene, camera);

    if (canAnimate()) {
      frameRequest = requestAnimationFrame(renderFrame);
    }
  };

  const requestRender = () => {
    if (!documentVisible || !inViewport || frameRequest) return;
    frameRequest = requestAnimationFrame(renderFrame);
  };

  const stopRendering = () => {
    if (!frameRequest) return;
    cancelAnimationFrame(frameRequest);
    frameRequest = 0;
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
    const rect = container.getBoundingClientRect();
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
    if (width < 2 || height < 2) return;

    const mobile = width < 640;
    const compact = width < 980;
    const shortMobile = mobile && height < 540;
    const pixelRatioLimit = mobile ? 1.45 : 1.75;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioLimit));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;

    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const frameHeight = mobile ? (shortMobile ? 15 : 12) : compact ? 6.8 : 5.62;
    const frameWidth = mobile ? 6.3 : compact ? 7.7 : 6.65;
    const distanceForHeight = frameHeight / (2 * Math.tan(verticalFov / 2));
    const distanceForWidth = frameWidth / (2 * Math.tan(verticalFov / 2) * camera.aspect);
    const cameraDistance = Math.max(distanceForHeight, distanceForWidth);
    camera.position.set(0, 0, cameraDistance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    const visibleHeight = 2 * cameraDistance * Math.tan(verticalFov / 2);
    const visibleWidth = visibleHeight * camera.aspect;
    if (mobile) {
      layoutX = 0;
      layoutY = visibleHeight * (shortMobile ? -0.31 : -0.258);
    } else {
      const preferredRightPosition = visibleWidth * (compact ? 0.2 : 0.23);
      const completeModelLimit = visibleWidth / 2 - 3;
      layoutX = Math.max(0, Math.min(preferredRightPosition, completeModelLimit));
      layoutY = compact ? -0.08 : 0.04;
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
    if (reducedMotion) stopRendering();
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
    stopRendering();
    canvas.hidden = true;
    markFallback(container, new Error("WebGL context lost"));
  });

  resize();
  requestRender();

  return {
    container,
    canvas,
    renderer,
    scene,
    camera,
    setMode
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
