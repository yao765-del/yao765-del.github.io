"use strict";

const willowPreview = (p) => {
  let holder = null;
  let strands = [];
  let lastTime = 0;

  const CHAR_POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const SEED = 87241;

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
      width: Math.max(1, holder ? holder.clientWidth : 300),
      height: Math.max(1, holder ? holder.clientHeight : 300)
    };
  }

  function pointOnPath(path, t) {
    return {
      x: p.bezierPoint(path.x0, path.x1, path.x2, path.x3, t),
      y: p.bezierPoint(path.y0, path.y1, path.y2, path.y3, t)
    };
  }

  function makePath(spec) {
    return {
      x0: spec.start[0] * p.width,
      y0: spec.start[1] * p.height,

      x1: spec.control1[0] * p.width,
      y1: spec.control1[1] * p.height,

      x2: spec.control2[0] * p.width,
      y2: spec.control2[1] * p.height,

      x3: spec.end[0] * p.width,
      y3: spec.end[1] * p.height
    };
  }

  function samplePath(path, count) {
    const lookup = [];
    const steps = 180;

    let totalLength = 0;
    let previous = pointOnPath(path, 0);

    lookup.push({
      t: 0,
      length: 0,
      point: previous
    });

    for (let index = 1; index <= steps; index += 1) {
      const t = index / steps;
      const current = pointOnPath(path, t);

      totalLength += Math.hypot(
        current.x - previous.x,
        current.y - previous.y
      );

      lookup.push({
        t,
        length: totalLength,
        point: current
      });

      previous = current;
    }

    const samples = [];

    for (let index = 0; index < count; index += 1) {
      const targetLength =
        totalLength *
        (
          index /
          Math.max(1, count - 1)
        );

      let low = 0;
      let high = lookup.length - 1;

      while (low < high) {
        const middle = Math.floor(
          (low + high) / 2
        );

        if (lookup[middle].length < targetLength) {
          low = middle + 1;
        } else {
          high = middle;
        }
      }

      const upper = lookup[low];
      const lower = lookup[Math.max(0, low - 1)];

      const span = Math.max(
        0.0001,
        upper.length - lower.length
      );

      const amount = clamp(
        (targetLength - lower.length) / span,
        0,
        1
      );

      const t = lerpValue(
        lower.t,
        upper.t,
        amount
      );

      samples.push({
        t,
        point: pointOnPath(path, t)
      });
    }

    return samples;
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

    pointer.velocityX = lerpValue(
      pointer.velocityX,
      clamp(rawVelocityX, -26, 26),
      0.38
    );

    pointer.velocityY = lerpValue(
      pointer.velocityY,
      clamp(rawVelocityY, -26, 26),
      0.38
    );

    pointer.active = inside;
    pointer.x = p.mouseX;
    pointer.y = p.mouseY;

    pointer.speed = Math.hypot(
      pointer.velocityX,
      pointer.velocityY
    );

    if (inside) {
      pointer.previousX = p.mouseX;
      pointer.previousY = p.mouseY;
    } else {
      pointer.velocityX *= 0.7;
      pointer.velocityY *= 0.7;

      pointer.speed = Math.hypot(
        pointer.velocityX,
        pointer.velocityY
      );
    }

    pointer.wasActive = inside;
  }

  class WillowStrand {
    constructor(spec) {
      this.spec = spec;
      this.phase = spec.phase;
      this.windScale = spec.windScale;
      this.path = makePath(spec);

      this.interactionOffsetX = 0;
      this.interactionOffsetY = 0;

      this.interactionVelocityX = 0;
      this.interactionVelocityY = 0;

      this.nodes = samplePath(
        this.path,
        38
      ).map((sample, index) => ({
        restX: sample.point.x,
        restY: sample.point.y,

        xOffset: 0,
        yOffset: 0,

        velocityX: 0,
        velocityY: 0,

        tip: index / 37
      }));

      this.glyphs = this.createGlyphs();
    }

    createGlyphs() {
      const result = [];

      const scale = Math.min(
        p.width,
        p.height
      );

      const start = this.spec.glyphStart;
      const end = this.spec.glyphEnd || 0.988;

      for (
        let index = 0;
        index < this.spec.glyphCount;
        index += 1
      ) {
        const ratio =
          this.spec.glyphCount === 1
            ? 0.5
            : index / (this.spec.glyphCount - 1);

        const fraction = clamp(
          lerpValue(
            start,
            end,
            ratio
          ) +
          p.random(-0.006, 0.006),

          start,
          end
        );

        result.push({
          fraction,

          char:
            CHAR_POOL[
              Math.floor(
                p.random(CHAR_POOL.length)
              )
            ],

          size:
            p.random(
              scale * 0.019,
              scale * 0.027
            ),

          alpha:
            p.random(165, 225),

          normalOffset:
            p.random(-2.2, 2.2),

          rotation:
            p.random(-0.14, 0.14),

          phase:
            p.random(Math.PI * 2)
        });

        if (
          fraction > 0.3 &&
          fraction < 0.9 &&
          p.random() < this.spec.secondRowChance
        ) {
          result.push({
            fraction:
              clamp(
                fraction +
                p.random(-0.008, 0.008),

                start,
                end
              ),

            char:
              CHAR_POOL[
                Math.floor(
                  p.random(CHAR_POOL.length)
                )
              ],

            size:
              p.random(
                scale * 0.018,
                scale * 0.025
              ),

            alpha:
              p.random(135, 200),

            normalOffset:
              p.random(3.2, 5.1) *
              (
                p.random() < 0.5
                  ? -1
                  : 1
              ),

            rotation:
              p.random(-0.16, 0.16),

            phase:
              p.random(Math.PI * 2)
          });
        }
      }

      return result;
    }

    contactStrength() {
      if (
        !pointer.active ||
        pointer.speed < 0.5
      ) {
        return null;
      }

      const radius =
        Math.min(
          p.width,
          p.height
        ) *
        0.14;

      let nearestDistance = Infinity;

      for (
        let index = 1;
        index < this.nodes.length;
        index += 1
      ) {
        const node = this.nodes[index];

        const distance = Math.hypot(
          node.restX +
          node.xOffset -
          pointer.x,

          node.restY +
          node.yOffset -
          pointer.y
        );

        if (distance < nearestDistance) {
          nearestDistance = distance;
        }
      }

      if (nearestDistance >= radius) {
        return null;
      }

      return {
        proximity:
          1 -
          nearestDistance /
          radius,

        speedRatio:
          clamp(
            pointer.speed / 14,
            0,
            1
          )
      };
    }

    updateInteraction(deltaTime) {
      const contact =
        this.contactStrength();

      const shortSide =
        Math.min(
          p.width,
          p.height
        );

      const maxInteraction =
        shortSide * 0.06;

      if (contact) {
        const movementLength =
          Math.max(
            0.0001,
            pointer.speed
          );

        const directionX =
          pointer.velocityX /
          movementLength;

        const directionY =
          pointer.velocityY /
          movementLength;

        const proximity =
          contact.proximity *
          contact.proximity;

        const impulse =
          shortSide *
          (
            0.28 +
            contact.speedRatio *
            0.18
          ) *
          proximity;

        this.interactionVelocityX +=
          directionX *
          impulse;

        this.interactionVelocityY +=
          directionY *
          impulse *
          0.18;
      }

      const spring = 12.5;
      const damping = 5.6;

      const accelerationX =
        -this.interactionOffsetX *
        spring -
        this.interactionVelocityX *
        damping;

      const accelerationY =
        -this.interactionOffsetY *
        spring -
        this.interactionVelocityY *
        damping;

      this.interactionVelocityX +=
        accelerationX *
        deltaTime;

      this.interactionVelocityY +=
        accelerationY *
        deltaTime;

      this.interactionOffsetX =
        clamp(
          this.interactionOffsetX +
          this.interactionVelocityX *
          deltaTime,

          -maxInteraction,
          maxInteraction
        );

      this.interactionOffsetY =
        clamp(
          this.interactionOffsetY +
          this.interactionVelocityY *
          deltaTime,

          -shortSide * 0.018,
          shortSide * 0.018
        );
    }

    update(time, deltaTime) {
      this.updateInteraction(deltaTime);

      const globalWind =
        Math.sin(
          time * 0.00062
        ) *
        0.58 +

        Math.sin(
          time * 0.00023 +
          1.7
        ) *
        0.32 +

        Math.sin(
          time * 0.00119 +
          0.4
        ) *
        0.1;

      for (
        let index = 0;
        index < this.nodes.length;
        index += 1
      ) {
        const node = this.nodes[index];
        const tip = node.tip;

        const delayedWind =
          Math.sin(
            time * 0.00082 +
            this.phase -
            tip * 0.72
          );

        const naturalWindX =
          (
            globalWind * 0.82 +
            delayedWind * 0.18
          ) *
          this.windScale *
          0.34 *
          Math.pow(tip, 1.72);

        /*
          同一根柳条共享同一个互动偏移。

          根部移动最少。
          越靠近末端移动越明显。
          整条曲线保持连续。
        */
        const wholeStrandProfile =
          0.12 * tip +
          0.88 *
          Math.pow(tip, 1.38);

        const interactionWave =
          0.92 +
          0.08 *
          Math.sin(
            time * 0.0032 -
            tip * 0.9 +
            this.phase
          );

        const desiredX =
          naturalWindX +

          this.interactionOffsetX *
          wholeStrandProfile *
          interactionWave;

        const desiredY =
          Math.abs(
            naturalWindX
          ) *
          0.045 *
          tip +

          this.interactionOffsetY *
          wholeStrandProfile;

        let couplingX = 0;
        let couplingY = 0;

        if (index > 0) {
          couplingX +=
            (
              this.nodes[
                index - 1
              ].xOffset -
              node.xOffset
            ) *
            6.4;

          couplingY +=
            (
              this.nodes[
                index - 1
              ].yOffset -
              node.yOffset
            ) *
            6.4;
        }

        if (
          index <
          this.nodes.length -
          1
        ) {
          couplingX +=
            (
              this.nodes[
                index + 1
              ].xOffset -
              node.xOffset
            ) *
            4.6;

          couplingY +=
            (
              this.nodes[
                index + 1
              ].yOffset -
              node.yOffset
            ) *
            4.6;
        }

        const spring = 27;
        const damping = 7.6;

        const accelerationX =
          (
            desiredX -
            node.xOffset
          ) *
          spring -

          node.velocityX *
          damping +

          couplingX;

        const accelerationY =
          (
            desiredY -
            node.yOffset
          ) *
          spring -

          node.velocityY *
          damping +

          couplingY;

        node.velocityX +=
          accelerationX *
          deltaTime;

        node.velocityY +=
          accelerationY *
          deltaTime;

        node.xOffset +=
          node.velocityX *
          deltaTime;

        node.yOffset +=
          node.velocityY *
          deltaTime;
      }

      this.nodes[0].xOffset = 0;
      this.nodes[0].yOffset = 0;

      this.nodes[0].velocityX = 0;
      this.nodes[0].velocityY = 0;
    }

    positionAt(fraction) {
      const scaled =
        clamp(
          fraction,
          0,
          1
        ) *
        (
          this.nodes.length -
          1
        );

      const lowerIndex =
        Math.floor(scaled);

      const upperIndex =
        Math.min(
          this.nodes.length -
          1,

          lowerIndex + 1
        );

      const amount =
        scaled -
        lowerIndex;

      const lower =
        this.nodes[
          lowerIndex
        ];

      const upper =
        this.nodes[
          upperIndex
        ];

      const lowerX =
        lower.restX +
        lower.xOffset;

      const lowerY =
        lower.restY +
        lower.yOffset;

      const upperX =
        upper.restX +
        upper.xOffset;

      const upperY =
        upper.restY +
        upper.yOffset;

      return {
        x:
          lerpValue(
            lowerX,
            upperX,
            amount
          ),

        y:
          lerpValue(
            lowerY,
            upperY,
            amount
          ),

        angle:
          Math.atan2(
            upperY -
            lowerY,

            upperX -
            lowerX
          )
      };
    }

    draw(time) {
      for (const glyph of this.glyphs) {
        const position =
          this.positionAt(
            glyph.fraction
          );

        const normal =
          position.angle +
          Math.PI / 2;

        const micro =
          Math.sin(
            time * 0.00135 +
            glyph.phase
          ) *
          0.55 *
          0.34;

        p.push();

        p.translate(
          position.x +
          Math.cos(normal) *
          glyph.normalOffset,

          position.y +
          Math.sin(normal) *
          glyph.normalOffset +
          micro
        );

        p.rotate(
          glyph.rotation +
          micro * 0.008
        );

        p.noStroke();

        p.fill(
          92,
          165,
          83,
          glyph.alpha
        );

        p.textAlign(
          p.CENTER,
          p.CENTER
        );

        p.textSize(
          glyph.size
        );

        p.text(
          glyph.char,
          0,
          0
        );

        p.pop();
      }
    }
  }

  function drawTrunk() {
    const w = p.width;
    const h = p.height;

    const lineWidth =
      Math.max(
        1.45,

        Math.min(
          w,
          h
        ) *
        0.0031
      );

    const lines = [
      [
        [0.438, 0.842],
        [0.452, 0.775],
        [0.466, 0.585],
        [0.448, 0.405]
      ],

      [
        [0.456, 0.838],
        [0.466, 0.76],
        [0.476, 0.59],
        [0.464, 0.412]
      ],

      [
        [0.474, 0.835],
        [0.48, 0.755],
        [0.487, 0.592],
        [0.479, 0.418]
      ],

      [
        [0.493, 0.836],
        [0.494, 0.755],
        [0.496, 0.595],
        [0.495, 0.422]
      ],

      [
        [0.512, 0.835],
        [0.509, 0.755],
        [0.505, 0.592],
        [0.511, 0.417]
      ],

      [
        [0.531, 0.838],
        [0.524, 0.76],
        [0.516, 0.59],
        [0.527, 0.41]
      ],

      [
        [0.55, 0.842],
        [0.538, 0.775],
        [0.524, 0.585],
        [0.542, 0.402]
      ]
    ];

    p.noFill();

    p.stroke(
      146,
      122,
      96,
      210
    );

    p.strokeWeight(
      lineWidth
    );

    p.strokeCap(
      p.ROUND
    );

    p.strokeJoin(
      p.ROUND
    );

    for (const line of lines) {
      p.bezier(
        line[0][0] * w,
        line[0][1] * h,

        line[1][0] * w,
        line[1][1] * h,

        line[2][0] * w,
        line[2][1] * h,

        line[3][0] * w,
        line[3][1] * h
      );
    }
  }

  function buildWillow() {
    p.randomSeed(SEED);

    const settings = [
      [[.438,.337],[.39,.105],[.12,.19],[.075,.745],.12,38,.26,22,.3],
      [[.446,.348],[.405,.135],[.18,.205],[.14,.69],.15,34,.24,20,1.1],
      [[.452,.36],[.425,.16],[.24,.225],[.215,.66],.18,31,.22,18,2],
      [[.462,.372],[.442,.19],[.31,.245],[.295,.625],.2,28,.19,16,2.7],
      [[.474,.382],[.462,.215],[.38,.275],[.375,.64],.22,26,.17,14,3.5],
      [[.482,.36],[.47,.205],[.435,.28],[.425,.61],.24,25,.14,13,4.2],

      [[.472,.326],[.475,.155],[.455,.22],[.455,.59],.16,29,.18,13,4.45],
      [[.485,.322],[.488,.145],[.478,.21],[.48,.575],.14,30,.19,12.5,4.75],
      [[.498,.318],[.5,.14],[.5,.205],[.5,.565],.13,31,.2,12,5.05],
      [[.511,.322],[.512,.145],[.522,.21],[.52,.575],.14,30,.19,12.5,5.35],
      [[.524,.326],[.525,.155],[.545,.22],[.545,.59],.16,29,.18,13,5.65],

      [[.518,.355],[.53,.2],[.565,.275],[.575,.62],.23,25,.14,13,6],
      [[.528,.375],[.54,.19],[.62,.245],[.63,.645],.21,27,.18,15,6.5],
      [[.54,.365],[.56,.16],[.69,.225],[.71,.61],.19,29,.2,17,7.2],
      [[.55,.352],[.58,.13],[.77,.205],[.795,.675],.16,33,.23,19,7.9],
      [[.558,.34],[.605,.105],[.86,.185],[.89,.72],.13,37,.25,21,8.6],

      [[.452,.335],[.43,.17],[.34,.21],[.335,.5],.27,18,.1,12,9.3],
      [[.47,.325],[.46,.16],[.405,.205],[.4,.515],.29,17,.08,11,10],
      [[.53,.318],[.54,.15],[.595,.2],[.6,.51],.29,17,.08,11,10.7],
      [[.548,.33],[.57,.17],[.66,.21],[.665,.505],.27,20,.1,12,11.4],

      [[.447,.338],[.47,.105],[.64,.145],[.72,.57],.13,34,.18,17,12.1],
      [[.555,.332],[.525,.095],[.37,.15],[.285,.58],.14,34,.18,17,12.8]
    ];

    strands =
      settings.map(
        (setting) =>
          new WillowStrand({
            start:
              setting[0],

            control1:
              setting[1],

            control2:
              setting[2],

            end:
              setting[3],

            glyphStart:
              setting[4],

            glyphCount:
              setting[5],

            secondRowChance:
              setting[6],

            windScale:
              setting[7],

            phase:
              setting[8]
          })
      );

    lastTime = p.millis();
  }

  p.setup = () => {
    holder =
      document.getElementById(
        "willow-stage"
      );

    const size = stageSize();

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

    p.textFont("DM Sans");


    pointer.previousX = p.mouseX;
    pointer.previousY = p.mouseY;

    buildWillow();
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
    drawTrunk();

    for (const strand of strands) {
      strand.update(
        now,
        deltaTime
      );

      strand.draw(now);
    }
  };

  p.windowResized = () => {
    const size = stageSize();

    p.resizeCanvas(
      size.width,
      size.height
    );

    buildWillow();
  };
};

new p5(willowPreview);