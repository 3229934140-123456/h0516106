import type { TemplateStep } from '@/types';

export function checkAbnormal(result: string, step: TemplateStep): boolean {
  if (step.referenceMin === undefined && step.referenceMax === undefined) {
    return false;
  }
  
  const numResult = parseFloat(result);
  if (isNaN(numResult)) {
    return false;
  }
  
  if (step.referenceMin !== undefined && numResult < step.referenceMin) {
    return true;
  }
  if (step.referenceMax !== undefined && numResult > step.referenceMax) {
    return true;
  }
  
  return false;
}

export function getSeverity(result: string, step: TemplateStep): 'low' | 'medium' | 'high' | 'critical' {
  const numResult = parseFloat(result);
  if (isNaN(numResult)) return 'low';
  
  const min = step.referenceMin ?? -Infinity;
  const max = step.referenceMax ?? Infinity;
  const range = max - min;
  
  if (range === Infinity || range === 0) return 'low';
  
  const deviation = numResult < min ? min - numResult : numResult - max;
  const deviationPercent = (deviation / range) * 100;
  
  if (deviationPercent > 50) return 'critical';
  if (deviationPercent > 20) return 'high';
  if (deviationPercent > 10) return 'medium';
  return 'low';
}

export function getAbnormalDescription(result: string, step: TemplateStep): string {
  const numResult = parseFloat(result);
  const min = step.referenceMin;
  const max = step.referenceMax;
  
  if (min !== undefined && numResult < min) {
    return `${step.name}结果偏低: ${result}${step.unit || ''} (参考范围: ${min}-${max}${step.unit || ''})`;
  }
  if (max !== undefined && numResult > max) {
    return `${step.name}结果偏高: ${result}${step.unit || ''} (参考范围: ${min}-${max}${step.unit || ''})`;
  }
  return `${step.name}结果异常: ${result}${step.unit || ''}`;
}
