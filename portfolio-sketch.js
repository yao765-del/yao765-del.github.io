"use strict";

/*
  个人照片路径。
  照片是 PNG 时，将 jpg 改成 png。
*/
const PORTRAIT_PATH =
  "./assets/images/portrait/portrait-home.jpg";

/*
  原始粒子参数。

  粒子数量、扩散范围、聚合速度和鼠标效果
  保持原来的设置。
*/
const PARTICLE_SETTINGS = {
  desktopGap: 6,
  mobileGap: 7,

  spring: 0.022,
  friction: 0.84,

  maximumDelay: 950,

  mouseRadius: 82,

  /*
    鼠标进入照片区域后，
    先让粒子反应一小段时间。
  */
  photoRevealDelay: 320,

  /*
    真实照片显露所需时间。
  */
  photoRevealDuration: 1800
};

let portraitImage;
let portraitImageFailed = false;

let particles = [];
let portraitBuffer;

let pageBackgroundColor;

let animationStartedAt = 0;
let formedEventSent = false;

let activeCategory = "";

let realPortraitElement = null;

/*
  鼠标是否已经触发真实照片。
*/
let photoRevealTriggered = false;

/*
  鼠标第一次进入照片区域的时间。
*/
let photoRevealTriggeredAt = 0;

/*
  真实照片当前显示程度。
  0 代表完全透明。
  1 代表完全显示。
*/
let photoRevealAmount = 0;

/*
  提前加载照片。
*/
function preload() {
  portraitImage = loadImage(
    PORTRAIT_PATH,

    () => {
      portraitImageFailed = false;
    },

    () => {
      portraitImageFailed = true;
    }
  );
}

/*
  初始化页面。
*/
function setup() {
  const canvas = createCanvas(
    windowWidth,
    windowHeight
  );

  canvas.parent("particleStage");

  pixelDensity(
    Math.min(
      window.devicePixelRatio || 1,
      2
    )
  );

  noStroke();

  pageBackgroundColor =
    readBackgroundColor();

  realPortraitElement =
    document.getElementById(
      "realPortrait"
    );

  if (!realPortraitElement) {
    console.error(
      "Could not find #realPortrait."
    );
  }

  if (
    portraitImageFailed ||
    !portraitImage ||
    portraitImage.width <= 1
  ) {
    showImageError();
    noLoop();
    return;
  }

  buildPortraitParticles();
  positionRealPortrait();

  if (realPortraitElement) {
    realPortraitElement.style.opacity =
      "0";
  }

  animationStartedAt = millis();
}

/*
  每一帧更新粒子和照片。
*/
function draw() {
  background(pageBackgroundColor);

  const now = millis();

  const elapsed =
    now - animationStartedAt;

  /*
    粒子已经基本形成以后，
    才允许鼠标触发真实照片。
  */
  if (
    !photoRevealTriggered &&
    elapsed > 1700 &&
    pointerIsInsidePortrait() &&
    pointerHasMoved()
  ) {
    photoRevealTriggered = true;
    photoRevealTriggeredAt = now;
  }

  /*
    鼠标触发后先等待 0.32 秒。

    这段时间内，原有鼠标推开粒子的效果
    会先被用户看到。
  */
  if (photoRevealTriggered) {
    const revealElapsed =
      now -
      photoRevealTriggeredAt -
      PARTICLE_SETTINGS
        .photoRevealDelay;

    const rawRevealProgress =
      constrain(
        revealElapsed /
          PARTICLE_SETTINGS
            .photoRevealDuration,
        0,
        1
      );

    /*
      平滑缓入缓出。
    */
    photoRevealAmount =
      rawRevealProgress *
      rawRevealProgress *
      (
        3 -
        2 * rawRevealProgress
      );
  } else {
    photoRevealAmount = 0;
  }

  /*
    真实照片从粒子后方显露。
  */
  if (realPortraitElement) {
    realPortraitElement.style.opacity =
      photoRevealAmount.toFixed(3);
  }

  /*
    照片显露时，粒子逐渐变淡。

    最后仍保留少量粒子，
    避免突然完全消失。
  */
  const particleOpacity =
    lerp(
      1,
      0.07,
      photoRevealAmount
    );

  for (const particle of particles) {
    particle.update(elapsed);

    particle.display(
      particleOpacity
    );
  }

  /*
    照片完全显露后，
    通知 portfolio.js 显示右侧三个入口。
  */
  /*
  真实照片开始显露 0.5 秒后，
  显示右侧作品入口。
*/
if (
  !formedEventSent &&
  photoRevealTriggered &&
  now -
    photoRevealTriggeredAt -
    PARTICLE_SETTINGS.photoRevealDelay >=
    500
) {
  formedEventSent = true;

  window.dispatchEvent(
    new CustomEvent(
      "portrait-formed"
    )
  );
}
}

