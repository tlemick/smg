import { useState, useCallback } from 'react';
import type { TradeOrderData, ExecutedTradeOrder } from '@/types';

/**
 * Hook for managing trade drawer state and step progression
 * 
 * Handles:
 * - Current step (1-5)
 * - Order data accumulation across steps
 * - Executed order details
 * - Step navigation
 * 
 * @returns Drawer state and control functions
 */
export function useTradeDrawer() {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [orderData, setOrderData] = useState<Partial<TradeOrderData>>({});
  const [executedOrder, setExecutedOrder] = useState<ExecutedTradeOrder | null>(null);

  const goToStep = useCallback((newStep: 1 | 2 | 3 | 4 | 5) => {
    setStep(newStep);
  }, []);

  const nextStep = useCallback(() => {
    setStep((prev) => Math.min(5, prev + 1) as 1 | 2 | 3 | 4 | 5);
  }, []);

  const previousStep = useCallback(() => {
    setStep((prev) => Math.max(1, prev - 1) as 1 | 2 | 3 | 4 | 5);
  }, []);

  const reset = useCallback(() => {
    setStep(1);
    setOrderData({});
    setExecutedOrder(null);
  }, []);

  const updateOrderData = useCallback((updates: Partial<TradeOrderData>) => {
    setOrderData((prev) => ({ ...prev, ...updates }));
  }, []);

  return {
    step,
    orderData,
    executedOrder,
    goToStep,
    nextStep,
    previousStep,
    reset,
    updateOrderData,
    setExecutedOrder,
  };
}
