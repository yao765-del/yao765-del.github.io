
/* =========================
   滚动出现
   ========================= */

const revealItems =
  document.querySelectorAll(
    ".reveal"
  );

if (
  "IntersectionObserver" in window
) {
  const revealObserver =
    new IntersectionObserver(
      entries => {
        entries.forEach(
          entry => {
            if (
              entry.isIntersecting
            ) {
              entry.target.classList.add(
                "is-visible"
              );

              revealObserver.unobserve(
                entry.target
              );
            }
          }
        );
      },
      {
        threshold: 0.1,
        rootMargin:
          "0px 0px -5% 0px"
      }
    );

  revealItems.forEach(
    item => {
      revealObserver.observe(
        item
      );
    }
  );
} else {
  revealItems.forEach(
    item => {
      item.classList.add(
        "is-visible"
      );
    }
  );
}
/* =========================
   图片翻页器
   ========================= */

const PDF_PAGE_COUNT = 11;

const PDF_IMAGE_FOLDER =
  "../assets/images/projects/focusflow/pdf-pages/";

const flipbook =
  document.getElementById(
    "pdfFlipbook"
  );

const previousButton =
  document.getElementById(
    "pdfPrev"
  );

const nextButton =
  document.getElementById(
    "pdfNext"
  );

const leftWrap =
  document.getElementById(
    "pdfLeftWrap"
  );

const rightWrap =
  document.getElementById(
    "pdfRightWrap"
  );

const leftImage =
  document.getElementById(
    "pdfLeftImage"
  );

const rightImage =
  document.getElementById(
    "pdfRightImage"
  );

const leftNumber =
  document.getElementById(
    "pdfLeftNumber"
  );

const rightNumber =
  document.getElementById(
    "pdfRightNumber"
  );

const pdfCounter =
  document.getElementById(
    "pdfCounter"
  );

const pdfError =
  document.getElementById(
    "pdfError"
  );

let currentPage = 1;
let resizeTimer = null;

function pageImagePath(
  pageNumber
) {
  const pageName =
    String(pageNumber)
      .padStart(2, "0");

  return (
    PDF_IMAGE_FOLDER +
    `focusflow-page-${pageName}.png`
  );
}

function isSinglePageMode() {
  return window.innerWidth <= 760;
}

function clearPage(
  image,
  wrap,
  numberElement
) {
  image.removeAttribute(
    "src"
  );

  image.alt = "";

  wrap.classList.add(
    "is-blank"
  );

  wrap.classList.remove(
    "is-loading"
  );

  numberElement.textContent =
    "";
}

function displayPage(
  pageNumber,
  image,
  wrap,
  numberElement
) {
  if (
    !pageNumber ||
    pageNumber < 1 ||
    pageNumber > PDF_PAGE_COUNT
  ) {
    clearPage(
      image,
      wrap,
      numberElement
    );

    return;
  }

  wrap.classList.remove(
    "is-blank"
  );

  wrap.classList.add(
    "is-loading"
  );

  image.alt =
    `FocusFlow design document page ${pageNumber}`;

  image.onload = () => {
    wrap.classList.remove(
      "is-loading"
    );

    pdfError.hidden = true;
  };

  image.onerror = () => {
    console.error(
      `Page ${pageNumber} could not load.`
    );

    wrap.classList.remove(
      "is-loading"
    );

    wrap.classList.add(
      "is-blank"
    );

    pdfError.hidden = false;
  };

  image.src =
    pageImagePath(
      pageNumber
    );

  numberElement.textContent =
    String(pageNumber)
      .padStart(2, "0");
}

function updateCounter(
  leftPage,
  rightPage
) {
  if (isSinglePageMode()) {
    pdfCounter.textContent =
      `PAGE ${leftPage} / ${PDF_PAGE_COUNT}`;

    return;
  }

  if (!leftPage) {
    pdfCounter.textContent =
      `PAGE ${rightPage} / ${PDF_PAGE_COUNT}`;

    return;
  }

  if (!rightPage) {
    pdfCounter.textContent =
      `PAGE ${leftPage} / ${PDF_PAGE_COUNT}`;

    return;
  }

  pdfCounter.textContent =
    `PAGES ${leftPage}–${rightPage} / ${PDF_PAGE_COUNT}`;
}

function updateButtons() {
  previousButton.disabled =
    currentPage <= 1;

  if (isSinglePageMode()) {
    nextButton.disabled =
      currentPage >=
      PDF_PAGE_COUNT;

    return;
  }

  nextButton.disabled =
    currentPage >= 10;
}

function renderCurrentPages() {
  const singlePage =
    isSinglePageMode();

  flipbook.classList.toggle(
    "is-single-page",
    singlePage
  );

  let leftPage = null;
  let rightPage = null;

  if (singlePage) {
    leftPage =
      currentPage;

    rightPage =
      null;
  } else if (
    currentPage === 1
  ) {
    leftPage =
      null;

    rightPage =
      1;
  } else {
    leftPage =
      currentPage;

    rightPage =
      currentPage + 1 <=
      PDF_PAGE_COUNT
        ? currentPage + 1
        : null;
  }

  displayPage(
    leftPage,
    leftImage,
    leftWrap,
    leftNumber
  );

  displayPage(
    rightPage,
    rightImage,
    rightWrap,
    rightNumber
  );

  updateCounter(
    leftPage,
    rightPage
  );

  updateButtons();
}

