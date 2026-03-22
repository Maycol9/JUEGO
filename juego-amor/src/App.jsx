import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Heart,
  Play,
  RotateCcw,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";

const TILE_SIZE = 56;
const WIN_MESSAGE = "¡Felicidades, ganaste mi amor! 💖";

const LEVELS = [
  {
    name: "Bosque de los Corazones",
    romanticText: "Cada paso tuyo hace este mundo más bonito. ✨",
    map: [
      "###########",
      "#P..G....E#",
      "#.###.###.#",
      "#...#...#.#",
      "#.G.#.M.#.#",
      "#...#...#.#",
      "#..G......#",
      "###########",
    ],
  },
  {
    name: "Jardín de Estrellas",
    romanticText: "Eres mi premio favorito, incluso cuando el nivel se pone difícil. 🌷",
    map: [
      "############",
      "#P..#...G.E#",
      "#.#.#.###..#",
      "#.#...#..#.#",
      "#.###.#.M#.#",
      "#...G.#..#.#",
      "#.###.#..#.#",
      "#....G....N#",
      "############",
    ],
  },
  {
    name: "Castillo del Amor",
    romanticText: "Lo lograste, princesa: este juego también late por ti. 👑",
    map: [
      "#############",
      "#P...#...G.E#",
      "#.##.#.###..#",
      "#..G.#...#..#",
      "##.#.###.#M.#",
      "#..#.....#..#",
      "#..###.###..#",
      "#G......N...#",
      "#############",
    ],
  },
];

function parseLevel(level) {
  const grid = level.map.map((row) => row.split(""));
  let start = { x: 1, y: 1 };
  let exit = { x: 1, y: 1 };
  const gems = [];
  const enemies = [];

  grid.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell === "P") {
        start = { x, y };
        grid[y][x] = ".";
      }
      if (cell === "E") {
        exit = { x, y };
        grid[y][x] = ".";
      }
      if (cell === "G") {
        gems.push({ x, y, id: `${x}-${y}` });
        grid[y][x] = ".";
      }
      if (cell === "M") {
        enemies.push({ x, y, id: `${x}-${y}-M`, axis: "x", dir: 1 });
        grid[y][x] = ".";
      }
      if (cell === "N") {
        enemies.push({ x, y, id: `${x}-${y}-N`, axis: "y", dir: 1 });
        grid[y][x] = ".";
      }
    });
  });

  return {
    grid,
    width: grid[0].length,
    height: grid.length,
    start,
    exit,
    gems,
    enemies,
  };
}

function cellKey(x, y) {
  return `${x}-${y}`;
}

