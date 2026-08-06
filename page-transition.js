"use strict";

(() => {
  const PAPER_COLOR = "#f4f0e8";

  /*
    从 portfolio.html 出发时，
    目标页面的位置。
  */
  const MODELING_PAGE =
    "./modeling-entry/index.html";

  const LEAVE_DURATION = 720;
  const ENTER_DURATION = 760;

  function addTransitionStyles() {
    if (
      document.getElementById(
        "modeling-route-styles"
      )
    ) {
      return;
    }

    const style =
      document.createElement("style");

    style.id =
      "modeling-route-styles";

    style.textContent = `
      .modeling-route-layer {
        position: fixed;
        inset: 0;
        z-index: 999999;

        overflow: hidden;

        background:
          var(--paper, ${PAPER_COLOR});

        opacity: 0;
        pointer-events: none;

        transition:
          opacity 420ms ease;
      }

      .modeling-route-layer.is-visible {
        opacity: 1;
      }

      .modeling-route-line {
        position: absolute;

        top: 50%;
        left: 8vw;
        right: 8vw;

        height: 1px;

        background:
          rgba(17, 17, 17, 0.28);

        transform: scaleX(0);
        transform-origin: left center;
      }

      .modeling-route-layer.is-visible
      .modeling-route-line {
        animation:
          modelingRouteLine
          620ms
          cubic-bezier(
            0.22,
            0.72,
            0.18,
            1
          )
          forwards;
      }

      .modeling-route-title {
        position: absolute;

        top: calc(50% + 18px);
        left: 50%;

        margin: 0;

        color:
          rgba(17, 17, 17, 0.84);

        font-family:
          "Helvetica Neue",
          Helvetica,
          Arial,
          sans-serif;

        font-size:
          clamp(
            12px,
            1.05vw,
            17px
          );

        font-weight: 400;

        letter-spacing: 0.18em;

        white-space: nowrap;

        opacity: 0;

        transform:
          translate(
            -50%,
            9px
          );
      }

      .modeling-route-layer.is-visible
      .modeling-route-title {
        animation:
          modelingRouteTitle
          520ms
          170ms
          ease
          forwards;
      }

      .modeling-route-grain {
        position: absolute;
        inset: -20%;

        opacity: 0.1;

        background-image:
          radial-gradient(
            circle at 20% 30%,
            rgba(17, 17, 17, 0.16)
            0 0.55px,
            transparent 0.7px
          ),
          radial-gradient(
            circle at 75% 62%,
            rgba(17, 17, 17, 0.11)
            0 0.45px,
            transparent 0.65px
          );

        background-size:
          9px 9px,
          13px 13px;

        transform:
          rotate(0.01deg);
      }

      body.is-routing-to-modeling {
        pointer-events: none;
      }

      body.is-routing-to-modeling
      > *:not(.modeling-route-layer) {
        animation:
          modelingPageLeave
          520ms
          ease
          forwards;
      }

      /*
        进入柳树气球页面时使用的遮罩。
      */
      .modeling-page-entry-cover {
        position: fixed;
        inset: 0;
        z-index: 999999;

        background:
          var(--paper, ${PAPER_COLOR});

        opacity: 1;
        pointer-events: none;

        transition:
          opacity
          ${ENTER_DURATION}ms
          cubic-bezier(
            0.22,
            0.72,
            0.18,
            1
          );
      }

      .modeling-page-entry-cover.is-gone {
        opacity: 0;
      }

      @keyframes modelingRouteLine {
        0% {
          transform: scaleX(0);
          opacity: 0.2;
        }

        62% {
          transform: scaleX(1.02);
          opacity: 1;
        }

        100% {
          transform: scaleX(1);
          opacity: 0.72;
        }
      }

      @keyframes modelingRouteTitle {
        from {
          opacity: 0;

          transform:
            translate(
              -50%,
              9px
            );
        }

        to {
          opacity: 1;

          transform:
            translate(
              -50%,
              0
            );
        }
      }

      @keyframes modelingPageLeave {
        from {
          opacity: 1;
          transform: scale(1);
          filter: blur(0);
        }

        to {
          opacity: 0.16;
          transform: scale(0.992);
          filter: blur(2px);
        }
      }

      @media (
        prefers-reduced-motion:
        reduce
      ) {
        .modeling-route-layer,
        .modeling-page-entry-cover {
          transition-duration: 1ms;
        }

        .modeling-route-layer.is-visible
        .modeling-route-line,

        .modeling-route-layer.is-visible
        .modeling-route-title,

        body.is-routing-to-modeling
        > *:not(.modeling-route-layer) {
          animation-duration: 1ms;
          animation-delay: 0ms;
        }
      }
    `;

    document.head.appendChild(
      style
    );
  }

  function createRouteLayer() {
    const layer =
      document.createElement("div");

    layer.className =
      "modeling-route-layer";

    layer.setAttribute(
      "aria-hidden",
      "true"
    );

    layer.innerHTML = `
      <div
        class="modeling-route-grain"
      ></div>

      <div
        class="modeling-route-line"
      ></div>

      <p
        class="modeling-route-title"
      >
        3D MODELING
      </p>
    `;

    document.body.appendChild(
      layer
    );

    return layer;
  }

  /*
    自动寻找上一页里的
    3D MODELING 按钮。

    不要求你修改原按钮结构。
  */
  function findModelingButton() {
    const buttons =
      Array.from(
        document.querySelectorAll(
          ".work-button"
        )
      );

    return (
      buttons.find((button) => {
        const text =
          button.textContent
            .replace(/\s+/g, " ")
            .trim()
            .toUpperCase();

        return text.includes(
          "3D MODELING"
        );
      }) || null
    );
  }

  /*
    用页面中的现有元素判断
    当前是否已经进入建模入口页。
  */
  function isModelingEntryPage() {
    return Boolean(
      document.getElementById(
        "willow-stage"
      ) ||
      document.getElementById(
        "balloons-stage"
      )
    );
  }

  function revealModelingPage() {
    if (!isModelingEntryPage()) {
      return;
    }

    const cover =
      document.createElement("div");

    cover.className =
      "modeling-page-entry-cover";

    cover.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.appendChild(
      cover
    );

    /*
      等待页面和 p5 画布完成首轮布局，
      再让遮罩淡出。
    */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        cover.classList.add(
          "is-gone"
        );
      });
    });

    window.setTimeout(() => {
      cover.remove();
    }, ENTER_DURATION + 120);
  }

  function connectModelingButton() {
    const button =
      findModelingButton();

    /*
      当前页面没有 work-button 时，
      说明已经进入其他页面。
    */
    if (!button) {
      return;
    }

    button.setAttribute(
      "aria-label",
      "Open 3D Modeling"
    );

    let isLeaving = false;

    function openModelingPage() {
      if (isLeaving) {
        return;
      }

      isLeaving = true;

      document.body.classList.add(
        "is-routing-to-modeling"
      );

      const layer =
        createRouteLayer();

      requestAnimationFrame(() => {
        layer.classList.add(
          "is-visible"
        );
      });

      window.setTimeout(() => {
        window.location.href =
          MODELING_PAGE;
      }, LEAVE_DURATION);
    }

    button.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        openModelingPage();
      }
    );

    button.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key !== "Enter" &&
          event.key !== " "
        ) {
          return;
        }

        event.preventDefault();
        openModelingPage();
      }
    );
  }

  addTransitionStyles();
  revealModelingPage();
  connectModelingButton();
})();