"use strict";

(() => {
  const PAPER_COLOR = "#f4f0e8";

  const routes = [
    {
      selectors: [
        "#modelingEntry",
        "#willow-stage"
      ],

      url: "./modeling-gallery.html",
      label: "3D MODELING"
    },

    {
      selectors: [
        "#ue5Entry",
        "#balloons-stage"
      ],

      url: "./ue5-gallery.html",
      label: "UE5 LEVEL PROTOTYPE"
    }
  ];

  let isRouting = false;

  function addStyles() {
    if (
      document.getElementById(
        "gallery-link-styles"
      )
    ) {
      return;
    }

    const style =
      document.createElement("style");

    style.id =
      "gallery-link-styles";

    style.textContent = `
      #modelingEntry,
      #ue5Entry,
      #willow-stage,
      #balloons-stage {
        cursor: pointer;
      }

      .gallery-route-cover {
        position: fixed;
        inset: 0;
        z-index: 999999;

        display: grid;
        place-items: center;

        background: ${PAPER_COLOR};

        opacity: 0;
        pointer-events: none;

        transition:
          opacity 420ms ease;
      }

      .gallery-route-cover.is-visible {
        opacity: 1;
      }

      .gallery-route-content {
        display: grid;
        justify-items: center;
        gap: 18px;
      }

      .gallery-route-line {
        width: min(320px, 52vw);
        height: 1px;

        background:
          rgba(17, 17, 17, 0.28);

        transform: scaleX(0);
        transform-origin: left center;
      }

      .gallery-route-cover.is-visible
      .gallery-route-line {
        animation:
          galleryRouteLine
          600ms
          cubic-bezier(
            0.22,
            0.72,
            0.18,
            1
          )
          forwards;
      }

      .gallery-route-label {
        margin: 0;

        color:
          rgba(17, 17, 17, 0.75);

        font-family:
          "DM Sans",
          Arial,
          sans-serif;

        font-size:
          12px;

        font-weight: 400;

        letter-spacing: 0.18em;

        opacity: 0;

        transform:
          translateY(8px);
      }

      .gallery-route-cover.is-visible
      .gallery-route-label {
        animation:
          galleryRouteLabel
          500ms
          150ms
          ease
          forwards;
      }

      @keyframes galleryRouteLine {
        0% {
          transform: scaleX(0);
        }

        70% {
          transform: scaleX(1.04);
        }

        100% {
          transform: scaleX(1);
        }
      }

      @keyframes galleryRouteLabel {
        from {
          opacity: 0;

          transform:
            translateY(8px);
        }

        to {
          opacity: 1;

          transform:
            translateY(0);
        }
      }
    `;

    document.head.appendChild(style);
  }

  function findRoute(target) {
    for (const route of routes) {
      for (
        const selector of
        route.selectors
      ) {
        const element =
          target.closest(selector);

        if (element) {
          return route;
        }
      }
    }

    return null;
  }

  function createCover(label) {
    const cover =
      document.createElement("div");

    cover.className =
      "gallery-route-cover";

    cover.innerHTML = `
      <div class="gallery-route-content">
        <div class="gallery-route-line"></div>

        <p class="gallery-route-label">
          ${label}
        </p>
      </div>
    `;

    document.body.appendChild(cover);

    requestAnimationFrame(() => {
      cover.classList.add(
        "is-visible"
      );
    });

    return cover;
  }

  function openRoute(route) {
    if (isRouting) {
      return;
    }

    isRouting = true;

    createCover(route.label);

    window.setTimeout(() => {
      window.location.href =
        route.url;
    }, 720);
  }

  function makeElementsAccessible() {
    for (const route of routes) {
      for (
        const selector of
        route.selectors
      ) {
        const element =
          document.querySelector(
            selector
          );

        if (!element) {
          continue;
        }

        element.setAttribute(
          "role",
          "link"
        );

        element.setAttribute(
          "tabindex",
          "0"
        );

        element.setAttribute(
          "aria-label",
          `Open ${route.label}`
        );
      }
    }
  }

  document.addEventListener(
    "click",
    (event) => {
      const route =
        findRoute(event.target);

      if (!route) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      openRoute(route);
    },
    true
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key !== "Enter" &&
        event.key !== " "
      ) {
        return;
      }

      const route =
        findRoute(event.target);

      if (!route) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      openRoute(route);
    },
    true
  );

  addStyles();
  makeElementsAccessible();
})();