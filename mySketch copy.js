
let font;
let parts = [];
let particles = [];
let textOpacity1 = 0;
let textOpacity2 = 0;
let canvasWidth, canvasHeight;
let textTexture1, textTexture2, textTexture3;
let borders = [];
let borderOpacity = 0;

// Переменные для маршрута камеры
let camPositions = [];
let camT = 0;
let camSpeed = 0.002;
let fadeOut = 0;

// Переменные для изменения угла линзы (FOV)
let baseFov;
let fovOffset = 0;

// Переменная для frameSender
let frameSender;
let myCanvas;

// Define classes before they are used
class Border {
  constructor(position, x, y, w, h) {
    this.position = position;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.depth = 10;
    this.angle = 0;
  }

  update() {
    this.angle += 0.05;
    this.depth = 10 + sin(this.angle) * 5;
  }

  display() {
    push();
    translate(this.x, this.y, 0);
    fill(0, map(easeInOutQuad(borderOpacity), 0, 1, 0, 255));
    noStroke();
    if (this.position === "top" || this.position === "bottom") {
      box(this.w, this.h, this.depth);
    } else if (this.position === "left" || this.position === "right") {
      box(this.w, this.h, this.depth);
    }
    pop();
  }
}

class Part {
  constructor(x, y, w, h, speed, addDetails = false, isTriangle = false) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.speed = speed;
    this.offset = 0;
    this.targetOffset = random(-canvasWidth * 0.083, canvasWidth * 0.083);
    this.offsetT = 0;
    this.addDetails = addDetails;
    this.isTriangle = isTriangle;
    this.angle = random(TWO_PI);
    this.tremor = 0;
  }

  update() {
    this.offsetT += 0.02;
    if (this.offsetT > 1) {
      this.offsetT = 0;
      this.targetOffset = random(-canvasWidth * 0.083, canvasWidth * 0.083);
    }
    this.offset = lerp(this.offset, this.targetOffset, easeInOutQuad(this.offsetT));
    this.angle += 0.02;
    this.tremor = sin(frameCount * 0.1) * 5;
  }

  display() {
    push();
    let zOffset = sin(this.angle) * 50;
    translate(this.x - canvasWidth / 2 + this.tremor, this.y - canvasHeight / 2 + this.tremor, zOffset);
    rotateZ(this.angle * 0.1);
    fill(0);
    noStroke();
    if (this.h > canvasHeight * 0.125) {
      box(this.w, this.h, 30);
      if (this.addDetails) {
        stroke(100);
        for (let i = -this.h / 2; i < this.h / 2; i += this.h / 15) {
          line(-this.w / 2, i, -15, this.w / 2, i, 15);
        }
      }
    } else if (this.w > this.h && !this.isTriangle) {
      box(this.w, this.h, 30);
      if (this.addDetails) {
        stroke(100);
        for (let i = -this.w / 2; i < this.w / 2; i += this.w / 15) {
          line(i, -this.h / 2, -15, i, this.h / 2, 15);
        }
      }
    } else {
      beginShape();
      vertex(-this.w / 2, -this.h / 2, 15);
      vertex(this.w / 2, 0, 15);
      vertex(-this.w / 2, this.h / 2, 15);
      vertex(-this.w / 2, -this.h / 3, -15);
      vertex(this.w / 2, 0, -15);
      vertex(-this.w / 2, this.h / 2, -15);
      endShape(CLOSE);
      if (this.addDetails) {
        stroke(100);
        for (let i = 0; i < 3; i++) {
          line(-this.w / 4 + i * this.w / 8, -this.h / 4, 0, this.w / 4 + i * this.w / 8, this.h / 4, 0);
        }
      }
    }
    pop();
  }
}

