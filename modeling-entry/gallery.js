"use strict";

(() => {
  const items =
    Array.from(
      document.querySelectorAll(
        ".gallery-item"
      )
    );

  const lightbox =
    document.getElementById(
      "galleryLightbox"
    );

  const lightboxImage =
    document.getElementById(
      "lightboxImage"
    );

  const lightboxCaption =
    document.getElementById(
      "lightboxCaption"
    );

  const lightboxClose =
    document.getElementById(
      "lightboxClose"
    );

  const imageButtons =
    Array.from(
      document.querySelectorAll(
        ".gallery-image-button"
      )
    );

  const backLink =
    document.querySelector(
      ".gallery-back"
    );

  function revealPage() {
    requestAnimationFrame(() => {
      document.body.classList.add(
        "is-loaded"
      );
    });
  }

  function revealItems() {
    if (
      !("IntersectionObserver" in window)
    ) {
      items.forEach((item) => {
        item.classList.add(
          "is-visible"
        );
      });

      return;
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            entry.target.classList.add(
              "is-visible"
            );

            observer.unobserve(
              entry.target
            );
          });
        },
        {
          threshold: 0.12,
          rootMargin:
            "0px 0px -6% 0px"
        }
      );

    items.forEach((item) => {
      observer.observe(item);
    });
  }

  function openLightbox(button) {
    if (
      !lightbox ||
      !lightboxImage ||
      !lightboxCaption
    ) {
      return;
    }

    const image =
      button.querySelector("img");

    if (!image) {
      return;
    }

    lightboxImage.src =
      image.currentSrc ||
      image.src;

    lightboxImage.alt =
      image.alt;

    lightboxCaption.textContent =
      button.dataset.caption || "";

    lightbox.classList.add(
      "is-open"
    );

    lightbox.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.classList.add(
      "is-lightbox-open"
    );
  }

  function closeLightbox() {
    if (!lightbox) {
      return;
    }

    lightbox.classList.remove(
      "is-open"
    );

    lightbox.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.classList.remove(
      "is-lightbox-open"
    );

    window.setTimeout(() => {
      if (lightboxImage) {
        lightboxImage.src = "";
      }
    }, 420);
  }

  imageButtons.forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        openLightbox(button);
      }
    );
  });

  if (lightboxClose) {
    lightboxClose.addEventListener(
      "click",
      closeLightbox
    );
  }

  if (lightbox) {
    lightbox.addEventListener(
      "click",
      (event) => {
        if (event.target === lightbox) {
          closeLightbox();
        }
      }
    );
  }

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape") {
        closeLightbox();
      }
    }
  );

  if (backLink) {
    backLink.addEventListener(
      "click",
      (event) => {
        event.preventDefault();

        document.body.classList.add(
          "is-leaving"
        );

        window.setTimeout(() => {
          window.location.href =
            backLink.href;
        }, 430);
      }
    );
  }

  revealPage();
  revealItems();
})();