let state = 0, transition = 0, upperShapeIndex = 0, lowerShapeIndex = 0;
let shapes = ["crescent", "star", "square"];
let cameraState = 0, cameraTransition = 0;
let upperCharGrid = [], lowerCharGrid = [], miniShapesUpper = [], miniShapesLower = [];
let ws, frameCountForCapture = 0;
let params = { stateChangeSpeed: 120, transitionSpeed: 0.02, maxRadius: 120, textDensity: 2, miniShapeCount: 10, miniShapeRotationSpeed: 2, pulseAmplitude: 1.5, depth: 50, cameraChangeSpeed: 240, cameraZoomSpeed: 0.01, isPlaying: true };
let myCanvas;

function setup() {
    myCanvas = createCanvas(1920, 962);
    frameRate(60); // Устанавливаем частоту кадров 60 FPS
    textAlign(CENTER, CENTER);
    noStroke();
    initializeCharGrids();
    initializeMiniShapes();
    
    ws = new WebSocket('ws://localhost:8080');
    ws.onopen = () => console.log('Connected to WebSocket server');
    ws.addEventListener('message', (event) => {
        const msg = event.data;
        params.isPlaying = msg === 'play';
    });
    ws.onclose = () => console.log('Disconnected from WebSocket server');
}

function initializeCharGrids() {
    let chars = "文 学 書 読 詩 小 説 隠 画 物 語 意 紙 墨 笔 表 章 演 故 伝";
    upperCharGrid = [];
    lowerCharGrid = [];
    for (let i = 0; i < 2; i++) {
        let grid = [], numAngles = Math.floor(360 / params.textDensity), numRadii = Math.floor(params.maxRadius / 6);
        for (let angle = 0; angle < numAngles; angle++) {
            let row = [];
            for (let r = 0; r < numRadii; r++) row.push(chars.charAt(floor(random(chars.length))));
            grid.push(row);
        }
        if (i === 0) upperCharGrid = grid;
        else lowerCharGrid = grid;
    }
}

function initializeMiniShapes() {
    miniShapesUpper = [];
    miniShapesLower = [];
    for (let i = 0; i < params.miniShapeCount; i++) {
        miniShapesUpper.push({ angle: i * (360 / params.miniShapeCount), radius: params.maxRadius * (1.2 + random(-0.2, 0.2)), size: 12 + random(4), rotation: 0 });
        miniShapesLower.push({ angle: i * (360 / params.miniShapeCount), radius: params.maxRadius * (1.2 + random(-0.2, 0.2)), size: 12 + random(4), rotation: 0 });
    }
}

function draw() {
    if (!params.isPlaying) return;
    background(0);

    if (frameCount % params.stateChangeSpeed === 0) {
        state = 1 - state;
        upperShapeIndex = (upperShapeIndex + 1) % shapes.length;
        lowerShapeIndex = (lowerShapeIndex + 1) % shapes.length;
        initializeCharGrids();
        initializeMiniShapes();
    }
    transition = easeInOutQuad(sin(frameCount * params.transitionSpeed));

    if (frameCount % params.cameraChangeSpeed === 0) cameraState = (cameraState + 1) % 4;
    cameraTransition = easeInOutQuad(sin(frameCount * params.cameraZoomSpeed));

    push();
    let camX, camY, camZoom;
    if (cameraState === 0 || cameraState === 2) {
        camX = windowWidth / 2;
        camY = windowHeight / 2;
        camZoom = 1;
    } else if (cameraState === 1) {
        camX = windowWidth / 2;
        camY = windowHeight / 4;
        camZoom = 2;
    } else {
        camX = windowWidth / 2;
        camY = 3 * windowHeight / 4;
        camZoom = 2;
    }

    let targetCamX = camX, targetCamY = camY, targetCamZoom = camZoom;
    let prevCamX = windowWidth / 2, prevCamY = windowHeight / 2, prevCamZoom = 1;
    camX = lerp(prevCamX, targetCamX, cameraTransition);
    camY = lerp(prevCamY, targetCamY, cameraTransition);
    camZoom = lerp(prevCamZoom, targetCamZoom, cameraTransition);

    translate(windowWidth / 2, windowHeight / 2);
    scale(camZoom);
    translate(-camX, -camY);

    drawShape(windowWidth / 2, windowHeight / 4, state === 0 ? 0 : 1, transition, shapes[upperShapeIndex], upperCharGrid, miniShapesUpper);
    drawShape(windowWidth / 2, 3 * windowHeight / 4, state === 0 ? 1 : 0, transition, shapes[lowerShapeIndex], lowerCharGrid, miniShapesLower);

    pop();

    if (ws.readyState === WebSocket.OPEN && myCanvas) {
        console.log('Sending frame');
        const dataURL = myCanvas.elt.toDataURL('image/png');
        ws.send(JSON.stringify({ type: 'frame', data: dataURL }));
    }
    frameCountForCapture++;
}