class Tail {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.angle = 0;
    this.tremor = 0;
  }

  update() {
    this.angle += 0.02;
    this.tremor = sin(frameCount * 0.1) * 5;
  }

  display() {
    push();
    let zOffset = sin(this.angle) * 50;
    translate(this.x - canvasWidth / 2 + this.tremor, this.y - canvasHeight / 2 + this.tremor, zOffset);
    rotateZ(this.angle * 0.1);
    fill(0);
    noStroke();
    beginShape();
    vertex(0, 0, 15);
    bezierVertex(this.w / 4, -canvasHeight * 0.0625 + sin(this.angle) * canvasHeight * 0.0125, 15,
                 this.w * 3 / 4, this.h / 2 + sin(this.angle) * canvasHeight * 0.0125, 15,
                 this.w, this.h, 15);
    vertex(0, 0, -15);
    bezierVertex(this.w / 4, -canvasHeight * 0.0625 + sin(this.angle) * canvasHeight * 0.0125, -15,
                 this.w * 3 / 4, this.h / 2 + sin(this.angle) * canvasHeight * 0.0125, -15,
                 this.w, this.h, -15);
    endShape(CLOSE);
    stroke(100);
    for (let i = 0; i < this.w; i += this.w / 30) {
      let t = i / this.w;
      let y1 = t * (this.h / 2);
      let y2 = this.h / 2 + t * (this.h / 2);
      line(i, y1, 15, i, y2, -15);
    }
    pop();
  }
}

class Particle {
  constructor() {
    this.x = random(-canvasWidth / 2, canvasWidth / 2);
    this.y = random(-canvasHeight / 2, canvasHeight / 2);
    this.z = random(-100, 100);
    this.size = random(5, 15);
    this.angle = random(TWO_PI);
    this.zT = 0;
    this.targetZ = this.z;
  }

  update() {
    this.zT += 0.01;
    if (this.zT > 1) {
      this.zT = 0;
      this.targetZ = random(-100, 100);
    }
    this.z = lerp(this.z, this.targetZ, easeInOutQuad(this.zT));
    if (abs(this.z) > 100) {
      this.x = random(-canvasWidth / 2, canvasWidth / 2);
      this.y = random(-canvasHeight / 2, canvasHeight / 2);
    }
    this.angle += 0.05;
  }

  display() {
    push();
    translate(this.x, this.y, this.z);
    rotateZ(this.angle);
    fill(50);
    box(this.size);
    pop();
  }
}

function preload() {
  font = loadFont('NotoSansJP-Regular.ttf');
}

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - pow(-2 * t + 2, 2) / 2;
}

function setup() {
    canvasWidth = 1920;  // Full HD ширина
    canvasHeight = 1080; // Full HD высота
    canvasHeight = Math.floor(canvasHeight / 2) * 2; // Убеждаемся, что высота чётная (1080 уже чётное)
    myCanvas = createCanvas(canvasWidth, canvasHeight, WEBGL);
    frameSender = initFrameSender(500);

  baseFov = PI / 3;

  updateTextures();

  parts.push(new Part(canvasWidth * 0.33, canvasHeight * 0.1875, canvasWidth * 0.083, canvasHeight * 0.25, 0.5, true));
  parts.push(new Part(canvasWidth * 0.5, canvasHeight * 0.1875, canvasWidth * 0.083, canvasHeight * 0.25, -0.5, true));
  parts.push(new Part(canvasWidth * 0.416, canvasHeight * 0.25, canvasWidth * 0.167, canvasHeight * 0.0625, 0.3, false));
  parts.push(new Part(canvasWidth * 0.416, canvasHeight * 0.5, canvasWidth * 0.133, canvasHeight * 0.1, -0.3, false, true));

  tail = new Tail(canvasWidth * 0.25, canvasHeight * 0.75, canvasWidth * 0.5, canvasHeight * 0.1875);

  for (let i = 0; i < 100; i++) {
    particles.push(new Particle());
  }

  borders.push(new Border("top", -canvasWidth * 0.45, -canvasHeight * 0.45, canvasWidth * 0.9, canvasHeight * 0.02));
  borders.push(new Border("bottom", -canvasWidth * 0.45, canvasHeight * 0.43, canvasWidth * 0.9, canvasHeight * 0.02));
  borders.push(new Border("left", -canvasWidth * 0.45, -canvasHeight * 0.45, canvasWidth * 0.02, canvasHeight * 0.9));
  borders.push(new Border("right", canvasWidth * 0.43, -canvasHeight * 0.45, canvasWidth * 0.02, canvasHeight * 0.9));

  // Определяем маршрут камеры с дополнительными точками для плавного зацикливания
  camPositions = [
    { x: 0, y: 0, z: 1000, angleX: 0, angleY: 0 },
    { x: 600, y: 0, z: 400, angleX: PI / 4, angleY: 0 },
    { x: 300, y: -150, z: 700, angleX: -PI / 6, angleY: PI / 8 },
    { x: 0, y: -300, z: 600, angleX: -PI / 3, angleY: PI / 6 },
    { x: -200, y: 200, z: 500, angleX: 0, angleY: -PI / 8 },
    { x: -400, y: 400, z: 300, angleX: PI / 6, angleY: -PI / 4 },
    { x: -100, y: 100, z: 800, angleX: PI / 12, angleY: -PI / 12 },
    { x: 0, y: 0, z: 1000, angleX: 0, angleY: 0 }
  ];
}