/*
  读取网页底色。
*/
function readBackgroundColor() {
  const cssValue =
    getComputedStyle(
      document.documentElement
    )
      .getPropertyValue("--paper")
      .trim();

  if (cssValue) {
    return color(cssValue);
  }

  return color("#f4f0e8");
}

/*
  照片的位置和大小。

  桌面端位于姓名下方左侧。
*/
function calculatePortraitBox() {
  const isMobile = width < 760;

  if (isMobile) {
    const portraitRatio = 0.68;

    const portraitWidth = Math.min(
      width * 0.64,
      280
    );

    const portraitHeight =
      portraitWidth / portraitRatio;

    return {
      left:
        width * 0.5 -
        portraitWidth * 0.5,

      top: 112,

      width: Math.round(
        portraitWidth
      ),

      height: Math.round(
        portraitHeight
      )
    };
  }

  const portraitRatio = 0.66;

  const portraitWidth = Math.min(
    Math.max(
      width * 0.14,
      190
    ),
    230
  );

  const portraitHeight =
    portraitWidth / portraitRatio;

  return {
    left: 34,
    top: 112,

    width: Math.round(
      portraitWidth
    ),

    height: Math.round(
      portraitHeight
    )
  };
}

/*
  让真实照片和粒子照片完全重合。
*/
function positionRealPortrait() {
  if (!realPortraitElement) {
    return;
  }

  const portraitBox =
    calculatePortraitBox();

  realPortraitElement.style.left =
    `${portraitBox.left}px`;

  realPortraitElement.style.top =
    `${portraitBox.top}px`;

  realPortraitElement.style.width =
    `${portraitBox.width}px`;

  realPortraitElement.style.height =
    `${portraitBox.height}px`;
}

/*
  判断鼠标是否在照片区域内。
*/
function pointerIsInsidePortrait() {
  const portraitBox =
    calculatePortraitBox();

  /*
    触发范围比照片稍微大一点。
  */
  const padding = 24;

  return (
    mouseX >=
      portraitBox.left -
        padding &&

    mouseX <=
      portraitBox.left +
        portraitBox.width +
        padding &&

    mouseY >=
      portraitBox.top -
        padding &&

    mouseY <=
      portraitBox.top +
        portraitBox.height +
        padding
  );
}

/*
  判断鼠标是否真的移动过。
  避免页面打开时鼠标刚好停在那里。
*/
function pointerHasMoved() {
  return (
    abs(mouseX - pmouseX) +
      abs(mouseY - pmouseY) >
    0.35
  );
}