function drawShape(x, y, targetState, progress, shapeType, charGrid, miniShapes) {
    push();
    translate(x, y);

    let baseRadius = lerp(80, params.maxRadius, progress);
    let depth = lerp(0, params.depth, progress);
    let noiseFactor = noise(frameCount * 0.05);
    let dynamicDensity = params.textDensity * (1 + 0.3 * progress);
    let angleStep = dynamicDensity, numAngles = Math.floor(360 / angleStep), rStep = 6, numRadii = Math.floor(params.maxRadius / rStep);

    for (let angleIndex = 0; angleIndex < numAngles; angleIndex++) {
        let angle = angleIndex * angleStep, cosAngle = cos(radians(angle)), sinAngle = sin(radians(angle));
        for (let rIndex = 0; rIndex < numRadii; rIndex++) {
            let r = rIndex * rStep;
            if (r > baseRadius) continue;
            let spacingFactor = map(r, 0, baseRadius, 0.9, 1.3);
            let pxBase = r * cosAngle * spacingFactor + noiseFactor * 5;
            let pyBase = r * sinAngle * spacingFactor + noiseFactor * 5;
            let offset = depth * sinAngle * progress;

            let px, py;
            if (shapeType === "crescent") {
                px = pxBase;
                py = pyBase;
            } else if (shapeType === "star") {
                let starFactor = 1 + 0.5 * sin(radians(angle * 5));
                let adjustedR = r * starFactor;
                px = adjustedR * cosAngle * spacingFactor + noiseFactor * 5;
                py = adjustedR * sinAngle * spacingFactor + noiseFactor * 5;
            } else {
                px = pxBase;
                py = pyBase;
                let maxDim = max(abs(px), abs(py));
                let squareR = map(maxDim, 0, baseRadius, 0, baseRadius * 0.7);
                px = constrain(px * spacingFactor, -squareR, squareR);
                py = constrain(py * spacingFactor, -squareR, squareR);
            }

            if (charGrid[angleIndex] && charGrid[angleIndex][rIndex]) {
                let pulse = sin(frameCount * 0.05 + r) * params.pulseAmplitude;
                textSize(7 + pulse);
                fill(255, map(progress, 0, 1, 100, 255));
                text(charGrid[angleIndex][rIndex], px, py - offset);
            }
        }
    }

    miniShapes.forEach(shape => {
        shape.angle += params.miniShapeRotationSpeed;
        shape.rotation += 3;
        let orbitX = shape.radius * cos(radians(shape.angle));
        let orbitY = shape.radius * sin(radians(shape.angle));
        push();
        translate(orbitX, orbitY);
        rotate(radians(shape.rotation));
        let shakeX = random(-1, 1) * progress, shakeY = random(-1, 1) * progress;
        translate(shakeX, shakeY);
        drawMiniShape(0, 0, shape.size, shapeType, charGrid, progress);
        pop();
    });

    for (let i = 0; i < 15; i++) {
        let scatterR = random(baseRadius, baseRadius * 1.5), scatterAngle = random(360);
        let scatterX = scatterR * cos(radians(scatterAngle)), scatterY = scatterR * sin(radians(scatterAngle));
        let angleIndex = floor(scatterAngle / params.textDensity) % (charGrid.length || 1);
        let rIndex = floor(scatterR / 6) % (charGrid[0] ? charGrid[0].length : 1);
        if (charGrid[angleIndex] && charGrid[angleIndex][rIndex]) {
            let pulse = sin(frameCount * 0.05 + i) * params.pulseAmplitude;
            textSize(5 + pulse);
            fill(255, map(progress, 0, 1, 50, 150));
            text(charGrid[angleIndex][rIndex], scatterX, scatterY);
        }
    }

    fill(0);
    if (shapeType === "crescent") {
        let innerRadius = baseRadius * 0.7;
        beginShape();
        for (let angle = 0; angle <= 360; angle += 10) {
            let px = innerRadius * cos(radians(angle)), py = innerRadius * sin(radians(angle));
            vertex(px, py - depth);
        }
        beginContour();
        for (let angle = 0; angle <= 360; angle += 10) {
            let px = (innerRadius * 0.8) * cos(radians(angle + 90));
            let py = (innerRadius * 0.8) * sin(radians(angle + 90)) - innerRadius * 0.4;
            vertex(px, py - depth);
        }
        endContour();
        endShape(CLOSE);
    } else if (shapeType === "star") {
        let innerRadius = baseRadius * 0.7;
        beginShape();
        for (let angle = 0; angle <= 360; angle += 10) {
            let starFactor = 1 + 0.5 * sin(radians(angle * 5));
            let px = (innerRadius * starFactor) * cos(radians(angle));
            let py = (innerRadius * starFactor) * sin(radians(angle));
            vertex(px, py - depth);
        }
        endShape(CLOSE);
    } else {
        rectMode(CENTER);
        rect(0, -depth, baseRadius * 0.7, baseRadius * 0.7);
    }

    pop();
}

