export function generateTrackingNo(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  const todayKey = `tracking_counter_${dateStr}`;
  const counter = parseInt(localStorage.getItem(todayKey) || '0', 10) + 1;
  localStorage.setItem(todayKey, String(counter));
  
  const sequence = String(counter).padStart(4, '0');
  return `LAB-${dateStr}-${sequence}`;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