function draw() {
  // Проверяем состояние воспроизведения через frameSender
  if (!frameSender.getIsPlaying()) return;

  background(255);

  // Обновляем параметр времени камеры
  camT += camSpeed;
  if (camT >= 1) {
    camT = 0; // Зацикливаем
  }

  // Плавное затемнение на концах цикла
  let fadeT = sin(camT * TWO_PI) * 0.5 + 0.5;
  fadeOut = map(fadeT, 0, 1, 0, 150);

  // Плавная анимация прозрачности текста и границ
  let opacityT = easeInOutQuad(abs(sin(camT * PI)));
  textOpacity1 = map(opacityT, 0, 1, 0.3, 1);
  textOpacity2 = map(opacityT, 0, 1, 0.3, 1);
  borderOpacity = map(opacityT, 0, 1, 0.3, 1);

  // Интерполяция позиции и углов камеры с помощью сплайна
  let numPoints = camPositions.length;
  let segmentT = (camT * (numPoints - 1)) % (numPoints - 1);
  let currentIndex = floor(segmentT);
  let t = segmentT - currentIndex;

  let p0 = camPositions[max(0, currentIndex - 1)];
  let p1 = camPositions[currentIndex];
  let p2 = camPositions[min(numPoints - 1, currentIndex + 1)];
  let p3 = camPositions[min(numPoints - 1, currentIndex + 2) % numPoints];

  let camX = catmullRom(p0.x, p1.x, p2.x, p3.x, t);
  let camY = catmullRom(p0.y, p1.y, p2.y, p3.y, t);
  let camZ = catmullRom(p0.z, p1.z, p2.z, p3.z, t);
  let camAngleX = catmullRom(p0.angleX, p1.angleX, p2.angleX, p3.angleX, t);
  let camAngleY = catmullRom(p0.angleY, p1.angleY, p2.angleY, p3.angleY, t);

  // Динамическое изменение FOV
  fovOffset = sin(camT * TWO_PI) * 0.1;
  let currentFov = baseFov + fovOffset;
  perspective(currentFov, canvasWidth / canvasHeight, 1, 5000);

  // Установка камеры
  camera(camX, camY, camZ, 0, 0, 0, 0, 1, 0);
  rotateY(camAngleX);
  rotateX(camAngleY);

  ambientLight(100);
  pointLight(255, 255, 255, camX, camY, camZ);

  for (let border of borders) {
    border.update();
    border.display();
  }

  for (let particle of particles) {
    particle.update();
    particle.display();
  }

  for (let part of parts) {
    part.update();
    part.display();
  }

  tail.update();
  tail.display();

  // Вертикальный текст
  push();
  let zText1 = map(easeInOutQuad(textOpacity1), 0, 1, -100, 20);
  translate(canvasWidth * 0.5 - canvasWidth / 2, canvasHeight * 0.5 - canvasHeight / 2, zText1);
  rotateY(PI / 2 + sin(frameCount * 0.01) * 0.1);
  texture(textTexture1);
  plane(canvasWidth, canvasHeight);
  pop();

  // Горизонтальный текст
  push();
  let zText2 = map(easeInOutQuad(textOpacity2), 0, 1, -100, 20);
  translate(canvasWidth * 0.5 - canvasWidth / 2, canvasHeight * 0.5 - canvasHeight / 2, zText2);
  rotateZ(sin(frameCount * 0.01) * 0.1);
  texture(textTexture2);
  plane(canvasWidth, canvasHeight);
  pop();

  // Иероглиф в углу
  push();
  let zText3 = map(easeInOutQuad(textOpacity1), 0, 1, -100, 20);
  translate(canvasWidth * 0.5 - canvasWidth / 2, canvasHeight * 0.5 - canvasHeight / 2, zText3);
  rotateZ(sin(frameCount * 0.01) * 0.1);
  texture(textTexture3);
  plane(canvasWidth, canvasHeight);
  pop();

  // Затемнение экрана
  push();
  resetMatrix();
  ortho(0, width, 0, -height, -1000, 1000);
  translate(-width / 2, -height / 2, 1000);
  fill(0, fadeOut);
  noStroke();
  rectMode(CORNER);
  rect(0, 0, width, height);
  pop();

  // Отправка текущего кадра через frameSender
  frameSender.sendFrame(myCanvas);
}

