import { useEffect, useRef } from "react";
import type { ScanCardItem } from "../components/dashboard/dashboard-helpers";

type UseNotificationsParams = {
  items: ScanCardItem[];
  favoriteSymbols: string[];
  notificationsEnabled: boolean;
  notificationPermission: NotificationPermission | "unsupported";
  scoreAlertThreshold: number;
  favoriteDropThreshold: number;
};

export function useNotifications({
  items,
  favoriteSymbols,
  notificationsEnabled,
  notificationPermission,
  scoreAlertThreshold,
  favoriteDropThreshold,
}: UseNotificationsParams) {
  const notificationSentKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const activeKeys = new Set<string>();

    items.forEach((item) => {
      const isHighScore = item.snapshot.score >= scoreAlertThreshold;
      const isFavoriteDrop =
        favoriteSymbols.includes(item.symbol) &&
        (item.snapshot.changePercent24h ?? 0) <= favoriteDropThreshold;
      const isSpikeCandidate =
        item.spikeClassification === "breakout" ||
        item.spikeClassification === "momentum";

      if (isHighScore) {
        activeKeys.add(`${item.symbol}-${item.timeframe}-score`);
      }

      if (isFavoriteDrop) {
        activeKeys.add(`${item.symbol}-${item.timeframe}-drop`);
      }

      if (isSpikeCandidate) {
        activeKeys.add(`${item.symbol}-${item.timeframe}-spike`);
      }
    });

    const sentKeys = notificationSentKeysRef.current;
    Array.from(sentKeys).forEach((key) => {
      if (!activeKeys.has(key)) {
        sentKeys.delete(key);
      }
    });
  }, [items, scoreAlertThreshold, favoriteDropThreshold, favoriteSymbols]);

  useEffect(() => {
    if (!notificationsEnabled) return;
    if (notificationPermission !== "granted") return;

    const candidates = items.filter((item) => {
      const isHighScore = item.snapshot.score >= scoreAlertThreshold;
      const isFavoriteDrop =
        favoriteSymbols.includes(item.symbol) &&
        (item.snapshot.changePercent24h ?? 0) <= favoriteDropThreshold;
      const isSpikeCandidate =
        item.spikeClassification === "breakout" ||
        item.spikeClassification === "momentum";

      return isHighScore || isFavoriteDrop || isSpikeCandidate;
    });

    candidates.forEach((item) => {
      const isHighScore = item.snapshot.score >= scoreAlertThreshold;
      const isFavoriteDrop =
        favoriteSymbols.includes(item.symbol) &&
        (item.snapshot.changePercent24h ?? 0) <= favoriteDropThreshold;

      const notificationKey = `${item.symbol}-${item.timeframe}-${
        isHighScore ? "score" : isFavoriteDrop ? "drop" : "spike"
      }`;

      if (notificationSentKeysRef.current.has(notificationKey)) return;

      const changeLabel =
        item.snapshot.changePercent24h == null
          ? "-"
          : `${item.snapshot.changePercent24h >= 0 ? "+" : ""}${item.snapshot.changePercent24h.toFixed(2)}%`;

      const body = isHighScore
        ? `${item.symbol} score ${item.snapshot.score} oldu. ${item.headline}`
        : isFavoriteDrop
          ? `${item.symbol} favorilerde ve 24s değişim ${changeLabel}. Zararı büyütmeden kontrol et.`
          : `${item.symbol} için ${item.spikeLabel} tespit edildi. 24s değişim ${changeLabel}. ${item.headline}`;

      new Notification(`${item.symbol} uyarısı`, {
        body,
      });

      notificationSentKeysRef.current.add(notificationKey);
    });
  }, [
    items,
    notificationsEnabled,
    notificationPermission,
    scoreAlertThreshold,
    favoriteDropThreshold,
    favoriteSymbols,
  ]);
}
