const maxRadius = 200;
const maxClusters = 20;
const minClusterSize = 50;
const predefinedColors = [
  "green",
  "red",
  "orange",
  "cyan",
  "magenta",
  "lavender",
  "teal",
];
const names = [
  "VERDE",
  "VERMELHO",
  "LARANJA",
  "CIANO",
  "ROSA",
  "BRANCO",
  "teal",
];
const settings = {
  seed: 91651088029,
  fps: 0,
  atoms: {
    count: 500,
    radius: 1,
  },
  drawings: {
    lines: false,
    circle: false,
    clusters: false,
    background_color: "#000000",
  },
  export: {
    image: () => {
      const imageDataURL = canvas.toDataURL({
        format: "png",
        quality: 1,
      });
      dataURL_downloader(imageDataURL);
    },

    video: () => {
      mediaRecorder.state == "recording"
        ? mediaRecorder.stop()
        : mediaRecorder.start();
    },
  },
  explore: false,
  explorePeriod: 100,
  rules: {},
  rulesArray: [],
  radii: {},
  radii2Array: [],
  colors: [],
  numColors: 4,
  time_scale: 1.0,
  viscosity: 0.7,
  gravity: 0.0,
  pulseDuration: 10,
  wallRepel: 40,
  reset: () => {
    randomAtoms(settings.atoms.count, true);
  },
  randomRules: () => {
    settings.seed = local_seed;
    startRandom();
  },
  symmetricRules: () => {
    symmetricRules();
    randomAtoms(settings.atoms.count, true);
    updateGUIDisplay();
  },
  gui: null,
};

const setupClicks = () => {
  canvas.addEventListener("click", (e) => {
    pulse = settings.pulseDuration;
    if (e.shiftKey) pulse = -pulse;
    pulse_x = e.clientX;
    pulse_y = e.clientY;
  });
};
const setupKeys = () => {
  canvas.addEventListener("keydown", function (e) {
    console.log(e.key);
    switch (e.key) {
      case "r":
        settings.randomRules();
        break;
      case "t":
        settings.drawings.clusters = !settings.drawings.clusters;
        break;
      case "o":
        settings.reset();
        break;
      case "s":
        settings.symmetricRules();
        break;
      default:
        console.log(e.key);
    }
  });
};
const updateGUIDisplay = () => {
  console.log("gui", settings.gui);
  settings.gui.destroy();
  setupGUI();
};
Object.defineProperty(String.prototype, "capitalise", {
  value: function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
  },
  enumerable: false,
});

const setupGUI = () => {
  settings.gui = new lil.GUI();
  const configFolder = settings.gui.addFolder("CONFIGURAÇÕES");
  configFolder.add(settings, "reset").name("RESETAR");
  configFolder.add(settings, "randomRules").name("ALEATÓRIO");
  configFolder.add(settings, "symmetricRules").name("REGRAS SIMÉTRICAS");
  configFolder
    .add(settings, "numColors", 1, 7, 1)
    .name("NÚMERO DE CORES")
    .listen()
    .onFinishChange((v) => {
      setNumberOfColors();
      startRandom();
    });
  configFolder
    .add(settings, "seed")
    .name("SEED")
    .listen()
    .onFinishChange((v) => {
      startRandom();
    });
  configFolder.add(settings, "fps").name("FPS").listen().disable();
  configFolder
    .add(settings.atoms, "count", 1, 1000, 1)
    .name("ATOMOS POR COR")
    .listen()
    .onFinishChange((v) => {
      randomAtoms(v, true);
    });
  configFolder.add(settings, "time_scale", 0.1, 5, 0.01).name("TEMPO").listen();
  configFolder
    .add(settings, "viscosity", 0.1, 2, 0.1)
    .name("VISCOSIDADE")
    .listen();

  configFolder.add(settings, "gravity", 0, 1, 0.05).name("GRAVIDADE").listen();
  configFolder.add(settings, "pulseDuration", 1, 100, 1).name("PULSO").listen();

  configFolder.add(settings, "wallRepel", 0, 100, 1).name("PAREDE").listen();
  configFolder.add(settings, "explore").name("EXPLORAÇÃO ALEATÓRIA").listen();

  const drawingsFolder = settings.gui.addFolder("DESENHOS");
  drawingsFolder
    .add(settings.atoms, "radius", 1, 10, 0.5)
    .name("RAIO")
    .listen();

  drawingsFolder
    .add(settings.drawings, "circle")
    .name("FORMATO DO CIRCULO")
    .listen();
  drawingsFolder
    .add(settings.drawings, "clusters")
    .name("TRAÇAR CAMINHO")
    .listen();

  drawingsFolder
    .add(settings.drawings, "lines")
    .name("DESENHAR LINHAS")
    .listen();
  drawingsFolder
    .addColor(settings.drawings, "background_color")
    .name("FUNDO")
    .listen();

  const exportFolder = settings.gui.addFolder("EXPORTAR");
  exportFolder.add(settings.export, "image").name("IMAGEM");
  exportFolder.add(settings.export, "video").name("VIDEO: INICIAR / PARAR");

  for (let i = 0; i < settings.colors.length; i++) {
    const colorFolder = settings.gui.addFolder(
      `REGRAS: <font color=\'${settings.colors[i]}\'>${names[
        i
      ].capitalise()}</font>`
    );
    for (let j = 0; j < settings.colors.length; j++) {
      colorFolder
        .add(
          settings.rules[settings.colors[j]],
          settings.colors[j],
          -1,
          1,
          0.001
        )
        .name(
          `<-> <font color=\'${settings.colors[j]}\'>${names[
            j
          ].capitalise()}</font>`
        )
        .listen()
        .onFinishChange((v) => {
          flattenRules();
        });
    }
    colorFolder
      .add(settings.radii, settings.colors[i], 1, maxRadius, 5)
      .name("RAIO")
      .listen()
      .onFinishChange((v) => {
        flattenRules();
      });
  }
};