// Функция для сплайновой интерполяции (Catmull-Rom)
function catmullRom(p0, p1, p2, p3, t) {
  let t2 = t * t;
  let t3 = t2 * t;
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
}

function updateTextures() {
  textTexture1 = createGraphics(canvasWidth, canvasHeight);
  textTexture1.textFont(font);
  textTexture1.textSize(canvasHeight * 0.02);
  textTexture1.textAlign(RIGHT);
  textTexture1.fill(50, 150);
  textTexture1.translate(canvasWidth * 0.916 + 2, canvasHeight * 0.375 + 2);
  textTexture1.rotate(-PI / 2);
  textTexture1.text("March 28, 19:00\n三月二十八日", 0, 0);
  textTexture1.fill(0);
  textTexture1.translate(-2, -2);
  textTexture1.text("March 28, 19:00\n三月二十八日", 0, 0);

  textTexture2 = createGraphics(canvasWidth, canvasHeight);
  textTexture2.textFont(font);
  textTexture2.textAlign(LEFT);
  textTexture2.fill(50, 150);
  textTexture2.textSize(canvasHeight * 0.025);
  textTexture2.text("bibliotheca\npoesis 詩の図書館", canvasWidth * 0.083 + 2, canvasHeight * 0.8125 + 2);
  textTexture2.textSize(canvasHeight * 0.021);
  textTexture2.text("Barbolina-dori 6\nバルボリナ通り6", canvasWidth * 0.083 + 2, canvasHeight * 0.90625 + 2);
  textTexture2.fill(100, 150);
  textTexture2.text("無料入場", canvasWidth * 0.083 + 2, canvasHeight * 0.95 + 2);
  textTexture2.fill(50, 150);
  textTexture2.text("18+", canvasWidth * 0.083 + 2, canvasHeight * 0.9875 + 2);
  textTexture2.fill(0);
  textTexture2.textSize(canvasHeight * 0.025);
  textTexture2.text("bibliotheca\npoesis 詩の図書館", canvasWidth * 0.083, canvasHeight * 0.8125);
  textTexture2.textSize(canvasHeight * 0.021);
  textTexture2.text("Barbolina-dori 6\nバルボリナ通り6", canvasWidth * 0.083, canvasHeight * 0.90625);
  textTexture2.fill(100);
  textTexture2.text("無料入場", canvasWidth * 0.083, canvasHeight * 0.95);
  textTexture2.fill(50);
  textTexture2.text("18+", canvasWidth * 0.083, canvasHeight * 0.9875);

  textTexture3 = createGraphics(canvasWidth, canvasHeight);
  textTexture3.textFont(font);
  textTexture3.textSize(canvasHeight * 0.05);
  textTexture3.fill(50, 150);
  textTexture3.text("[医]形状", canvasWidth * 0.083 + 2, canvasHeight * 0.0625 + 2);
  textTexture3.fill(0);
  textTexture3.text("[医]形状", canvasWidth * 0.083, canvasHeight * 0.0625);
}