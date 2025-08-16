"use client";

import React, { useMemo, useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

// UI
import { Download, Layers, RefreshCw } from "lucide-react";

// 既存の卵カードUIコンポーネントを再利用
import EggCard from "@/app/components/character/EggCard";
import { EggType } from "@/types/character";

// 定数: 出力サイズ
const OUTPUT_SIZE = 1000; // 1000x1000 PNG/SVG

// 型定義
interface EggMeta {
  id: number;
  seed: number;
  name: string;
  description: string;
  traits: string[];
  design: EggDesign;
}

interface EggDesign {
  // 見た目のパラメータ（色、パターンなど）
  palette: string;
  colors: [string, string]; // グラデーションの2色
  pattern: "speckle" | "stripe" | "rings" | "aurora" | "cosmic" | "fire" | "natural" | "pastel";
  shine: number; // 0..1 グロス強度
  speckleCount: number; // 斑点数
  stripeCount: number; // ストライプ数
  rotation: number; // パターン回転角度
}

/**
 * 乱数生成器（簡易版）: mulberry32
 * - 同じ seed から常に同じ系列を得る
 */
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 補助: 配列から乱択
 */
function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * 色操作関数: HSL と Hex に対応した明るさ調整（明るく）
 */
function lightenColor(color: string, percent: number): string {
  if (color.startsWith('hsl')) {
    const hsl = color.match(/\d+/g)?.map(Number) || [0, 0, 0];
    return `hsl(${hsl[0]}, ${hsl[1]}%, ${Math.min(100, hsl[2] + percent)}%)`;
  }
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

/**
 * 色操作関数: HSL と Hex に対応した明るさ調整（暗く）
 */
function darkenColor(color: string, percent: number): string {
  if (color.startsWith('hsl')) {
    const hsl = color.match(/\d+/g)?.map(Number) || [0, 0, 0];
    return `hsl(${hsl[0]}, ${hsl[1]}%, ${Math.max(0, hsl[2] - percent)}%)`;
  }
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = ((num >> 8) & 0x00ff) - amt;
  const B = (num & 0x0000ff) - amt;
  return (
    '#' +
    (
      0x1000000 +
      (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
      (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
      (B > 255 ? 255 : B < 0 ? 0 : B)
    )
      .toString(16)
      .slice(1)
  );
}

/**
 * 卵の名称を生成
 */
function generateName(rng: () => number): string {
  const adjectives = [
    "オーロラの", "コズミックな", "パステルの", "古代の", "煌めく", "静謐な", "神秘の",
    "原初の", "風詠みの", "深夜の", "黎明の", "暁の", "夢幻の", "星霜の", "蒼穹の",
    "翠碧の", "紅蓮の", "琥珀の", "白銀の", "漆黒の", "虹彩の", "稲妻の", "泡沫の",
  ];
  const nouns = [
    "卵殻", "結晶卵", "原石卵", "星卵", "霧卵", "潮騒卵", "焔卵", "森羅卵", "月光卵",
    "暁光卵", "深淵卵", "薄明卵", "風花卵", "砂紋卵", "雲海卵", "氷晶卵", "樹液卵",
    "音紋卵", "波紋卵", "光環卵", "夢紡卵", "記憶卵",
  ];
  return `${pick(rng, adjectives)}${pick(rng, nouns)}`;
}

/**
 * 卵の特性（traits）を生成
 */
function generateTraits(rng: () => number, design: EggDesign): string[] {
  const elements = ["炎", "水", "風", "土", "雷", "氷", "光", "闇"];
  const vibes = ["静か", "活発", "知的", "大胆", "優雅", "素朴", "神秘的", "快活"];
  const rarity = mapRarity(design); // 'common' | 'rare' | 'legendary'

  // レアリティ別特性プール（短いタグ表現）
  const rarityTraits: Record<EggType['rarity'], string[]> = {
    common: ["堅牢", "穏やか", "素直", "温厚", "安定"],
    rare: ["俊敏", "奔放", "聡明", "快活", "勇敢"],
    legendary: ["神秘", "崇高", "不滅", "奇跡", "古代の力"],
  };

  // 特性取得関数（レアリティに応じて1つ選択）
  function getRandomTrait(r: EggType['rarity']): string {
    const pool = rarityTraits[r];
    return pool[Math.floor(rng() * pool.length)];
  }

  // パターンを短い日本語ラベルにマッピング（タグとして使用）
  const patternLabels: Record<EggDesign['pattern'], string> = {
    speckle: '斑点',
    stripe: '縞模様',
    rings: '輪紋',
    aurora: 'オーロラ',
    cosmic: '宇宙',
    fire: '炎',
    natural: '自然',
    pastel: 'パステル',
  };

  const element = pick(rng, elements);
  const vibe = pick(rng, vibes);
  const special = getRandomTrait(rarity);
  const patternTag = patternLabels[design.pattern];

  // 特徴タグは3つに統一: パターン / エレメント / レアリティ特性
  return [patternTag, element, special];
}

/**
 * 卵の説明文を生成
 */
function generateDescription(rng: () => number, traits: string[]): string {
  const tone = [
    "この卵は遥か昔の記憶を湛え、微かな輝きで持ち主に応えるという。",
    "表層に刻まれた紋は世界の理の名残であり、触れると静かに鼓動する。",
    "柔らかな光が殻の奥から滲み、未だ知られぬ可能性を約束している。",
    "風とともに囁くように震え、選ばれし者を待っているようだ。",
    "淡い放射が周囲の気配を整え、持つ者の心を凪へ導くという。",
  ];
  const base = pick(rng, tone);
  const traitLine = `特性: ${traits.join(" / ")}`;
  return `${base} ${traitLine}`;
}

/**
 * デザイン（色やパターン等）の生成
 */
function generateDesign(rng: () => number): EggDesign {
  const palettes: Record<string, [string, string][]> = {
    aurora: [["#74ebd5", "#ACB6E5"], ["#B3FFAB", "#12FFF7"], ["#a1c4fd", "#c2e9fb"]],
    cosmic: [["#0f0c29", "#302b63"], ["#24243e", "#302b63"], ["#2C3E50", "#4CA1AF"]],
    fire: [["#f83600", "#f9d423"], ["#e96443", "#904e95"], ["#fd746c", "#ff9068"]],
    natural: [["#56ab2f", "#a8e063"], ["#314755", "#26a0da"], ["#5A3F37", "#2C7744"]],
    pastel: [["#fbc2eb", "#a6c1ee"], ["#ffecd2", "#fcb69f"], ["#e0c3fc", "#8ec5fc"]],
  };
  const paletteKeys = Object.keys(palettes);
  const palette = pick(rng, paletteKeys);
  const colors = pick(rng, palettes[palette]);
  const pattern = pick(rng, [
    "speckle",
    "stripe",
    "rings",
    "aurora",
    "cosmic",
    "fire",
    "natural",
    "pastel",
  ] as const) as EggDesign["pattern"];

  return {
    palette,
    colors: colors as [string, string],
    pattern,
    shine: Math.round(rng() * 60) / 100, // 0..0.6
    speckleCount: 200 + Math.floor(rng() * 300),
    stripeCount: 6 + Math.floor(rng() * 8),
    rotation: Math.round(rng() * 360),
  };
}

/**
 * SVGの卵パス（中心: (500,500), サイズ: width,height）
 * - 上部がやや細く、下部が膨らむ卵型をBezierで近似
 */
function buildEggPath(cx: number, cy: number, width: number, height: number): string {
  const w = width;
  const h = height;
  const topX = cx;
  const topY = cy - h / 2;
  const cp1x = cx + w * 0.35;
  const cp1y = cy - h * 0.5;
  const cp2x = cx + w * 0.5;
  const cp2y = cy + h * 0.1;
  const bottomX = cx;
  const bottomY = cy + h * 0.5;
  const cp3x = cx - w * 0.5;
  const cp3y = cy + h * 0.1;
  const cp4x = cx - w * 0.35;
  const cp4y = cy - h * 0.5;
  return `M ${topX},${topY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${bottomX},${bottomY} C ${cp3x},${cp3y} ${cp4x},${cp4y} ${topX},${topY} Z`;
}

/**
 * SVG文字列を生成（パターン適用＆中央配置）
 */
function createEggSVG(design: EggDesign, seed: number): string {
  // SVG生成を、参照コードの構成（defs/overlay/追加エフェクト）に基づいて再実装
  const id = `g${seed}`;
  const baseColor = design.colors[0];
  const rarity = mapRarity(design);

  // 既存のパターン名を新オーバーレイ名へマッピング
  const overlay: 'gradient' | 'spots' | 'stripes' | 'flame' | 'lightning' | 'runes' | 'stars' =
    design.pattern === 'stripe' ? 'stripes'
      : design.pattern === 'speckle' ? 'spots'
      : design.pattern === 'rings' ? 'stars'
      : 'gradient';

  // パターン定義（主にラジアルグラデーション）
  function generatePatternDefs() {
    if (overlay !== 'gradient') return '';
    return `<radialGradient id="grad${id}" cx="30%" cy="30%">
      <stop offset="0%" stop-color="${lightenColor(baseColor, 40)}"/>
      <stop offset="70%" stop-color="${baseColor}"/>
      <stop offset="100%" stop-color="${darkenColor(baseColor, 20)}"/>
    </radialGradient>`;
  }

  // オーバーレイパターン
  function generatePatternOverlay() {
    const overlays: Record<typeof overlay, () => string> = {
      gradient: () => '',
      spots: () => Array.from({ length: 12 }, (_, i) => {
        const angle = (i * 30) * Math.PI / 180;
        const radius = 80 + (i % 3) * 40;
        const x = 500 + Math.cos(angle) * radius;
        const y = 500 + Math.sin(angle) * radius * 1.4;
        return `<circle cx="${x}" cy="${y}" r="${8 + (i % 3) * 4}" fill="${darkenColor(baseColor, 30)}" opacity="0.6"/>`;
      }).join(''),
      stripes: () => Array.from({ length: 8 }, (_, i) =>
        `<ellipse cx="500" cy="${350 + i * 35}" rx="180" ry="12" fill="${darkenColor(baseColor, 20)}" opacity="0.5"/>`
      ).join(''),
      flame: () => `<path d="M 450 450 Q 480 350 500 450 Q 520 350 550 450 Q 535 550 500 580 Q 465 550 450 450" fill="rgba(255,100,0,0.7)"/>`,
      lightning: () => `<path d="M 480 350 L 520 350 L 500 450 L 530 450 L 480 650 L 500 550 L 470 550 Z" fill="rgba(255,255,100,0.8)"/>`,
      runes: () => Array.from({ length: 6 }, (_, i) => {
        const symbols = ['♦', '♠', '♣', '♥', '※', '✦'];
        const angle = (i * 60) * Math.PI / 180;
        const x = 500 + Math.cos(angle) * 100;
        const y = 500 + Math.sin(angle) * 140;
        return `<text x="${x}" y="${y}" font-family="serif" font-size="30" fill="rgba(255,255,255,0.9)" text-anchor="middle">${symbols[i]}</text>`;
      }).join(''),
      stars: () => Array.from({ length: 15 }, (_, i) => {
        const angle = (i * 24) * Math.PI / 180;
        const radius = 60 + (i % 4) * 30;
        const x = 500 + Math.cos(angle) * radius;
        const y = 500 + Math.sin(angle) * radius * 1.4;
        return `<circle cx="${x}" cy="${y}" r="3" fill="rgba(255,255,255,0.9)"/>`;
      }).join(''),
    };
    return overlays[overlay]();
  }

  // レアリティエフェクト
  function generateAdditionalDetails() {
    const rarityEffects: Record<EggType['rarity'], () => string> = {
      common: () => '',
      rare: () => `<circle cx="500" cy="500" r="210" fill="none" stroke="rgba(100,200,255,0.3)" stroke-width="2"/>`,
      legendary: () => `<circle cx="500" cy="500" r="210" fill="none" stroke="rgba(255,215,0,0.5)" stroke-width="3"/>
                       <circle cx="500" cy="500" r="220" fill="none" stroke="rgba(255,215,0,0.3)" stroke-width="2"/>`,
    };
    return rarityEffects[rarity]();
  }

  const fillColor = overlay === 'gradient' ? `url(#grad${id})` : baseColor;

  return `<svg width="1000" height="1000" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
    <defs>
      ${generatePatternDefs()}
    </defs>
    <rect width="1000" height="1000" fill="transparent"/>
    <ellipse cx="500" cy="850" rx="180" ry="30" fill="rgba(0,0,0,0.1)"/>
    <ellipse cx="500" cy="500" rx="200" ry="280" fill="${fillColor}" stroke="#333" stroke-width="3"/>
    ${generatePatternOverlay()}
    <ellipse cx="450" cy="400" rx="35" ry="50" fill="rgba(255,255,255,0.6)"/>
    <circle cx="460" cy="420" r="12" fill="rgba(255,255,255,0.9)"/>
    ${generateAdditionalDetails()}
  </svg>`;
}

/**
 * CanvasでPNG画像を生成（1000x1000・中央配置）
 */
async function createEggPNG(design: EggDesign, seed: number): Promise<Blob> {
  const size = OUTPUT_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // 背景は透明
  ctx.clearRect(0, 0, size, size);

  // グラデーション
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, design.colors[0]);
  grad.addColorStop(1, design.colors[1]);
  ctx.fillStyle = grad;

  // 卵パスを作成して中央に配置
  const cx = size / 2;
  const cy = size / 2;
  const eggW = Math.floor(size * 0.6);
  const eggH = Math.floor(size * 0.78);

  // パス
  ctx.beginPath();
  ctx.moveTo(cx, cy - eggH / 2);
  ctx.bezierCurveTo(
    cx + eggW * 0.35, cy - eggH * 0.5,
    cx + eggW * 0.5, cy + eggH * 0.1,
    cx, cy + eggH * 0.5
  );
  ctx.bezierCurveTo(
    cx - eggW * 0.5, cy + eggH * 0.1,
    cx - eggW * 0.35, cy - eggH * 0.5,
    cx, cy - eggH / 2
  );
  ctx.closePath();

  // クリップ領域に設定
  ctx.save();
  ctx.clip();

  // ベース塗り
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // パターン描画
  const rng = mulberry32(seed);
  if (design.pattern === "stripe") {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((design.rotation * Math.PI) / 180);
    const w = size / (design.stripeCount + 2);
    for (let i = -Math.ceil(size / w); i < Math.ceil(size / w); i++) {
      ctx.fillStyle = i % 2 === 0 ? design.colors[0] : design.colors[1];
      ctx.globalAlpha = 0.25;
      ctx.fillRect(i * w - size / 2, -size / 2, w * 1.5, size);
    }
    ctx.restore();
  } else if (design.pattern === "rings") {
    ctx.save();
    ctx.strokeStyle = design.colors[0];
    ctx.globalAlpha = 0.2;
    for (let i = 1; i <= 10; i++) {
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.arc(cx, cy, (Math.min(eggW, eggH) / 20) * i, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  } else if (design.pattern === "speckle") {
    for (let i = 0; i < design.speckleCount; i++) {
      const x = Math.floor(rng() * size);
      const y = Math.floor(rng() * size);
      const r = Math.floor(1 + rng() * 6);
      const color = rng() > 0.5 ? design.colors[0] : design.colors[1];
      const op = 0.12 + rng() * 0.18;
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.globalAlpha = op;
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // ソフトなグラデーション矩形
    const g2 = ctx.createLinearGradient(0, 0, size, size);
    g2.addColorStop(0, design.colors[0]);
    g2.addColorStop(1, design.colors[1]);
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, size, size);
  }

  // ハイライト
  ctx.globalAlpha = 0.25 + 0.4 * design.shine;
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.ellipse(cx - eggW * 0.15, cy - eggH * 0.15, eggW * 0.25, eggH * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // クリップ解除
  ctx.restore();

  // PNG出力
  return new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b as Blob), "image/png", 0.95);
  });
}

/**
 * 250種のメタデータを生成
 * - 画像自体はダウンロード操作時に生成（省メモリ）
 */
function useGeneratedEggs(count: number) {
  return useMemo(() => {
    const eggs: EggMeta[] = [];
    for (let i = 0; i < count; i++) {
      const seed = 1000 + i; // 再現可能なシード
      const rng = mulberry32(seed);
      const design = generateDesign(rng);
      const traits = generateTraits(rng, design);
      const name = generateName(rng);
      const description = generateDescription(rng, traits);
      eggs.push({ id: i + 1, seed, name, description, traits, design });
    }
    return eggs;
  }, [count]);
}

/**
 * CSV文字列を生成
 */
function buildCSV(eggs: EggMeta[]): string {
  const header = ["id", "name", "description", "traits"].join(",");
  const rows = eggs.map((e) => {
    const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
    return [
      e.id.toString(),
      escape(e.name),
      escape(e.description),
      escape(e.traits.join("; ")),
    ].join(",");
  });
  return [header, ...rows].join("\n");
}

/**
 * 管理者用: CoChara卵ジェネレータ
 * - 1000x1000 PNG/SVG を250種生成（卵は中央配置）
 * - 名前/説明文/特性をCSVでダウンロード
 * - 画像はZIPで一括ダウンロード
 */
export default function EggGenerator() {
  const eggs = useGeneratedEggs(250);
  const [working, setWorking] = useState<"none" | "png" | "svg" | "csv">("none");
  // 全プレビュー表示フラグ
  const [showAll, setShowAll] = useState(false);

  /**
   * 生成ボタン押下時のハンドラ
   * - 全プレビュー表示を有効にする
   */
  const handleGenerateAllPreview = () => {
    setShowAll(true);
  };

  /**
   * 全プレビュー用に、各卵のSVG文字列をメモ化
   * - showAll が true の時のみ計算してコストを抑制
   */
  const previewSvgs = useMemo(() => {
    if (!showAll) return [] as { id: number; svg: string; meta: EggMeta }[];
    return eggs.map((e) => ({
      id: e.id,
      svg: createEggSVG(e.design, e.seed),
      meta: e,
    }));
  }, [showAll, eggs]);

  /**
   * PNG(1000x1000)をZIPにまとめてダウンロード
   */
  const handleDownloadPNG = async () => {
    try {
      setWorking("png");
      const zip = new JSZip();
      const folder = zip.folder("png")!;
      for (const egg of eggs) {
        const blob = await createEggPNG(egg.design, egg.seed);
        const filename = `egg_${String(egg.id).padStart(3, "0")}.png`;
        folder.file(filename, blob);
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, "cochara_eggs_png.zip");
    } finally {
      setWorking("none");
    }
  };

  /**
   * SVG(1000x1000)をZIPにまとめてダウンロード
   */
  const handleDownloadSVG = async () => {
    try {
      setWorking("svg");
      const zip = new JSZip();
      const folder = zip.folder("svg")!;
      for (const egg of eggs) {
        const svg = createEggSVG(egg.design, egg.seed);
        const filename = `egg_${String(egg.id).padStart(3, "0")}.svg`;
        folder.file(filename, svg);
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, "cochara_eggs_svg.zip");
    } finally {
      setWorking("none");
    }
  };

  /**
   * CSVをダウンロード
   */
  const handleDownloadCSV = async () => {
    try {
      setWorking("csv");
      const csv = buildCSV(eggs);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      saveAs(blob, "cochara_eggs_meta.csv");
    } finally {
      setWorking("none");
    }
  };

  return (
    <div className="max-w-6xl w-full mx-auto">
      <div className="mb-6 flex flex-col items-center gap-3">
        <h1 className="text-3xl font-bold text-white">CoChara 卵ジェネレータ</h1>
        <p className="text-white/80 text-center">
          1000x1000 PNG / SVG で250種類のユニークな卵画像を生成。CSVで名前・説明文・特性もダウンロードできます。
        </p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={handleGenerateAllPreview}
            disabled={showAll}
            className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white font-semibold px-5 py-3 rounded disabled:opacity-50"
          >
            生成（全プレビュー表示）
          </button>
        </div>
      </div>

      {/* プレビュー */}
      {!showAll && (
        <div className="mb-10">
          <p className="text-white/70 mb-3">プレビュー（先頭6件）</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-items-center">
            {eggs.slice(0, 6).map((e, idx) => {
              const svg = createEggSVG(e.design, e.seed);
              const imageSrc = svgToDataUrl(svg);
              const eggType = toEggType(e);
              return (
                <EggCard
                  key={`preview-${e.id}`}
                  eggType={eggType}
                  isSelected={false}
                  onSelect={() => {}}
                  index={idx}
                  imageSrc={imageSrc}
                />
              );
            })}
          </div>
        </div>
      )}

      {showAll && (
        <div className="mb-10">
          <p className="text-white/70 mb-3">全プレビュー（{eggs.length}件）</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 justify-items-center">
            {previewSvgs.map((p, idx) => {
              const imageSrc = svgToDataUrl(p.svg);
              const eggType = toEggType(p.meta);
              return (
                <EggCard
                  key={`preview-all-${p.id}`}
                  eggType={eggType}
                  isSelected={false}
                  onSelect={() => {}}
                  index={idx}
                  imageSrc={imageSrc}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* 操作ボタン */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={handleDownloadPNG}
          disabled={working !== "none"}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-3 rounded disabled:opacity-50"
        >
          <Download size={18} /> PNGをZIPでダウンロード (250)
        </button>
        <button
          onClick={handleDownloadSVG}
          disabled={working !== "none"}
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-5 py-3 rounded disabled:opacity-50"
        >
          <Layers size={18} /> SVGをZIPでダウンロード (250)
        </button>
        <button
          onClick={handleDownloadCSV}
          disabled={working !== "none"}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-3 rounded disabled:opacity-50"
        >
          <RefreshCw size={18} /> CSVをダウンロード
        </button>
      </div>

      {/* 注意 */}
      <p className="text-center text-white/70 text-xs mt-4">
        画像生成はブラウザ内で行われます。PNG生成は少し時間がかかる場合があります。
      </p>
    </div>
  );
}

/**
 * 生成済みSVG文字列を <img src> で使える data URL へ変換
 */
function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * デザイン情報からレアリティを推定
 * - 光沢(shine)やパターン種別で簡易的に分類
 */
function mapRarity(design: EggDesign): EggType['rarity'] {
  if (design.pattern === 'cosmic' || design.pattern === 'fire' || design.shine > 0.75) {
    return 'legendary';
  }
  if (design.pattern === 'aurora' || design.pattern === 'rings' || design.shine > 0.55) {
    return 'rare';
  }
  return 'common';
}

/**
 * 生成メタから既存の EggType へマッピング
 * - src を渡すため、gradient/strokeColor はフォールバック用のデフォルト値を設定
 */
function toEggType(meta: EggMeta): EggType {
  return {
    id: `gen-${meta.id}`,
    name: meta.name,
    description: meta.description,
    gradient: 'from-white via-gray-50 to-gray-100',
    strokeColor: 'stroke-gray-300',
    pattern: meta.design.pattern,
    characteristics: meta.traits,
    rarity: mapRarity(meta.design),
  };
}