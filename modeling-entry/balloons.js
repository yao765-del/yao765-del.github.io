"use strict";

const balloonPreview = (p) => {
  let holder = null;
  let balloons = [];
  let lastTime = 0;

  const pointer = {
    active: false,
    wasActive: false,
    x: 0,
    y: 0,
    previousX: 0,
    previousY: 0,
    velocityX: 0,
    velocityY: 0,
    speed: 0
  };

  const clamp = (value, minimum, maximum) =>
    Math.min(Math.max(value, minimum), maximum);

  const lerpValue = (start, end, amount) =>
    start + (end - start) * amount;

  function stageSize() {
    return {
      width: Math.max(
        1,
        holder ? holder.clientWidth : 300
      ),

      height: Math.max(
        1,
        holder ? holder.clientHeight : 300
      )
    };
  }

  function updatePointer() {
    const inside =
      p.mouseX >= 0 &&
      p.mouseX <= p.width &&
      p.mouseY >= 0 &&
      p.mouseY <= p.height;

    if (inside && !pointer.wasActive) {
      pointer.previousX = p.mouseX;
      pointer.previousY = p.mouseY;

      pointer.velocityX = 0;
      pointer.velocityY = 0;
    }

    const rawVelocityX = inside
      ? p.mouseX - pointer.previousX
      : 0;

    const rawVelocityY = inside
      ? p.mouseY - pointer.previousY
      : 0;

    pointer.velocityX =
      lerpValue(
        pointer.velocityX,
        clamp(
          rawVelocityX,
          -26,
          26
        ),
        0.34
      );

    pointer.velocityY =
      lerpValue(
        pointer.velocityY,
        clamp(
          rawVelocityY,
          -26,
          26
        ),
        0.34
      );

    pointer.active = inside;
    pointer.x = p.mouseX;
    pointer.y = p.mouseY;

    pointer.speed =
      Math.hypot(
        pointer.velocityX,
        pointer.velocityY
      );

    if (inside) {
      pointer.previousX = p.mouseX;
      pointer.previousY = p.mouseY;
    } else {
      pointer.velocityX *= 0.7;
      pointer.velocityY *= 0.7;

      pointer.speed =
        Math.hypot(
          pointer.velocityX,
          pointer.velocityY
        );
    }

    pointer.wasActive = inside;
  }

  class BubbleBalloon {
    constructor(spec) {
      this.spec = spec;
      this.label = spec.label;
      this.tint = spec.tint;
      this.phase = spec.phase;

      this.x = 0;
      this.y = 0;

      this.velocityX = 0;
      this.velocityY = 0;

      this.accelerationX = 0;
      this.accelerationY = 0;

      this.rotation = 0;
      this.angularVelocity = 0;

      /*
        内部异形气球的独立物理状态。
      */
      this.innerX = 0;
      this.innerY = 0;

      this.innerVelocityX = 0;
      this.innerVelocityY = 0;

      this.innerRotation = 0;
      this.innerAngularVelocity = 0;

      this.resize();

      this.x = this.restX;
      this.y = this.restY;

      /*
        静止初始位置在空腔底部。
      */
      this.innerY =
        this.innerLimitY *
        0.98;
    }

    resize() {
      const shortSide =
        Math.min(
          p.width,
          p.height
        );

      this.restX =
        this.spec.x *
        p.width;

      this.restY =
        this.spec.y *
        p.height;

      this.radiusX =
        this.spec.radiusX *
        shortSide;

      this.radiusY =
        this.spec.radiusY *
        shortSide;

      this.knotX =
        p.width *
        0.5;

      this.knotY =
        p.height *
        0.8;

      /*
        外层气球内部可使用的空腔。
      */
      this.cavityRadiusX =
        this.radiusX *
        0.89;

      this.cavityRadiusY =
        this.radiusY *
        0.88;

      /*
        异形字母气球几乎占满空腔。
      */
      this.innerBodyRadiusX =
        this.cavityRadiusX *
        0.86;

      this.innerBodyRadiusY =
        this.cavityRadiusY *
        0.8;

      /*
        字母气球只剩少量活动空间。
      */
      this.innerLimitX =
        Math.max(
          2.5,

          this.cavityRadiusX -
          this.innerBodyRadiusX
        );

      this.innerLimitY =
        Math.max(
          2.5,

          this.cavityRadiusY -
          this.innerBodyRadiusY
        );

      this.restStringLength =
        Math.hypot(
          this.restX -
          this.knotX,

          this.restY +
          this.radiusY *
          0.88 -
          this.knotY
        );
    }

    attachmentPoint() {
      return {
        x: this.x,

        y:
          this.y +
          this.radiusY *
          0.88
      };
    }

    pointerInsideOuter() {
      if (
        !pointer.active ||
        pointer.speed < 0.45
      ) {
        return false;
      }

      const localX =
        pointer.x -
        this.x;

      const localY =
        pointer.y -
        this.y;

      const cosine =
        Math.cos(
          -this.rotation
        );

      const sine =
        Math.sin(
          -this.rotation
        );

      const rotatedX =
        localX *
        cosine -
        localY *
        sine;

      const rotatedY =
        localX *
        sine +
        localY *
        cosine;

      const normalizedX =
        rotatedX /
        (
          this.radiusX *
          1.1
        );

      const normalizedY =
        rotatedY /
        (
          this.radiusY *
          1.1
        );

      return (
        normalizedX *
        normalizedX +
        normalizedY *
        normalizedY <=
        1
      );
    }

    applyPointerImpulse() {
      if (!this.pointerInsideOuter()) {
        return;
      }

      const speedRatio =
        clamp(
          pointer.speed / 15,
          0,
          1
        );

      const impulseScale =
        5.8 +
        speedRatio *
        4.6;

      /*
        外层气球沿鼠标划动方向移动。
      */
      this.velocityX +=
        pointer.velocityX *
        impulseScale;

      this.velocityY +=
        pointer.velocityY *
        impulseScale *
        0.24;

      this.angularVelocity +=
        pointer.velocityX *
        0.0042;
    }

    updateOuter(time, deltaTime) {
      const floatX =
        Math.sin(
          time *
          0.00068 +
          this.phase
        ) *
        this.radiusX *
        0.055;

      const floatY =
        Math.sin(
          time *
          0.00049 +
          this.phase *
          1.7
        ) *
        this.radiusY *
        0.035;

      let forceX =
        (
          this.restX +
          floatX -
          this.x
        ) *
        4.4;

      let forceY =
        (
          this.restY +
          floatY -
          this.y
        ) *
        4.4;

      const attachment =
        this.attachmentPoint();

      const stringX =
        attachment.x -
        this.knotX;

      const stringY =
        attachment.y -
        this.knotY;

      const stringLength =
        Math.max(
          0.0001,

          Math.hypot(
            stringX,
            stringY
          )
        );

      const stringError =
        stringLength -
        this.restStringLength;

      /*
        绳子拉力。
      */
      forceX +=
        -(
          stringX /
          stringLength
        ) *
        stringError *
        8.6;

      forceY +=
        -(
          stringY /
          stringLength
        ) *
        stringError *
        8.6;

      /*
        轻微向上的浮力。
      */
      forceY -= 1.8;

      this.accelerationX =
        forceX -
        this.velocityX *
        4.05;

      this.accelerationY =
        forceY -
        this.velocityY *
        4.05;

      this.velocityX =
        clamp(
          this.velocityX +
          this.accelerationX *
          deltaTime,

          -165,
          165
        );

      this.velocityY =
        clamp(
          this.velocityY +
          this.accelerationY *
          deltaTime,

          -90,
          90
        );

      this.x +=
        this.velocityX *
        deltaTime;

      this.y +=
        this.velocityY *
        deltaTime;

      const targetRotation =
        clamp(
          this.velocityX *
          0.00235,

          -0.09,
          0.09
        );

      const angularAcceleration =
        (
          targetRotation -
          this.rotation
        ) *
        17 -

        this.angularVelocity *
        6.4;

      this.angularVelocity +=
        angularAcceleration *
        deltaTime;

      this.rotation +=
        this.angularVelocity *
        deltaTime;
    }

    worldAccelerationToLocal() {
      const cosine =
        Math.cos(
          -this.rotation
        );

      const sine =
        Math.sin(
          -this.rotation
        );

      return {
        x:
          this.accelerationX *
          cosine -
          this.accelerationY *
          sine,

        y:
          this.accelerationX *
          sine +
          this.accelerationY *
          cosine
      };
    }

    constrainInnerBody() {
      const normalizedX =
        this.innerX /
        this.innerLimitX;

      const normalizedY =
        this.innerY /
        this.innerLimitY;

      const lengthSquared =
        normalizedX *
        normalizedX +
        normalizedY *
        normalizedY;

      if (lengthSquared <= 1) {
        return;
      }

      /*
        把内部气球投影回椭圆形内壁。
      */
      const length =
        Math.sqrt(
          lengthSquared
        );

      this.innerX /= length;
      this.innerY /= length;

      /*
        计算内壁法线。
      */
      const normalXRaw =
        this.innerX /
        (
          this.innerLimitX *
          this.innerLimitX
        );

      const normalYRaw =
        this.innerY /
        (
          this.innerLimitY *
          this.innerLimitY
        );

      const normalLength =
        Math.max(
          0.0001,

          Math.hypot(
            normalXRaw,
            normalYRaw
          )
        );

      const normalX =
        normalXRaw /
        normalLength;

      const normalY =
        normalYRaw /
        normalLength;

      const outwardVelocity =
        this.innerVelocityX *
        normalX +
        this.innerVelocityY *
        normalY;

      /*
        撞到内壁后回弹。
      */
      if (outwardVelocity > 0) {
        const restitution = 0.33;

        this.innerVelocityX -=
          (
            1 +
            restitution
          ) *
          outwardVelocity *
          normalX;

        this.innerVelocityY -=
          (
            1 +
            restitution
          ) *
          outwardVelocity *
          normalY;

        this.innerVelocityX *= 0.94;
        this.innerVelocityY *= 0.94;

        this.innerAngularVelocity +=
          (
            -normalX *
            this.innerVelocityY +

            normalY *
            this.innerVelocityX
          ) *
          0.004;
      }
    }

    updateInner(deltaTime) {
      const shortSide =
        Math.min(
          p.width,
          p.height
        );

      const localOuterAcceleration =
        this.worldAccelerationToLocal();

      /*
        重力让内部异形气球静止时停在底部。
      */
      const gravity =
        shortSide *
        0.68;

      /*
        外层气球加速时，
        内部气球因惯性向反方向移动。
      */
      const forceX =
        -localOuterAcceleration.x *
        0.82 -

        this.innerVelocityX *
        3.9;

      const forceY =
        gravity -

        localOuterAcceleration.y *
        0.82 -

        this.innerVelocityY *
        3.9;

      this.innerVelocityX +=
        forceX *
        deltaTime;

      this.innerVelocityY +=
        forceY *
        deltaTime;

      this.innerX +=
        this.innerVelocityX *
        deltaTime;

      this.innerY +=
        this.innerVelocityY *
        deltaTime;

      this.constrainInnerBody();

      const targetInnerRotation =
        clamp(
          -this.innerVelocityX *
          0.0035 -

          this.angularVelocity *
          0.42,

          -0.11,
          0.11
        );

      const angularAcceleration =
        (
          targetInnerRotation -
          this.innerRotation
        ) *
        16 -

        this.innerAngularVelocity *
        5.6;

      this.innerAngularVelocity +=
        angularAcceleration *
        deltaTime;

      this.innerRotation +=
        this.innerAngularVelocity *
        deltaTime;

      this.innerRotation =
        clamp(
          this.innerRotation,
          -0.12,
          0.12
        );
    }

    update(time, deltaTime) {
      /*
        每一帧只施加一次鼠标冲量。
      */
      this.applyPointerImpulse();

      /*
        三次子步骤提升碰撞稳定性。
      */
      const substeps = 3;

      const subDelta =
        deltaTime /
        substeps;

      for (
        let step = 0;
        step < substeps;
        step += 1
      ) {
        this.updateOuter(
          time,
          subDelta
        );

        this.updateInner(
          subDelta
        );
      }
    }

    drawString() {
      const attachment =
        this.attachmentPoint();

      const bend =
        (
          this.x -
          this.knotX
        ) *
        0.22;

      p.noFill();

      p.stroke(
        76,
        80,
        88,
        82
      );

      p.strokeWeight(
        Math.max(
          0.8,

          Math.min(
            p.width,
            p.height
          ) *
          0.0015
        )
      );

      p.bezier(
        this.knotX,
        this.knotY,

        this.knotX +
        bend *
        0.12,

        lerpValue(
          this.knotY,
          attachment.y,
          0.36
        ),

        attachment.x -
        bend *
        0.2,

        lerpValue(
          this.knotY,
          attachment.y,
          0.72
        ),

        attachment.x,
        attachment.y
      );
    }

    /*
      外层透明气球的后层。
    */
    drawOuterBack() {
      const context =
        p.drawingContext;

      p.push();

      p.translate(
        this.x,
        this.y
      );

      p.rotate(
        this.rotation
      );

      context.save();

      context.beginPath();

      context.ellipse(
        0,
        0,

        this.radiusX,
        this.radiusY,

        0,
        0,
        Math.PI * 2
      );

      context.clip();

      const gradient =
        context.createRadialGradient(
          -this.radiusX *
          0.34,

          -this.radiusY *
          0.4,

          2,

          0,
          0,

          this.radiusY *
          1.18
        );

      gradient.addColorStop(
        0,
        "rgba(255,255,255,0.34)"
      );

      gradient.addColorStop(
        0.35,

        `rgba(${this.tint[0]},${this.tint[1]},${this.tint[2]},0.045)`
      );

      gradient.addColorStop(
        0.72,

        `rgba(${this.tint[0]},${this.tint[1]},${this.tint[2]},0.085)`
      );

      gradient.addColorStop(
        1,
        "rgba(105,118,136,0.14)"
      );

      context.fillStyle = gradient;

      context.fillRect(
        -this.radiusX,
        -this.radiusY,

        this.radiusX * 2,
        this.radiusY * 2
      );

      context.restore();

      p.noStroke();

      p.fill(
        this.tint[0],
        this.tint[1],
        this.tint[2],
        10
      );

      p.ellipse(
        0,
        0,

        this.radiusX * 1.82,
        this.radiusY * 1.82
      );

      p.pop();
    }

    fittedInnerFontSize(context) {
      let fontSize =
        this.innerBodyRadiusY *
        1.96;

      const maximumWidth =
        this.innerBodyRadiusX *
        1.78;

      const maximumHeight =
        this.innerBodyRadiusY *
        1.9;

      context.font =
        `900 ${fontSize}px Arial Black, Arial, sans-serif`;

      const metrics =
        context.measureText(
          this.label
        );

      const widthScale =
        maximumWidth /
        Math.max(
          1,
          metrics.width
        );

      const heightScale =
        maximumHeight /
        Math.max(
          1,
          fontSize
        );

      fontSize *=
        Math.min(
          1,
          widthScale,
          heightScale
        );

      return fontSize;
    }

    /*
      绘制充气异形字母气球。
    */
    drawInnerLetterBalloon() {
      const context =
        p.drawingContext;

      const cosine =
        Math.cos(
          this.rotation
        );

      const sine =
        Math.sin(
          this.rotation
        );

      const worldOffsetX =
        this.innerX *
        cosine -

        this.innerY *
        sine;

      const worldOffsetY =
        this.innerX *
        sine +

        this.innerY *
        cosine;

      context.save();

      context.translate(
        this.x +
        worldOffsetX,

        this.y +
        worldOffsetY
      );

      context.rotate(
        this.rotation +
        this.innerRotation
      );

      context.textAlign =
        "center";

      context.textBaseline =
        "middle";

      context.lineJoin =
        "round";

      context.lineCap =
        "round";

      const fontSize =
        this.fittedInnerFontSize(
          context
        );

      context.font =
        `900 ${fontSize}px Arial Black, Arial, sans-serif`;

      const fillGradient =
        context.createLinearGradient(
          -this.innerBodyRadiusX,
          -this.innerBodyRadiusY,

          this.innerBodyRadiusX,
          this.innerBodyRadiusY
        );

      /*
        灰白透明气球材质。
      */
      fillGradient.addColorStop(
        0,
        "rgba(255,255,255,0.74)"
      );

      fillGradient.addColorStop(
        0.36,
        "rgba(236,237,235,0.58)"
      );

      fillGradient.addColorStop(
        0.72,
        "rgba(210,211,208,0.52)"
      );

      fillGradient.addColorStop(
        1,
        "rgba(174,176,176,0.48)"
      );

      context.shadowColor =
        "rgba(55,58,64,0.12)";

      context.shadowBlur =
        fontSize *
        0.07;

      context.lineWidth =
        Math.max(
          4,
          fontSize *
          0.115
        );

      context.strokeStyle =
        "rgba(72,74,80,0.38)";

      context.fillStyle =
        fillGradient;

      context.strokeText(
        this.label,
        0,
        fontSize * 0.02
      );

      context.fillText(
        this.label,
        0,
        fontSize * 0.02
      );

      /*
        左上高光。
      */
      context.shadowBlur = 0;

      context.lineWidth =
        Math.max(
          1.5,
          fontSize *
          0.035
        );

      context.strokeStyle =
        "rgba(255,255,255,0.58)";

      context.strokeText(
        this.label,

        -fontSize *
        0.018,

        -fontSize *
        0.025
      );

      /*
        第二层轻微反光。
      */
      context.lineWidth =
        Math.max(
          1,
          fontSize *
          0.018
        );

      context.strokeStyle =
        "rgba(255,255,255,0.28)";

      context.strokeText(
        this.label,

        fontSize *
        0.016,

        fontSize *
        0.018
      );

      context.restore();
    }

    /*
      外层气球边缘与高光。
      在内部字母之后绘制。
    */
    drawOuterFront() {
      p.push();

      p.translate(
        this.x,
        this.y
      );

      p.rotate(
        this.rotation
      );

      p.noFill();

      p.stroke(
        76,
        84,
        98,
        118
      );

      p.strokeWeight(
        Math.max(
          1,

          Math.min(
            p.width,
            p.height
          ) *
          0.0021
        )
      );

      p.ellipse(
        0,
        0,

        this.radiusX * 2,
        this.radiusY * 2
      );

      p.stroke(
        255,
        255,
        255,
        170
      );

      p.strokeWeight(
        Math.max(
          1.35,

          Math.min(
            p.width,
            p.height
          ) *
          0.003
        )
      );

      p.arc(
        -this.radiusX *
        0.21,

        -this.radiusY *
        0.16,

        this.radiusX *
        1.16,

        this.radiusY *
        1.42,

        Math.PI * 1.05,
        Math.PI * 1.56
      );

      p.stroke(
        255,
        255,
        255,
        64
      );

      p.strokeWeight(
        Math.max(
          0.8,

          Math.min(
            p.width,
            p.height
          ) *
          0.0017
        )
      );

      p.arc(
        this.radiusX *
        0.12,

        this.radiusY *
        0.05,

        this.radiusX *
        1.5,

        this.radiusY *
        1.58,

        -0.2,
        0.95
      );

      p.noStroke();

      p.fill(
        86,
        94,
        108,
        82
      );

      p.triangle(
        -this.radiusX *
        0.08,

        this.radiusY *
        0.84,

        this.radiusX *
        0.08,

        this.radiusY *
        0.84,

        0,

        this.radiusY *
        1.01
      );

      p.pop();
    }
  }

  function resolveOuterCollisions() {
    for (
      let firstIndex = 0;
      firstIndex < balloons.length;
      firstIndex += 1
    ) {
      for (
        let secondIndex =
          firstIndex + 1;

        secondIndex < balloons.length;
        secondIndex += 1
      ) {
        const first =
          balloons[firstIndex];

        const second =
          balloons[secondIndex];

        const deltaX =
          second.x -
          first.x;

        const deltaY =
          second.y -
          first.y;

        const distance =
          Math.max(
            0.0001,

            Math.hypot(
              deltaX,
              deltaY
            )
          );

        const minimumDistance =
          Math.min(
            first.radiusX,
            first.radiusY
          ) *
          0.91 +

          Math.min(
            second.radiusX,
            second.radiusY
          ) *
          0.91;

        if (distance >= minimumDistance) {
          continue;
        }

        const normalX =
          deltaX /
          distance;

        const normalY =
          deltaY /
          distance;

        const overlap =
          minimumDistance -
          distance;

        first.x -=
          normalX *
          overlap *
          0.5;

        first.y -=
          normalY *
          overlap *
          0.5;

        second.x +=
          normalX *
          overlap *
          0.5;

        second.y +=
          normalY *
          overlap *
          0.5;

        const relativeVelocity =
          (
            second.velocityX -
            first.velocityX
          ) *
          normalX +

          (
            second.velocityY -
            first.velocityY
          ) *
          normalY;

        if (relativeVelocity < 0) {
          const impulse =
            -relativeVelocity *
            0.36;

          first.velocityX -=
            normalX *
            impulse;

          first.velocityY -=
            normalY *
            impulse;

          second.velocityX +=
            normalX *
            impulse;

          second.velocityY +=
            normalY *
            impulse;
        }
      }
    }
  }

  function buildBalloons() {
    balloons = [
      new BubbleBalloon({
        label: "U",

        x: 0.385,
        y: 0.39,

        radiusX: 0.118,
        radiusY: 0.15,

        phase: 0.4,

        tint: [
          186,
          208,
          226
        ]
      }),

      new BubbleBalloon({
        label: "E",

        x: 0.5,
        y: 0.25,

        radiusX: 0.124,
        radiusY: 0.158,

        phase: 2.3,

        tint: [
          205,
          198,
          228
        ]
      }),

      new BubbleBalloon({
        label: "5",

        x: 0.62,
        y: 0.35,

        radiusX: 0.116,
        radiusY: 0.147,

        phase: 4.5,

        tint: [
          194,
          220,
          216
        ]
      })
    ];

    lastTime = p.millis();
  }

  p.setup = () => {
    holder =
      document.getElementById(
        "balloons-stage"
      );

    const size =
      stageSize();

    const canvas =
      p.createCanvas(
        size.width,
        size.height
      );

    canvas.parent(holder);

    p.pixelDensity(
      Math.min(
        window.devicePixelRatio || 1,
        2
      )
    );

    pointer.previousX = p.mouseX;
    pointer.previousY = p.mouseY;

    buildBalloons();
  };

  p.draw = () => {
    p.clear();

    const now = p.millis();

    const deltaTime =
      clamp(
        (
          now -
          lastTime
        ) /
        1000,

        0.001,
        0.033
      );

    lastTime = now;

    updatePointer();

    for (const balloon of balloons) {
      balloon.update(
        now,
        deltaTime
      );
    }

    resolveOuterCollisions();

    /*
      绳子位于气球后面。
    */
    for (const balloon of balloons) {
      balloon.drawString();
    }

    p.noStroke();

    p.fill(
      76,
      80,
      88,
      98
    );

    p.circle(
      p.width * 0.5,
      p.height * 0.8,

      Math.max(
        4,

        Math.min(
          p.width,
          p.height
        ) *
        0.012
      )
    );

    /*
      外层透明底色。
    */
    for (const balloon of balloons) {
      balloon.drawOuterBack();
    }

    /*
      内部异形气球。
    */
    for (const balloon of balloons) {
      balloon.drawInnerLetterBalloon();
    }

    /*
      外层气球边缘和高光。
    */
    for (const balloon of balloons) {
      balloon.drawOuterFront();
    }
  };

  p.windowResized = () => {
    const size = stageSize();

    p.resizeCanvas(
      size.width,
      size.height
    );

    buildBalloons();
  };
};

new p5(balloonPreview);