var local_seed = settings.seed;
function mulberry32() {
  let t = (local_seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function loadSeedFromUrl() {
  let hash = window.location.hash;
  if (hash != undefined && hash[0] == "#") {
    let param = Number(hash.substr(1));
    if (isFinite(param)) {
      settings.seed = param;
    }
  }
}

function randomRules() {
  if (!isFinite(settings.seed)) settings.seed = 0xcafecafe;
  window.location.hash = "#" + settings.seed;
  document.title = "VIDA N° " + settings.seed;
  local_seed = settings.seed;
  for (const i of settings.colors) {
    settings.rules[i] = {};
    for (const j of settings.colors) {
      settings.rules[i][j] = mulberry32() * 2 - 1;
    }
    settings.radii[i] = 80;
  }
  flattenRules();
}

function symmetricRules() {
  for (const i of settings.colors) {
    for (const j of settings.colors) {
      if (j < i) {
        let v = 0.5 * (settings.rules[i][j] + settings.rules[j][i]);
        settings.rules[i][j] = settings.rules[j][i] = v;
      }
    }
  }
  console.log(JSON.stringify(settings.rules));
  flattenRules();
}

function flattenRules() {
  settings.rulesArray = [];
  settings.radii2Array = [];
  for (const c1 of settings.colors) {
    for (const c2 of settings.colors) {
      settings.rulesArray.push(settings.rules[c1][c2]);
    }
    settings.radii2Array.push(settings.radii[c1] * settings.radii[c1]);
  }
}

function updateCanvasDimensions() {
  canvas.width = window.innerWidth * 0.9;
  canvas.height = window.innerHeight * 0.9;
}

function randomX() {
  return mulberry32() * (canvas.width - 100) + 50;
}

function randomY() {
  return mulberry32() * (canvas.height - 100) + 50;
}

/* Create an Atom - Use matrices for x4/5 performance improvement
        atom[0] = x
        atom[1] = y
        atom[2] = ax
        atom[3] = ay
        atom[4] = color (index)
        */
const create = (number, color) => {
  for (let i = 0; i < number; i++) {
    atoms.push([randomX(), randomY(), 0, 0, color]);
  }
};

function randomAtoms(number_of_atoms_per_color, clear_previous) {
  if (clear_previous) atoms.length = 0;
  for (let c = 0; c < settings.colors.length; c++) {
    create(number_of_atoms_per_color, c);
  }
  clusters.length = 0;
}

function startRandom() {
  randomRules();
  randomAtoms(settings.atoms.count, true);
  updateGUIDisplay();
}

function setNumberOfColors() {
  settings.colors = [];
  for (let i = 0; i < settings.numColors; ++i) {
    settings.colors.push(predefinedColors[i]);
  }
}

loadSeedFromUrl();

const canvas = document.getElementById("canvas");
const m = canvas.getContext("2d");
const drawSquare = (x, y, color, radius) => {
  m.fillStyle = color;
  m.fillRect(x - radius, y - radius, 2 * radius, 2 * radius);
};

function drawCircle(x, y, color, radius, fill = true) {
  m.beginPath();
  m.arc(x, y, radius, 0 * Math.PI, 2 * Math.PI);
  m.closePath();
  m.strokeStyle = m.fillStyle = color;
  fill ? m.fill() : m.stroke();
}

function drawLineBetweenAtoms(ax, ay, bx, by, color) {
  m.beginPath();
  m.moveTo(ax, ay);
  m.lineTo(bx, by);
  m.closePath();
  m.strokeStyle = color;
  m.stroke();
}

let clusters = [];
function newCluster() {
  return [randomX(), randomY(), maxRadius, "white"];
}
function addNewClusters(num_clusters) {
  if (clusters.length < num_clusters / 2) {
    while (clusters.length < num_clusters) clusters.push(newCluster());
  }
}
function findNearestCluster(x, y) {
  let best = -1;
  let best_d2 = 1e38;
  for (let i = 0; i < clusters.length; ++i) {
    const c = clusters[i];
    const dx = c[0] - x;
    const dy = c[1] - y;
    const d2 = dx * dx + dy * dy;
    if (d2 < best_d2) {
      best = i;
      best_d2 = d2;
    }
  }
  return [best, best_d2];
}
function moveClusters(accums) {
  let max_d = 0;
  for (let i = 0; i < clusters.length; ++i) {
    let c = clusters[i];
    const a = accums[i];
    if (a[0] > minClusterSize) {
      const norm = 1 / a[0];
      const new_x = a[1] * norm;
      const new_y = a[2] * norm;
      max_d = Math.max(max_d, Math.abs(c[0] - new_x), Math.abs(c[1] - new_y));
      c[0] = new_x;
      c[1] = new_y;
    }
  }
  return max_d;
}
function finalizeClusters(accums) {
  for (let i = 0; i < clusters.length; ++i) {
    let c = clusters[i];
    const a = accums[i];
    if (a[0] > minClusterSize) {
      const norm = 1 / a[0];
      const new_r = 1.1 * Math.sqrt(a[3] * norm);
      c[2] = 0.95 * c[2] + 0.05 * new_r;
      c[3] = settings.colors[Math.floor(a[4] * norm + 0.5)];
    } else {
      c[2] = 0;
    }
  }
}
function trackClusters() {
  addNewClusters(maxClusters);
  let accums = [];
  for (const c of clusters) accums.push([0, 0, 0, 0, 0]);
  const maxKMeanPasses = 10;
  for (let pass = maxKMeanPasses; pass >= 0; --pass) {
    for (let a of accums) a = [0, 0, 0, 0, 0];
    for (const c of atoms) {
      const [best, best_d2] = findNearestCluster(c[0], c[1]);
      if (best >= 0 && best_d2 < maxRadius * maxRadius) {
        accums[best][0] += 1;
        accums[best][1] += c[0];
        accums[best][2] += c[1];
        accums[best][3] += best_d2;
        accums[best][4] += c[4];
      }
    }
    const max_d = moveClusters(accums);
    if (max_d < 1) break;
  }
  finalizeClusters(accums);
}
function drawClusters() {
  let i = 0;
  while (i < clusters.length) {
    let c = clusters[i];
    if (c[2] > 0) {
      drawCircle(c[0], c[1], c[3], c[2], false);
      ++i;
    } else {
      const last = clusters.pop();
      if (i < clusters.length) clusters[i] = last;
    }
  }
}

updateCanvasDimensions();

var pulse = 0;
var pulse_x = 0,
  pulse_y = 0;

var exploration_timer = 0;
function exploreParameters() {
  if (exploration_timer <= 0) {
    let c1 = settings.colors[Math.floor(mulberry32() * settings.numColors)];
    if (mulberry32() >= 0.2) {
      let c2 = settings.colors[Math.floor(mulberry32() * settings.numColors)];
      let new_strength = mulberry32();
      if (settings.rules[c1][c2] > 0) new_strength = -new_strength;
      settings.rules[c1][c2] = new_strength;
    } else {
      settings.radii[c1] = 1 + Math.floor(mulberry32() * maxRadius);
    }
    flattenRules();
    exploration_timer = settings.explorePeriod;
  }
  exploration_timer -= 1;
}

var total_v;

const applyRules = () => {
  total_v = 0;
  for (const a of atoms) {
    let fx = 0;
    let fy = 0;
    const idx = a[4] * settings.numColors;
    const r2 = settings.radii2Array[a[4]];
    for (const b of atoms) {
      const g = settings.rulesArray[idx + b[4]];
      const dx = a[0] - b[0];
      const dy = a[1] - b[1];
      if (dx !== 0 || dy !== 0) {
        const d = dx * dx + dy * dy;
        if (d < r2) {
          const F = g / Math.sqrt(d);
          fx += F * dx;
          fy += F * dy;

          if (settings.drawings.lines) {
            drawLineBetweenAtoms(a[0], a[1], b[0], b[1], settings.colors[b[4]]);
          }
        }
      }
    }
    if (pulse != 0) {
      const dx = a[0] - pulse_x;
      const dy = a[1] - pulse_y;
      const d = dx * dx + dy * dy;
      if (d > 0) {
        const F = (100 * pulse) / (d * settings.time_scale);
        fx += F * dx;
        fy += F * dy;
      }
    }
    if (settings.wallRepel > 0) {
      const d = settings.wallRepel;
      const strength = 0.1;
      if (a[0] < d) fx += (d - a[0]) * strength;
      if (a[0] > canvas.width - d) fx += (canvas.width - d - a[0]) * strength;
      if (a[1] < d) fy += (d - a[1]) * strength;
      if (a[1] > canvas.height - d) fy += (canvas.height - d - a[1]) * strength;
    }
    fy += settings.gravity;
    const vmix = 1 - settings.viscosity;
    a[2] = a[2] * vmix + fx * settings.time_scale;
    a[3] = a[3] * vmix + fy * settings.time_scale;

    total_v += Math.abs(a[2]);
    total_v += Math.abs(a[3]);
  }

  for (const a of atoms) {
    a[0] += a[2];
    a[1] += a[3];

    if (a[0] < 0) {
      a[0] = -a[0];
      a[2] *= -1;
    }
    if (a[0] >= canvas.width) {
      a[0] = 2 * canvas.width - a[0];
      a[2] *= -1;
    }
    if (a[1] < 0) {
      a[1] = -a[1];
      a[3] *= -1;
    }
    if (a[1] >= canvas.height) {
      a[1] = 2 * canvas.height - a[1];
      a[3] *= -1;
    }
  }
  total_v /= atoms.length;
};

setNumberOfColors();
randomRules();

const atoms = [];
randomAtoms(settings.atoms.count, true);

setupClicks();
setupKeys();
setupGUI();

var lastT = Date.now();
update();

function update() {
  updateCanvasDimensions();
  m.fillStyle = settings.drawings.background_color;
  m.fillRect(0, 0, canvas.width, canvas.height);
  applyRules();
  for (const a of atoms) {
    if (settings.drawings.circle) {
      drawCircle(a[0], a[1], settings.colors[a[4]], settings.atoms.radius);
    } else {
      drawSquare(a[0], a[1], settings.colors[a[4]], settings.atoms.radius);
    }
  }
  if (settings.drawings.clusters) {
    trackClusters();
    drawClusters();
  }

  updateParams();

  requestAnimationFrame(update);
}

function updateParams() {
  var curT = Date.now();
  if (curT > lastT) {
    const new_fps = 1000 / (curT - lastT);
    settings.fps = Math.round(settings.fps * 0.8 + new_fps * 0.2);
    lastT = curT;
  }

  if (total_v > 30 && settings.time_scale > 5) settings.time_scale /= 1.1;
  if (settings.time_scale < 0.9) settings.time_scale *= 1.01;
  if (settings.time_scale > 1.1) settings.time_scale /= 1.01;

  if (pulse != 0) pulse -= pulse > 0 ? 1 : -1;
  if (settings.explore) exploreParameters();
}

function dataURL_downloader(dataURL, name = `VIDA N° ${settings.seed}`) {
  const hyperlink = document.createElement("a");
  hyperlink.download = name;
  hyperlink.target = "_blank";
  hyperlink.href = dataURL;
  hyperlink.click();
  hyperlink.remove();
}

const videoStream = canvas.captureStream();
const mediaRecorder = new MediaRecorder(videoStream);
let chunks = [];
mediaRecorder.ondataavailable = function (e) {
  chunks.push(e.data);
};
mediaRecorder.onstop = function (e) {
  const blob = new Blob(chunks, { type: "video/mp4" });
  const videoDataURL = URL.createObjectURL(blob);
  dataURL_downloader(videoDataURL);
  chunks = [];
};
