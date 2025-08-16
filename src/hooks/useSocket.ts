import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

/**
 * Socket.IOクライアント用のカスタムフック
 * リアルタイム機能（チャット、共有編集、通知等）で使用
 */
export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Socket.IOクライアントを初期化
    socketRef.current = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8500', {
      path: '/api/socket',
      autoConnect: true,
    });

    const socket = socketRef.current;

    // 接続状態のイベントリスナー
    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    // クリーンアップ
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  /**
   * 指定したルームに参加
   * @param roomId ルームID
   */
  const joinRoom = (roomId: string) => {
    socketRef.current?.emit('room:join', roomId);
  };

  /**
   * ルームにメッセージを送信
   * @param roomId ルームID
   * @param message メッセージ内容
   */
  const sendMessage = (roomId: string, message: any) => {
    socketRef.current?.emit('room:message', { roomId, message });
  };

  /**
   * ルーム内の状態を共有（例：カーソル位置、編集状態等）
   * @param roomId ルームID
   * @param state 状態データ
   */
  const shareState = (roomId: string, state: any) => {
    socketRef.current?.emit('room:state', { roomId, state });
  };

  /**
   * イベントリスナーを登録
   * @param event イベント名
   * @param callback コールバック関数
   */
  const on = (event: string, callback: (data: any) => void) => {
    socketRef.current?.on(event, callback);
  };

  /**
   * イベントリスナーを削除
   * @param event イベント名
   * @param callback コールバック関数（オプション）
   */
  const off = (event: string, callback?: (data: any) => void) => {
    if (callback) {
      socketRef.current?.off(event, callback);
    } else {
      socketRef.current?.off(event);
    }
  };

  return {
    socket: socketRef.current,
    connected,
    joinRoom,
    sendMessage,
    shareState,
    on,
    off,
  };
}

/**
 * 特定のルーム用のSocket.IOフック
 * @param roomId ルームID
 */
export function useSocketRoom(roomId: string) {
  const { socket, connected, joinRoom, sendMessage, shareState, on, off } = useSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [roomMembers, setRoomMembers] = useState<string[]>([]);

  useEffect(() => {
    if (connected && roomId) {
      // ルームに参加
      joinRoom(roomId);

      // ルーム参加完了の確認
      const handleRoomJoined = (joinedRoomId: string) => {
        if (joinedRoomId === roomId) {
          console.log(`Room ${roomId} joined successfully`);
        }
      };

      // メッセージ受信
      const handleMessage = (data: { sender: string; message: any }) => {
        setMessages(prev => [...prev, { ...data, timestamp: Date.now() }]);
      };

      // 状態更新受信
      const handleStateUpdate = (data: { sender: string; state: any }) => {
        // 状態更新は個別のコンポーネントで処理することを想定
        console.log('State update received:', data);
      };

      // イベントリスナーを登録
      on('room:joined', handleRoomJoined);
      on('room:message', handleMessage);
      on('room:state', handleStateUpdate);

      // クリーンアップ
      return () => {
        off('room:joined', handleRoomJoined);
        off('room:message', handleMessage);
        off('room:state', handleStateUpdate);
      };
    }
  }, [connected, roomId, joinRoom, on, off]);

  /**
   * ルームにメッセージを送信
   * @param message メッセージ内容
   */
  const sendRoomMessage = (message: any) => {
    sendMessage(roomId, message);
  };

  /**
   * ルーム内で状態を共有
   * @param state 状態データ
   */
  const shareRoomState = (state: any) => {
    shareState(roomId, state);
  };

  return {
    connected,
    messages,
    roomMembers,
    sendMessage: sendRoomMessage,
    shareState: shareRoomState,
  };
}