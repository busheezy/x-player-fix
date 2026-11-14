const playerSelector = '[data-testid="videoPlayer"]';
const sliderSelector = '[role="slider"]';
const otherControlSelector = 'button, a, input, select, textarea, video, [role="button"]';

interface SliderDrag {
  slider: Element;
  timeStamp: number;
  events: AbortController;
}

let drag: SliderDrag | undefined;

function endDrag(): void {
  drag?.events.abort();
  drag = undefined;
}

function findSlider(target: Element, player: Element): Element | undefined {
  const directSlider = target.closest(sliderSelector);
  if (directSlider && player.contains(directSlider)) {
    return directSlider;
  }
  if (target.closest(otherControlSelector)) {
    return undefined;
  }

  const sliders = Array.from(player.querySelectorAll(sliderSelector));
  return findTrackSlider(target, player, sliders);
}

function findTrackSlider(
  target: Element,
  player: Element,
  sliders: Element[],
): Element | undefined {
  let element: Element | null = target;
  while (element && element !== player) {
    if (element.querySelector(otherControlSelector)) {
      return undefined;
    }

    const container = element;
    const matches = sliders.filter((slider) => container.contains(slider));
    if (matches.length === 1) {
      return matches[0];
    }
    if (matches.length > 1) {
      return undefined;
    }

    element = element.parentElement;
  }

  return undefined;
}

function startInteraction(event: MouseEvent): void {
  if (!event.isTrusted || event.button !== 0 || !(event.target instanceof Element)) {
    return;
  }

  endDrag();
  cancelSpeedHold();
  const player = event.target.closest(playerSelector);
  if (!player) {
    return;
  }

  const video = player.querySelector("video");
  if (!video || video.controls) {
    return;
  }

  const slider = findSlider(event.target, player);
  if (!slider) {
    startSpeedHold(event, player, video);
    return;
  }
  if (slider.getAttribute("aria-disabled") === "true") {
    return;
  }

  const events = new AbortController();
  const options = { capture: true, passive: true, signal: events.signal };
  drag = { slider, timeStamp: event.timeStamp, events };

  window.addEventListener("mousemove", updateDrag, options);
  window.addEventListener("mouseup", endDrag, options);
  window.addEventListener("blur", endDrag, { signal: events.signal });
  window.addEventListener("pagehide", endDrag, { signal: events.signal });
  document.addEventListener("visibilitychange", endDrag, { signal: events.signal });
}

function updateDrag(event: MouseEvent): void {
  if (!drag || !event.isTrusted) {
    return;
  }

  if (!drag.slider.isConnected || (event.buttons & 1) === 0) {
    endDrag();
    return;
  }

  const timeStamp = Math.max(event.timeStamp, drag.timeStamp + 0.001);
  if (timeStamp === event.timeStamp) {
    drag.timeStamp = timeStamp;
    return;
  }

  try {
    Object.defineProperty(event, "timeStamp", { value: timeStamp, configurable: true });
    drag.timeStamp = timeStamp;
  } catch {
    endDrag();
    document.documentElement.setAttribute("data-x-player-fix", "unsupported");
  }
}

function showLoadedState(): void {
  document.documentElement.setAttribute("data-x-player-fix", "ready");
}

window.addEventListener("mousedown", startInteraction, { capture: true, passive: true });

if (document.documentElement) {
  showLoadedState();
} else {
  document.addEventListener("DOMContentLoaded", showLoadedState, { once: true });
}
import { cancelSpeedHold, startSpeedHold } from "./hold-speed";
