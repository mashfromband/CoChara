/**
 * Mastraエージェント: 卵の色分析と日本語色名生成
 * 
 * このエージェントは：
 * - eggTypeのgradientとstrokeColorを受け取り、色味を分析
 * - 色相・彩度・明度から、詩的で独創的な日本語色名を生成
 * - 既存キャラクターの名前との重複を回避
 */

// import { Agent } from '@mastra/core/agent'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
// import { ollama } from 'ollama-ai-provider-v2'

/**
 * 卵の色ツール：卵の色情報から詩的な日本語名を生成
 */
export const analyzeEggColorTool = createTool({
  id: 'analyze-egg-color',
  description: '卵のgradientとstrokeColorから詩的で独創的な日本語名を生成する',
  inputSchema: z.object({
    gradient: z.string().describe('Tailwind CSS形式のグラデーション（例: from-pink-100 via-pink-200 to-purple-200）'),
    strokeColor: z.string().describe('Tailwind CSS形式のストローク色（例: stroke-pink-400）'),
    pattern: z.string().describe('卵のパターン（例: heart, stars, flames）'),
    existingNames: z.array(z.string()).describe('既存のキャラクター名一覧（重複回避用）')
  }),
  outputSchema: z.object({
    colorName: z.string().describe('生成された日本語色名（最大8文字）'),
    colorAnalysis: z.string().describe('色の分析・説明'),
    alternatives: z.array(z.string()).describe('代替案（3つ）')
  }),
  execute: async ({ context }) => {
    const { gradient, strokeColor, pattern, existingNames } = context

    // Tailwind CSSクラスから色相を推定
    const colorInfo = extractColorInfo(gradient, strokeColor)
    
    // 詩的な色名候補を生成
    const candidates = generatePoeticalColorNames(colorInfo, pattern)
    
    // 重複回避
    const availableNames = candidates.filter(name => 
      !existingNames.some(existing => 
        existing.includes(name) || name.includes(existing)
      )
    )
    
    const selectedName = availableNames[0] || candidates[0]
    const alternatives = availableNames.slice(1, 4)
    
    return {
      colorName: selectedName,
      colorAnalysis: `${colorInfo.hue}系統の${colorInfo.brightness}な色合い。${colorInfo.description}`,
      alternatives
    }
  }
})

/**
 * 色分析エージェント：LLMを使用してより豊かな名前を生成
 * 注意: Ollama互換性の問題により、現在は無効化されています
 */
/*
import { Agent } from '@mastra/core/agent'
// export const colorNameAgent = new Agent({
  name: 'color-name-agent',
  instructions: `あなたは詩的で美しい日本語の色名を生成する専門家です。

以下の原則に従ってください：
1. 卵の色情報（gradient, strokeColor, pattern）を分析し、詩的で独創的な日本語名を生成する
2. 名前は最大8文字以内とする
3. 既存のキャラクター名と重複しないよう工夫する
4. 季節感、自然、宝石、花、空、水などからインスピレーションを得る
5. 単純な色名（赤、青等）ではなく、情緒的で美しい表現を使う

例：紅蓮、琥珀、翠玉、瑠璃、藤紫、桃花、白銀、漆黒、朝霞、夕焼、月光、星砂

色の分析も含めて、そのエッグの美しさを表現してください。`,
  
  model: ollama('llama3.2:1b'),
  
  tools: { analyzeEggColorTool }
})
*/

/**
 * Tailwind CSSクラスから色情報を抽出
 */
function extractColorInfo(gradient: string, strokeColor: string) {
  // gradientからメインカラーを抽出
  const colorMatch = gradient.match(/(red|pink|purple|blue|indigo|green|yellow|orange|gray|white|black)-(\d+)/g)
  const strokeMatch = strokeColor.match(/(red|pink|purple|blue|indigo|green|yellow|orange|gray|white|black)-(\d+)/)
  
  const mainColor = colorMatch?.[0] || strokeMatch?.[0] || 'gray-500'
  const [colorName, intensity] = mainColor.split('-')
  
  const hueMap: Record<string, string> = {
    red: '紅',
    pink: '桃',
    purple: '紫',
    blue: '青',
    indigo: '藍',
    green: '緑',
    yellow: '黄',
    orange: '橙',
    gray: '灰',
    white: '白',
    black: '黒'
  }
  
  const brightnessMap: Record<string, string> = {
    '50': '極淡',
    '100': '淡',
    '200': '薄',
    '300': '明',
    '400': '中',
    '500': '濃',
    '600': '深',
    '700': '暗',
    '800': '重',
    '900': '漆'
  }
  
  const hue = hueMap[colorName as keyof typeof hueMap] || '彩'
  const brightness = brightnessMap[intensity as keyof typeof brightnessMap] || '明'
  
  // 補足説明
  const description = `${colorName}系のニュアンスが感じられる` 
  
  return { hue, brightness, description }
}