/*
  从照片像素创建粒子。
*/
function buildPortraitParticles() {
  particles = [];

  const portraitBox =
    calculatePortraitBox();

  portraitBuffer = createGraphics(
    portraitBox.width,
    portraitBox.height
  );

  portraitBuffer.pixelDensity(1);
  portraitBuffer.clear();

  /*
    使用 cover 方式裁切照片。
  */
  const scaleAmount = Math.max(
    portraitBox.width /
      portraitImage.width,

    portraitBox.height /
      portraitImage.height
  );

  const drawingWidth =
    portraitImage.width *
    scaleAmount;

  const drawingHeight =
    portraitImage.height *
    scaleAmount;

  /*
    保留脸部所在的左侧区域。
  */
  const drawingX =
    (
      portraitBox.width -
      drawingWidth
    ) * 0.35;

  const drawingY =
    (
      portraitBox.height -
      drawingHeight
    ) * 0.46;

  portraitBuffer.image(
    portraitImage,
    drawingX,
    drawingY,
    drawingWidth,
    drawingHeight
  );

  portraitBuffer.loadPixels();

  const isMobile = width < 760;

  const gap = isMobile
    ? PARTICLE_SETTINGS.mobileGap
    : PARTICLE_SETTINGS.desktopGap;

  const paperRed =
    red(pageBackgroundColor);

  const paperGreen =
    green(pageBackgroundColor);

  const paperBlue =
    blue(pageBackgroundColor);

  for (
    let sampleY = 0;
    sampleY <
      portraitBuffer.height;
    sampleY += gap
  ) {
    for (
      let sampleX = 0;
      sampleX <
        portraitBuffer.width;
      sampleX += gap
    ) {
      const pixelIndex =
        4 *
        (
          sampleX +
          sampleY *
            portraitBuffer.width
        );

      const pixelRed =
        portraitBuffer.pixels[
          pixelIndex
        ];

      const pixelGreen =
        portraitBuffer.pixels[
          pixelIndex + 1
        ];

      const pixelBlue =
        portraitBuffer.pixels[
          pixelIndex + 2
        ];

      const pixelAlpha =
        portraitBuffer.pixels[
          pixelIndex + 3
        ];

      if (pixelAlpha < 40) {
        continue;
      }

      /*
        浅色背景区域减少粒子，
        避免形成生硬矩形。
      */
      const differenceFromPaper =
        Math.abs(
          pixelRed - paperRed
        ) +
        Math.abs(
          pixelGreen - paperGreen
        ) +
        Math.abs(
          pixelBlue - paperBlue
        );

      let keepChance = 1;

      if (
        differenceFromPaper < 22
      ) {
        keepChance = 0.08;
      } else if (
        differenceFromPaper < 48
      ) {
        keepChance = 0.28;
      } else if (
        differenceFromPaper < 78
      ) {
        keepChance = 0.62;
      }

      if (
        random() > keepChance
      ) {
        continue;
      }

      /*
        原来的粒子初始位置。

        大部分粒子散布在整个屏幕，
        一部分从屏幕四周进入。
      */
      const start =
        createParticleStartPosition();

      const targetX =
        portraitBox.left +
        sampleX +
        random(-0.7, 0.7);

      const targetY =
        portraitBox.top +
        sampleY +
        random(-0.7, 0.7);

      const largeParticle =
        random() < 0.11;

      const particleSize =
        largeParticle
          ? random(2.7, 4.8)
          : random(0.8, 2.2);

      particles.push(
        new PortraitParticle({
          startX: start.x,
          startY: start.y,

          targetX,
          targetY,

          red: pixelRed,
          green: pixelGreen,
          blue: pixelBlue,

          alpha:
            random(185, 245),

          size: particleSize,

          delay: random(
            0,
            PARTICLE_SETTINGS
              .maximumDelay
          )
        })
      );
    }
  }

  console.log(
    `Portrait particles: ${particles.length}`
  );
}

/*
  保留原来的粒子扩散方式。
*/
function createParticleStartPosition() {
  if (random() < 0.68) {
    return {
      x: random(width),
      y: random(height)
    };
  }

  const margin = 90;
  const side = floor(random(4));

  if (side === 0) {
    return {
      x: random(
        -margin,
        width + margin
      ),
      y: -margin
    };
  }

  if (side === 1) {
    return {
      x: width + margin,
      y: random(
        -margin,
        height + margin
      )
    };
  }

  if (side === 2) {
    return {
      x: random(
        -margin,
        width + margin
      ),
      y: height + margin
    };
  }

  return {
    x: -margin,
    y: random(
      -margin,
      height + margin
    )
  };
}

/*
  单个粒子。
*/
class PortraitParticle {
  constructor(options) {
    this.x = options.startX;
    this.y = options.startY;

    this.targetX =
      options.targetX;

    this.targetY =
      options.targetY;

    this.velocityX =
      random(-1.2, 1.2);

    this.velocityY =
      random(-1.2, 1.2);

    this.red = options.red;
    this.green = options.green;
    this.blue = options.blue;

    this.maximumAlpha =
      options.alpha;

    this.alpha = 0;

    this.size =
      options.size;

    this.delay =
      options.delay;

    this.phase =
      random(TWO_PI);

    this.driftSpeed =
      random(
        0.00065,
        0.00125
      );

    this.driftAmount =
      random(0.18, 0.62);
  }

