/*
  p5.js portfolio curtain

  - 细线错落向下出现
  - 初始状态持续受到微风影响
  - 从中央向左右移动时逐根拨开
  - 帘线长度始终保持一致
  - 使用角度链代替弹簧绳，消除泡面状折线和整体弹跳
  - 左右开启进度独立保存
  - 少量中央线偶尔松动、下落并回到原位
  - ENTER 关闭时完全隐藏
  - 打开后完整显示矩形框
  - 少量真实帘线会自然经过上方两个角
*/

const BG = '#f4f0e8';
const LINE_RGB = [37, 37, 35];
const ENTER_RGB = [56, 55, 52];

/*
  点击 ENTER 后进入的页面。
  把 portfolio.html 改成你的正式作品集页面名称。
*/
const ENTER_URL = 'portfolio.html';

const STRAND_COUNT = 104;
const NODE_COUNT = 40;

let strands = [];
let maskLayer;

let curtain = {
  cx: 0,
  top: 0,
  width: 0,
  height: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

let enterBox = {
  x: 0,
  y: 0,
  w: 0,
  h: 0,
  cx: 0,
  cy: 0,
};

let leftTarget = 0;
let rightTarget = 0;

let leftOpen = 0;
let rightOpen = 0;

let gestureArmed = false;
let introFinished = false;
let hoverEnter = false;

let fading = false;
let fadeAmount = 0;
let navigationStarted = false;

let nextLooseEvent = 0;
let lastFrameTime = 0;

function setup() {
  const canvas = createCanvas(
    windowWidth,
    windowHeight
  );

  canvas.parent('p5-root');

  pixelDensity(
    Math.min(
      window.devicePixelRatio || 1,
      2
    )
  );

  strokeCap(ROUND);
  strokeJoin(ROUND);
  textAlign(CENTER, CENTER);

  rebuildScene();

  lastFrameTime = millis();
}

function rebuildScene() {
  calculateLayout();

  if (maskLayer) {
    maskLayer.remove();
  }

  maskLayer = createGraphics(
    width,
    height
  );

  maskLayer.pixelDensity(1);

  strands = [];

  const gap =
    curtain.width /
    (STRAND_COUNT - 1);

  for (
    let i = 0;
    i < STRAND_COUNT;
    i += 1
  ) {
    const x =
      curtain.left +
      i * gap;

    const side =
      x < curtain.cx
        ? -1
        : 1;

    const rank = constrain(
      abs(x - curtain.cx) /
        (curtain.width * 0.5),
      0,
      1
    );

    strands.push(
      new CurtainStrand(
        i,
        x,
        side,
        rank
      )
    );
  }

  nextLooseEvent =
    millis() +
    random(3600, 5600);
}

function calculateLayout() {
  curtain.width = min(
    430,
    width * 0.54
  );

  curtain.height = min(
    480,
    height * 0.6
  );

  curtain.cx =
    width * 0.5;

  curtain.top = max(
    48,
    height * 0.5 -
      curtain.height * 0.57
  );

  curtain.left =
    curtain.cx -
    curtain.width * 0.5;

  curtain.right =
    curtain.cx +
    curtain.width * 0.5;

  curtain.bottom =
    curtain.top +
    curtain.height;

  enterBox.w = min(
    154,
    curtain.width * 0.39
  );

  enterBox.h = 58;

  enterBox.cx =
    curtain.cx;

  enterBox.cy =
    curtain.top +
    curtain.height * 0.54;

  enterBox.x =
    enterBox.cx -
    enterBox.w * 0.5;

  enterBox.y =
    enterBox.cy -
    enterBox.h * 0.5;
}

function draw() {
  background(BG);

  const now = millis();

  const dt = constrain(
    (now - lastFrameTime) /
      16.6667,
    0.45,
    1.8
  );

  lastFrameTime = now;

  introFinished =
    now > 2200;

  updateGlobalOpening(dt);
  updateLooseEvents(now);
  updateHoverState();

  /*
    绘制顺序：

    ENTER
    稳定遮挡层
    帘线
  */
  drawEnterBox();
  drawStableEnterMask();

  for (const strand of strands) {
    strand.update(
      now,
      dt
    );
  }

  /*
    外侧线先绘制。

    中央线后绘制，
    让中央汇聚区域更自然。
  */
  const ordered = [
    ...strands,
  ].sort(
    (a, b) =>
      b.rank - a.rank
  );

  for (const strand of ordered) {
    strand.draw(now);
  }

  drawFadeTransition();
}

function updateGlobalOpening(dt) {
  /*
    开启进度只使用平滑跟随。

    不使用整体弹簧，
    因此不会反复弹动。
  */
  const openFollow =
    1 - pow(0.82, dt);

  leftOpen +=
    (
      leftTarget -
      leftOpen
    ) *
    openFollow;

  rightOpen +=
    (
      rightTarget -
      rightOpen
    ) *
    openFollow;
}

function updateLooseEvents(now) {
  const ready =
    leftOpen > 0.84 ||
    rightOpen > 0.84;

  if (
    !ready ||
    now < nextLooseEvent
  ) {
    return;
  }

  const candidates =
    strands.filter(
      (strand) => {
        const sideOpen =
          strand.side < 0
            ? leftOpen
            : rightOpen;

        return (
          sideOpen > 0.86 &&
          strand.rank < 0.42 &&
          !strand.loose.active
        );
      }
    );

  shuffle(
    candidates,
    true
  );

  /*
    大多数时候只出现一根。

    少数情况下出现两根。
  */
  const amount =
    random() < 0.78
      ? 1
      : 2;

  for (
    let i = 0;
    i <
    min(
      amount,
      candidates.length
    );
    i += 1
  ) {
    candidates[
      i
    ].startLooseEvent(now);
  }

  nextLooseEvent =
    now +
    random(4700, 8200);
}

function updateHoverState() {
  hoverEnter =
    enterReady() &&
    pointInsideEnter(
      mouseX,
      mouseY
    ) &&
    !fading;

  cursor(
    hoverEnter
      ? HAND
      : ARROW
  );
}

function enterReady() {
  return (
    introFinished &&
    leftOpen > 0.965 &&
    rightOpen > 0.965
  );
}

function pointInsideEnter(
  x,
  y
) {
  return (
    x >= enterBox.x - 8 &&
    x <=
      enterBox.x +
        enterBox.w +
        8 &&
    y >= enterBox.y - 8 &&
    y <=
      enterBox.y +
        enterBox.h +
        8
  );
}

function drawEnterBox() {
  push();

  translate(
    enterBox.cx,
    enterBox.cy
  );

  const scaleAmount =
    hoverEnter
      ? 1.018
      : 1;

  const alpha =
    hoverEnter
      ? 235
      : 192;

  scale(scaleAmount);

  rectMode(CENTER);

  stroke(
    ENTER_RGB[0],
    ENTER_RGB[1],
    ENTER_RGB[2],
    alpha
  );

  strokeWeight(1.05);

  noFill();

  /*
    始终绘制完整矩形。

    是否显示由遮挡层控制，
    因此不会缺少两个角。
  */
  rect(
    0,
    0,
    enterBox.w,
    enterBox.h
  );

  noStroke();

  fill(
    ENTER_RGB[0],
    ENTER_RGB[1],
    ENTER_RGB[2],
    alpha
  );

  textFont('Arial');
  textStyle(NORMAL);
  textSize(13);

  drawSpacedText(
    'ENTER',
    0,
    1,
    hoverEnter
      ? 4.4
      : 3.7
  );

  pop();
}

function drawSpacedText(
  value,
  cx,
  cy,
  spacing
) {
  const widths = [];
  let total = 0;

  for (
    let i = 0;
    i < value.length;
    i += 1
  ) {
    const characterWidth =
      textWidth(value[i]);

    widths.push(
      characterWidth
    );

    total +=
      characterWidth;

    if (
      i <
      value.length - 1
    ) {
      total += spacing;
    }
  }

  let x =
    cx -
    total * 0.5;

  for (
    let i = 0;
    i < value.length;
    i += 1
  ) {
    text(
      value[i],
      x +
        widths[i] * 0.5,
      cy
    );

    x +=
      widths[i] +
      spacing;
  }
}

function drawStableEnterMask() {
  maskLayer.clear();

  maskLayer.noStroke();
  maskLayer.fill(BG);

  const padX = 28;
  const padY = 18;

  /*
    关闭状态下，
    背景色完全覆盖 ENTER。
  */
  maskLayer.rect(
    enterBox.x - padX,
    enterBox.y - padY,
    enterBox.w +
      padX * 2,
    enterBox.h +
      padY * 2
  );

  const leftReveal =
    smoothstep(
      0.08,
      0.97,
      leftOpen
    );

  const rightReveal =
    smoothstep(
      0.08,
      0.97,
      rightOpen
    );

  const openingLeft =
    lerp(
      enterBox.cx,
      enterBox.x - 7,
      leftReveal
    );

  const openingRight =
    lerp(
      enterBox.cx,
      enterBox.x +
        enterBox.w +
        7,
      rightReveal
    );

  if (
    openingRight -
      openingLeft >
    0.8
  ) {
    const context =
      maskLayer
        .drawingContext;

    context.save();

    context
      .globalCompositeOperation =
      'destination-out';

    maskLayer.fill(255);

    /*
      从中央向两侧逐渐露出完整方框。

      完全打开后，
      方框的四个角都会存在。

      后绘制的真实帘线会自然经过
      上方两个角附近。
    */
    maskLayer.rect(
      openingLeft,
      enterBox.y - 7,
      max(
        0,
        openingRight -
          openingLeft
      ),
      enterBox.h + 14,
      2
    );

    context.restore();
  }

  image(
    maskLayer,
    0,
    0,
    width,
    height
  );
}

function drawFadeTransition() {
  if (!fading) {
    return;
  }

  fadeAmount = min(
    255,
    fadeAmount + 8
  );

  noStroke();

  fill(
    244,
    240,
    232,
    fadeAmount
  );

  rect(
    0,
    0,
    width,
    height
  );

  if (
    fadeAmount >= 255 &&
    !navigationStarted
  ) {
    navigationStarted =
      true;

    window.location.href =
      ENTER_URL;
  }
}

function handlePointer(
  x,
  y
) {
  if (
    !introFinished ||
    fading
  ) {
    return;
  }

  const validY =
    y >
      curtain.top +
        curtain.height *
          0.18 &&
    y <
      curtain.bottom +
        28;

  const centreZone =
    max(
      24,
      curtain.width *
        0.06
    );

  /*
    第一次交互必须经过帘幕中央。
  */
  if (!gestureArmed) {
    if (
      validY &&
      abs(
        x -
          curtain.cx
      ) <= centreZone
    ) {
      gestureArmed =
        true;
    } else {
      return;
    }
  }

  const maxTravel =
    curtain.width *
    0.47;

  if (
    x >= curtain.cx
  ) {
    const progress =
      constrain(
        (
          x -
          curtain.cx
        ) /
          maxTravel,
        0,
        1
      );

    rightTarget =
      max(
        rightTarget,
        progress
      );
  } else {
    const progress =
      constrain(
        (
          curtain.cx -
          x
        ) /
          maxTravel,
        0,
        1
      );

    leftTarget =
      max(
        leftTarget,
        progress
      );
  }
}

function mouseMoved() {
  handlePointer(
    mouseX,
    mouseY
  );

  return false;
}

function mouseDragged() {
  handlePointer(
    mouseX,
    mouseY
  );

  return false;
}

function mousePressed() {
  if (
    enterReady() &&
    pointInsideEnter(
      mouseX,
      mouseY
    )
  ) {
    fading = true;

    return false;
  }

  handlePointer(
    mouseX,
    mouseY
  );

  return false;
}

function touchStarted() {
  if (
    touches.length > 0
  ) {
    const touch =
      touches[0];

    if (
      enterReady() &&
      pointInsideEnter(
        touch.x,
        touch.y
      )
    ) {
      fading = true;

      return false;
    }

    handlePointer(
      touch.x,
      touch.y
    );
  }

  return false;
}

function touchMoved() {
  if (
    touches.length > 0
  ) {
    handlePointer(
      touches[0].x,
      touches[0].y
    );
  }

  return false;
}

function keyPressed() {
  /*
    测试时按键盘 R，
    可以让帘幕重新关闭。
  */
  if (
    key === 'r' ||
    key === 'R'
  ) {
    leftTarget = 0;
    rightTarget = 0;

    leftOpen = 0;
    rightOpen = 0;

    gestureArmed = false;

    fading = false;
    fadeAmount = 0;
    navigationStarted = false;

    rebuildScene();
  }
}

function windowResized() {
  resizeCanvas(
    windowWidth,
    windowHeight
  );

  rebuildScene();
}

class CurtainStrand {
  constructor(
    index,
    anchorX,
    side,
    rank
  ) {
    this.index = index;
    this.anchorX = anchorX;
    this.side = side;
    this.rank = rank;

    /*
      所有线段长度完全一致。
    */
    this.segmentLength =
      curtain.height /
      (NODE_COUNT - 1);

    this.points = [];
    this.driverAngles = [];
    this.angles = [];

    this.openValue = 0;

    this.windPhase =
      random(TWO_PI);

    this.windPhase2 =
      random(TWO_PI);

    this.windSpeed =
      random(
        0.00042,
        0.00062
      );

    this.windAmplitude =
      random(
        0.82,
        1.24
      );

    this.lineAlpha =
      random(
        94,
        145
      );

    this.lineWeight =
      random(
        0.47,
        0.72
      );

    this.revealDelay =
      random(
        70,
        850
      ) +
      noise(
        index * 0.18
      ) *
        260;

    this.revealDuration =
      random(
        900,
        1450
      );

    /*
      相邻线条保留轻微差异，
      防止形成完全复制的扇形。
    */
    this.bendVariation =
      random(
        -0.035,
        0.035
      );

    this.tailVariation =
      random(
        -0.025,
        0.025
      );

    this.crossDirection =
      random() < 0.5
        ? -1
        : 1;

    this.crossAmount =
      random(
        0.003,
        0.012
      ) *
      pow(
        1 - rank,
        1.8
      );

    /*
      每侧有一两根线经过 ENTER
      上方角落附近。

      方框角本身不会消失，
      只会被真实线条轻微压住。
    */
    this.cornerVeil =
      rank > 0.022 &&
      rank < 0.078;

    this.loose = {
      active: false,
      start: 0,
      duration: 0,
      amount: 0,
      kick: 0,
    };

    for (
      let i = 0;
      i < NODE_COUNT;
      i += 1
    ) {
      this.points.push({
        x: anchorX,
        y:
          curtain.top +
          i *
            this
              .segmentLength,
      });

      if (
        i <
        NODE_COUNT - 1
      ) {
        this.driverAngles.push(
          0
        );

        this.angles.push(0);
      }
    }
  }

  sideProgress() {
    return (
      this.side < 0
        ? leftOpen
        : rightOpen
    );
  }

  activationTarget() {
    const progress =
      this.sideProgress();

    /*
      中央线先被拨开。

      外侧线开始得更晚。
    */
    const threshold =
      this.rank *
      0.84;

    const activation =
      smoothstep(
        threshold,
        min(
          1.03,
          threshold +
            0.2
        ),
        progress
      );

    /*
      中央线抬升幅度最大。

      外侧线保持较多垂直状态。
    */
   const strength =
  lerp(
    1,
    0.34,
    pow(
      this.rank,
      1.02
    )
  );

    return (
      activation *
      strength
    );
  }

  startLooseEvent(now) {
    this.loose.active =
      true;

    this.loose.start =
      now;

    this.loose.duration =
      random(
        1500,
        2350
      );

    this.loose.amount =
      random(
        0.12,
        0.22
      );

    this.loose.kick =
      random(
        -0.035,
        0.035
      );
  }

  looseState(now) {
    if (
      !this.loose.active
    ) {
      return {
        release: 0,
        kick: 0,
      };
    }

    const progress =
      (
        now -
        this.loose.start
      ) /
      this.loose.duration;

    if (
      progress >= 1
    ) {
      this.loose.active =
        false;

      return {
        release: 0,
        kick: 0,
      };
    }

    /*
      先下落一小段，
      再轻微回到原位。
    */
    const releaseEnvelope =
      pow(
        sin(
          PI *
            constrain(
              progress,
              0,
              1
            )
        ),
        1.35
      );

    const rebound =
      sin(
        progress *
          PI *
          3.6
      ) *
      (
        1 -
        progress
      );

    return {
      release:
        releaseEnvelope *
        this.loose.amount,

      kick:
        rebound *
        this.loose.kick,
    };
  }

  update(
    now,
    dt
  ) {
    const target =
      this.activationTarget();

    /*
      每根线具有自己的延迟。

      不使用会持续过冲的弹簧。
    */
    const openFollow =
      1 -
      pow(
        lerp(
          0.84,
          0.89,
          this.rank
        ),
        dt
      );

    this.openValue +=
      (
        target -
        this.openValue
      ) *
      openFollow;

    const loose =
      this.looseState(now);

    for (
      let i = 0;
      i <
      this.angles.length;
      i += 1
    ) {
      const t =
        (
          i +
          0.5
        ) /
        this.angles.length;

      const targetAngle =
        this.targetAngle(
          t,
          this.openValue,
          now,
          loose
        );

      /*
        双层平滑产生柔软惯性。

        尾部跟随略慢，
        又不会反复弹跳。
      */
      const driverFollow =
        1 -
        pow(
          lerp(
            0.76,
            0.84,
            t
          ),
          dt
        );

      const angleFollow =
        1 -
        pow(
          lerp(
            0.82,
            0.9,
            t
          ),
          dt
        );

      this.driverAngles[
        i
      ] +=
        shortestAngleDifference(
          this.driverAngles[
            i
          ],
          targetAngle
        ) *
        driverFollow;

      this.angles[i] +=
        shortestAngleDifference(
          this.angles[i],
          this.driverAngles[
            i
          ]
        ) *
        angleFollow;
    }

    this.rebuildPoints();
  }

  targetAngle(
  t,
  openAmount,
  now,
  loose
) {
  const lowerWeight =
    pow(t, 1.35);

  const sharedWind =
    sin(
      now * 0.00043
    ) *
      0.58 +
    sin(
      now *
        0.00017 +
        1.1
    ) *
      0.24 +
    map(
      noise(
        now *
          0.000055
      ),
      0,
      1,
      -1,
      1
    ) *
      0.18;

  const privateWind =
    sin(
      now *
        this.windSpeed +
        this.windPhase
    ) *
      0.72 +
    sin(
      now *
        this.windSpeed *
        0.57 +
        this.windPhase2
    ) *
      0.28;

  const windAngle =
    (
      sharedWind *
        0.68 +
      privateWind *
        0.32
    ) *
    0.0115 *
    this.windAmplitude *
    lowerWeight *
    (
      1 -
      openAmount *
        0.28
    );

  if (
    openAmount <=
    0.0001
  ) {
    return windAngle;
  }

  const looseWeight =
    smoothstep(
      0.36,
      1,
      t
    );

  const localOpen =
    constrain(
      openAmount *
        (
          1 -
          loose.release *
            looseWeight
        ),
      0,
      1
    );

  const easedOpen =
    smoothstep(
      0,
      1,
      localOpen
    );

  /*
    关键修改：

    以前是中段弯一下，后段很快掉回去，
    所以线尾还在最下面。

    现在改成：
    前段开始抬起
    中后段长时间保持被拉起
    最后很小一段再轻微回收

    这样最终轮廓会更像被拉上去的窗帘。
  */
  let riseStart =
    lerp(
      0.08,
      0.16,
      this.rank
    );

  let riseEnd =
    lerp(
      0.28,
      0.40,
      this.rank
    );

  let holdEnd =
    lerp(
      0.84,
      0.90,
      this.rank
    );

  let dropEnd =
    lerp(
      0.96,
      0.985,
      this.rank
    );

  if (
    this.cornerVeil
  ) {
    riseStart = 0.18;
    riseEnd = 0.46;
    holdEnd = 0.89;
    dropEnd = 0.975;
  }

  const rise =
    smoothstep(
      riseStart,
      riseEnd,
      t
    );

  const holdDrop =
    1 -
    smoothstep(
      holdEnd,
      dropEnd,
      t
    );

  /*
    主体提拉轮廓
  */
  const mainProfile =
    rise * holdDrop;

  /*
    最末端轻微向内收一点，
    让尾部不要像头发一样继续往外垂。
  */
  const tuckProfile =
    smoothstep(
      0.84,
      1,
      t
    );

  const maxAngle =
    this.cornerVeil
      ? radians(78)
      : lerp(
          radians(84),
          radians(42),
          this.rank
        );

  const tuckAngle =
    this.cornerVeil
      ? radians(8)
      : lerp(
          radians(10),
          radians(3),
          this.rank
        );

  let openingAngle =
    this.side *
    easedOpen *
    maxAngle *
    mainProfile;

  /*
    尾部轻微回收
  */
  openingAngle +=
    -this.side *
    easedOpen *
    tuckAngle *
    tuckProfile;

  /*
    少量中央交合，保留你原本好的质感
  */
  const crossingProfile =
    sin(
      PI *
        smoothstep(
          0.60,
          0.96,
          t
        )
    ) *
    smoothstep(
      0.56,
      0.74,
      t
    );

  openingAngle +=
    this.crossDirection *
    this.crossAmount *
    crossingProfile *
    easedOpen;

  /*
    轻微个体差异
  */
  openingAngle +=
    this.side *
    easedOpen *
    (
      this.bendVariation *
        mainProfile *
        0.72 +
      this.tailVariation *
        tuckProfile *
        0.45
    );

  /*
    偶尔松动下垂时只影响中后段
  */
  openingAngle +=
    loose.kick *
    smoothstep(
      0.56,
      1,
      t
    );

  /*
    打开后依旧保留一点风
  */
  const openWind =
    windAngle *
    lerp(
      1,
      0.66,
      easedOpen
    );

  return (
    openingAngle +
    openWind
  );
}

  rebuildPoints() {
    this.points[0].x =
      this.anchorX;

    this.points[0].y =
      curtain.top;

    /*
      根据每段角度重新计算坐标。

      每一段都使用相同 segmentLength，
      所以帘线总长度不会变化。
    */
    for (
      let i = 1;
      i <
      this.points.length;
      i += 1
    ) {
      const angle =
        this.angles[
          i - 1
        ];

      const previous =
        this.points[
          i - 1
        ];

      /*
        角度 0 表示垂直向下。
      */
      this.points[i].x =
        previous.x +
        sin(angle) *
          this.segmentLength;

      this.points[i].y =
        previous.y +
        cos(angle) *
          this.segmentLength;
    }
  }

  revealAmount(now) {
    return smoothstep(
      this.revealDelay,
      this.revealDelay +
        this.revealDuration,
      now
    );
  }

  draw(now) {
    const reveal =
      this.revealAmount(now);

    if (
      reveal <= 0.001
    ) {
      return;
    }

    const lastPosition =
      reveal *
      (
        this.points.length -
        1
      );

    const wholeIndex =
      floor(lastPosition);

    const partial =
      lastPosition -
      wholeIndex;

    const visiblePoints = [];

    for (
      let i = 0;
      i <=
      min(
        wholeIndex,
        this.points.length -
          1
      );
      i += 1
    ) {
      visiblePoints.push(
        this.points[i]
      );
    }

    if (
      wholeIndex <
        this.points.length -
          1 &&
      partial > 0
    ) {
      const a =
        this.points[
          wholeIndex
        ];

      const b =
        this.points[
          wholeIndex + 1
        ];

      visiblePoints.push({
        x: lerp(
          a.x,
          b.x,
          partial
        ),

        y: lerp(
          a.y,
          b.y,
          partial
        ),
      });
    }

    if (
      visiblePoints.length <
      2
    ) {
      return;
    }

    const darknessBoost =
      this.openValue >
      0.18
        ? 7
        : 0;

    stroke(
      LINE_RGB[0],
      LINE_RGB[1],
      LINE_RGB[2],
      this.lineAlpha +
        darknessBoost
    );

    strokeWeight(
      this.lineWeight
    );

    noFill();

    /*
      curveVertex 会把节点连接成平滑曲线。

      不再出现之前连续折角形成的泡面轮廓。
    */
    beginShape();

    const first =
      visiblePoints[0];

    curveVertex(
      first.x,
      first.y
    );

    curveVertex(
      first.x,
      first.y
    );

    for (
      const point of
      visiblePoints
    ) {
      curveVertex(
        point.x,
        point.y
      );
    }

    const last =
      visiblePoints[
        visiblePoints.length -
          1
      ];

    curveVertex(
      last.x,
      last.y
    );

    curveVertex(
      last.x,
      last.y
    );

    endShape();
  }
}

function shortestAngleDifference(
  from,
  to
) {
  return atan2(
    sin(to - from),
    cos(to - from)
  );
}

function smoothstep(
  edge0,
  edge1,
  value
) {
  if (
    edge0 === edge1
  ) {
    return value < edge0
      ? 0
      : 1;
  }

  const x = constrain(
    (
      value -
      edge0
    ) /
      (
        edge1 -
        edge0
      ),
    0,
    1
  );

  return (
    x *
    x *
    (
      3 -
      2 * x
    )
  );
}