export type SampleStatus = 'pending' | 'testing' | 'completed' | 'abnormal' | 'archived';
export type ExperimentStage = 'received' | 'preparation' | 'testing' | 'analysis' | 'review' | 'completed';
export type UserRole = 'admin' | 'operator' | 'manager' | 'client';
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
export type ExperimentStatus = 'draft' | 'in_progress' | 'completed';
export type ReportStatus = 'draft' | 'reviewing' | 'approved' | 'rejected';
export type NotificationStatus = 'pending' | 'sent' | 'read';

export interface Sample {
  id: string;
  trackingNo: string;
  name: string;
  type: string;
  source: string;
  client: string;
  receivedDate: string;
  quantity: number;
  description: string;
  status: SampleStatus;
  currentStage: ExperimentStage;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FlowLog {
  id: string;
  sampleId: string;
  fromStage: ExperimentStage;
  toStage: ExperimentStage;
  operator: string;
  remark: string;
  operatedAt: string;
}

export interface Experiment {
  id: string;
  sampleId: string;
  templateId: string;
  title: string;
  operator: string;
  status: ExperimentStatus;
  startedAt: string;
  completedAt?: string;
}

export interface ExperimentStep {
  id: string;
  experimentId: string;
  stepOrder: number;
  name: string;
  description: string;
  instrumentNo: string;
  parameters: Record<string, string>;
  observation: string;
  result: string;
  isAbnormal: boolean;
  completed: boolean;
  completedAt?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: TemplateStep[];
  isActive: boolean;
  createdAt: string;
}

export interface TemplateStep {
  id: string;
  stepOrder: number;
  name: string;
  description: string;
  referenceMin?: number;
  referenceMax?: number;
  unit?: string;
  requiredInstrument: boolean;
  isRequired: boolean;
}

export interface Report {
  id: string;
  experimentId: string;
  sampleId: string;
  title: string;
  content: string;
  status: ReportStatus;
  createdBy: string;
  approvedBy?: string;
  hasElectronicSeal: boolean;
  createdAt: string;
  approvedAt?: string;
  history: ReportHistory[];
}

export interface AbnormalResult {
  id: string;
  experimentStepId: string;
  experimentId: string;
  sampleId: string;
  description: string;
  severity: SeverityLevel;
  handled: boolean;
  handledBy?: string;
  handledRemark?: string;
  handledAt?: string;
  resolved: boolean;
  resolvedAt?: string;
  createdAt: string;
}

export interface ReportHistory {
  id: string;
  action: 'save' | 'submit' | 'reject' | 'approve' | 'seal' | 'edit';
  operator: string;
  operatedAt: string;
  remark?: string;
}

export interface Notification {
  id: string;
  abnormalResultId: string;
  recipient: string;
  content: string;
  status: NotificationStatus;
  sentAt: string;
}

export interface User {
  id: string;
  username: string;
  realName: string;
  role: UserRole;
  email: string;
  phone: string;
  isActive: boolean;
}

export interface DashboardStats {
  totalSamples: number;
  pendingSamples: number;
  testingSamples: number;
  completedSamples: number;
  abnormalSamples: number;
  todaysSamples: number;
  pendingReports: number;
  unhandledExceptions: number;
}

export interface StageInfo {
  key: ExperimentStage;
  label: string;
  icon: string;
}

export const STAGES: StageInfo[] = [
  { key: 'received', label: '样品接收', icon: 'Package' },
  { key: 'preparation', label: '样品制备', icon: 'FlaskConical' },
  { key: 'testing', label: '实验检测', icon: 'Microscope' },
  { key: 'analysis', label: '数据分析', icon: 'BarChart3' },
  { key: 'review', label: '报告审核', icon: 'FileCheck' },
  { key: 'completed', label: '完成归档', icon: 'Archive' },
];

export const SAMPLE_STATUS_LABELS: Record<SampleStatus, string> = {
  pending: '待检测',
  testing: '检测中',
  completed: '已完成',
  abnormal: '异常',
  archived: '已归档',
};

export const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  low: '轻微',
  medium: '中等',
  high: '严重',
  critical: '紧急',
};
