(() => {
  const base = "/hifi-guide";
  const introSessionKey = "tingfan-water-intro-v1";
  const wait = milliseconds => new Promise(resolve => window.setTimeout(resolve, milliseconds));
  const chapters = [
    {
      title: "第一章 · 听懂HiFi",
      pages: [
        ["1.1 什么是 HiFi", "/docs/1-basics/what-is-hifi.html"],
        ["1.2 手机外放与耳机", "/docs/1-basics/why-different.html"],
        ["1.3 认识你的耳朵", "/docs/1-basics/your-ears.html"]
      ]
    },
    {
      title: "第二章 · 认识设备",
      pages: [
        ["2.1 耳机类型速览", "/docs/2-gear/headphone-types.html"],
        ["2.2 看懂耳机参数", "/docs/2-gear/specs-explained.html"],
        ["2.3 前端是什么", "/docs/2-gear/sources.html"],
        ["2.4 无线 vs 有线", "/docs/2-gear/wireless-vs-wired.html"]
      ]
    },
    {
      title: "第三章 · 建立听感",
      pages: [
        ["3.1 低频", "/docs/3-listening/bass.html"],
        ["3.2 中频", "/docs/3-listening/mids.html"],
        ["3.3 高频", "/docs/3-listening/treble.html"],
        ["3.4 声场", "/docs/3-listening/soundstage.html"],
        ["3.5 频响曲线", "/docs/3-listening/frequency-response.html"],
        ["3.6 参考曲目", "/docs/3-listening/reference-tracks.html"]
      ]
    },
    {
      title: "第四章 · 听音词典",
      pages: [
        ["4.1 瞬态", "/docs/4-glossary/transient.html"],
        ["4.2 解析力", "/docs/4-glossary/detail.html"],
        ["4.3 音色", "/docs/4-glossary/timbre.html"],
        ["4.4 齿音", "/docs/4-glossary/sibilance.html"],
        ["4.5 声场", "/docs/4-glossary/soundstage-detail.html"]
      ]
    }
  ];

  const normalizePath = path => {
    const clean = decodeURI(path).replace(/\/+$/, "");
    return clean || "/";
  };

  const currentPath = normalizePath(window.location.pathname);
  const homePaths = new Set([
    normalizePath(`${base}/`),
    normalizePath(`${base}/index.html`)
  ]);
  const isHomePage = homePaths.has(currentPath);
  const fullPath = path => `${base}${path}`;
  const allPages = chapters.flatMap(chapter => chapter.pages.map(page => ({
    title: page[0],
    path: fullPath(page[1]),
    chapter: chapter.title
  })));
  const currentPage = allPages.find(page => normalizePath(page.path) === currentPath);

  function shouldPlayInitialIntro() {
    if (new URLSearchParams(window.location.search).get("intro") === "1") return true;
    try {
      return window.sessionStorage.getItem(introSessionKey) !== "complete";
    } catch {
      return true;
    }
  }

  function rememberIntro() {
    try {
      window.sessionStorage.setItem(introSessionKey, "complete");
    } catch {
      // Storage can be unavailable in strict privacy modes; the intro still works.
    }
  }

  function makeHeader() {
    const header = document.createElement("header");
    header.className = "guide-header";
    header.innerHTML = `
      <div class="guide-header__inner">
        <a class="guide-brand" href="${base}/" aria-label="听凡 HiFi入门指南首页">
          <span class="guide-brand__mark" aria-hidden="true">听</span>
          <span class="guide-brand__copy"><strong>听凡 · HiFi入门指南</strong><span>把听感翻译成人话</span></span>
        </a>
        <div class="guide-header__actions">
          <a class="guide-home-link" href="${isHomePage ? "#content" : `${base}/`}">${isHomePage ? "阅读目录" : "返回目录"}</a>
          <button class="guide-menu-button" type="button" aria-label="打开章节目录" aria-expanded="false" aria-controls="guide-site-navigation" title="章节目录">
            <span class="guide-menu-icon" aria-hidden="true"></span>
          </button>
        </div>
      </div>
      <div class="guide-progress" aria-hidden="true"><div class="guide-progress__bar"></div></div>`;
    return header;
  }

  function makeSidebar() {
    const aside = document.createElement("aside");
    aside.className = "guide-sidebar";
    aside.id = "guide-site-navigation";
    aside.setAttribute("aria-label", "全站章节目录");
    const nav = document.createElement("nav");
    nav.innerHTML = `<span class="guide-sidebar__title">阅读目录</span><a class="guide-sidebar__home" href="${base}/">总目录</a>`;

    chapters.forEach(chapter => {
      const heading = document.createElement("div");
      heading.className = "guide-sidebar__chapter";
      heading.textContent = chapter.title;
      nav.appendChild(heading);

      chapter.pages.forEach(([title, path]) => {
        const link = document.createElement("a");
        link.className = "guide-sidebar__link";
        link.href = fullPath(path);
        link.textContent = title;
        if (normalizePath(fullPath(path)) === currentPath) {
          link.classList.add("is-active");
          link.setAttribute("aria-current", "page");
        }
        nav.appendChild(link);
      });
    });

    aside.appendChild(nav);
    return aside;
  }

  function makeHomeHero(main) {
    const originalTitle = main.querySelector(":scope > h1");
    const originalTagline = originalTitle?.nextElementSibling;

    const hero = document.createElement("section");
    hero.className = "guide-hero";
    hero.dataset.soundMode = "mid";
    hero.setAttribute("aria-labelledby", "guide-hero-title");
    hero.innerHTML = `
      <div class="guide-hero__scene" data-headphone-scene tabindex="0" aria-label="可旋转的三维头戴式耳机">
        <div class="guide-headphone-fallback" aria-hidden="true">
          <span class="guide-headphone-fallback__band"></span>
          <span class="guide-headphone-fallback__cup guide-headphone-fallback__cup--left"></span>
          <span class="guide-headphone-fallback__cup guide-headphone-fallback__cup--right"></span>
        </div>
      </div>
      <div class="guide-hero__inner">
        <div class="guide-hero__copy">
          <span class="guide-hero__eyebrow">零基础耳机听感指南</span>
          <h1 id="guide-hero-title">听凡 · HiFi 入门指南</h1>
          <p class="guide-hero__lead">把“低频下潜、声场、解析力、瞬态”翻译成你能听懂、能验证、能说出口的话。</p>
          <div class="guide-sound-switcher" role="group" aria-label="选择要先听懂的频段">
            <button type="button" data-sound-mode="low" aria-pressed="false" title="查看低频主题">低频</button>
            <button type="button" data-sound-mode="mid" aria-pressed="true" title="查看人声主题">人声</button>
            <button type="button" data-sound-mode="high" aria-pressed="false" title="查看高频主题">高频</button>
          </div>
          <div class="guide-mode-summary" aria-live="polite">
            <strong data-mode-title>中频 · 厚度与距离</strong>
            <span data-mode-copy>听懂歌手是厚、薄、靠前，还是被伴奏盖住。</span>
            <a data-mode-link href="${base}/docs/3-listening/mids.html">进入中频章节</a>
          </div>
          <a class="guide-hero__start" href="${base}/docs/1-basics/what-is-hifi.html">从第一章开始</a>
        </div>
      </div>
      <button class="guide-intro-replay" type="button" aria-label="重播水面开场" title="重播水面开场">
        <span aria-hidden="true"></span>
      </button>`;

    originalTitle?.remove();
    if (originalTagline?.tagName === "BLOCKQUOTE") originalTagline.remove();
    return hero;
  }

  function makeWaterIntro() {
    const intro = document.createElement("div");
    intro.className = "guide-intro";
    intro.setAttribute("role", "dialog");
    intro.setAttribute("aria-modal", "true");
    intro.setAttribute("aria-label", "听凡水面开场");
    intro.innerHTML = `
      <div class="guide-intro__stage"></div>
      <div class="guide-intro__ripples" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
      <div class="guide-intro__water" aria-hidden="true">
        <span class="guide-intro__surface-ring guide-intro__surface-ring--one"></span>
        <span class="guide-intro__surface-ring guide-intro__surface-ring--two"></span>
        <span class="guide-intro__splash guide-intro__splash--one"></span>
        <span class="guide-intro__splash guide-intro__splash--two"></span>
        <span class="guide-intro__splash guide-intro__splash--three"></span>
        <span class="guide-intro__splash guide-intro__splash--four"></span>
        <span class="guide-intro__splash guide-intro__splash--five"></span>
      </div>
      <button class="guide-intro__trigger" type="button" aria-label="触碰水滴，进入听凡" disabled>
        <span class="guide-intro__drop" aria-hidden="true"></span>
      </button>
      <span class="guide-visually-hidden" data-intro-status aria-live="polite">开场正在准备</span>`;
    return intro;
  }

  function initHomeHero(hero) {
    const modes = {
      low: {
        title: "低频 · 分量与下潜",
        copy: "先分清低音是多、是深，还是鼓点没有及时收住。",
        link: `${base}/docs/3-listening/bass.html`,
        linkText: "进入低频章节"
      },
      mid: {
        title: "中频 · 厚度与距离",
        copy: "听懂歌手是厚、薄、靠前，还是被伴奏盖住。",
        link: `${base}/docs/3-listening/mids.html`,
        linkText: "进入中频章节"
      },
      high: {
        title: "高频 · 明亮与刺激",
        copy: "分清镲片的亮、尾音的空气感，以及真正让你不舒服的刺。",
        link: `${base}/docs/3-listening/treble.html`,
        linkText: "进入高频章节"
      }
    };
    const buttons = [...hero.querySelectorAll("[data-sound-mode]")];
    const switcher = hero.querySelector(".guide-sound-switcher");
    const title = hero.querySelector("[data-mode-title]");
    const copy = hero.querySelector("[data-mode-copy]");
    const link = hero.querySelector("[data-mode-link]");
    const scene = hero.querySelector("[data-headphone-scene]");
    const replayButton = hero.querySelector(".guide-intro-replay");
    let controllerPromise;
    let introRunning = false;

    const selectMode = mode => {
      const content = modes[mode];
      if (!content) return;
      hero.dataset.soundMode = mode;
      buttons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.soundMode === mode)));
      title.textContent = content.title;
      copy.textContent = content.copy;
      link.href = content.link;
      link.textContent = content.linkText;
    };

    buttons.forEach(button => button.addEventListener("click", () => selectMode(button.dataset.soundMode)));
    switcher.addEventListener("keydown", event => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const currentIndex = Math.max(0, buttons.indexOf(document.activeElement));
      const step = event.key === "ArrowRight" ? 1 : -1;
      const next = buttons[(currentIndex + step + buttons.length) % buttons.length];
      event.preventDefault();
      next.focus();
      next.click();
    });

    const markSceneFallback = () => {
      if (!scene) return;
      scene.classList.add("is-fallback");
      scene.dataset.renderer = "fallback";
      scene.removeAttribute("tabindex");
      scene.removeAttribute("aria-busy");
      scene.setAttribute("role", "img");
      scene.setAttribute("aria-label", "头戴式耳机静态示意图");
    };

    const ensureController = () => {
      if (!controllerPromise) {
        controllerPromise = import(`${base}/assets/js/headphone-scene.js`)
          .then(module => module.initHeadphoneScene(scene))
          .catch(() => {
            markSceneFallback();
            return null;
          });
      }
      return controllerPromise;
    };

    const runWaterIntro = async ({ restoreFocus = false } = {}) => {
      if (introRunning || !scene) return;
      introRunning = true;

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const intro = makeWaterIntro();
      const stage = intro.querySelector(".guide-intro__stage");
      const trigger = intro.querySelector(".guide-intro__trigger");
      const status = intro.querySelector("[data-intro-status]");
      scene.dataset.presentation = "intro";
      stage.appendChild(scene);
      document.body.appendChild(intro);
      document.body.classList.add("guide-intro-active");
      document.dispatchEvent(new CustomEvent("guide-intro:statechange"));
      requestAnimationFrame(() => intro.classList.add("is-mounted"));

      let controller = null;
      let removeTriggerListener = () => {};
      let resolveSkip;
      let skippedByKeyboard = false;
      const skipPromise = new Promise(resolve => {
        resolveSkip = () => resolve({ type: "skip", keyboard: true });
      });
      const handleKeydown = event => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        skippedByKeyboard = true;
        resolveSkip();
      };
      document.addEventListener("keydown", handleKeydown);

      try {
        const controllerLoad = ensureController().then(value => {
          controller = value;
          return value;
        });
        const loadResult = await Promise.race([
          controllerLoad.then(value => ({ type: "loaded", value })),
          skipPromise
        ]);
        let action = loadResult;

        if (loadResult.type === "loaded") {
          controller = loadResult.value;
          controller?.prepareIntro();
          intro.classList.add("is-ready");
          trigger.disabled = false;
          status.textContent = "水滴已准备好";
          trigger.focus({ preventScroll: true });

          const startPromise = new Promise(resolve => {
            const start = event => resolve({ type: "start", keyboard: event.detail === 0 });
            trigger.addEventListener("click", start, { once: true });
            removeTriggerListener = () => trigger.removeEventListener("click", start);
          });
          action = await Promise.race([startPromise, skipPromise]);
        }

        trigger.disabled = true;
        if (action.type === "start") {
          intro.classList.add("is-playing");
          status.textContent = "耳机正在浮出水面";
          const fallbackDuration = reducedMotion ? 260 : 3300;
          await Promise.race([
            controller?.playIntro?.() || wait(fallbackDuration),
            wait(fallbackDuration + 300),
            skipPromise
          ]);
        } else {
          status.textContent = "已跳过开场";
        }

        intro.classList.add("is-revealing");
        await Promise.race([wait(reducedMotion ? 0 : 220), skipPromise]);
        hero.insertBefore(scene, hero.firstChild);
        scene.dataset.presentation = "hero";
        if (controller) {
          controller.finishIntro();
        } else {
          controllerLoad.then(lateController => lateController?.finishIntro());
        }
        document.documentElement.classList.remove("guide-intro-boot");
        intro.classList.add("is-exiting");
        await Promise.race([wait(reducedMotion ? 0 : 620), skipPromise]);
        intro.remove();
        document.body.classList.remove("guide-intro-active");
        rememberIntro();
        document.dispatchEvent(new CustomEvent("guide-intro:statechange"));
        introRunning = false;

        if (restoreFocus || action.keyboard || skippedByKeyboard) {
          replayButton?.focus({ preventScroll: true });
        }
      } finally {
        removeTriggerListener();
        document.removeEventListener("keydown", handleKeydown);
      }
    };

    replayButton?.addEventListener("click", () => runWaterIntro({ restoreFocus: true }));

    if (shouldPlayInitialIntro()) {
      runWaterIntro();
    } else {
      document.documentElement.classList.remove("guide-intro-boot");
      ensureController();
    }
  }

  function addBreadcrumb(main) {
    if (!currentPage) return;
    const breadcrumb = document.createElement("nav");
    breadcrumb.className = "guide-breadcrumb";
    breadcrumb.setAttribute("aria-label", "面包屑");
    breadcrumb.innerHTML = `
      <a href="${base}/">总目录</a><span aria-hidden="true">/</span>
      <span>${currentPage.chapter}</span><span aria-hidden="true">/</span>
      <span aria-current="page">${currentPage.title}</span>`;
    main.insertBefore(breadcrumb, main.firstChild);
  }

  function addOnPageNavigation(main) {
    const headings = [...main.querySelectorAll("h2")].filter(heading => heading.id);
    if (headings.length < 3) return;
    const details = document.createElement("details");
    details.className = "on-page";
    if (window.innerWidth > 980) details.open = true;
    const summary = document.createElement("summary");
    summary.textContent = "本页内容";
    const links = document.createElement("div");
    links.className = "on-page__links";
    headings.forEach(heading => {
      const link = document.createElement("a");
      link.href = `#${heading.id}`;
      link.textContent = heading.textContent;
      links.appendChild(link);
    });
    details.append(summary, links);
    const title = main.querySelector("h1");
    if (title) title.insertAdjacentElement("afterend", details);
  }

  function updateReadingProgress(bar, main) {
    const start = main.offsetTop;
    const distance = Math.max(main.scrollHeight - window.innerHeight, 1);
    const progress = Math.min(1, Math.max(0, (window.scrollY - start) / distance));
    bar.style.width = `${progress * 100}%`;
  }

  function init() {
    const main = document.querySelector("main.main-content");
    const pageHeader = document.querySelector(".page-header");
    if (!main || !pageHeader) return;

    const skipLink = document.getElementById("skip-to-content");
    if (skipLink) skipLink.textContent = "跳到正文";

    const header = makeHeader();
    const sidebar = makeSidebar();
    const hero = isHomePage ? makeHomeHero(main) : null;
    const shell = document.createElement("div");
    shell.className = "guide-shell";
    const overlay = document.createElement("div");
    overlay.className = "guide-overlay";
    overlay.setAttribute("aria-hidden", "true");

    document.body.insertBefore(header, pageHeader);
    document.body.insertBefore(shell, main);
    if (hero) document.body.insertBefore(hero, shell);
    shell.append(sidebar, main);
    document.body.appendChild(overlay);

    addBreadcrumb(main);
    addOnPageNavigation(main);
    if (hero) {
      document.body.classList.add("guide-home");
      initHomeHero(hero);
    }

    const footer = main.querySelector(".site-footer");
    if (footer) {
      footer.innerHTML = `<span>听凡 · HiFi入门指南 · <a href="https://github.com/Dawalis-04/hifi-guide">查看源码</a> · CC BY-SA 4.0</span>`;
    }

    const menuButton = header.querySelector(".guide-menu-button");
    const brandLink = header.querySelector(".guide-brand");
    const homeLink = header.querySelector(".guide-home-link");
    const mobileNavigation = window.matchMedia("(max-width: 980px)");

    const setBackgroundInert = inert => {
      const introActive = document.body.classList.contains("guide-intro-active");
      header.inert = introActive;
      shell.inert = introActive;
      main.inert = introActive || inert;
      brandLink.inert = introActive || inert;
      homeLink.inert = introActive || inert;
      menuButton.inert = introActive;
      if (hero) hero.inert = introActive || inert;
      if (skipLink) skipLink.inert = introActive || inert;
    };

    const setSidebarAvailable = available => {
      const shouldEnable = available && !document.body.classList.contains("guide-intro-active");
      sidebar.inert = !shouldEnable;
      if (shouldEnable) sidebar.removeAttribute("aria-hidden");
      else sidebar.setAttribute("aria-hidden", "true");
    };

    const focusCurrentNavigationItem = () => {
      const target = sidebar.querySelector(".guide-sidebar__link.is-active") || sidebar.querySelector(".guide-sidebar__home");
      if (!target) return;
      requestAnimationFrame(() => {
        if (!mobileNavigation.matches || !document.body.classList.contains("guide-nav-open")) return;
        target.focus({ preventScroll: true });
        target.scrollIntoView({ block: "nearest" });
      });
    };

    const setMenu = (open, { restoreFocus = false, moveFocus = true } = {}) => {
      const shouldOpen = Boolean(open && mobileNavigation.matches);
      document.body.classList.toggle("guide-nav-open", shouldOpen);
      menuButton.setAttribute("aria-expanded", String(shouldOpen));
      menuButton.setAttribute("aria-label", shouldOpen ? "关闭章节目录" : "打开章节目录");
      setBackgroundInert(shouldOpen);

      if (shouldOpen) {
        setSidebarAvailable(true);
        if (moveFocus) focusCurrentNavigationItem();
        return;
      }

      if (restoreFocus && mobileNavigation.matches) menuButton.focus({ preventScroll: true });
      setSidebarAvailable(!mobileNavigation.matches);
    };

    menuButton.addEventListener("click", () => {
      const open = !document.body.classList.contains("guide-nav-open");
      setMenu(open, { restoreFocus: !open });
    });
    overlay.addEventListener("click", () => setMenu(false, { restoreFocus: true }));
    sidebar.addEventListener("click", event => {
      if (!event.target.closest("a") || !mobileNavigation.matches) return;
      requestAnimationFrame(() => setMenu(false));
    });
    document.addEventListener("keydown", event => {
      if (!mobileNavigation.matches || !document.body.classList.contains("guide-nav-open")) return;
      if (event.key === "Escape") {
        event.preventDefault();
        setMenu(false, { restoreFocus: true });
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = [menuButton, ...sidebar.querySelectorAll("a[href]")]
        .filter(element => !element.inert && element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!focusable.includes(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    });

    const syncNavigationForViewport = () => {
      const restoreFocus = mobileNavigation.matches && sidebar.contains(document.activeElement);
      setMenu(false, { restoreFocus, moveFocus: false });
    };
    if (typeof mobileNavigation.addEventListener === "function") {
      mobileNavigation.addEventListener("change", syncNavigationForViewport);
    } else {
      mobileNavigation.addListener(syncNavigationForViewport);
    }
    document.addEventListener("guide-intro:statechange", () => {
      setMenu(false, { moveFocus: false });
    });
    syncNavigationForViewport();

    const progressBar = header.querySelector(".guide-progress__bar");
    const refreshProgress = () => updateReadingProgress(progressBar, main);
    window.addEventListener("scroll", refreshProgress, { passive: true });
    window.addEventListener("resize", refreshProgress);
    refreshProgress();

    document.documentElement.classList.add("guide-ready");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
