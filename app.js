const display = document.querySelector("#display-value");
const expression = document.querySelector("#expression");
const lyricLine = document.querySelector("#lyric-line");
const playerStatus = document.querySelector("#player-status");
const playButton = document.querySelector("#play-button");
const stopButton = document.querySelector("#stop-button");
const audio = document.querySelector("#song");
const progress = document.querySelector(".track-progress");
const progressFill = document.querySelector("#progress-fill");
const trackTime = document.querySelector("#track-time");
const canvas = document.querySelector("#visualizer");
const canvasContext = canvas.getContext("2d");

const defaultLyrics = [
  "Heto na naman tayo",
  "Umiindak muli",
  "Sa saliw ng buhay nating",
  "Laging sumasandali"
];
const defaultLineMs = 4000;
const typingPortion = 0.6;
let lyrics = [];
let lyricTimer = 0;
let lyricStartedAt = 0;
let currentValue = "0";
let storedValue = null;
let pendingOperator = null;
let replaceCurrent = false;
let audioContext = null;
let analyser = null;
let frequencyData = null;
let animationFrame = 0;

function parseLyrics(source) {
  return source.split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const separator = line.indexOf("|");
      if (separator > 0) {
        const duration = Number.parseInt(line.slice(0, separator).trim(), 10);
        if (Number.isFinite(duration) && duration > 0) {
          return { text: line.slice(separator + 1).trim(), duration };
        }
      }
      return { text: line, duration: defaultLineMs };
    })
    .filter((line) => line.text);
}

fetch("lyrics.txt")
  .then((response) => {
    if (!response.ok) throw new Error("Lyrics file could not be loaded");
    return response.text();
  })
  .then((source) => {
    lyrics = parseLyrics(source);
    if (!lyrics.length) lyrics = defaultLyrics.map((text) => ({ text, duration: defaultLineMs }));
  })
  .catch(() => {
    lyrics = defaultLyrics.map((text) => ({ text, duration: defaultLineMs }));
  });

function renderDisplay() {
  display.textContent = currentValue;
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return "Error";
  const rounded = Number.parseFloat(value.toPrecision(11));
  return String(Object.is(rounded, -0) ? 0 : rounded);
}

function enterDigit(digit) {
  currentValue = replaceCurrent || currentValue === "0" ? digit : currentValue + digit;
  replaceCurrent = false;
  renderDisplay();
}

function enterDecimal() {
  if (replaceCurrent) {
    currentValue = "0.";
    replaceCurrent = false;
  } else if (!currentValue.includes(".")) {
    currentValue += ".";
  }
  renderDisplay();
}

function applyOperator(operator) {
  const value = Number(currentValue);
  if (pendingOperator && !replaceCurrent) {
    calculate(false);
    storedValue = Number(currentValue);
  } else {
    storedValue = value;
  }
  pendingOperator = operator;
  expression.textContent = `${currentValue} ${operator}`;
  replaceCurrent = true;
}

function calculate(startPlayback = true) {
  if (pendingOperator && storedValue !== null) {
    const left = storedValue;
    const right = Number(currentValue);
    const operator = pendingOperator;
    let result;
    if (operator === "+") result = left + right;
    if (operator === "−") result = left - right;
    if (operator === "×") result = left * right;
    if (operator === "÷") result = right === 0 ? NaN : left / right;
    expression.textContent = `${formatNumber(left)} ${operator} ${formatNumber(right)} =`;
    currentValue = formatNumber(result);
    storedValue = null;
    pendingOperator = null;
    replaceCurrent = true;
    renderDisplay();
  } else {
    expression.textContent = "";
  }
  if (startPlayback) startShow();
}

function stopShow(resetLine = true) {
  window.clearInterval(lyricTimer);
  lyricTimer = 0;
  audio.pause();
  if (Number.isFinite(audio.duration)) audio.currentTime = 0;
  progressFill.style.width = "0%";
  progress.setAttribute("aria-valuenow", "0");
  if (resetLine) lyricLine.textContent = "Press play or calculate to begin.";
  playerStatus.textContent = "READY";
  playButton.disabled = false;
  cancelAnimationFrame(animationFrame);
  drawVisualizer(false);
}

function startShow() {
  stopShow(false);
  if (!lyrics.length) {
    lyricLine.textContent = "Loading lyrics...";
    window.setTimeout(startShow, 150);
    return;
  }

  lyricStartedAt = performance.now();
  playerStatus.textContent = "PLAYING";
  playButton.disabled = true;
  startVisualizer();
  audio.currentTime = 0;
  audio.play().then(() => {
    playerStatus.textContent = "PLAYING";
  }).catch(() => {
    playerStatus.textContent = "AUDIO UNAVAILABLE";
  });

  lyricTimer = window.setInterval(updateLyrics, 30);
  updateLyrics();
}