function playTurnAnimation(
  direction
) {
  flipbook.removeAttribute(
    "data-turn"
  );

  void flipbook.offsetWidth;

  flipbook.setAttribute(
    "data-turn",
    direction
  );

  window.setTimeout(
    () => {
      flipbook.removeAttribute(
        "data-turn"
      );
    },
    460
  );
}

function goToNextPages() {
  if (
    nextButton.disabled
  ) {
    return;
  }

  if (isSinglePageMode()) {
    currentPage =
      Math.min(
        PDF_PAGE_COUNT,
        currentPage + 1
      );
  } else if (
    currentPage === 1
  ) {
    currentPage = 2;
  } else {
    currentPage =
      Math.min(
        10,
        currentPage + 2
      );
  }

  renderCurrentPages();

  playTurnAnimation(
    "next"
  );
}

function goToPreviousPages() {
  if (
    previousButton.disabled
  ) {
    return;
  }

  if (isSinglePageMode()) {
    currentPage =
      Math.max(
        1,
        currentPage - 1
      );
  } else if (
    currentPage <= 2
  ) {
    currentPage = 1;
  } else {
    currentPage =
      Math.max(
        2,
        currentPage - 2
      );
  }

  renderCurrentPages();

  playTurnAnimation(
    "previous"
  );
}

previousButton?.addEventListener(
  "click",
  goToPreviousPages
);

nextButton?.addEventListener(
  "click",
  goToNextPages
);

flipbook?.addEventListener(
  "keydown",
  event => {
    if (
      event.key === "ArrowRight"
    ) {
      event.preventDefault();

      goToNextPages();
    }

    if (
      event.key === "ArrowLeft"
    ) {
      event.preventDefault();

      goToPreviousPages();
    }
  }
);

window.addEventListener(
  "resize",
  () => {
    window.clearTimeout(
      resizeTimer
    );

    resizeTimer =
      window.setTimeout(
        () => {
          if (
            currentPage >
            PDF_PAGE_COUNT
          ) {
            currentPage =
              PDF_PAGE_COUNT;
          }

          renderCurrentPages();
        },
        160
      );
  }
);

/*
  提前加载后面的页面，
  翻页时不会闪白。
*/
for (
  let page = 1;
  page <= PDF_PAGE_COUNT;
  page += 1
) {
  const preloadImage =
    new Image();

  preloadImage.src =
    pageImagePath(page);
}

renderCurrentPages();

/* =========================
   截图英文翻译
   ========================= */

const imageTranslations = {
  "focusflow-01-simple-home.jpg": {
    title: "Simple Mode",
    lines: [
      "What would you like to do today?",
      "A year only has thirty-six ten-day periods.",
      "Create Task",
      "Today’s Tasks",
      "You have no saved tasks.",
      "Today’s Visualization",
      "0 tasks completed today.",
      "View Today’s Timeline",
      "View Weekly View",
      "Plan",
      "My Profile"
    ]
  },

  "focusflow-02-system-home.jpg": {
    title: "System Mode",
    lines: [
      "Host, today’s tasks have been refreshed.",
      "Please handle today’s tasks.",
      "Create Task",
      "System Tasks",
      "There are currently no pending system tasks.",
      "System Record",
      "0 system tasks submitted today.",
      "View Today’s Timeline",
      "View Weekly View",
      "Tasks",
      "My Profile"
    ]
  },

  "focusflow-03-create-task.jpg": {
    title: "Create Task",
    lines: [
      "Task Name",
      "Example: Write English homework",
      "Task Category",
      "Study",
      "Work",
      "Daily Life",
      "Exercise",
      "Self-Care",
      "Social",
      "Time Mode",
      "Exact Time",
      "Flexible Exact Time",
      "Random Time Range",
      "Selected Time",
      "Tap to choose a time"
    ]
  },

  "focusflow-05-Simple-profile.jpg": {
    title: "Simple User Profile",
    lines: [
      "My Profile",
      "Account, settings, and personal information will appear here.",
      "You",
      "Guest User",
      "ID: Guest-0001",
      "Login / Register",
      "Settings",
      "Ringtone Settings",
      "Whitelist App Settings"
    ]
  },

  "focusflow-05-System-profile.jpg": {
    title: "System Host Profile",
    lines: [
      "Host",
      "System identity, growth records, and Store entry",
      "You",
      "Default Host",
      "System ID: Host-0001",
      "Bind Host Identity",
      "Store",
      "Coins",
      "Growth",
      "Knowledge",
      "Work",
      "Daily Life",
      "Health",
      "Appearance",
      "Social",
      "Self-Discipline",
      "Settings"
    ]
  },

  "focusflow-06-whitelist.jpg": {
    title: "App Whitelist Settings",
    lines: [
      "App Whitelist Settings",
      "Record the apps that are allowed to remain available.",
      "Add a Whitelisted App",
      "Example: Forest / Notion / Calculator",
      "Add to Whitelist",
      "Current Whitelist",
      "There are currently no whitelisted apps."
    ]
  },

  "focusflow-07-growth-settings.jpg": {
    title: "Growth and Coin Settings",
    lines: [
      "Growth",
      "Knowledge",
      "Work",
      "Daily Life",
      "Health",
      "Appearance",
      "Social",
      "Self-Discipline",
      "Settings",
      "Ringtone Settings",
      "Whitelist App Settings",
      "Coin Distribution Method",
      "System Default",
      "Choose Each Time",
      "Default Coin Amount"
    ]
  },

  "focusflow-08-store.jpg": {
    title: "Reward Store",
    lines: [
      "Store",
      "Coin Balance",
      "100 Coins",
      "Locked",
      "Redemption History"
    ]
  }
};

