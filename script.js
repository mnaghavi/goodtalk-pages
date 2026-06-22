const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const themeToggles = Array.from(document.querySelectorAll(".theme-toggle"));
const savedTheme = window.localStorage.getItem("goodtalk-theme");
const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
let currentTheme = savedTheme || preferredTheme;

const applyTheme = (theme) => {
  currentTheme = theme;
  document.body.dataset.theme = theme;
  window.localStorage.setItem("goodtalk-theme", theme);

  themeToggles.forEach((toggle) => {
    const isDark = theme === "dark";
    toggle.setAttribute("aria-pressed", String(isDark));
    toggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  });
};

if (themeToggles.length) {
  applyTheme(currentTheme);
  themeToggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      applyTheme(currentTheme === "dark" ? "light" : "dark");
    });
  });
}

const topbar = document.querySelector(".topbar");
const menuToggle = document.querySelector(".menu-toggle");
const topbarMenu = document.querySelector(".topbar-menu");
const getStickyOffset = () => {
  if (!topbar) {
    return 96;
  }

  const topbarStyles = window.getComputedStyle(topbar);
  const stickyTop = parseFloat(topbarStyles.top) || 0;
  return Math.ceil(topbar.offsetHeight + stickyTop + 18);
};

document.body.style.setProperty("--sticky-offset", `${getStickyOffset()}px`);

if (topbar && menuToggle && topbarMenu) {
  const closeMenu = () => {
    topbar.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  };

  menuToggle.addEventListener("click", () => {
    const isOpen = topbar.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  topbarMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 860) {
        closeMenu();
      }
    });
  });

  document.addEventListener("click", (event) => {
    if (window.innerWidth > 860) {
      return;
    }

    if (!topbar.contains(event.target)) {
      closeMenu();
    }
  });

  window.addEventListener("resize", () => {
    document.body.style.setProperty("--sticky-offset", `${getStickyOffset()}px`);
    if (window.innerWidth > 860) {
      closeMenu();
    }
  });
}

const inPageLinks = Array.from(document.querySelectorAll('a[href^="#"]'));
inPageLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const href = link.getAttribute("href");
    if (!href || href === "#") {
      return;
    }

    const target = document.querySelector(href);
    if (!target) {
      return;
    }

    event.preventDefault();

    const offset = getStickyOffset();
    const targetTop = target.getBoundingClientRect().top + window.scrollY - offset;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: prefersReduced ? "auto" : "smooth"
    });

    if (history.replaceState) {
      history.replaceState(null, "", href);
    } else {
      window.location.hash = href;
    }
  });
});

const revealItems = document.querySelectorAll(".reveal");
if (!prefersReducedMotion && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const carousels = Array.from(document.querySelectorAll("[data-carousel]"));
carousels.forEach((carousel) => {
  const track = carousel.querySelector(".example-carousel-track");
  const deviceTrack = carousel.querySelector(".device-carousel-track");
  const slides = Array.from(carousel.querySelectorAll(".example-slide"));
  const prevButtons = Array.from(carousel.querySelectorAll("[data-carousel-prev]"));
  const nextButtons = Array.from(carousel.querySelectorAll("[data-carousel-next]"));
  const deviceViewport = carousel.querySelector(".device-carousel-viewport.is-clickable");
  const dots = Array.from(carousel.querySelectorAll("[data-carousel-dot]"));

  if (!track || !slides.length) {
    return;
  }

  let currentIndex = 0;

  const updateCarousel = () => {
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    if (deviceTrack) {
      deviceTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
    }

    dots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === currentIndex);
      dot.setAttribute("aria-current", index === currentIndex ? "true" : "false");
    });
  };

  prevButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentIndex = (currentIndex - 1 + slides.length) % slides.length;
      updateCarousel();
    });
  });

  nextButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentIndex = (currentIndex + 1) % slides.length;
      updateCarousel();
    });
  });

  const showNextSlide = () => {
    currentIndex = (currentIndex + 1) % slides.length;
    updateCarousel();
  };

  deviceViewport?.addEventListener("click", showNextSlide);
  deviceViewport?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      showNextSlide();
    }
  });

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      currentIndex = index;
      updateCarousel();
    });
  });

  updateCarousel();
});

const heroSwitcher = document.querySelector("[data-hero-switcher]");
if (heroSwitcher) {
  const heroScreens = Array.from(heroSwitcher.querySelectorAll("[data-hero-screen]"));
  const heroButton = heroSwitcher.querySelector(".hero-phone-switcher");
  let activeHeroScreen = 0;

  heroButton?.addEventListener("click", () => {
    activeHeroScreen = (activeHeroScreen + 1) % heroScreens.length;
    heroScreens.forEach((screen, index) => {
      screen.classList.toggle("is-active", index === activeHeroScreen);
    });
    heroButton.setAttribute(
      "aria-label",
      activeHeroScreen === 0 ? "Show guided conversations screen" : "Show hard conversations screen"
    );
  });
}

const page = document.body.dataset.page;

if (page === "home") {
  const homeLinks = Array.from(document.querySelectorAll('.nav-link[href^="#"]'));
  const homeSections = homeLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if (homeSections.length && "IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const sectionId = `#${entry.target.id}`;
          homeLinks.forEach((link) => {
            link.classList.toggle("is-active", link.getAttribute("href") === sectionId);
          });
        });
      },
      {
        threshold: 0.45,
        rootMargin: "-15% 0px -45% 0px"
      }
    );

    homeSections.forEach((section) => sectionObserver.observe(section));
  }

  const modeLinks = Array.from(document.querySelectorAll("[data-mode-link]"));
  const modeSections = modeLinks
    .map((link) => document.getElementById(link.dataset.modeLink))
    .filter(Boolean);

  if (modeSections.length && "IntersectionObserver" in window) {
    const modeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const id = entry.target.id;
          modeLinks.forEach((link) => {
            link.classList.toggle("is-active", link.dataset.modeLink === id);
          });
        });
      },
      {
        threshold: 0.5,
        rootMargin: "-12% 0px -35% 0px"
      }
    );

    modeSections.forEach((section) => modeObserver.observe(section));
  }
} else {
  const currentPage = `${page}.html`;
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === currentPage);
  });
}
