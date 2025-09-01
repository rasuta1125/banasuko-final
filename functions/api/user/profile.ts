import { Hono } from 'hono';
import { initializeFirebase } from '../../lib/firebase';

const app = new Hono();

// 初代バナスコのget_user_data_from_firestore関数を移植
async function getUserDataFromFirestore(uid: string) {
  try {
    const db = initializeFirebase();
    const docRef = db.collection('users').doc(uid);
    const doc = await docRef.get();
    
    if (doc.exists) {
      const data = doc.data();
      return {
        plan: data?.plan || "Free",
        remaining_uses: data?.remaining_uses || 0,
        email: data?.email || "",
        created_at: data?.created_at || null
      };
    } else {
      // 初代バナスコのロジック：新規ユーザーの場合、デフォルト値を設定
      const defaultData = {
        plan: "Free",
        remaining_uses: 5,
        created_at: new Date()
      };
      
      await docRef.set(defaultData);
      return defaultData;
    }
  } catch (error) {
    console.error('Firestore user data fetch error:', error);
    throw error;
  }
}

// 初代バナスコのupdate_user_uses_in_firestore関数を移植
async function updateUserUsesInFirestore(uid: string, usesToDeduct: number = 1) {
  try {
    const db = initializeFirebase();
    const docRef = db.collection('users').doc(uid);
    
    await docRef.update({
      remaining_uses: db.FieldValue.increment(-usesToDeduct),
      last_used_at: new Date()
    });
    
    return true;
  } catch (error) {
    console.error('Firestore user uses update error:', error);
    return false;
  }
}

// 初代バナスコのadd_diagnosis_record_to_firestore関数を移植
async function addDiagnosisRecordToFirestore(uid: string, recordData: any) {
  try {
    const db = initializeFirebase();
    const docRef = db.collection('users').doc(uid).collection('diagnoses').doc();
    
    const recordWithTimestamp = {
      ...recordData,
      created_at: new Date()
    };
    
    await docRef.set(recordWithTimestamp);
    return true;
  } catch (error) {
    console.error('Firestore diagnosis record add error:', error);
    return false;
  }
}

// ユーザープロファイル取得API
app.get('/profile', async (c) => {
  try {
    // セッションからUIDを取得（簡易版）
    const sessionCookie = c.req.header('Cookie')?.match(/bn_session=([^;]+)/)?.[1];
    
    if (!sessionCookie) {
      return c.json({ 
        success: false, 
        error: '認証が必要です' 
      }, 401);
    }

    // 実際の実装では、JWTトークンを検証してUIDを取得
    // ここでは簡易的にデモユーザーとして処理
    const uid = 'demo_user_123';
    
    const userData = await getUserDataFromFirestore(uid);
    
    return c.json({
      success: true,
      profile: userData
    });
    
  } catch (error) {
    console.error('Profile fetch error:', error);
    return c.json({ 
      success: false, 
      error: 'プロフィール取得に失敗しました' 
    }, 500);
  }
});

// ユーザープロファイル作成API（初代バナスコのロジックを移植）
app.post('/profile', async (c) => {
  try {
    const { uid, email, displayName, plan } = await c.req.json();
    
    if (!uid || !email) {
      return c.json({ 
        success: false, 
        error: 'UIDとメールアドレスが必要です' 
      }, 400);
    }

    // 初代バナスコのロジック：新規ユーザーのデフォルト設定
    const userProfile = {
      email: email,
      displayName: displayName || email.split('@')[0],
      plan: plan || "Free",
      remaining_uses: 5,
      created_at: new Date()
    };

    const db = initializeFirebase();
    await db.collection('users').doc(uid).set(userProfile);
    
    console.log('✅ User profile created in Firestore:', uid);
    
    return c.json({ 
      success: true, 
      message: 'ユーザープロフィールを作成しました',
      profile: userProfile
    });
    
  } catch (error) {
    console.error('Profile creation error:', error);
    return c.json({ 
      success: false, 
      error: 'プロフィール作成に失敗しました' 
    }, 500);
  }
});

// 利用回数更新API（初代バナスコのロジックを移植）
app.post('/uses/update', async (c) => {
  try {
    const { uid, usesToDeduct = 1 } = await c.req.json();
    
    if (!uid) {
      return c.json({ 
        success: false, 
        error: 'UIDが必要です' 
      }, 400);
    }

    const success = await updateUserUsesInFirestore(uid, usesToDeduct);
    
    if (success) {
      return c.json({ 
        success: true, 
        message: '利用回数を更新しました' 
      });
    } else {
      return c.json({ 
        success: false, 
        error: '利用回数の更新に失敗しました' 
      }, 500);
    }
    
  } catch (error) {
    console.error('Uses update error:', error);
    return c.json({ 
      success: false, 
      error: '利用回数更新に失敗しました' 
    }, 500);
  }
});

// 診断記録追加API（初代バナスコのロジックを移植）
app.post('/diagnosis/record', async (c) => {
  try {
    const { uid, recordData } = await c.req.json();
    
    if (!uid || !recordData) {
      return c.json({ 
        success: false, 
        error: 'UIDと診断データが必要です' 
      }, 400);
    }

    const success = await addDiagnosisRecordToFirestore(uid, recordData);
    
    if (success) {
      return c.json({ 
        success: true, 
        message: '診断記録を保存しました' 
      });
    } else {
      return c.json({ 
        success: false, 
        error: '診断記録の保存に失敗しました' 
      }, 500);
    }
    
  } catch (error) {
    console.error('Diagnosis record error:', error);
    return c.json({ 
      success: false, 
      error: '診断記録の保存に失敗しました' 
    }, 500);
  }
});

export default app;
