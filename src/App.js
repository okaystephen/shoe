import { useState, useEffect, useRef, useCallback } from "react";

const ROOMS = {
  1:  { name: "Garage",            floor: 1, adj: [3],                   bin: true,  emoji: "🚗" },
  2:  { name: "Covered Entry",     floor: 1, adj: [3, 9],                            emoji: "🚪" },
  3:  { name: "Foyer",             floor: 1, adj: [19, 1, 5, 2],         stairs: true, emoji: "🏠" },
  4:  { name: "Powder Room",       floor: 1, adj: [5],                               emoji: "🚽" },
  5:  { name: "Living Room",       floor: 1, adj: [8, 6, 7, 4, 3],                   emoji: "🛋️" },
  6:  { name: "Dining Room",       floor: 1, adj: [8, 7, 5],                         emoji: "🍽️" },
  7:  { name: "Kitchen",           floor: 1, adj: [6, 5],                            emoji: "🍳" },
  8:  { name: "Covered Terrace",   floor: 1, adj: [9, 6, 5],             bin: true,  emoji: "🌿" },
  9:  { name: "Garden",            floor: 1, adj: [2, 8],                            emoji: "🌳" },
  10: { name: "Master Bedroom",    floor: 2, adj: [19, 11],                           emoji: "🛏️" },
  11: { name: "WIC (Master)",      floor: 2, adj: [12, 10],                           emoji: "👔" },
  12: { name: "Bath (Master)",     floor: 2, adj: [11],                               emoji: "🛁" },
  13: { name: "Your Bedroom",      floor: 2, adj: [19, 14],              bin: true,  emoji: "🛏️" },
  14: { name: "Your WIC",          floor: 2, adj: [13],                               emoji: "👟" },
  15: { name: "Guest Suite",       floor: 2, adj: [19],                               emoji: "🛌" },
  16: { name: "Bathroom #2",       floor: 2, adj: [19],                               emoji: "🚿" },
  17: { name: "Laundry Room",      floor: 2, adj: [19],                               emoji: "🧺" },
  18: { name: "Linen Closet",      floor: 2, adj: [19],                               emoji: "🗄️" },
  19: { name: "Hallway",           floor: 2, adj: [17, 18, 15, 16, 13, 10, 3], stairs: true, emoji: "🏃" },
};

const GROUND_FLOOR = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const SECOND_FLOOR = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

const TOY_NAMES  = { chew: "chew toy", rope: "rope toy", ball: "ball", chew2: "chew toy", rope2: "rope toy", ball2: "ball" };
const TOY_EMOJIS = { chew: "🦴", rope: "🪢", ball: "⚾", chew2: "🦴", rope2: "🪢", ball2: "⚾" };
const TOY_IDS    = ["chew", "rope", "ball", "chew2", "rope2", "ball2"];

function rand(lo, hi) { return Math.floor(Math.random() * (hi - lo + 1)) + lo; }

function initGame() {
  const shoe = rand(1, 19);
  const dogName = rand(0, 1) === 0 ? "Bailey" : "Kahlua";
  const usedRooms = new Set([shoe]);
  const toyPositions = {};
  for (const t of TOY_IDS) {
    let r;
    do { r = rand(1, 19); } while (usedRooms.has(r));
    usedRooms.add(r);
    toyPositions[t] = { room: r, picked: false };
  }
  let startRoom;
  do { startRoom = rand(1, 19); } while (usedRooms.has(startRoom));
  return {
    shoe, dogName, toyPositions,
    current: startRoom,
    hands: [],
    hearts: 0,
    penalties: 0,
    startTime: Date.now(),
    shoeLookCount: 0,
    dogHere: rand(0, 2) <= 1,
    phase: "arrive",
  };
}