function drawMiniShape(x, y, size, shapeType, charGrid, progress) {
    let miniRadius = size, angleStep = 10, rStep = 5, numAngles = Math.floor(360 / angleStep), numRadii = Math.floor(miniRadius / rStep);
    for (let angle = 0; angle < numAngles; angle++) {
        let cosAngle = cos(radians(angle * angleStep)), sinAngle = sin(radians(angle * angleStep));
        for (let r = 0; r < numRadii; r++) {
            let rVal = r * rStep;
            let angleIndex = floor((angle * angleStep) / params.textDensity) % (charGrid.length || 1);
            let rIndex = floor(rVal / rStep) % (charGrid[0] ? charGrid[0].length : 1);
            let pxBase = x + rVal * cosAngle, pyBase = y + rVal * sinAngle;
            let px, py;

            if (shapeType === "crescent") {
                px = pxBase;
                py = pyBase;
                if (rVal > miniRadius * 0.7 && angle * angleStep > 90 && angle * angleStep < 270) continue;
            } else if (shapeType === "star") {
                let starFactor = 1 + 0.5 * sin(radians(angle * angleStep * 5));
                let adjustedR = rVal * starFactor;
                px = x + adjustedR * cosAngle;
                py = y + adjustedR * sinAngle;
            } else {
                px = pxBase;
                py = pyBase;
                let maxDim = max(abs(px), abs(py));
                let squareR = map(maxDim, 0, miniRadius, 0, miniRadius * 0.7);
                px = constrain(px, -squareR, squareR);
                py = constrain(py, -squareR, squareR);
            }

            if (charGrid[angleIndex] && charGrid[angleIndex][rIndex]) {
                let pulse = sin(frameCount * 0.05 + rVal) * params.pulseAmplitude;
                textSize(5 + pulse);
                fill(255, map(progress, 0, 1, 100, 255));
                text(charGrid[angleIndex][rIndex], px, py);
            }
        }
    }
}

function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
