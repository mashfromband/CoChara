import { NextRequest } from 'next/server';
import { Server as NetServer } from 'http';
import { Server as IOServer } from 'socket.io';
import { redis } from '@/lib/redis';

// NOTE: Next.js App Router の Route Handlers を利用して Socket.IO サーバーを初期化します。
// Vercel等のサーバーレスでは常駐できないため、セルフホスト前提の使い方です。
// 同じポート(Next.jsのHTTPサーバー)で動作させます。

export const dynamic = 'force-dynamic';

let io: IOServer | null = null;

/**
 * Socket.IOサーバーの初期化関数
 * - すでに初期化済みであれば既存のインスタンスを返す
 */
function getOrCreateIO(server: NetServer): IOServer {
  if (io) return io;

  io = new IOServer(server, {
    path: '/api/socket',
    cors: {
      origin: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8500',
      credentials: true,
    },
  });

  // 接続イベント
  io.on('connection', (socket) => {
    // クライアントからのjoin（部屋参加）
    socket.on('room:join', (roomId: string) => {
      socket.join(roomId);
      socket.emit('room:joined', roomId);
    });

    // メッセージ送信（部屋内ブロードキャスト）
    socket.on('room:message', ({ roomId, message }) => {
      socket.to(roomId).emit('room:message', { sender: socket.id, message });
    });

    // ルーム内のステータス更新（例：共同編集カーソル位置等）
    socket.on('room:state', ({ roomId, state }) => {
      socket.to(roomId).emit('room:state', { sender: socket.id, state });
    });

    socket.on('disconnect', () => {
      // ここで必要ならRedisからpresenceなどを削除
    });
  });

  return io;
}

/**
 * GETハンドラー
 * - Next.jsのNodeサーバーの参照を取得し、Socket.IOサーバーを同ポート上で起動
 */
export async function GET() {
  // @ts-ignore - Next.js の内部型
  const server: NetServer | undefined = (global as any).server || (global as any).__server;

  if (!server) {
    return new Response('Server is not available', { status: 500 });
  }

  // 既に初期化済みか確認
  getOrCreateIO(server);

  return new Response('Socket.IO server is ready', { status: 200 });
}

/**
 * POSTハンドラー（例：Redis経由で特定ルームに配信）
 */
export async function POST(request: NextRequest) {
  if (!io) {
    return new Response('Socket.IO not initialized', { status: 500 });
  }

  const payload = await request.json();
  const { channel, event, data } = payload || {};

  if (!channel || !event) {
    return new Response('Invalid payload', { status: 400 });
  }

  // 直接 Socket.IO へ送信
  io.to(channel).emit(event, data);

  // Redis Pub/Sub にも発行（将来的にスケール時に活用）
  await redis.publish(`channel:${channel}`, JSON.stringify({ event, data }));

  return new Response('OK', { status: 200 });
}