export default function App() {
  const [started, setStarted] = useState(false);
  const [levelIndex, setLevelIndex] = useState(0);
  const [lives, setLives] = useState(3);
  const [player, setPlayer] = useState({ x: 1, y: 1 });
  const [enemies, setEnemies] = useState([]);
  const [collected, setCollected] = useState([]);
  const [score, setScore] = useState(0);
  const [overlay, setOverlay] = useState(null);
  const [gameFinished, setGameFinished] = useState(false);
  const touchStartRef = useRef(null);

  const currentLevel = LEVELS[levelIndex];
  const parsed = useMemo(() => parseLevel(currentLevel), [currentLevel]);

  const resetLevelState = useCallback(
    (keepLives = true) => {
      setPlayer(parsed.start);
      setEnemies(parsed.enemies);
      setCollected([]);
      if (!keepLives) setLives(3);
      setOverlay(null);
    },
    [parsed]
  );

  useEffect(() => {
    setPlayer(parsed.start);
    setEnemies(parsed.enemies);
    setCollected([]);
    setOverlay(null);
  }, [parsed]);

  const enemyKeys = useMemo(
    () => new Set(enemies.map((enemy) => cellKey(enemy.x, enemy.y))),
    [enemies]
  );

  const collectedKeys = useMemo(() => new Set(collected), [collected]);
  const remainingGems = parsed.gems.filter((gem) => !collectedKeys.has(gem.id));

  const loseLife = useCallback(() => {
    setLives((prev) => {
      if (prev <= 1) {
        setOverlay({
          type: "gameover",
          title: "No pasa nada, vuelve a intentarlo 💗",
          subtitle: "Hasta los juegos bonitos tienen desafíos. Presiona reiniciar y sigue jugando.",
        });
        return 0;
      }
      return prev - 1;
    });
    setPlayer(parsed.start);
  }, [parsed.start]);

  const isWall = useCallback(
    (x, y) => {
      if (y < 0 || y >= parsed.height || x < 0 || x >= parsed.width) return true;
      return parsed.grid[y][x] === "#";
    },
    [parsed]
  );

  const movePlayer = useCallback(
    (dx, dy) => {
      if (!started || overlay || gameFinished) return;

      const nextX = player.x + dx;
      const nextY = player.y + dy;

      if (isWall(nextX, nextY)) return;

      if (enemyKeys.has(cellKey(nextX, nextY))) {
        loseLife();
        return;
      }

      const gem = remainingGems.find((item) => item.x === nextX && item.y === nextY);
      if (gem) {
        setCollected((prev) => [...prev, gem.id]);
        setScore((prev) => prev + 100);
      }

      const reachedExit = nextX === parsed.exit.x && nextY === parsed.exit.y;
      if (reachedExit && remainingGems.length === (gem ? 1 : 0)) {
        setPlayer({ x: nextX, y: nextY });
        const isLast = levelIndex === LEVELS.length - 1;

        if (isLast) {
          setGameFinished(true);
          setOverlay({
            type: "final",
            title: WIN_MESSAGE,
            subtitle: "Terminaste la aventura romántica completa. Eres la campeona de mi corazón. 🌹",
          });
        } else {
          setOverlay({
            type: "win",
            title: WIN_MESSAGE,
            subtitle: currentLevel.romanticText,
          });
        }
        return;
      }

      setPlayer({ x: nextX, y: nextY });
    },
    [
      started,
      overlay,
      gameFinished,
      player,
      isWall,
      enemyKeys,
      loseLife,
      remainingGems,
      parsed.exit.x,
      parsed.exit.y,
      levelIndex,
      currentLevel.romanticText,
    ]
  );

  useEffect(() => {
    const onKeyDown = (event) => {
      const key = event.key.toLowerCase();
      if (["arrowup", "w"].includes(key)) movePlayer(0, -1);
      if (["arrowdown", "s"].includes(key)) movePlayer(0, 1);
      if (["arrowleft", "a"].includes(key)) movePlayer(-1, 0);
      if (["arrowright", "d"].includes(key)) movePlayer(1, 0);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [movePlayer]);

  useEffect(() => {
    if (!started || overlay || gameFinished) return;

    const interval = setInterval(() => {
      setEnemies((prevEnemies) => {
        const nextEnemies = prevEnemies.map((enemy) => {
          const dx = enemy.axis === "x" ? enemy.dir : 0;
          const dy = enemy.axis === "y" ? enemy.dir : 0;
          const nextX = enemy.x + dx;
          const nextY = enemy.y + dy;

          if (isWall(nextX, nextY)) {
            const reversedDir = enemy.dir * -1;
            return { ...enemy, dir: reversedDir };
          }

          return { ...enemy, x: nextX, y: nextY };
        });

        const crash = nextEnemies.some((enemy) => enemy.x === player.x && enemy.y === player.y);
        if (crash) loseLife();

        return nextEnemies;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [started, overlay, gameFinished, isWall, player, loseLife]);

  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event) => {
    if (!touchStartRef.current) return;

    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const threshold = 24;

    if (absX < threshold && absY < threshold) {
      touchStartRef.current = null;
      return;
    }

    if (absX > absY) {
      movePlayer(dx > 0 ? 1 : -1, 0);
    } else {
      movePlayer(0, dy > 0 ? 1 : -1);
    }

    touchStartRef.current = null;
  };

  const nextLevel = () => {
    setOverlay(null);
    setLevelIndex((prev) => prev + 1);
  };

  const restartGame = () => {
    setStarted(true);
    setLevelIndex(0);
    setLives(3);
    setScore(0);
    setGameFinished(false);
    setOverlay(null);
    setTimeout(() => {
      const fresh = parseLevel(LEVELS[0]);
      setPlayer(fresh.start);
      setEnemies(fresh.enemies);
      setCollected([]);
    }, 0);
  };

  const startGame = () => {
    setStarted(true);
    setLevelIndex(0);
    setLives(3);
    setScore(0);
    setGameFinished(false);
    resetLevelState(false);
  };

  const renderCell = (x, y) => {
    const baseClass = "relative flex items-center justify-center rounded-2xl border transition-all duration-300";
    const isPlayer = player.x === x && player.y === y;
    const isExit = parsed.exit.x === x && parsed.exit.y === y;
    const isEnemy = enemies.some((enemy) => enemy.x === x && enemy.y === y);
    const gem = remainingGems.find((item) => item.x === x && item.y === y);
    const wall = parsed.grid[y][x] === "#";

    let style = {
      width: TILE_SIZE,
      height: TILE_SIZE,
    };

    if (wall) {
      return (
        <div
          key={cellKey(x, y)}
          style={style}
          className={`${baseClass} border-white/10 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 shadow-inner`}
        >
          <div className="h-6 w-6 rounded-full bg-white/10" />
        </div>
      );
    }

    return (
      <div
        key={cellKey(x, y)}
        style={style}
        className={`${baseClass} border-white/10 bg-gradient-to-br from-emerald-200/60 via-white/60 to-pink-200/60 backdrop-blur-sm shadow-sm`}
      >
        {isExit && (
          <motion.div
            animate={{ scale: remainingGems.length === 0 ? [1, 1.08, 1] : 1 }}
            transition={{ repeat: Infinity, duration: 1.4 }}
            className={`absolute inset-2 rounded-2xl border ${
              remainingGems.length === 0
                ? "border-yellow-400 bg-yellow-200/80"
                : "border-white/40 bg-white/30"
            } flex items-center justify-center text-xl`}
          >
            {remainingGems.length === 0 ? "🚪" : "🔒"}
          </motion.div>
        )}

        {gem && (
          <motion.div
            animate={{ y: [0, -4, 0], rotate: [0, 6, -6, 0] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
            className="absolute text-2xl"
          >
            💎
          </motion.div>
        )}

        {isEnemy && (
          <motion.div
            animate={{ scale: [1, 1.06, 1], opacity: [0.9, 1, 0.9] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="absolute flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-900 to-slate-900 text-xl shadow-lg"
          >
            👾
          </motion.div>
        )}

        {isPlayer && (
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400 via-pink-400 to-rose-500 text-xl shadow-xl"
          >
            🧚‍♀️
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_35%),linear-gradient(135deg,#2d1b69_0%,#111827_45%,#4c1d95_100%)] p-4 text-white md:p-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[360px_1fr]">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-[28px] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-pink-400/20 p-3">
              <Sparkles className="h-7 w-7 text-pink-200" />
            </div>
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">Aventura Romántica</h1>
              <p className="text-sm text-white/70">Un juego echo para ti mi amor.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-pink-200/80">Nivel actual</p>
              <h2 className="mt-2 text-xl font-semibold">{currentLevel.name}</h2>
              <p className="mt-2 text-sm leading-6 text-white/75">Recoge todos los diamantes y luego llega a la puerta.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm text-white/70">
                  <Heart className="h-4 w-4 text-pink-300" /> Vidas
                </div>
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <Heart
                      key={i}
                      className={`h-6 w-6 ${i < lives ? "fill-pink-400 text-pink-300" : "text-white/15"}`}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm text-white/70">
                  <Star className="h-4 w-4 text-yellow-300" /> Puntaje
                </div>
                <p className="text-2xl font-bold">{score}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-medium text-white/80">Diamantes restantes</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-3xl">💎</span>
                <span className="text-2xl font-bold">{remainingGems.length}</span>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="mb-3 text-sm font-medium text-white/80">Controles</p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div />
                <div className="rounded-2xl bg-white/10 p-3">
                  <ArrowUp className="mx-auto h-5 w-5" />
                </div>
                <div />
                <div className="rounded-2xl bg-white/10 p-3">
                  <ArrowLeft className="mx-auto h-5 w-5" />
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <ArrowDown className="mx-auto h-5 w-5" />
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <ArrowRight className="mx-auto h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-sm text-white/60">También puedes usar W, A, S y D.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={startGame}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-fuchsia-500 px-4 py-3 font-semibold shadow-lg transition hover:scale-[1.02]"
              >
                <Play className="h-5 w-5" />
                {started ? "Jugar de nuevo" : "Iniciar juego"}
              </button>
              <button
                onClick={restartGame}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 font-semibold transition hover:bg-white/15"
              >
                <RotateCcw className="h-5 w-5" /> Reiniciar
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur-xl md:p-6"
        >
          <div className="mb-4 flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-black/20 p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-200/80">Modo aventura</p>
              <p className="mt-1 text-lg font-semibold">Lleva a la heroína hasta la salida</p>
            </div>
            <div className="rounded-2xl bg-yellow-400/15 px-4 py-2 text-sm font-semibold text-yellow-200">
              Nivel {levelIndex + 1} / {LEVELS.length}
            </div>
          </div>

          <div
            className="relative overflow-auto rounded-[28px] border border-white/10 bg-black/20 p-4"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: "none" }}
          >
            <div
              className="relative mx-auto grid gap-2"
              style={{
                width: parsed.width * (TILE_SIZE + 8) - 8,
                gridTemplateColumns: `repeat(${parsed.width}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: parsed.height }).flatMap((_, y) =>
                Array.from({ length: parsed.width }).map((__, x) => renderCell(x, y))
              )}
            </div>
          </div>

          <AnimatePresence>
            {!started && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-md"
              >
                <div className="max-w-xl rounded-[32px] border border-white/10 bg-white/10 p-8 text-center shadow-2xl backdrop-blur-xl">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-pink-500/20 text-4xl">
                    🌸
                  </div>
                  <h2 className="text-3xl font-bold">Un juego hecho para ella</h2>
                  <p className="mt-4 text-base leading-7 text-white/75">
                    Explora, recoge diamantes y supera los niveles. Cada victoria mostrará un mensaje especial:
                  </p>
                  <p className="mt-4 rounded-2xl bg-pink-500/15 px-4 py-3 text-lg font-semibold text-pink-100">
                    {WIN_MESSAGE}
                  </p>
                  <button
                    onClick={startGame}
                    className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-fuchsia-500 px-6 py-3 font-semibold shadow-lg transition hover:scale-[1.02]"
                  >
                    <Play className="h-5 w-5" /> Comenzar aventura
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {overlay && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-md"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="max-w-xl rounded-[32px] border border-white/10 bg-white/10 p-8 text-center shadow-2xl backdrop-blur-xl"
                >
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-400/20 text-4xl">
                    {overlay.type === "gameover" ? "💔" : overlay.type === "final" ? "👑" : "🏆"}
                  </div>
                  <h3 className="text-3xl font-bold">{overlay.title}</h3>
                  <p className="mt-4 text-base leading-7 text-white/75">{overlay.subtitle}</p>

                  {overlay.type !== "gameover" && (
                    <div className="mt-5 rounded-3xl border border-pink-300/20 bg-pink-400/10 p-4">
                      <p className="text-lg font-medium text-pink-100">Tu premio especial:</p>
                      <p className="mt-2 text-2xl font-bold text-white">{WIN_MESSAGE}</p>
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    {overlay.type === "win" && (
                      <button
                        onClick={nextLevel}
                        className="rounded-2xl bg-gradient-to-r from-pink-500 to-fuchsia-500 px-6 py-3 font-semibold shadow-lg transition hover:scale-[1.02]"
                      >
                        Siguiente nivel
                      </button>
                    )}

                    {(overlay.type === "final" || overlay.type === "gameover") && (
                      <button
                        onClick={restartGame}
                        className="rounded-2xl bg-gradient-to-r from-pink-500 to-fuchsia-500 px-6 py-3 font-semibold shadow-lg transition hover:scale-[1.02]"
                      >
                        Volver a jugar
                      </button>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-4 md:hidden">
            <p className="mb-3 text-center text-sm font-medium text-white/80">Controles táctiles</p>
            <div className="mx-auto grid w-full max-w-[220px] grid-cols-3 gap-3">
              <div />
              <button
                onClick={() => movePlayer(0, -1)}
                className="rounded-2xl bg-white/10 p-4 active:scale-95"
              >
                <ArrowUp className="mx-auto h-6 w-6" />
              </button>
              <div />
              <button
                onClick={() => movePlayer(-1, 0)}
                className="rounded-2xl bg-white/10 p-4 active:scale-95"
              >
                <ArrowLeft className="mx-auto h-6 w-6" />
              </button>
              <button
                onClick={() => movePlayer(0, 1)}
                className="rounded-2xl bg-white/10 p-4 active:scale-95"
              >
                <ArrowDown className="mx-auto h-6 w-6" />
              </button>
              <button
                onClick={() => movePlayer(1, 0)}
                className="rounded-2xl bg-white/10 p-4 active:scale-95"
              >
                <ArrowRight className="mx-auto h-6 w-6" />
              </button>
            </div>
            <p className="mt-3 text-center text-xs text-white/60">
              También puede deslizar el dedo sobre el mapa para moverse.
            </p>
          </div>

          {gameFinished && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pointer-events-none absolute inset-0 overflow-hidden"
            >
              {Array.from({ length: 18 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: -40, x: `${(i * 7) % 100}%`, opacity: 0 }}
                  animate={{ y: "110%", opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 4 + (i % 3), repeat: Infinity, delay: i * 0.12 }}
                  className="absolute text-2xl"
                >
                  {i % 2 === 0 ? "💖" : "✨"}
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
