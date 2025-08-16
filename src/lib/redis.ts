import Redis from 'ioredis';

// Redis接続設定
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  // デフォルトでは接続失敗時に自動再接続を試行
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
};

/**
 * Redis クライアントインスタンス
 * セッションストア、リアルタイム機能のための永続化層として使用
 */
export const redis = new Redis(redisConfig);

/**
 * Redis接続エラーハンドリング
 */
redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('ready', () => {
  console.log('Redis connection is ready');
});

/**
 * Redis接続を安全にクローズ
 */
export const closeRedisConnection = async () => {
  try {
    await redis.disconnect();
    console.log('Redis connection closed');
  } catch (error) {
    console.error('Error closing Redis connection:', error);
  }
};

/**
 * セッションデータの管理用ヘルパー関数
 */
export const sessionStore = {
  /**
   * セッションデータを保存
   * @param sessionId セッションID
   * @param data セッションデータ
   * @param ttl 有効期限（秒）
   */
  async set(sessionId: string, data: any, ttl: number = 3600) {
    try {
      await redis.setex(`session:${sessionId}`, ttl, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving session to Redis:', error);
      throw error;
    }
  },

  /**
   * セッションデータを取得
   * @param sessionId セッションID
   * @returns セッションデータまたはnull
   */
  async get(sessionId: string) {
    try {
      const data = await redis.get(`session:${sessionId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error retrieving session from Redis:', error);
      return null;
    }
  },

  /**
   * セッションデータを削除
   * @param sessionId セッションID
   */
  async delete(sessionId: string) {
    try {
      await redis.del(`session:${sessionId}`);
    } catch (error) {
      console.error('Error deleting session from Redis:', error);
      throw error;
    }
  },

  /**
   * セッションの有効期限を延長
   * @param sessionId セッションID
   * @param ttl 有効期限（秒）
   */
  async extend(sessionId: string, ttl: number = 3600) {
    try {
      await redis.expire(`session:${sessionId}`, ttl);
    } catch (error) {
      console.error('Error extending session TTL:', error);
      throw error;
    }
  }
};

/**
 * リアルタイム機能用のPub/Sub管理
 */
export const pubSub = {
  /**
   * チャンネルにメッセージを発行
   * @param channel チャンネル名
   * @param message メッセージ
   */
  async publish(channel: string, message: any) {
    try {
      await redis.publish(channel, JSON.stringify(message));
    } catch (error) {
      console.error('Error publishing message to Redis:', error);
      throw error;
    }
  },

  /**
   * チャンネルを購読（Socket.IOサーバーから使用）
   * @param channel チャンネル名
   * @param callback メッセージ受信時のコールバック
   */
  async subscribe(channel: string, callback: (message: any) => void) {
    try {
      const subscriber = redis.duplicate();
      await subscriber.subscribe(channel);
      
      subscriber.on('message', (receivedChannel, message) => {
        if (receivedChannel === channel) {
          try {
            const parsedMessage = JSON.parse(message);
            callback(parsedMessage);
          } catch (error) {
            console.error('Error parsing Redis message:', error);
          }
        }
      });

      return subscriber;
    } catch (error) {
      console.error('Error subscribing to Redis channel:', error);
      throw error;
    }
  }
};