const lightbox =
  document.getElementById(
    "imageLightbox"
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

const translationToggle =
  document.getElementById(
    "translationToggle"
  );

const translationPanel =
  document.getElementById(
    "translationPanel"
  );

const translationTitle =
  document.getElementById(
    "translationTitle"
  );

const translationContent =
  document.getElementById(
    "translationContent"
  );

const imageButtons =
  document.querySelectorAll(
    ".image-button"
  );

let activeTranslation = null;

function getImageFileName(
  source
) {
  try {
    const url =
      new URL(
        source,
        window.location.href
      );

    return decodeURIComponent(
      url.pathname
        .split("/")
        .pop()
    );
  } catch {
    return source
      .split("/")
      .pop()
      .split("?")[0];
  }
}

function closeTranslation() {
  translationPanel.hidden = true;

  translationToggle.textContent =
    "VIEW ENGLISH TEXT";
}

function prepareTranslation(
  imageSource
) {
  const fileName =
    getImageFileName(
      imageSource
    );

  activeTranslation =
    imageTranslations[
      fileName
    ] || null;

  closeTranslation();

  if (!activeTranslation) {
    translationToggle.hidden =
      true;

    translationTitle.textContent =
      "";

    translationContent.innerHTML =
      "";

    return;
  }

  translationToggle.hidden =
    false;

  translationTitle.textContent =
    activeTranslation.title;

  translationContent.innerHTML =
    "";

  activeTranslation.lines.forEach(
    line => {
      const paragraph =
        document.createElement(
          "p"
        );

      paragraph.textContent =
        line;

      translationContent.appendChild(
        paragraph
      );
    }
  );
}

function openLightbox(
  source,
  alt,
  caption
) {
  lightboxImage.src =
    source;

  lightboxImage.alt =
    alt || caption || "";

  lightboxCaption.textContent =
    caption || "";

  prepareTranslation(
    source
  );

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

  closeTranslation();

  window.setTimeout(
    () => {
      lightboxImage.src = "";
    },
    350
  );
}

imageButtons.forEach(
  button => {
    button.addEventListener(
      "click",
      () => {
        const image =
          button.querySelector(
            "img"
          );

        const caption =
          button.dataset.caption ||
          "";

        openLightbox(
          image.currentSrc ||
            image.src,
          image.alt,
          caption
        );
      }
    );
  }
);

translationToggle?.addEventListener(
  "click",
  () => {
    if (!activeTranslation) {
      return;
    }

    const willOpen =
      translationPanel.hidden;

    translationPanel.hidden =
      !willOpen;

    translationToggle.textContent =
      willOpen
        ? "HIDE ENGLISH TEXT"
        : "VIEW ENGLISH TEXT";
  }
);

lightboxClose?.addEventListener(
  "click",
  closeLightbox
);

lightbox?.addEventListener(
  "click",
  event => {
    if (
      event.target ===
      lightbox
    ) {
      closeLightbox();
    }
  }
);

document.addEventListener(
  "keydown",
  event => {
    if (
      event.key === "Escape" &&
      lightbox?.classList.contains(
        "is-open"
      )
    ) {
      closeLightbox();
    }
  }
);

/* =========================
   页面淡出跳转
   ========================= */

const pageLinks =
  document.querySelectorAll(
    ".page-link"
  );

pageLinks.forEach(
  link => {
    link.addEventListener(
      "click",
      event => {
        const destination =
          link.getAttribute(
            "href"
          );

        if (!destination) {
          return;
        }

        event.preventDefault();

        document.body.classList.add(
          "is-leaving"
        );

        window.setTimeout(
          () => {
            window.location.href =
              destination;
          },
          360
        );
      }
    );
  }
);
/*
  播放一个视频时，
  自动暂停页面中的其他视频。
*/
const portfolioVideos =
  document.querySelectorAll(
    ".portfolio-video"
  );

portfolioVideos.forEach(
  activeVideo => {
    activeVideo.addEventListener(
      "play",
      () => {
        portfolioVideos.forEach(
          otherVideo => {
            if (
              otherVideo !==
              activeVideo
            ) {
              otherVideo.pause();
            }
          }
        );
      }
    );
  }
);