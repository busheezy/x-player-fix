interface SpeedHold {
  video: HTMLVideoElement;
  player: Element;
  events: AbortController;
  timer: number;
  startX: number;
  startY: number;
  previousRate: number | undefined;
}

const controlSelector = 'button, a, input, select, textarea, [role="button"], [role="slider"]';
let hold: SpeedHold | undefined;
let releaseClick: AbortController | undefined;

export function cancelSpeedHold(): void {
  releaseClick?.abort();
  releaseClick = undefined;
  endHold();
}

function endHold(): void {
  const current = hold;
  if (!current) {
    return;
  }

  hold = undefined;
  window.clearTimeout(current.timer);
  current.events.abort();
  if (current.previousRate !== undefined && current.video.playbackRate === 2) {
    current.video.playbackRate = current.previousRate;
  }
}

function activateHold(): void {
  const current = hold;
  if (!current || !current.video.isConnected || current.video.paused || current.video.ended) {
    endHold();
    return;
  }

  current.previousRate = current.video.playbackRate;
  try {
    current.video.playbackRate = 2;
  } catch {
    endHold();
  }
}

function suppressReleaseClick(player: Element): void {
  const events = new AbortController();
  releaseClick = events;
  const suppressClick = (event: MouseEvent): void => {
    if (!event.isTrusted || event.detail === 0 || !(event.target instanceof Node)) {
      return;
    }
    if (!player.contains(event.target)) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    events.abort();
  };

  window.addEventListener("click", suppressClick, { capture: true, signal: events.signal });
  window.setTimeout(() => events.abort(), 500);
}

function releaseHold(event: MouseEvent): void {
  if (event.button !== 0) {
    return;
  }

  const current = hold;
  endHold();
  if (current?.previousRate !== undefined) {
    suppressReleaseClick(current.player);
  }
}

function moveHold(event: MouseEvent): void {
  const current = hold;
  if (!current) {
    return;
  }
  if ((event.buttons & 1) === 0) {
    endHold();
    return;
  }

  const distance = Math.hypot(event.clientX - current.startX, event.clientY - current.startY);
  if (current.previousRate === undefined && distance > 8) {
    endHold();
  }
}

export function startSpeedHold(event: MouseEvent, player: Element, video: HTMLVideoElement): void {
  if (!(event.target instanceof Element) || event.target.closest(controlSelector)) {
    return;
  }
  if (video.paused || video.ended || video.controls) {
    return;
  }

  const bounds = video.getBoundingClientRect();
  const insideX = event.clientX >= bounds.left && event.clientX <= bounds.right;
  const insideY = event.clientY >= bounds.top && event.clientY <= bounds.bottom;
  if (!insideX || !insideY) {
    return;
  }

  const events = new AbortController();
  const options = { capture: true, passive: true, signal: events.signal };
  hold = {
    video,
    player,
    events,
    timer: window.setTimeout(activateHold, 350),
    startX: event.clientX,
    startY: event.clientY,
    previousRate: undefined,
  };

  window.addEventListener("mouseup", releaseHold, options);
  window.addEventListener("mousemove", moveHold, options);
  window.addEventListener("scroll", endHold, options);
  window.addEventListener("blur", endHold, { signal: events.signal });
  window.addEventListener("pagehide", endHold, { signal: events.signal });
  window.addEventListener("dragstart", endHold, options);
  window.addEventListener("contextmenu", endHold, options);
  document.addEventListener("visibilitychange", endHold, { signal: events.signal });
  player.addEventListener("mouseleave", endHold, { signal: events.signal });
  video.addEventListener("pause", endHold, { signal: events.signal });
  video.addEventListener("emptied", endHold, { signal: events.signal });
}