  update(elapsed) {
    /*
      粒子等待阶段。
    */
    if (elapsed < this.delay) {
      this.alpha +=
        (
          this.maximumAlpha *
            0.16 -
          this.alpha
        ) * 0.04;

      this.x +=
        sin(
          elapsed * 0.001 +
          this.phase
        ) * 0.08;

      this.y +=
        cos(
          elapsed * 0.001 +
          this.phase
        ) * 0.08;

      return;
    }

    let categoryMultiplier = 1;

    if (
      activeCategory ===
      "modeling"
    ) {
      categoryMultiplier = 1.7;
    }

    if (
      activeCategory ===
      "game-design"
    ) {
      categoryMultiplier = 2.15;
    }

    if (
      activeCategory ===
      "personal-app"
    ) {
      categoryMultiplier = 1.35;
    }

    /*
      原来的照片形成后轻微漂浮。
    */
    const movingTargetX =
      this.targetX +
      sin(
        elapsed *
          this.driftSpeed +
        this.phase
      ) *
        this.driftAmount *
        categoryMultiplier;

    const movingTargetY =
      this.targetY +
      cos(
        elapsed *
          this.driftSpeed +
        this.phase
      ) *
        this.driftAmount *
        categoryMultiplier;

    const distanceX =
      movingTargetX -
      this.x;

    const distanceY =
      movingTargetY -
      this.y;

    this.velocityX +=
      distanceX *
      PARTICLE_SETTINGS.spring;

    this.velocityY +=
      distanceY *
      PARTICLE_SETTINGS.spring;

    this.velocityX *=
      PARTICLE_SETTINGS.friction;

    this.velocityY *=
      PARTICLE_SETTINGS.friction;

    /*
      保留原来的鼠标推开粒子效果。
    */
    if (
      elapsed > 1700 &&
      mouseX >= 0 &&
      mouseX <= width &&
      mouseY >= 0 &&
      mouseY <= height
    ) {
      const mouseDistanceX =
        this.x - mouseX;

      const mouseDistanceY =
        this.y - mouseY;

      const distanceSquared =
        mouseDistanceX *
          mouseDistanceX +
        mouseDistanceY *
          mouseDistanceY;

      const radius =
        PARTICLE_SETTINGS
          .mouseRadius;

      if (
        distanceSquared <
        radius * radius
      ) {
        const actualDistance =
          Math.sqrt(
            Math.max(
              distanceSquared,
              0.001
            )
          );

        const force =
          (
            1 -
            actualDistance / radius
          ) * 0.72;

        this.velocityX +=
          (
            mouseDistanceX /
            actualDistance
          ) * force;

        this.velocityY +=
          (
            mouseDistanceY /
            actualDistance
          ) * force;
      }
    }

    this.x += this.velocityX;
    this.y += this.velocityY;

    this.alpha +=
      (
        this.maximumAlpha -
        this.alpha
      ) * 0.065;
  }

  display(
    opacityMultiplier = 1
  ) {
    fill(
      this.red,
      this.green,
      this.blue,
      this.alpha *
        opacityMultiplier
    );

    circle(
      this.x,
      this.y,
      this.size
    );
  }
}

/*
  记录右侧悬停分类。
*/
window.addEventListener(
  "portfolio-category-change",
  (event) => {
    activeCategory =
      event.detail.category || "";
  }
);

/*
  浏览器尺寸改变时重新生成。
*/
function windowResized() {
  resizeCanvas(
    windowWidth,
    windowHeight
  );

  pageBackgroundColor =
    readBackgroundColor();

  formedEventSent = false;

  photoRevealTriggered = false;
  photoRevealTriggeredAt = 0;
  photoRevealAmount = 0;

  document.body.classList.remove(
    "is-ready"
  );

  if (realPortraitElement) {
    realPortraitElement.style.opacity =
      "0";
  }

  buildPortraitParticles();
  positionRealPortrait();

  animationStartedAt = millis();
}

/*
  图片读取失败提示。
*/
function showImageError() {
  const errorElement =
    document.getElementById(
      "imageError"
    );

  if (errorElement) {
    errorElement.hidden = false;
  }

  console.error(
    "Portrait image could not be loaded:",
    PORTRAIT_PATH
  );
}