function updateLyrics() {
  const elapsed = performance.now() - lyricStartedAt;
  let remaining = elapsed;
  let lineIndex = 0;
  while (lineIndex < lyrics.length && remaining >= lyrics[lineIndex].duration) {
    remaining -= lyrics[lineIndex].duration;
    lineIndex += 1;
  }

  if (lineIndex >= lyrics.length) {
    window.clearInterval(lyricTimer);
    lyricTimer = 0;
    audio.pause();
    playerStatus.textContent = "FINISHED";
    playButton.disabled = false;
    cancelAnimationFrame(animationFrame);
    drawVisualizer(false);
    return;
  }

  const line = lyrics[lineIndex];
  const typingTime = Math.max(1, line.duration * typingPortion);
  const visibleCharacters = Math.min(line.text.length,
    Math.floor(line.text.length * Math.min(remaining / typingTime, 1)));
  lyricLine.textContent = line.text.slice(0, visibleCharacters);
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

audio.addEventListener("timeupdate", () => {
  const percent = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  progressFill.style.width = `${percent}%`;
  progress.setAttribute("aria-valuenow", String(Math.round(percent)));
  trackTime.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
});

audio.addEventListener("loadedmetadata", () => {
  trackTime.textContent = `0:00 / ${formatTime(audio.duration)}`;
});

audio.addEventListener("error", () => {
  playerStatus.textContent = "AUDIO FILE NOT FOUND";
});

function handleKey(key) {
  if (/^\d$/.test(key)) return enterDigit(key);
  if (key === ".") return enterDecimal();
  if (key === "clear") {
    currentValue = "0";
    storedValue = null;
    pendingOperator = null;
    replaceCurrent = false;
    expression.textContent = "";
    return renderDisplay();
  }
  if (key === "sign") {
    if (currentValue !== "0" && currentValue !== "Error") {
      currentValue = currentValue.startsWith("-") ? currentValue.slice(1) : `-${currentValue}`;
      renderDisplay();
    }
    return;
  }
  if (key === "percent") {
    currentValue = formatNumber(Number(currentValue) / 100);
    replaceCurrent = true;
    return renderDisplay();
  }
  if (key === "backspace") {
    currentValue = replaceCurrent || currentValue.length < 2 ? "0" : currentValue.slice(0, -1);
    replaceCurrent = false;
    return renderDisplay();
  }
  const operators = { add: "+", subtract: "−", multiply: "×", divide: "÷" };
  if (operators[key]) return applyOperator(operators[key]);
  if (key === "equals") return calculate();
}

document.querySelectorAll("[data-digit]").forEach((button) => {
  button.addEventListener("click", () => {
    stopShow();
    handleKey(button.dataset.digit);
  });
});

document.querySelectorAll("[data-key]").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.key === "equals") {
      window.clearInterval(lyricTimer);
      lyricTimer = 0;
      audio.pause();
    } else {
      stopShow();
    }
    handleKey(button.dataset.key);
  });
});

playButton.addEventListener("click", startShow);
stopButton.addEventListener("click", () => stopShow());

document.addEventListener("keydown", (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  const keyMap = {
    Enter: "equals",
    Backspace: "backspace",
    Escape: "clear",
    "+": "add",
    "-": "subtract",
    "*": "multiply",
    "/": "divide",
    "%": "percent",
    ".": "decimal"
  };
  if (/^\d$/.test(event.key) || keyMap[event.key]) {
    event.preventDefault();
    const key = keyMap[event.key] || event.key;
    if (key === "equals") {
      window.clearInterval(lyricTimer);
      lyricTimer = 0;
      audio.pause();
    } else {
      stopShow();
    }
    handleKey(key);
  }
});

function setupAudioVisualizer() {
  if (analyser) return true;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return false;
  try {
    audioContext = new AudioContextClass();
    const source = audioContext.createMediaElementSource(audio);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 128;
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    frequencyData = new Uint8Array(analyser.frequencyBinCount);
    return true;
  } catch {
    analyser = null;
    return false;
  }
}

function startVisualizer() {
  setupAudioVisualizer();
  if (audioContext?.state === "suspended") audioContext.resume();
  cancelAnimationFrame(animationFrame);
  drawVisualizer(true);
}

function drawVisualizer(isPlaying) {
  const bounds = canvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(bounds.width * pixelRatio));
  const height = Math.max(1, Math.floor(bounds.height * pixelRatio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  canvasContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  canvasContext.clearRect(0, 0, bounds.width, bounds.height);

  if (analyser && isPlaying) analyser.getByteFrequencyData(frequencyData);
  const bars = 48;
  const gap = 3;
  const barWidth = (bounds.width - gap * (bars - 1)) / bars;
  for (let index = 0; index < bars; index += 1) {
    const value = isPlaying && analyser
      ? frequencyData[Math.floor(index * frequencyData.length / bars)] / 255
      : 0.06 + Math.max(0, Math.sin(index * 0.52)) * 0.08;
    const barHeight = Math.max(3, value * (bounds.height * 0.76));
    const x = index * (barWidth + gap);
    const y = (bounds.height - barHeight) / 2;
    canvasContext.fillStyle = index % 7 === 0 ? "#e76b45" : "#b9d6a5";
    canvasContext.fillRect(x, y, barWidth, barHeight);
  }

  if (isPlaying) animationFrame = requestAnimationFrame(() => drawVisualizer(true));
}

window.addEventListener("resize", () => drawVisualizer(Boolean(lyricTimer)));
drawVisualizer(false);