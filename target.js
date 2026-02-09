function createTarget(mode) {
  const size = mode === "grid" ? 24 : 30;

  return {
    x: Math.random() * (canvas.width - 100) + 50,
    y: Math.random() * (canvas.height - 100) + 50,
    r: size,
    vx: mode === "tracking" ? Math.random() * 4 - 2 : 0,
    vy: mode === "tracking" ? Math.random() * 4 - 2 : 0
  };
}
