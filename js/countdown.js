export function formatCountdown(milliseconds) {
  if (milliseconds <= 0) return '00:00:00';
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function createCountdown(target, element) {
  const update = () => {
    const diff = new Date(target) - new Date();
    element.textContent = formatCountdown(diff);
  };
  update();
  const intervalId = setInterval(update, 1000);
  return () => clearInterval(intervalId);
}
