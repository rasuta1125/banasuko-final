import { Hono } from 'hono';
import { initializeFirebase } from '../../lib/firebase';

const app = new Hono();

// 初代バナスコのupload_image_to_firebase_storage関数を移植
async function uploadImageToFirebaseStorage(uid: string, imageBytes: Buffer, filename: string) {
  try {
    const { getStorage } = await import('firebase-admin/storage');
    const storage = getStorage();
    const bucket = storage.bucket();
    
    const blob = bucket.file(`users/${uid}/diagnoses_images/${filename}`);
    await blob.save(imageBytes, {
      metadata: {
        contentType: 'image/png'
      }
    });
    
    await blob.makePublic();
    return blob.publicUrl();
  } catch (error) {
    console.error('Firebase Storage upload error:', error);
    return null;
  }
}

// 初代バナスコのsanitize関数を移植
function sanitize(value: any): string {
  if (value === null || value === undefined || value === "取得できず") {
    return "エラー";
  }
  return String(value);
}

// 初代バナスコのrun_ai_diagnosis関数を移植
app.post('/single', async (c) => {
  try {
    const formData = await c.req.formData();
    const imageFile = formData.get('image') as File;
    const mode = formData.get('mode') as string;
    
    if (!imageFile) {
      return c.json({ 
        success: false, 
        error: '画像ファイルが必要です' 
      }, 400);
    }

    // ファイルサイズとタイプの検証
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (imageFile.size > maxSize) {
      return c.json({ 
        success: false, 
        error: '画像サイズは10MB以下にしてください' 
      }, 400);
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(imageFile.type)) {
      return c.json({ 
        success: false, 
        error: 'JPEG、JPG、PNG形式の画像のみ対応しています' 
      }, 400);
    }

    // セッションからUIDを取得（簡易版）
    const sessionCookie = c.req.header('Cookie')?.match(/bn_session=([^;]+)/)?.[1];
    const uid = sessionCookie ? 'demo_user_123' : 'anonymous_user';

    // 画像をBase64に変換（初代バナスコのロジック）
    const arrayBuffer = await imageFile.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let base64 = '';
    for (let i = 0; i < uint8Array.length; i++) {
      base64 += String.fromCharCode(uint8Array[i]);
    }
    base64 = btoa(base64);

    // 初代バナスコのAI診断プロンプトを移植
    const aiPromptText = `以下のバナー画像をプロ視点で採点してください。【評価基準】1. 内容が一瞬で伝わるか 2. コピーの見やすさ 3. 行動喚起 4. 写真とテキストの整合性 5. 情報量のバランス【出力形式】---スコア：100点満点改善コメント：2～3行でお願いします---`;

    // OpenAI API呼び出し（初代バナスコと同じ）
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return c.json({ 
        success: false, 
        error: 'OpenAI APIキーが設定されていません' 
      }, 500);
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'あなたは広告のプロです。' },
          {
            role: 'user',
            content: [
              { type: 'text', text: aiPromptText },
              { 
                type: 'image_url', 
                image_url: { url: `data:image/png;base64,${base64}` }
              }
            ]
          }
        ],
        max_tokens: 600
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;

    if (!content) {
      throw new Error('OpenAI API response is empty');
    }

    // 初代バナスコの正規表現パースを移植
    const scoreMatch = content.match(/スコア[:：]\s*(.+)/);
    const commentMatch = content.match(/改善コメント[:：]\s*(.+)/s);
    
    const score = scoreMatch ? scoreMatch[1].trim() : "取得できず";
    const comment = commentMatch ? commentMatch[1].trim() : "取得できず";

    // 初代バナスコのsanitize関数を適用
    const sanitizedScore = sanitize(score);
    const sanitizedComment = sanitize(comment);

    // Firebase Storageに画像をアップロード（初代バナスコのロジック）
    const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, -5);
    const filename = `banner_single_${timestamp}.png`;
    const imageUrl = await uploadImageToFirebaseStorage(uid, Buffer.from(uint8Array), filename);

    // 初代バナスコのFirestore記録データ構造を移植
    const firestoreRecordData = {
      pattern: "single",
      platform: sanitize("GDN"),
      category: sanitize("広告"),
      industry: sanitize("その他"),
      age_group: sanitize("指定なし"),
      purpose: sanitize("リンククリック"),
      score: sanitizedScore,
      comment: sanitizedComment,
      image_url: imageUrl || "エラー",
      result: sanitize(""),
      follower_gain: sanitize(""),
      memo: sanitize("")
    };

    // Firestoreに診断記録を保存（初代バナスコのロジック）
    if (uid !== 'anonymous_user') {
      try {
        const db = initializeFirebase();
        const docRef = db.collection('users').doc(uid).collection('diagnoses').doc();
        await docRef.set({
          ...firestoreRecordData,
          created_at: new Date()
        });
        console.log('✅ Diagnosis record saved to Firestore');
      } catch (firestoreError) {
        console.error('Firestore save error:', firestoreError);
        // エラーでも分析結果は返す
      }
    }

    return c.json({
      success: true,
      data: {
        score: sanitizedScore,
        comment: sanitizedComment,
        imageUrl: imageUrl
      },
      message: '画像分析が完了しました'
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return c.json({ 
      success: false, 
      error: '画像分析中にエラーが発生しました' 
    }, 500);
  }
});

export default app;
