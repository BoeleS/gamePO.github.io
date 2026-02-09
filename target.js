function createTarget(mode) {
  const size = mode === "grid" ? 24 : 30;

  return {
    x: Math.random() * (window.innerWidth - 100) + 50,
    y: Math.random() * (window.innerHeight - 100) + 50,
    r: size,
    vx: mode === "tracking" ? Math.random() * 4 - 2 : 0,
    vy: mode === "tracking" ? Math.random() * 4 - 2 : 0
  };
}
