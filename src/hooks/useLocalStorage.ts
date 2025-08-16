'use client';

import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // ローカルストレージから値を取得する関数
  const readValue = (): T => {
    // ブラウザ環境でのみ実行
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  };

  // 状態を保持
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // 初回マウント時とキー変更時にローカルストレージから値を読み込む
  useEffect(() => {
    setStoredValue(readValue());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // 値を設定する関数
  const setValue = (value: T) => {
    try {
      // 関数の場合は現在の値を引数として実行
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // 状態を更新
      setStoredValue(valueToStore);
      
      // ブラウザ環境でのみローカルストレージに保存
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}