// ─── Modal ───────────────────────────────────────────────────────────────────
function Modal({ title, body, buttons, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-sm w-11/12 border border-gray-200 shadow-lg"
        onClick={e => e.stopPropagation()}
        style={{ fontFamily: "system-ui, sans-serif" }}
      >
        <h2 className="text-base font-medium mb-2">{title}</h2>
        <p className="text-sm text-gray-500 mb-4">{body}</p>
        <div className="flex gap-2 flex-wrap">
          {buttons.map((b, i) => (
            <button key={i} onClick={b.action}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all active:scale-95 ${b.danger
                ? "bg-red-700 text-white border-red-700 hover:bg-red-800"
                : "bg-transparent text-gray-800 border-gray-300 hover:bg-gray-100"}`}>
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Log ─────────────────────────────────────────────────────────────────────
function GameLog({ entries }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = 0; }, [entries]);
  return (
    <div ref={ref} className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500 overflow-y-auto" style={{ maxHeight: 120 }}>
      {entries.map((e, i) => (
        <div key={i} className="py-1 border-b border-gray-100 last:border-0 leading-relaxed">{e}</div>
      ))}
    </div>
  );
}

// ─── Floor Plan ──────────────────────────────────────────────────────────────
function FloorPlan({ game, onMove }) {
  const hasToy = (id) => TOY_IDS.some(t => game.toyPositions[t].room === id && !game.toyPositions[t].picked);
  const renderFloor = (ids, label) => (
    <div className="mb-3">
      <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 pb-1 border-b border-gray-100">{label}</div>
      <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {ids.map(id => {
          const r = ROOMS[id];
          const isCurrent = id === game.current;
          const isAdj = ROOMS[game.current].adj.includes(id);
          const toy = hasToy(id);
          const bin = r.bin;
          return (
            <button key={id} onClick={() => isAdj && onMove(id)}
              className="rounded-lg p-2 text-center text-xs leading-tight transition-all border"
              style={{
                background: isCurrent ? "#B5D4F4" : toy ? "#FAEEDA" : "transparent",
                borderColor: isCurrent ? "#185FA5" : bin ? "#1D9E75" : "#e5e7eb",
                color: isCurrent ? "#042C53" : "#374151",
                fontWeight: isCurrent ? 500 : 400,
                cursor: isAdj ? "pointer" : "default",
                opacity: !isCurrent && !isAdj ? 0.5 : 1,
              }}>
              <div>{r.emoji}</div>
              <div style={{ fontSize: 10 }}>{r.name}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 mt-2">
      {renderFloor(GROUND_FLOOR, "Ground floor")}
      {renderFloor(SECOND_FLOOR, "Second floor")}
      <div className="flex gap-3 flex-wrap mt-1" style={{ fontSize: 11, color: "#9ca3af" }}>
        <span><span className="inline-block w-2.5 h-2.5 rounded-sm align-middle mr-1 border-2" style={{ borderColor: "#185FA5" }}></span>you are here</span>
        <span><span className="inline-block w-2.5 h-2.5 rounded-sm align-middle mr-1" style={{ background: "#FAEEDA", border: "1px solid #d1d5db" }}></span>toy here</span>
        <span><span className="inline-block w-2.5 h-2.5 rounded-sm align-middle mr-1 border-2" style={{ borderColor: "#1D9E75" }}></span>toy bin</span>
        <span style={{ color: "#d1d5db" }}>dimmed = not adjacent</span>
      </div>
    </div>
  );
}

// ─── Summary Table ────────────────────────────────────────────────────────────
function SummaryTable({ elapsed, penalties, hearts }) {
  const deduct = hearts * 2;
  const final = elapsed + penalties - deduct;
  return (
    <table className="w-full text-sm mt-2">
      <tbody>
        {[
          ["Real time elapsed", `${elapsed}s`, ""],
          ["Penalties", `+${penalties}s`, "text-red-700"],
          ["Hearts collected", `${hearts} ♡`, "text-green-700"],
          ["Heart deduction", `-${deduct}s`, "text-green-700"],
        ].map(([label, val, cls]) => (
          <tr key={label} className="border-b border-gray-100">
            <td className="py-1.5 text-gray-400">{label}</td>
            <td className={`py-1.5 text-right font-medium ${cls}`}>{val}</td>
          </tr>
        ))}
        <tr>
          <td className="pt-2 font-medium">Final time</td>
          <td className="pt-2 text-right text-xl font-medium">{final}s</td>
        </tr>
      </tbody>
    </table>
  );
}

// ─── Intro Screen ─────────────────────────────────────────────────────────────
function IntroScreen({ onStart }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
    <div className="flex flex-col items-center gap-4 w-full max-w-md">
      <div style={{ fontSize: 56 }}>👟</div>
      <h1 className="text-2xl font-medium">Find That Shoe!</h1>
      <p className="text-sm text-gray-500 text-center">A text adventure by Stephen S. — now tap-based</p>
      <div className="w-full rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">How to play</p>
        <div className="flex flex-col gap-2 text-sm text-gray-500">
          {[
            ["🔍", "Search rooms for the shoe (5 tries per room, +2s each)"],
            ["🐕", "Pet your dog Bailey/Kahlua for a ♡ (−2s each)"],
            ["🧸", "Pick up toys & drop in bins for ♡ (−2s each)"],
            ["⚠️", "Hands full (2 toys)? You'll step on toys (+3s)"],
            ["🎉", "Find the shoe with empty hands to win!"],
          ].map(([icon, text]) => (
            <div key={text} className="flex gap-2"><span>{icon}</span><span>{text}</span></div>
          ))}
        </div>
      </div>
      <div className="w-full rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Toy bins</p>
        <p className="text-sm text-gray-500">🟢 Garage · Covered Terrace · Your Bedroom</p>
      </div>
      <button onClick={onStart}
        className="px-8 py-3 rounded-xl text-white font-medium text-base transition-all active:scale-95"
        style={{ background: "#185FA5" }}>
        Let's go! 🏃
      </button>
    </div>
    </div>
  );
}

// ─── End Screen ───────────────────────────────────────────────────────────────
function EndScreen({ won, game, elapsed, onReplay }) {
  const shoeName = ROOMS[game.shoe].name;
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
    <div className="flex flex-col items-center gap-4 w-full max-w-md">
      <div style={{ fontSize: 56 }}>{won ? "🎉" : "😔"}</div>
      <h1 className="text-2xl font-medium">{won ? "You found the shoe!" : "You gave up!"}</h1>
      <p className="text-sm text-gray-500 text-center">
        {won
          ? `${game.dogName} was watching as you found it in the ${shoeName}! 🎉`
          : `Sorry! ${game.dogName} hid it in the ${shoeName}. Come play again!`}
      </p>
      <div className="w-full rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Game summary</p>
        <SummaryTable elapsed={elapsed} penalties={game.penalties} hearts={game.hearts} />
      </div>
      <button onClick={onReplay}
        className="px-8 py-3 rounded-xl text-white font-medium text-base transition-all active:scale-95"
        style={{ background: "#185FA5" }}>
        Play again
      </button>
    </div>
    </div>
  );
}

// ─── Game Screen ──────────────────────────────────────────────────────────────
function GameScreen({ game, setGame, onWin, onQuit }) {
  const [log, setLog] = useState(["Game started! You find yourself in a house. Where's that shoe?"]);
  const [movePicking, setMovePicking] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - game.startTime) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [game.startTime]);

  const addLog = useCallback((msg) => setLog(prev => [msg, ...prev]), []);

  const getToyHere = useCallback((g = game) =>
    TOY_IDS.find(t => g.toyPositions[t].room === g.current && !g.toyPositions[t].picked) ?? null,
  [game]);

  const update = useCallback((patch, logMsg) => {
    setGame(prev => ({ ...prev, ...patch }));
    if (logMsg) addLog(logMsg);
  }, [setGame, addLog]);

  // On room change, check for dog/toy step
  const prevRoom = useRef(null);
  const addLogRef = useRef(addLog);
  useEffect(() => { addLogRef.current = addLog; }, [addLog]);

  useEffect(() => {
    if (prevRoom.current === null) { prevRoom.current = game.current; return; }
    if (prevRoom.current === game.current) return;
    prevRoom.current = game.current;
    setMovePicking(false);
    const dogAppears = rand(0, 2) <= 1;
    setGame(prev => {
      const toyHere = TOY_IDS.find(
        t => prev.toyPositions[t].room === prev.current && !prev.toyPositions[t].picked
      ) ?? null;
      let penalty = 0;
      if (prev.hands.length === 2 && toyHere) {
        penalty = 3;
        addLogRef.current(`⚠️ Hands full — you stepped on the ${TOY_NAMES[toyHere]}! +3s penalty.`);
      }
      if (dogAppears) addLogRef.current(`🐕 ${prev.dogName} appeared!`);
      return { ...prev, shoeLookCount: 0, penalties: prev.penalties + penalty, dogHere: dogAppears };
    });
  }, [game.current]); // eslint-disable-line react-hooks/exhaustive-deps

  const doSearch = () => {
    if (game.hands.length > 0) { addLog(`👐 You're holding ${game.hands.length} toy(s)! Drop them in a bin first.`); return; }
    if (game.shoeLookCount >= 5) { addLog("🔍 You've searched this room 5 times already. Move on!"); return; }
    const newCount = game.shoeLookCount + 1;
    setGame(prev => ({ ...prev, shoeLookCount: newCount, penalties: prev.penalties + 2 }));
    if (game.current === game.shoe) {
      const found = newCount === 5 || rand(1, 5) <= newCount;
      if (found) { addLog("👟 You found the shoe!"); onWin(); return; }
      addLog(`🔍 Search #${newCount}: So close! Keep looking…`);
    } else if (newCount >= 5) {
      addLog(`🔍 Search #${newCount}: Nothing here. The shoe isn't in this room.`);
    } else {
      addLog(`🔍 Search #${newCount}: Can't find it here…`);
    }
  };

  const doPet = () => {
    update({ hearts: game.hearts + 1, dogHere: false }, `💕 You petted ${game.dogName}! Got a ♡ (−2s)`);
  };

  const doPickup = (toy) => {
    if (game.hands.length >= 2) { addLog("👐 Your hands are full!"); return; }
    const newToys = { ...game.toyPositions, [toy]: { ...game.toyPositions[toy], picked: true } };
    const newHands = [...game.hands, toy];
    update({ toyPositions: newToys, hands: newHands },
      `🧸 Picked up the ${TOY_NAMES[toy]}! Holding ${newHands.length}/2 toys.`);
  };

  const doBin = () => {
    if (game.hands.length === 0) { addLog("🟢 Nothing to drop!"); return; }
    const n = game.hands.length;
    update({ hands: [], hearts: game.hearts + n }, `🟢 Dropped ${n} toy(s) in the bin! Got ${n} ♡`);
  };

  const doMove = (id) => {
    if (!ROOMS[game.current].adj.includes(id)) { addLog(`❌ Can't go directly to ${ROOMS[id].name} from here.`); return; }
    addLog(`🚶 Moved to ${ROOMS[id].name}.`);
    setGame(prev => ({ ...prev, current: id }));
  };

  const confirmQuit = () => setModal({
    title: "Quit the game?",
    body: "The shoe location will be revealed. Are you sure?",
    buttons: [
      { label: "Yes, quit", danger: true, action: () => { setModal(null); onQuit(); } },
      { label: "Keep searching", action: () => setModal(null) },
    ],
  });

  const room = ROOMS[game.current];
  const toyHere = getToyHere();
  const hasBin = room.bin;

  const handleFloorPlanMove = (id) => {
    addLog(`🚶 Moved to ${ROOMS[id].name}.`);
    setGame(prev => ({ ...prev, current: id }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {modal && <Modal {...modal} onClose={() => setModal(null)} />}

      <div className="flex gap-6 w-full" style={{ maxWidth: 900 }}>

        {/* ── Left column: game panel ── */}
        <div className="flex flex-col gap-3 flex-1 min-w-0" style={{ maxWidth: 420 }}>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              ["time", `${elapsed}s`],
              ["penalties", `+${game.penalties}s`],
              ["hearts", `♡ ${game.hearts}`],
            ].map(([label, val]) => (
              <div key={label} className="rounded-xl bg-gray-50 p-3">
                <div className="text-xs text-gray-400 mb-0.5">{label}</div>
                <div className="text-lg font-medium">{val}</div>
              </div>
            ))}
          </div>

          {/* Room header */}
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded-md"
                  style={{ background: room.floor === 1 ? "#E6F1FB" : "#EAF3DE", color: room.floor === 1 ? "#0C447C" : "#27500A" }}>
                  {room.floor === 1 ? "Ground floor" : "Second floor"}
                </span>
                <span className="text-base font-medium">{room.emoji} {room.name}</span>
              </div>
              <div className="flex gap-1">
                {[0, 1].map(i => (
                  <div key={i} className="w-9 h-9 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-lg">
                    {game.hands[i] ? TOY_EMOJIS[game.hands[i]] : "✋"}
                  </div>
                ))}
              </div>
            </div>
            <div className="text-xs text-gray-400">
              {[hasBin && "🟢 Toy bin here", toyHere && `🧸 ${TOY_NAMES[toyHere]} on the floor`].filter(Boolean).join("  ")}
            </div>
          </div>

          {/* Log */}
          <GameLog entries={log} />

          {/* Actions */}
          {!movePicking ? (
            <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
              <button onClick={doSearch}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white hover:bg-gray-50 active:scale-95 transition-all">
                🔍 Search for shoe
              </button>
              {game.dogHere && (
                <button onClick={doPet}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white hover:bg-gray-50 active:scale-95 transition-all">
                  🐕 Pet {game.dogName}
                </button>
              )}
              {toyHere && game.hands.length < 2 && (
                <button onClick={() => doPickup(toyHere)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white hover:bg-gray-50 active:scale-95 transition-all">
                  🧸 Pick up {TOY_NAMES[toyHere]}
                </button>
              )}
              {hasBin && game.hands.length > 0 && (
                <button onClick={doBin}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white hover:bg-gray-50 active:scale-95 transition-all"
                  style={{ borderColor: "#1D9E75" }}>
                  🟢 Drop toys in bin
                </button>
              )}
              <button onClick={() => setMovePicking(true)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white hover:bg-gray-50 active:scale-95 transition-all">
                🚶 Move room
              </button>
            </div>
          ) : (
            <div>
              <p className="text-xs text-gray-400 font-medium mb-2">Where to?</p>
              <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
                {room.adj.map(id => {
                  const r = ROOMS[id];
                  const hasToyThere = TOY_IDS.some(t => game.toyPositions[t].room === id && !game.toyPositions[t].picked);
                  return (
                    <button key={id} onClick={() => doMove(id)}
                      className="px-3 py-2.5 rounded-xl border text-sm text-left transition-all active:scale-95"
                      style={{
                        borderColor: r.bin ? "#1D9E75" : hasToyThere ? "#EF9F27" : "#e5e7eb",
                        background: hasToyThere ? "#FAEEDA" : "white",
                      }}>
                      {r.emoji} {r.name}
                    </button>
                  );
                })}
                <button onClick={() => setMovePicking(false)}
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 active:scale-95 transition-all">
                  ↩ Cancel
                </button>
              </div>
            </div>
          )}

          {/* Quit */}
          <div className="flex gap-2 mt-1">
            <button onClick={confirmQuit}
              className="px-3 py-1.5 rounded-lg border text-sm text-red-700 active:scale-95 transition-all"
              style={{ borderColor: "#fca5a5", background: "#fef2f2" }}>
              Quit game
            </button>
          </div>
        </div>

        {/* ── Right column: floor plan ── */}
        <div className="flex-shrink-0" style={{ width: 340 }}>
          <FloorPlan game={game} onMove={handleFloorPlanMove} />
        </div>

      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function FindThatShoe() {
  const [screen, setScreen] = useState("intro"); // intro | game | win | quit
  const [game, setGame] = useState(null);
  const [finalElapsed, setFinalElapsed] = useState(0);

  const startGame = () => {
    setGame(initGame());
    setScreen("game");
  };

  const handleWin = () => {
    setFinalElapsed(Math.floor((Date.now() - game.startTime) / 1000));
    setScreen("win");
  };

  const handleQuit = () => {
    setFinalElapsed(Math.floor((Date.now() - game.startTime) / 1000));
    setScreen("quit");
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {screen === "intro" && <IntroScreen onStart={startGame} />}
      {screen === "game" && game && (
        <GameScreen game={game} setGame={setGame} onWin={handleWin} onQuit={handleQuit} />
      )}
      {(screen === "win" || screen === "quit") && game && (
        <EndScreen won={screen === "win"} game={game} elapsed={finalElapsed} onReplay={() => setScreen("intro")} />
      )}
    </div>
  );
}