/**
 * 詩的な色名候補を生成
 */
function generatePoeticalColorNames(colorInfo: { hue: string, brightness: string }, pattern: string): string[] {
  const { hue, brightness } = colorInfo
  
  const baseColors = [
    `${brightness}${hue}`,
    `${hue}玉`,
    `${hue}光`,
    `${hue}霞`,
    `${hue}露`,
    `${hue}星`,
    `${hue}花`,
    `${hue}雪`,
    `${hue}閃`,
    `${hue}雫`,
  ].filter(name => name.length <= 8)
  
  const patternMap: Record<string, string[]> = {
    heart: ['恋', '愛', '心'],
    stars: ['宙', '星', '天'],
    flames: ['焔', '灯', '炎'],
    waves: ['波', '潮', '渚'],
    leaves: ['翠', '森', '萌'],
  }
  
  const patternBoost = (patternMap[pattern] || []).flatMap(suffix => 
    [
      `${hue}${suffix}`,
      `${brightness}${suffix}`
    ].filter(name => name.length <= 8)
  )
  
  const candidates = [...baseColors, ...patternBoost]
  
  // 明度修飾
  const brightnessPrefix = brightness === '淡' ? '淡' : brightness === '深' ? '深' : ''
  if (brightnessPrefix) {
    baseColors.forEach(color => {
      if ((brightnessPrefix + color).length <= 8) {
        candidates.push(brightnessPrefix + color)
      }
    })
  }
  
  return Array.from(new Set(candidates)).slice(0, 10)
}

/**
 * 既存のキャラクター名を取得（重複回避用）
 */
export async function getExistingCharacterNames(): Promise<string[]> {
  try {
    const characters = await prisma.character.findMany({
      select: { name: true }
    })
    return characters.map(c => c.name)
  } catch (error) {
    console.warn('既存キャラクター名の取得に失敗:', error)
    return []
  }
}

/**
 * エージェント（現在無効）またはツールを使って色名を生成（フォールバック付き）
 */
export async function generateColorBasedName(
  gradient: string,
  strokeColor: string,
  pattern: string
): Promise<string> {
  console.log('Mastra名前生成開始:', { gradient, strokeColor, pattern })
  
  try {
    // 環境変数でMastra統合のON/OFFを制御（.env.local）
    if (process.env.DISABLE_MASTRA_AGENTS === 'true') {
      console.log('DISABLE_MASTRA_AGENTS=true のため無効化')
      throw new Error('Mastra agents disabled')
    }

    const existingNames = await getExistingCharacterNames()
    console.log('既存キャラクター名一覧:', existingNames)

    // 現在はエージェント無効のため、ツールを直接実行
    const result = await (analyzeEggColorTool as any).execute({
      context: { gradient, strokeColor, pattern, existingNames }
    })

    console.log('Mastraツール実行結果:', result)

    const generatedName = result?.colorName || '神秘'
    console.log('生成された名前:', generatedName)
    
    return generatedName
  } catch (error) {
    console.warn('Mastraエージェント/ツールでの名前生成に失敗、フォールバックを使用:', error)

    // フォールバック: 既存ロジック
    const fallbackName = fallbackColorName(gradient, strokeColor, pattern)
    console.log('フォールバック名前:', fallbackName)
    
    return fallbackName
  }
}

/**
 * フォールバック用の色名生成
 */
function fallbackColorName(gradient: string, strokeColor: string, pattern: string): string {
  const colorInfo = extractColorInfo(gradient, strokeColor)
  const candidates = generatePoeticalColorNames(colorInfo, pattern)
  return candidates[0] || '神秘'
}