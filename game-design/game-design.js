const PAGE_FOLDER =
  "../assets/images/projects/game-design/book/";

const MAX_CHECK_PAGES = 100;

const book =
  document.getElementById(
    "book"
  );

const leftSheet =
  document.getElementById(
    "leftSheet"
  );

const rightSheet =
  document.getElementById(
    "rightSheet"
  );

const leftImage =
  document.getElementById(
    "leftPage"
  );

const rightImage =
  document.getElementById(
    "rightPage"
  );

const leftNumber =
  document.getElementById(
    "leftNumber"
  );

const rightNumber =
  document.getElementById(
    "rightNumber"
  );

const previousButton =
  document.getElementById(
    "prevPage"
  );

const nextButton =
  document.getElementById(
    "nextPage"
  );

const counter =
  document.getElementById(
    "pageCounter"
  );

let totalPages = 0;

/*
  当前状态：

  0 = 正封面
  1 = 第一组正文
  2 = 第二组正文
  ...
  最后一个 = 背封面
*/
let spreadIndex = 0;

function pagePath(
  pageNumber
) {
  return (
    PAGE_FOLDER +
    "game-page-" +
    String(pageNumber)
      .padStart(2, "0") +
    ".png"
  );
}

function imageExists(
  pageNumber
) {
  return new Promise(
    resolve => {
      const image =
        new Image();

      image.onload =
        () => resolve(true);

      image.onerror =
        () => resolve(false);

      image.src =
        pagePath(pageNumber);
    }
  );
}

async function detectPages() {
  totalPages = 0;

  for (
    let page = 1;
    page <= MAX_CHECK_PAGES;
    page += 1
  ) {
    const exists =
      await imageExists(page);

    if (!exists) {
      break;
    }

    totalPages = page;
  }

  if (totalPages === 0) {
    counter.textContent =
      "NO PAGES FOUND";

    return;
  }

  /*
    预加载全部页面。
  */
  for (
    let page = 1;
    page <= totalPages;
    page += 1
  ) {
    const image =
      new Image();

    image.src =
      pagePath(page);
  }

  renderBook();
}

function clearSheet(
  sheet,
  image,
  number
) {
  sheet.classList.add(
    "is-empty"
  );

  image.removeAttribute(
    "src"
  );

  image.alt = "";

  number.textContent = "";
}

function showPage(
  pageNumber,
  sheet,
  image,
  number
) {
  if (
    pageNumber < 1 ||
    pageNumber > totalPages
  ) {
    clearSheet(
      sheet,
      image,
      number
    );

    return;
  }

  sheet.classList.remove(
    "is-empty"
  );

  image.src =
    pagePath(pageNumber);

  image.alt =
    `Game design document page ${pageNumber}`;

  number.textContent =
    String(pageNumber)
      .padStart(2, "0");
}

function getMiddleSpreads() {
  const spreads = [];

  /*
    第 1 页是封面。
    最后一页是背封面。
    所以正文从 2 开始，
    到 totalPages - 1 结束。
  */
  let page = 2;

  while (
    page <=
    totalPages - 1
  ) {
    const left =
      page;

    let right =
      page + 1;

    /*
      最后一页必须保留为背封面。
    */
    if (
      right >= totalPages
    ) {
      right = null;
    }

    spreads.push({
      left,
      right
    });

    page += 2;
  }

  return spreads;
}

function getStates() {
  const states = [];

  /*
    正封面。
  */
  states.push({
    type: "cover",
    page: 1
  });

  const middle =
    getMiddleSpreads();

  middle.forEach(
    spread => {
      states.push({
        type: "spread",
        left: spread.left,
        right: spread.right
      });
    }
  );

  /*
    总页数超过 1 时，
    最后一页永远单独作为背封面。
  */
  if (totalPages > 1) {
    states.push({
      type: "back",
      page: totalPages
    });
  }

  return states;
}

function renderBook() {
  const states =
    getStates();

  spreadIndex =
    Math.max(
      0,
      Math.min(
        spreadIndex,
        states.length - 1
      )
    );

  const state =
    states[spreadIndex];

  if (
    state.type === "cover" ||
    state.type === "back"
  ) {
    book.classList.add(
      "is-single"
    );

    showPage(
      state.page,
      leftSheet,
      leftImage,
      leftNumber
    );

    clearSheet(
      rightSheet,
      rightImage,
      rightNumber
    );

    counter.textContent =
      state.type === "cover"
        ? `COVER · PAGE 1 / ${totalPages}`
        : `BACK COVER · PAGE ${totalPages} / ${totalPages}`;
  } else {
    book.classList.remove(
      "is-single"
    );

    showPage(
      state.left,
      leftSheet,
      leftImage,
      leftNumber
    );

    if (state.right) {
      showPage(
        state.right,
        rightSheet,
        rightImage,
        rightNumber
      );

      counter.textContent =
        `PAGES ${state.left}–${state.right} / ${totalPages}`;
    } else {
      clearSheet(
        rightSheet,
        rightImage,
        rightNumber
      );

      counter.textContent =
        `PAGE ${state.left} / ${totalPages}`;
    }
  }

  previousButton.disabled =
    spreadIndex === 0;

  nextButton.disabled =
    spreadIndex ===
    states.length - 1;
}

function animateTurn(
  direction
) {
  book.removeAttribute(
    "data-turn"
  );

  void book.offsetWidth;

  book.setAttribute(
    "data-turn",
    direction
  );

  window.setTimeout(
    () => {
      book.removeAttribute(
        "data-turn"
      );
    },
    450
  );
}

function next() {
  const states =
    getStates();

  if (
    spreadIndex >=
    states.length - 1
  ) {
    return;
  }

  spreadIndex += 1;

  renderBook();

  animateTurn("next");
}

function previous() {
  if (
    spreadIndex <= 0
  ) {
    return;
  }

  spreadIndex -= 1;

  renderBook();

  animateTurn("prev");
}

nextButton.addEventListener(
  "click",
  next
);

previousButton.addEventListener(
  "click",
  previous
);

book.addEventListener(
  "keydown",
  event => {
    if (
      event.key ===
      "ArrowRight"
    ) {
      next();
    }

    if (
      event.key ===
      "ArrowLeft"
    ) {
      previous();
    }
  }
);

detectPages();