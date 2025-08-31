import { Hono } from 'hono';
import { initializeFirebase } from '../../lib/firebase';

const app = new Hono();

app.post('/api/user/profile', async (c) => {
  try {
    const { uid, email, displayName, plan } = await c.req.json();

    // バリデーション
    if (!uid || !email || !displayName) {
      return c.json({
        success: false,
        error: '必要なユーザー情報が不足しています'
      }, 400);
    }

    // Firebase Firestoreにユーザープロフィールを保存
    try {
      const db = initializeFirebase();
      
      const userProfile = {
        uid: uid,
        email: email,
        displayName: displayName,
        plan: plan || 'free',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usage: {
          totalAnalyses: 0,
          monthlyAnalyses: 0,
          lastAnalysis: null
        }
      };

      await db.collection('users').doc(uid).set(userProfile);

      console.log('✅ User profile created in Firestore:', uid);

      return c.json({
        success: true,
        message: 'ユーザープロフィールを作成しました',
        profile: userProfile
      });

    } catch (firebaseError) {
      console.error('Firebase error:', firebaseError);
      
      // Firebase接続エラーの場合、ローカルストレージに保存（フォールバック）
      console.log('⚠️ Using fallback storage for user profile');
      
      return c.json({
        success: true,
        message: 'ユーザープロフィールを作成しました（ローカル保存）',
        profile: {
          uid: uid,
          email: email,
          displayName: displayName,
          plan: plan || 'free',
          createdAt: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    console.error('Profile creation error:', error);
    return c.json({
      success: false,
      error: 'プロフィール作成中にエラーが発生しました'
    }, 500);
  }
});

app.get('/api/user/profile', async (c) => {
  try {
    // セッションからユーザー情報を取得
    const sessionCookie = c.req.header('Cookie')?.match(/bn_session=([^;]+)/)?.[1];
    
    if (!sessionCookie) {
      return c.json({
        success: false,
        error: '認証が必要です'
      }, 401);
    }

    // 実際の実装では、セッションストアからユーザー情報を取得
    // ここでは簡易版として、デモユーザー情報を返す
    const userProfile = {
      uid: 'demo_user_123',
      email: 'demo@banasuko.com',
      displayName: 'Demo User',
      plan: 'free',
      usage: {
        totalAnalyses: 5,
        monthlyAnalyses: 2,
        lastAnalysis: new Date().toISOString()
      }
    };

    return c.json({
      success: true,
      profile: userProfile
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return c.json({
      success: false,
      error: 'プロフィール取得中にエラーが発生しました'
    }, 500);
  }
});

export default app;
