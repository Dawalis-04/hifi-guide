(() => {
  const base = "/hifi-guide";
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
          <a class="guide-home-link${isHomePage ? " guide-home-link--home" : ""}" href="${isHomePage ? "#content" : `${base}/`}" aria-label="${isHomePage ? "跳到正文" : "返回总目录"}">
            <span class="guide-home-link__full">${isHomePage ? "阅读正文" : "返回目录"}</span>
            <span class="guide-home-link__short" aria-hidden="true">${isHomePage ? "正文" : "目录"}</span>
          </a>
          <button class="guide-menu-button" type="button" aria-label="打开全书目录" aria-expanded="false" aria-controls="guide-site-navigation" title="全书目录">
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
    aside.setAttribute("aria-label", "全书目录");

    const nav = document.createElement("nav");
    const title = document.createElement("span");
    title.className = "guide-sidebar__title";
    title.textContent = "全书目录";
    const homeLink = document.createElement("a");
    homeLink.className = "guide-sidebar__home";
    homeLink.href = `${base}/`;
    homeLink.textContent = "序言与总目录";
    if (isHomePage) {
      homeLink.classList.add("is-active");
      homeLink.setAttribute("aria-current", "page");
    }
    nav.append(title, homeLink);

    chapters.forEach(chapter => {
      const heading = document.createElement("div");
      heading.className = "guide-sidebar__chapter";
      heading.textContent = chapter.title;
      nav.appendChild(heading);

      chapter.pages.forEach(([pageTitle, pagePath]) => {
        const link = document.createElement("a");
        link.className = "guide-sidebar__link";
        link.href = fullPath(pagePath);
        link.textContent = pageTitle;
        if (normalizePath(fullPath(pagePath)) === currentPath) {
          link.classList.add("is-active");
          link.setAttribute("aria-current", "page");
        }
        nav.appendChild(link);
      });
    });

    aside.appendChild(nav);
    return aside;
  }

  function addBreadcrumb(main) {
    if (!currentPage) return;
    const breadcrumb = document.createElement("nav");
    breadcrumb.className = "guide-breadcrumb";
    breadcrumb.setAttribute("aria-label", "当前位置");
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
    summary.textContent = "本页目录";
    const links = document.createElement("div");
    links.className = "on-page__links";

    headings.forEach(heading => {
      const link = document.createElement("a");
      link.href = `#${heading.id}`;
      link.textContent = heading.textContent;
      links.appendChild(link);
    });

    details.append(summary, links);
    const pageTitle = main.querySelector("h1");
    if (pageTitle) pageTitle.insertAdjacentElement("afterend", details);
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
    const shell = document.createElement("div");
    shell.className = "guide-shell";
    const overlay = document.createElement("div");
    overlay.className = "guide-overlay";
    overlay.setAttribute("aria-hidden", "true");

    document.body.insertBefore(header, pageHeader);
    document.body.insertBefore(shell, main);
    shell.append(sidebar, main);
    document.body.appendChild(overlay);
    document.body.classList.toggle("guide-index", isHomePage);

    addBreadcrumb(main);
    if (!isHomePage) addOnPageNavigation(main);

    const footer = main.querySelector(".site-footer");
    if (footer) {
      footer.innerHTML = `<span>听凡 · HiFi入门指南 · <a href="https://github.com/Dawalis-04/hifi-guide">查看源码</a> · CC BY-SA 4.0</span>`;
    }

    const menuButton = header.querySelector(".guide-menu-button");
    const brandLink = header.querySelector(".guide-brand");
    const homeLink = header.querySelector(".guide-home-link");
    const mobileNavigation = window.matchMedia("(max-width: 980px)");

    const setBackgroundInert = inert => {
      main.inert = inert;
      brandLink.inert = inert;
      homeLink.inert = inert;
      if (skipLink) skipLink.inert = inert;
    };

    const setSidebarAvailable = available => {
      sidebar.inert = !available;
      if (available) sidebar.removeAttribute("aria-hidden");
      else sidebar.setAttribute("aria-hidden", "true");
    };

    const focusCurrentNavigationItem = () => {
      const target = sidebar.querySelector("[aria-current='page']") || sidebar.querySelector(".guide-sidebar__home");
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
      menuButton.setAttribute("aria-label", shouldOpen ? "关闭全书目录" : "打开全书目录");
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
