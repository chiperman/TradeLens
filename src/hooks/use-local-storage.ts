import { useState } from "react";

/**
 * 带有 LocalStorage 持久化的 Hook
 * 使用延迟初始化方案以避免 React 级联渲染警告
 * @param key 存储键名
 * @param initialValue 初始默认值
 * @returns [value, setValue]
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error("读取 localStorage 失败:", error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error("写入 localStorage 失败:", error);
    }
  };

  return [storedValue, setValue];
}
