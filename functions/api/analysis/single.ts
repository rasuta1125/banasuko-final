import { Hono } from 'hono';

const app = new Hono();

app.post('/api/analysis/single', async (c) => {
  try {
    const formData = await c.req.formData();
    const mode = formData.get('mode') as string;
    const imageFile = formData.get('image') as File;

    // バリデーション
    if (!imageFile) {
      return c.json({
        success: false,
        error: '画像ファイルが提供されていません'
      }, 400);
    }

    // ファイルサイズチェック（10MB制限）
    if (imageFile.size > 10 * 1024 * 1024) {
      return c.json({
        success: false,
        error: '画像ファイルサイズは10MB以下にしてください'
      }, 400);
    }

    // ファイルタイプチェック
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(imageFile.type)) {
      return c.json({
        success: false,
        error: 'JPEG、JPG、PNG形式の画像のみ対応しています'
      }, 400);
    }

    // Base64変換
    const arrayBuffer = await imageFile.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let base64 = '';
    for (let i = 0; i < uint8Array.length; i++) {
      base64 += String.fromCharCode(uint8Array[i]);
    }
    base64 = btoa(base64);

    // OpenAI APIキーの取得
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return c.json({
        success: false,
        error: 'OpenAI APIキーが設定されていません'
      }, 500);
    }

    // OpenAI Vision APIの呼び出し
    const prompt = mode === 'analysis' 
      ? 'この画像を詳細に分析してください。画像の内容、色合い、構図、技術的な特徴などを日本語で説明してください。'
      : 'この画像の特徴を簡潔に説明してください。';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${imageFile.type};base64,${base64}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return c.json({
        success: false,
        error: '画像分析中にエラーが発生しました'
      }, 500);
    }

    const result = await response.json();
    const analysis = result.choices[0]?.message?.content;

    if (!analysis) {
      return c.json({
        success: false,
        error: '画像分析結果を取得できませんでした'
      }, 500);
    }

    return c.json({
      success: true,
      data: {
        analysis: analysis,
        mode: mode,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return c.json({
      success: false,
      error: '画像分析処理中にエラーが発生しました'
    }, 500);
  }
});

export default app;
