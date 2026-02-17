import { useMemo } from "react";
import type { DayRecord, CyclePrediction } from "../types";

export function useCyclePrediction(sortedRecords: DayRecord[]) {
  const prediction = useMemo<CyclePrediction>(() => {
    // 생리 시작일(day === 1)인 기록들 찾기
    const periodStarts = sortedRecords.filter((rec) => rec.day === 1);

    if (periodStarts.length < 2) {
      return {
        averageCycleLength: 0,
        nextPeriodDate: null,
        daysUntilNextPeriod: null,
        cycleHistory: [],
        confidence: "low",
      };
    }

    // 주기 계산 (각 생리 시작 간격)
    // 간단한 구현: period의 days 합계를 기반으로 계산
    const cycles: number[] = [];
    
    for (let i = 1; i < periodStarts.length; i++) {
      // 실제 주기 일수 (대략적인 추정)
      // 더 정밀한 계산은 실제 날짜 데이터가 필요함
      const current = periodStarts[i];
      const previous = periodStarts[i - 1];
      
      // 같은 period 내에서는 day 차이, 다른 period면 추정
      if (current.periodId === previous.periodId) {
        cycles.push(current.day - previous.day);
      } else {
        // 다른 period인 경우, 이전 period의 마지막 day부터 현재까지
        // 간단히 28일로 추정 (기본 생리 주기)
        cycles.push(28);
      }
    }

    if (cycles.length === 0) {
      return {
        averageCycleLength: 28,
        nextPeriodDate: null,
        daysUntilNextPeriod: null,
        cycleHistory: [],
        confidence: "low",
      };
    }

    const averageCycleLength = Math.round(
      cycles.reduce((sum, c) => sum + c, 0) / cycles.length
    );

    // 가장 최근 생리 시작일 기준으로 다음 예상일 계산
    const lastPeriodStart = periodStarts[periodStarts.length - 1];
    const today = new Date();
    
    // 마지막 생리로부터 경과 일수 (day 값으로 추정)
    const daysSinceLastPeriod = lastPeriodStart.day > 1 ? lastPeriodStart.day - 1 : 0;
    const daysUntilNextPeriod = Math.max(0, averageCycleLength - daysSinceLastPeriod);
    
    const nextPeriodDate = new Date(today);
    nextPeriodDate.setDate(nextPeriodDate.getDate() + daysUntilNextPeriod);

    // 신뢰도 계산
    let confidence: "low" | "medium" | "high" = "low";
    if (cycles.length >= 6) {
      confidence = "high";
    } else if (cycles.length >= 3) {
      confidence = "medium";
    }

    return {
      averageCycleLength,
      nextPeriodDate,
      daysUntilNextPeriod,
      cycleHistory: cycles,
      confidence,
    };
  }, [sortedRecords]);

  return prediction;
}
