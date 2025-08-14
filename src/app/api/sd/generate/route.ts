import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/sd/generate
 * Stable Diffusion AUTOMATIC1111 の REST API（/sdapi/v1/txt2img）を呼び出して画像を生成し、
 * 任意で rembg HTTP サーバの /api/remove を呼んで背景透過PNGに変換して返すエンドポイント。
 * - 必要な環境変数:
 *   - SD_WEBUI_BASE_URL: AUTOMATIC1111 のベースURL (例: http://127.0.0.1:7860)
 *   - REMBG_BASE_URL: rembg HTTP サーバのベースURL (例: http://127.0.0.1:7000)
 *
 * リクエスト例:
 * {
 *   "prompt": "cute chibi dragon, character sheet, white background, high quality",
 *   "negative_prompt": "text, watermark, logo, extra limbs, low quality",
 *   "steps": 28,
 *   "width": 768,
 *   "height": 768,
 *   "sampler_index": "DPM++ 2M Karras",
 *   "seed": 123456,
 *   "backgroundRemoval": true
 * }
 *
 * レスポンス例:
 * { "success": true, "imageBase64": "iVBORw0KGgoAAA..." }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      prompt,
      negative_prompt = '',
      steps = 28,
      width = 768,
      height = 768,
      sampler_index = 'DPM++ 2M Karras',
      seed = -1,
      backgroundRemoval = false,
      // 追加パラメータがあればそのまま透過
      ...rest
    } = body || {};

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'prompt は必須です' }, { status: 400 });
    }

    const sdBase = process.env.SD_WEBUI_BASE_URL || 'http://127.0.0.1:7860';

    // 1) AUTOMATIC1111 に txt2img リクエスト
    const sdPayload: any = {
      prompt,
      negative_prompt,
      steps,
      width,
      height,
      sampler_index,
      seed,
      send_images: true,
      // API の仕様上、未指定はデフォルトが使われるため、残りは任意で透過
      ...rest,
    };

    // 出力は常に PNG にするため、override_settings.samples_format を強制
    sdPayload.override_settings = {
      ...(sdPayload.override_settings || {}),
      samples_format: 'png',
    };

    const sdRes = await fetch(`${sdBase}/sdapi/v1/txt2img`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sdPayload),
    });

    if (!sdRes.ok) {
      const text = await sdRes.text();
      return NextResponse.json(
        { error: `Stable Diffusion API エラー: ${sdRes.status} ${text}` },
        { status: 502 }
      );
    }

    const sdJson = await sdRes.json();
    const images: string[] = sdJson?.images || [];
    if (!images.length) {
      return NextResponse.json(
        { error: 'Stable Diffusion から画像を取得できませんでした' },
        { status: 502 }
      );
    }

    // A1111 は base64 文字列（data URI でない場合もある）
    const first = images[0] as string;
    const base64Raw = first.includes(',') ? first.split(',')[1] : first;
    let imageBuffer = Buffer.from(base64Raw, 'base64');

    // 2) 任意: rembg HTTP サーバで背景透過（出力は PNG）
    if (backgroundRemoval) {
      const rembgBase = process.env.REMBG_BASE_URL; // 例: http://127.0.0.1:7000
      if (!rembgBase) {
        return NextResponse.json(
          { error: '背景透過が有効ですが REMBG_BASE_URL が未設定です' },
          { status: 500 }
        );
      }

      // rembg の /api/remove に multipart/form-data で PNG を投げる
      const form = new FormData();
      const blob = new Blob([imageBuffer], { type: 'image/png' });
      form.append('file', blob, 'input.png');

      const rRes = await fetch(`${rembgBase}/api/remove`, {
        method: 'POST',
        body: form,
      });

      if (!rRes.ok) {
        const text = await rRes.text();
        return NextResponse.json(
          { error: `rembg API エラー: ${rRes.status} ${text}` },
          { status: 502 }
        );
      }

      const outBuf = Buffer.from(await rRes.arrayBuffer());
      imageBuffer = outBuf; // 透過 PNG に置き換え
    }

    // base64 PNG として返却（クライアント側で /api/upload に渡せます）
    const outBase64 = imageBuffer.toString('base64');
    return NextResponse.json({ success: true, imageBase64: outBase64 });
  } catch (err) {
    console.error('生成APIエラー:', err);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}