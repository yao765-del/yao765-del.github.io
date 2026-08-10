"use strict";

document.addEventListener(
  "DOMContentLoaded",
  () => {
    let interfaceHasAppeared = false;

    /*
      粒子真正形成照片以后，
      显示右侧三个作品入口。
    */
    function revealInterface() {
      if (interfaceHasAppeared) {
        return;
      }

      interfaceHasAppeared = true;

      document.body.classList.add(
        "is-ready"
      );
    }

    window.addEventListener(
      "portrait-formed",
      revealInterface,
      {
        once: true
      }
    );

    const workButtons =
      document.querySelectorAll(
        ".work-button"
      );

    workButtons.forEach(
      (button) => {
        const category =
          button.dataset.category;

        button.addEventListener(
          "mouseenter",
          () => {
            document.body.dataset.activeCategory =
              category;

            window.dispatchEvent(
              new CustomEvent(
                "portfolio-category-change",
                {
                  detail: {
                    category
                  }
                }
              )
            );
          }
        );

        button.addEventListener(
          "mouseleave",
          () => {
            delete document.body.dataset
              .activeCategory;

            window.dispatchEvent(
              new CustomEvent(
                "portfolio-category-change",
                {
                  detail: {
                    category: ""
                  }
                }
              )
            );
          }
        );

        button.addEventListener(
          "click",
          () => {
            console.log(
              `Selected category: ${category}`
            );
          }
        );
      }
    );
  }
);
/*
  简历的位置跟随真实照片。

  它读取照片当前在浏览器中的实际位置，
  将简历放在照片右侧，并与照片顶部对齐。
*/
(() => {
  const portrait =
    document.getElementById(
      "realPortrait"
    );

  const resume =
    document.getElementById(
      "resumePanel"
    );

  const navigation =
    document.querySelector(
      ".work-navigation"
    );

  if (!portrait || !resume) {
    return;
  }

  let frameRequest = null;

  function syncResumePosition() {
    if (window.innerWidth <= 760) {
      resume.style.removeProperty(
        "width"
      );

      return;
    }

    const portraitRect =
      portrait.getBoundingClientRect();

    /*
      照片尚未完成尺寸计算时，
      暂时不移动简历。
    */
    if (
      portraitRect.width < 10 ||
      portraitRect.height < 10
    ) {
      return;
    }

    const gap = Math.max(
      28,
      Math.min(
        42,
        window.innerWidth *
          0.022
      )
    );

    const resumeLeft =
      portraitRect.right +
      gap;

    let availableWidth = 290;

    if (navigation) {
      const navigationRect =
        navigation.getBoundingClientRect();

      const spaceBeforeNavigation =
        navigationRect.left -
        resumeLeft -
        28;

      if (spaceBeforeNavigation > 220) {
        availableWidth =
          Math.min(
            290,
            spaceBeforeNavigation
          );
      }
    }

    availableWidth =
      Math.max(
        232,
        availableWidth
      );

    resume.style.left =
      `${Math.round(resumeLeft)}px`;

    resume.style.top =
      `${Math.round(
        portraitRect.top + 2
      )}px`;

    resume.style.width =
      `${Math.round(
        availableWidth
      )}px`;
  }

  function requestSync() {
    if (frameRequest) {
      cancelAnimationFrame(
        frameRequest
      );
    }

    frameRequest =
      requestAnimationFrame(
        syncResumePosition
      );
  }

  window.addEventListener(
    "resize",
    requestSync
  );

  window.addEventListener(
    "load",
    requestSync
  );

  const portraitObserver =
    new ResizeObserver(
      requestSync
    );

  portraitObserver.observe(
    portrait
  );

  const bodyObserver =
    new MutationObserver(
      requestSync
    );

  bodyObserver.observe(
    document.body,
    {
      attributes: true,
      attributeFilter: [
        "class"
      ]
    }
  );

  requestSync();

  window.setTimeout(
    requestSync,
    100
  );

  window.setTimeout(
    requestSync,
    650
  );

  window.setTimeout(
    requestSync,
    1400
  );
})();
/*
  PERSONAL APP / OTHER
  点击后进入 FocusFlow 与视频作品页面
*/
document.addEventListener(
  "DOMContentLoaded",
  () => {
    const normalizeText = value =>
      value
        .replace(/\s+/g, " ")
        .trim();

    const textElement = [
      ...document.querySelectorAll(
        "span, p, div, a, button"
      )
    ].find(element => {
      return (
        normalizeText(
          element.textContent
        ) ===
        "PERSONAL APP / OTHER"
      );
    });

    if (!textElement) {
      console.error(
        "Cannot find PERSONAL APP / OTHER."
      );

      return;
    }

    const personalAppButton =
      textElement.closest(
        [
          "a",
          "button",
          "[role='button']",
          ".work-button",
          ".work-item",
          ".navigation-item",
          ".portfolio-item",
          "li"
        ].join(", ")
      ) ||
      textElement.parentElement ||
      textElement;

    personalAppButton.style.cursor =
      "pointer";

    if (
      personalAppButton.tagName !== "A"
    ) {
      personalAppButton.setAttribute(
        "role",
        "link"
      );

      personalAppButton.setAttribute(
        "tabindex",
        "0"
      );
    }

    function openPersonalPage(event) {
      event.preventDefault();
      event.stopPropagation();

      if (
        typeof event.stopImmediatePropagation ===
        "function"
      ) {
        event.stopImmediatePropagation();
      }

      document.body.classList.add(
        "is-leaving"
      );

      window.setTimeout(
        () => {
          window.location.href =
            "./personal-other/index.html";
        },
        320
      );
    }

    personalAppButton.addEventListener(
      "click",
      openPersonalPage,
      true
    );

    personalAppButton.addEventListener(
      "keydown",
      event => {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          openPersonalPage(event);
        }
      },
      true
    );
  }
);
/*
  GAME DESIGN
*/
document.addEventListener(
  "DOMContentLoaded",
  () => {
    const elements = [
      ...document.querySelectorAll(
        "span, p, div, a, button"
      )
    ];

    const title =
      elements.find(
        element =>
          element.textContent
            .replace(/\s+/g, " ")
            .trim() ===
          "GAME DESIGN"
      );

    if (!title) {
      return;
    }

    const target =
      title.closest(
        [
          "a",
          "button",
          ".work-button",
          ".work-item",
          ".navigation-item",
          ".portfolio-item",
          "li"
        ].join(", ")
      ) ||
      title.parentElement;

    target.style.cursor =
      "pointer";

    target.addEventListener(
      "click",
      event => {
        event.preventDefault();

        window.location.href =
          "./game-design/index.html";
      },
      true
    );
  }
);