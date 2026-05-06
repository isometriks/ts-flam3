import "./style.css"
import Flame from "./flame.ts";

declare global {
  interface Window { flame: Flame }
}

let flame = new Flame(2200, 1200)
window.flame = flame

// UI elements
const gammaInput = document.getElementById("gamma") as HTMLInputElement;
const brightnessInput = document.getElementById("brightness") as HTMLInputElement;
const vibrancyInput = document.getElementById("vibrancy") as HTMLInputElement;
const gammaValue = document.getElementById("gamma-value")!;
const brightnessValue = document.getElementById("brightness-value")!;
const vibrancyValue = document.getElementById("vibrancy-value")!;
const pauseBtn = document.getElementById("pause-btn") as HTMLButtonElement;
const renderDeBtn = document.getElementById("render-de-btn") as HTMLButtonElement;
const randomizePaletteBtn = document.getElementById("randomize-palette-btn") as HTMLButtonElement;
const newFlameBtn = document.getElementById("new-flame-btn") as HTMLButtonElement;
const rotateMinusBtn = document.getElementById("rotate-minus-btn") as HTMLButtonElement;
const rotatePlusBtn = document.getElementById("rotate-plus-btn") as HTMLButtonElement;
const status = document.getElementById("status")!;

// Slider handlers
gammaInput.addEventListener("input", () => {
  flame.renderer.gamma = parseFloat(gammaInput.value);
  gammaValue.textContent = gammaInput.value;
});
brightnessInput.addEventListener("input", () => {
  flame.renderer.brightness = parseFloat(brightnessInput.value);
  brightnessValue.textContent = brightnessInput.value;
});
vibrancyInput.addEventListener("input", () => {
  flame.renderer.vibrancy = parseFloat(vibrancyInput.value);
  vibrancyValue.textContent = vibrancyInput.value;
});

// State
let sampling = true;
let intervalId: ReturnType<typeof setInterval> | null = null;
let totalSamples = 0;

function startSampling() {
  sampling = true;
  flame.renderer.densityEstimation = false;
  status.textContent = "Sampling...";
  pauseBtn.textContent = "Pause";

  intervalId = setInterval(() => {
    flame.iterate(500000);
    totalSamples += 500000;
    status.textContent = `Sampling... (${(totalSamples / 1e6).toFixed(1)}M samples)`;
    flame.render();
  }, 100);
}

function stopSampling() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  sampling = false;
}

// Pause / Resume toggle
pauseBtn.addEventListener("click", () => {
  if (sampling) {
    stopSampling();
    status.textContent = `Paused (${(totalSamples / 1e6).toFixed(1)}M samples)`;
    pauseBtn.textContent = "Resume";
  } else {
    startSampling();
  }
});

// Render with DE: stop sampling, render with density estimation
renderDeBtn.addEventListener("click", () => {
  stopSampling();
  pauseBtn.textContent = "Resume";
  renderDeBtn.disabled = true;
  status.textContent = "Rendering with density estimation...";

  // Use setTimeout so the status text paints before the blocking DE pass
  setTimeout(() => {
    flame.renderer.densityEstimation = true;
    flame.render();
    flame.renderer.densityEstimation = false;
    status.textContent = `Rendered with DE (${(totalSamples / 1e6).toFixed(1)}M samples)`;
    renderDeBtn.disabled = false;
  }, 50);
});

// Rotate: apply rotation to all transforms, clear histogram, restart
const ROTATE_STEP = Math.PI / 36; // 5 degrees

function rotateAndRestart(radians: number) {
  const wasSampling = sampling;
  stopSampling();
  flame.rotate(radians);
  totalSamples = 0;
  flame.iterate(2000000);
  totalSamples = 2000000;
  flame.render();
  if (wasSampling) startSampling();
}

rotateMinusBtn.addEventListener("click", () => rotateAndRestart(-ROTATE_STEP));
rotatePlusBtn.addEventListener("click", () => rotateAndRestart(ROTATE_STEP));

// Randomize palette: clear histogram, get new palette, restart sampling
randomizePaletteBtn.addEventListener("click", () => {
  stopSampling();
  flame.randomizePalette();
  totalSamples = 0;
  flame.iterate(2000000);
  totalSamples = 2000000;
  flame.render();
  startSampling();
});

// New flame: create a completely new flame and restart
newFlameBtn.addEventListener("click", () => {
  stopSampling();
  flame = new Flame(2200, 1200);
  window.flame = flame;
  flame.renderer.gamma = parseFloat(gammaInput.value);
  flame.renderer.brightness = parseFloat(brightnessInput.value);
  flame.renderer.vibrancy = parseFloat(vibrancyInput.value);
  totalSamples = 0;
  flame.iterate(2000000);
  totalSamples = 2000000;
  flame.render();
  startSampling();
});

// Initial sampling burst then start loop
flame.iterate(2000000);
totalSamples = 2000000;
flame.render();
startSampling();
