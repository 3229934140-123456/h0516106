import type { Sample, FlowLog, Experiment, ExperimentStep, Template, Report, AbnormalResult, Notification, User, Equipment, CalibrationRecord, ReportComment, SampleRetention, SampleDisposal } from '@/types';

const STORAGE_KEYS = {
  SAMPLES: 'lab_samples',
  FLOW_LOGS: 'lab_flow_logs',
  EXPERIMENTS: 'lab_experiments',
  EXPERIMENT_STEPS: 'lab_experiment_steps',
  TEMPLATES: 'lab_templates',
  REPORTS: 'lab_reports',
  ABNORMAL_RESULTS: 'lab_abnormal_results',
  NOTIFICATIONS: 'lab_notifications',
  USERS: 'lab_users',
  CURRENT_USER: 'lab_current_user',
  INITIALIZED: 'lab_initialized',
  EQUIPMENTS: 'lab_equipments',
  CALIBRATION_RECORDS: 'lab_calibration_records',
  REPORT_COMMENTS: 'lab_report_comments',
  SAMPLE_RETENTIONS: 'lab_sample_retentions',
  SAMPLE_DISPOSALS: 'lab_sample_disposals',
};

export function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setToStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getSamples(): Sample[] {
  return getFromStorage<Sample[]>(STORAGE_KEYS.SAMPLES, []);
}

export function setSamples(samples: Sample[]): void {
  setToStorage(STORAGE_KEYS.SAMPLES, samples);
}

export function getFlowLogs(): FlowLog[] {
  return getFromStorage<FlowLog[]>(STORAGE_KEYS.FLOW_LOGS, []);
}

export function setFlowLogs(logs: FlowLog[]): void {
  setToStorage(STORAGE_KEYS.FLOW_LOGS, logs);
}

export function getExperiments(): Experiment[] {
  return getFromStorage<Experiment[]>(STORAGE_KEYS.EXPERIMENTS, []);
}

export function setExperiments(experiments: Experiment[]): void {
  setToStorage(STORAGE_KEYS.EXPERIMENTS, experiments);
}

export function getExperimentSteps(): ExperimentStep[] {
  return getFromStorage<ExperimentStep[]>(STORAGE_KEYS.EXPERIMENT_STEPS, []);
}

export function setExperimentSteps(steps: ExperimentStep[]): void {
  setToStorage(STORAGE_KEYS.EXPERIMENT_STEPS, steps);
}

export function getTemplates(): Template[] {
  return getFromStorage<Template[]>(STORAGE_KEYS.TEMPLATES, []);
}

export function setTemplates(templates: Template[]): void {
  setToStorage(STORAGE_KEYS.TEMPLATES, templates);
}

export function getReports(): Report[] {
  return getFromStorage<Report[]>(STORAGE_KEYS.REPORTS, []);
}

export function setReports(reports: Report[]): void {
  setToStorage(STORAGE_KEYS.REPORTS, reports);
}

export function getAbnormalResults(): AbnormalResult[] {
  return getFromStorage<AbnormalResult[]>(STORAGE_KEYS.ABNORMAL_RESULTS, []);
}

export function setAbnormalResults(results: AbnormalResult[]): void {
  setToStorage(STORAGE_KEYS.ABNORMAL_RESULTS, results);
}

export function getNotifications(): Notification[] {
  return getFromStorage<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
}

export function setNotifications(notifications: Notification[]): void {
  setToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
}

export function getUsers(): User[] {
  return getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
}

export function setUsers(users: User[]): void {
  setToStorage(STORAGE_KEYS.USERS, users);
}

export function getCurrentUser(): User | null {
  return getFromStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null);
}

export function setCurrentUser(user: User | null): void {
  setToStorage(STORAGE_KEYS.CURRENT_USER, user);
}

export function isInitialized(): boolean {
  return getFromStorage<boolean>(STORAGE_KEYS.INITIALIZED, false);
}

export function markInitialized(): void {
  setToStorage(STORAGE_KEYS.INITIALIZED, true);
}

export function getEquipments(): Equipment[] {
  return getFromStorage<Equipment[]>(STORAGE_KEYS.EQUIPMENTS, []);
}

export function setEquipments(equipments: Equipment[]): void {
  setToStorage(STORAGE_KEYS.EQUIPMENTS, equipments);
}

export function getCalibrationRecords(): CalibrationRecord[] {
  return getFromStorage<CalibrationRecord[]>(STORAGE_KEYS.CALIBRATION_RECORDS, []);
}

export function setCalibrationRecords(records: CalibrationRecord[]): void {
  setToStorage(STORAGE_KEYS.CALIBRATION_RECORDS, records);
}

export function getReportComments(): ReportComment[] {
  return getFromStorage<ReportComment[]>(STORAGE_KEYS.REPORT_COMMENTS, []);
}

export function setReportComments(comments: ReportComment[]): void {
  setToStorage(STORAGE_KEYS.REPORT_COMMENTS, comments);
}

export function getSampleRetentions(): SampleRetention[] {
  return getFromStorage<SampleRetention[]>(STORAGE_KEYS.SAMPLE_RETENTIONS, []);
}

export function setSampleRetentions(retentions: SampleRetention[]): void {
  setToStorage(STORAGE_KEYS.SAMPLE_RETENTIONS, retentions);
}

export function getSampleDisposals(): SampleDisposal[] {
  return getFromStorage<SampleDisposal[]>(STORAGE_KEYS.SAMPLE_DISPOSALS, []);
}

export function setSampleDisposals(disposals: SampleDisposal[]): void {
  setToStorage(STORAGE_KEYS.SAMPLE_DISPOSALS, disposals);
}

export { STORAGE_KEYS };
