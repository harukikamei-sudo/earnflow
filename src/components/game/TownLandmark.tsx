import { TILE } from "@/game/map";

/**
 * 国（テーマ）ごとの象徴的ランドマーク。CSSドット風で描く装飾オーバーレイ。
 * エジプト=ピラミッド / イタリア=コロッセオ / フランス=エッフェル塔 …等。
 */

const W = TILE * 3.4;
const H = TILE * 4.2;

function Frame({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  // bottom が (y+1) タイルあたりに来るよう配置
  return (
    <div className="pointer-events-none absolute" style={{ left: x * TILE, top: (y + 1) * TILE - H, width: W, height: H }}>
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}

/** 多層の屋根（塔・パゴダ用） */
function Pagoda({ roof, body }: { roof: string; body: string }) {
  const tiers = [0, 1, 2, 3];
  return (
    <div className="absolute inset-x-0 bottom-0 top-2">
      {/* 心柱 */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2" style={{ width: "26%", height: "100%", background: body }} />
      {tiers.map((tier) => {
        const wPct = 92 - tier * 16;
        const bottomPct = tier * 23;
        return (
          <div
            key={tier}
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              width: `${wPct}%`,
              height: "16%",
              bottom: `${bottomPct}%`,
              background: roof,
              clipPath: "polygon(50% 0,100% 100%,0 100%)",
            }}
          />
        );
      })}
      {/* 相輪 */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2" style={{ width: 4, height: "10%", background: "#f6c945" }} />
    </div>
  );
}

export function TownLandmark({ id, x, y }: { id: string; x: number; y: number }) {
  switch (id) {
    case "japan":
      return (
        <Frame x={x} y={y}>
          <Pagoda roof="#c0392b" body="#e3c9a0" />
        </Frame>
      );

    case "china":
      return (
        <Frame x={x} y={y}>
          <Pagoda roof="#c79a1e" body="#9b2d23" />
        </Frame>
      );

    case "italy":
      // コロッセオ：楕円のリングにアーチ穴
      return (
        <Frame x={x} y={y}>
          <div className="absolute inset-x-0 bottom-0" style={{ top: "30%", background: "#d8c39a", borderRadius: "44% 44% 12% 12%", border: "3px solid #a98b5b" }}>
            {[0, 1, 2].map((row) => (
              <div key={row} className="absolute inset-x-2 flex justify-around" style={{ top: `${10 + row * 26}%` }}>
                {[0, 1, 2, 3].map((c) => (
                  <div key={c} style={{ width: 7, height: 11, background: "#5a4a30", borderRadius: "50% 50% 0 0" }} />
                ))}
              </div>
            ))}
            {/* 欠けた上辺 */}
            <div className="absolute right-2 top-0 h-3 w-6 -translate-y-1/2" style={{ background: "#3f9e44", borderRadius: "0 0 50% 50%" }} />
          </div>
        </Frame>
      );

    case "egypt":
    case "mexico": {
      // ピラミッド（メキシコは段ピラミッド）
      const step = id === "mexico";
      const sand = step ? "#b5713a" : "#e3c98a";
      return (
        <Frame x={x} y={y}>
          {step ? (
            <div className="absolute inset-x-0 bottom-0 top-[20%]">
              {[0, 1, 2, 3].map((s) => (
                <div
                  key={s}
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{ width: `${100 - s * 22}%`, height: "22%", bottom: `${s * 22}%`, background: sand, border: "2px solid #7a4a26" }}
                />
              ))}
              <div className="absolute bottom-[88%] left-1/2 h-[12%] w-1.5 -translate-x-1/2 bg-[#7a4a26]" />
            </div>
          ) : (
            <>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2" style={{ width: "100%", height: "78%", background: `linear-gradient(180deg,${sand},#caa869)`, clipPath: "polygon(50% 0,100% 100%,0 100%)" }} />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2" style={{ width: "50%", height: "78%", background: "rgba(0,0,0,0.12)", clipPath: "polygon(0 0,100% 100%,0 100%)" }} />
              <div className="absolute right-2 top-1 h-6 w-6 rounded-full" style={{ background: "#ffd86b", boxShadow: "0 0 14px 4px rgba(255,210,80,0.6)" }} />
            </>
          )}
        </Frame>
      );
    }

    case "france":
      // エッフェル塔
      return (
        <Frame x={x} y={y}>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2" style={{ width: "78%", height: "100%", background: "repeating-linear-gradient(180deg,#7a5a3a 0 4px,#6b4f33 4px 8px)", clipPath: "polygon(42% 0,58% 0,100% 100%,0 100%)" }} />
          <div className="absolute left-1/2 top-0 -translate-x-1/2" style={{ width: 4, height: "12%", background: "#7a5a3a" }} />
          {/* アーチ脚の隙間 */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2" style={{ width: "30%", height: "26%", background: "#3f9e44", clipPath: "polygon(0 100%,50% 30%,100% 100%)" }} />
        </Frame>
      );

    case "greece":
      // パルテノン（破風＋柱）
      return (
        <Frame x={x} y={y}>
          <div className="absolute inset-x-0" style={{ top: "20%", height: "16%", background: "#eee8d8", clipPath: "polygon(50% 0,100% 100%,0 100%)" }} />
          <div className="absolute inset-x-0" style={{ top: "34%", height: "8%", background: "#d8d0bc" }} />
          <div className="absolute inset-x-1 flex justify-around" style={{ top: "42%", bottom: "8%" }}>
            {[0, 1, 2, 3, 4].map((c) => (
              <div key={c} style={{ width: "11%", height: "100%", background: "#f3efe2", boxShadow: "inset -2px 0 0 #cfc8b4" }} />
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0" style={{ height: "8%", background: "#cfc8b4" }} />
        </Frame>
      );

    case "india":
      // タージ・マハル（中央ドーム＋ミナレット）
      return (
        <Frame x={x} y={y}>
          <div className="absolute bottom-0 inset-x-[18%]" style={{ top: "40%", background: "#f3efe6", borderRadius: "6px 6px 2px 2px" }} />
          <div className="absolute left-1/2 -translate-x-1/2" style={{ top: "20%", width: "34%", height: "32%", background: "#f7f4ee", borderRadius: "50% 50% 8% 8%" }} />
          <div className="absolute left-1/2 top-[14%] -translate-x-1/2 h-[8%] w-1 bg-[#c7a93a]" />
          {[8, 80].map((lx) => (
            <div key={lx} className="absolute bottom-0" style={{ left: `${lx}%`, width: "8%", height: "78%", background: "#efe9da", borderRadius: "50% 50% 0 0" }} />
          ))}
        </Frame>
      );

    case "russia":
      // 聖ワシリイ大聖堂（玉ねぎドーム）
      return (
        <Frame x={x} y={y}>
          <div className="absolute inset-x-[20%] bottom-0" style={{ top: "45%", background: "#d9c7a8", border: "2px solid #9b7b4b" }} />
          {[
            { l: "18%", c: "#c0392b", h: "30%", w: "18%" },
            { l: "41%", c: "#2980b9", h: "40%", w: "20%" },
            { l: "66%", c: "#27ae60", h: "30%", w: "18%" },
          ].map((d, i) => (
            <div key={i} className="absolute" style={{ left: d.l, bottom: "55%", width: d.w, height: d.h, background: d.c, borderRadius: "50% 50% 10% 10% / 70% 70% 10% 10%" }} />
          ))}
        </Frame>
      );

    case "brazil":
      // コルコバードのキリスト像
      return (
        <Frame x={x} y={y}>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2" style={{ width: "30%", height: "30%", background: "#8a8f9e" }} />
          <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: "30%", width: "10%", height: "44%", background: "#cfd3dd" }} />
          <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: "62%", width: "46%", height: "8%", background: "#cfd3dd" }} />
          <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: "70%", width: "12%", height: "12%", background: "#cfd3dd", borderRadius: "50%" }} />
        </Frame>
      );

    case "nordic":
      // 雪山＋モミの木
      return (
        <Frame x={x} y={y}>
          <div className="absolute bottom-0 inset-x-0" style={{ height: "70%", background: "linear-gradient(180deg,#9fb3c8,#6f859c)", clipPath: "polygon(50% 0,100% 100%,0 100%)" }} />
          <div className="absolute left-1/2 top-[2%] -translate-x-1/2" style={{ width: "40%", height: "26%", background: "#fff", clipPath: "polygon(50% 0,86% 60%,64% 50%,50% 70%,36% 50%,14% 60%)" }} />
          {[10, 78].map((lx) => (
            <div key={lx} className="absolute bottom-0" style={{ left: `${lx}%`, width: "14%", height: "44%", background: "#1e5e3a", clipPath: "polygon(50% 0,100% 100%,0 100%)" }} />
          ))}
        </Frame>
      );

    case "canyon":
    default:
      // 大峡谷のメサ＋アーチ
      return (
        <Frame x={x} y={y}>
          <div className="absolute bottom-0 left-0" style={{ width: "55%", height: "70%", background: "linear-gradient(180deg,#c0703f,#9a5230)", borderRadius: "6px 6px 0 0" }} />
          <div className="absolute bottom-0 right-1" style={{ width: "38%", height: "92%", background: "linear-gradient(180deg,#b5613a,#8a4426)", borderRadius: "8px 8px 0 0" }}>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2" style={{ width: "46%", height: "55%", background: "#3f9e44", borderRadius: "50% 50% 0 0 / 80% 80% 0 0" }} />
          </div>
        </Frame>
      );
  }
}
