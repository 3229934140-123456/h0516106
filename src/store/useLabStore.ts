import { create } from 'zustand';
import type {
  Sample, FlowLog, Experiment, ExperimentStep, Template, Report, ReportHistory, AbnormalResult, Notification, User, DashboardStats, ExperimentStage, Equipment, CalibrationRecord, ReportComment, SampleRetention, SampleDisposal } from '@/types';
import { getSamples, setSamples, getFlowLogs, setFlowLogs, getExperiments, setExperiments, getExperimentSteps, setExperimentSteps, getTemplates, setTemplates, getReports, setReports, getAbnormalResults, setAbnormalResults, getNotifications, setNotifications, getUsers, setUsers, getCurrentUser, setCurrentUser, isInitialized, markInitialized, getEquipments, setEquipments, getCalibrationRecords, setCalibrationRecords, getReportComments, setReportComments, getSampleRetentions, setSampleRetentions, getSampleDisposals, setSampleDisposals } from '@/utils/storage';
import { generateId, generateTrackingNo } from '@/utils/trackingNo';
import { getNowString, getTodayString } from '@/utils/dateFormat';
import { checkAbnormal, getSeverity, getAbnormalDescription } from '@/utils/validator';
import { mockSamples, mockTemplates, mockUsers, mockFlowLogs, mockExperiments, mockExperimentSteps, mockAbnormalResults, mockNotifications, mockReports, mockEquipments, mockCalibrationRecords, mockReportComments, mockSampleRetentions, mockSampleDisposals } from '@/data/mockData';

interface LabState {
  samples: Sample[];
  flowLogs: FlowLog[];
  experiments: Experiment[];
  experimentSteps: ExperimentStep[];
  templates: Template[];
  reports: Report[];
  abnormalResults: AbnormalResult[];
  notifications: Notification[];
  users: User[];
  currentUser: User | null;
  equipments: Equipment[];
  calibrationRecords: CalibrationRecord[];
  reportComments: ReportComment[];
  sampleRetentions: SampleRetention[];
  sampleDisposals: SampleDisposal[];
  loading: boolean;
  initialized: boolean;

  initializeData: () => Promise<void>;
  getDashboardStats: () => DashboardStats;

  addSample: (sample: Omit<Sample, 'id' | 'trackingNo' | 'status' | 'currentStage' | 'createdAt' | 'updatedAt'>) => Sample;
  updateSample: (id: string, updates: Partial<Sample>) => void;
  getSampleById: (id: string) => Sample | undefined;
  getSampleByTrackingNo: (trackingNo: string) => Sample | undefined;

  addFlowLog: (log: Omit<FlowLog, 'id' | 'operatedAt'>) => FlowLog;
  getFlowLogsBySampleId: (sampleId: string) => FlowLog[];
  updateSampleStage: (sampleId: string, toStage: ExperimentStage, operator: string, remark?: string) => void;

  addExperiment: (experiment: Omit<Experiment, 'id' | 'startedAt'>) => Experiment;
  addExperimentStep: (step: Omit<ExperimentStep, 'id'>) => ExperimentStep;
  updateExperimentStep: (id: string, updates: Partial<ExperimentStep>) => void;
  getExperimentById: (id: string) => Experiment | undefined;
  getExperimentsBySampleId: (sampleId: string) => Experiment[];
  getStepsByExperimentId: (experimentId: string) => ExperimentStep[];
  completeExperiment: (id: string) => void;

  addTemplate: (template: Omit<Template, 'id' | 'createdAt'>) => Template;
  updateTemplate: (id: string, updates: Partial<Template>) => void;
  deleteTemplate: (id: string) => void;
  getTemplateById: (id: string) => Template | undefined;

  addReport: (report: Omit<Report, 'id' | 'createdAt'>) => Report;
  updateReport: (id: string, updates: Partial<Report>) => void;
  getReportById: (id: string) => Report | undefined;
  getReportsBySampleId: (sampleId: string) => Report[];
  addReportHistory: (id: string, action: ReportHistory['action'], operator: string, remark?: string) => void;

  addReportComment: (reportId: string, authorId: string, authorName: string, content: string) => ReportComment;
  resolveReportComment: (commentId: string, resolvedBy: string, resolveRemark?: string) => void;
  getCommentsByReportId: (reportId: string) => ReportComment[];

  addAbnormalResult: (step: Omit<AbnormalResult, 'id' | 'createdAt'>) => AbnormalResult;
  handleAbnormalResult: (id: string, handledBy: string, handledRemark?: string) => void;
  resolveAbnormal: (experimentStepId: string) => void;
  getUnhandledAbnormalCount: () => number;

  addNotification: (notification: Omit<Notification, 'id' | 'sentAt'>) => Notification;
  markNotificationRead: (id: string) => void;
  getUnreadNotificationCount: () => number;

  getEquipmentById: (id: string) => Equipment | undefined;
  getEquipmentBySerialNo: (serialNo: string) => Equipment | undefined;
  getCalibrationRecordsByEquipmentId: (equipmentId: string) => CalibrationRecord[];
  getEquipmentsUsedBySample: (sampleId: string) => Equipment[];

  addSampleRetention: (retention: Omit<SampleRetention, 'id'>) => SampleRetention;
  updateSampleRetention: (id: string, updates: Partial<SampleRetention>) => void;
  getRetentionsBySampleId: (sampleId: string) => SampleRetention[];

  addSampleDisposal: (disposal: Omit<SampleDisposal, 'id'>) => SampleDisposal;
  getDisposalsBySampleId: (sampleId: string) => SampleDisposal[];

  checkAndCreateAbnormal: (stepId: string, result: string, templateStepId: string, sampleId: string) => void;
  createExperimentFromTemplate: (templateId: string, sampleId: string, title: string, operator: string) => { experiment: Experiment; steps: ExperimentStep[] };
}

export const useLabStore = create<LabState>((set, get) => ({
  samples: [],
  flowLogs: [],
  experiments: [],
  experimentSteps: [],
  templates: [],
  reports: [],
  abnormalResults: [],
  notifications: [],
  users: [],
  currentUser: null,
  equipments: [],
  calibrationRecords: [],
  reportComments: [],
  sampleRetentions: [],
  sampleDisposals: [],
  loading: false,
  initialized: false,

  initializeData: async () => {
    if (isInitialized()) {
      set({
        samples: getSamples(),
        flowLogs: getFlowLogs(),
        experiments: getExperiments(),
        experimentSteps: getExperimentSteps(),
        templates: getTemplates(),
        reports: getReports(),
        abnormalResults: getAbnormalResults(),
        notifications: getNotifications(),
        users: getUsers(),
        currentUser: getCurrentUser(),
        equipments: getEquipments(),
        calibrationRecords: getCalibrationRecords(),
        reportComments: getReportComments(),
        sampleRetentions: getSampleRetentions(),
        sampleDisposals: getSampleDisposals(),
        initialized: true,
      });
      return;
    }

    set({ loading: true });

    setSamples(mockSamples);
    setFlowLogs(mockFlowLogs);
    setExperiments(mockExperiments);
    setExperimentSteps(mockExperimentSteps);
    setTemplates(mockTemplates);
    setReports(mockReports);
    setAbnormalResults(mockAbnormalResults);
    setNotifications(mockNotifications);
    setUsers(mockUsers);
    setCurrentUser(mockUsers[1]);
    setEquipments(mockEquipments);
    setCalibrationRecords(mockCalibrationRecords);
    setReportComments(mockReportComments);
    setSampleRetentions(mockSampleRetentions);
    setSampleDisposals(mockSampleDisposals);

    markInitialized();

    set({
      samples: mockSamples,
      flowLogs: mockFlowLogs,
      experiments: mockExperiments,
      experimentSteps: mockExperimentSteps,
      templates: mockTemplates,
      reports: mockReports,
      abnormalResults: mockAbnormalResults,
      notifications: mockNotifications,
      users: mockUsers,
      currentUser: mockUsers[1],
      equipments: mockEquipments,
      calibrationRecords: mockCalibrationRecords,
      reportComments: mockReportComments,
      sampleRetentions: mockSampleRetentions,
      sampleDisposals: mockSampleDisposals,
      loading: false,
      initialized: true,
    });
  },

  getDashboardStats: () => {
    const { samples, reports, abnormalResults } = get();
    const today = getTodayString();

    return {
      totalSamples: samples.length,
      pendingSamples: samples.filter(s => s.status === 'pending').length,
      testingSamples: samples.filter(s => s.status === 'testing').length,
      completedSamples: samples.filter(s => s.status === 'completed').length,
      abnormalSamples: samples.filter(s => s.status === 'abnormal').length,
      todaysSamples: samples.filter(s => s.receivedDate === today).length,
      pendingReports: reports.filter(r => r.status === 'draft' || r.status === 'reviewing').length,
      unhandledExceptions: abnormalResults.filter(a => !a.handled).length,
    };
  },

  addSample: (sampleData) => {
    const existingTrackingNos = new Set(get().samples.map(s => s.trackingNo));
    const newSample: Sample = {
      ...sampleData,
      id: generateId(),
      trackingNo: generateTrackingNo(existingTrackingNos),
      status: 'pending',
      currentStage: 'received',
      createdAt: getNowString(),
      updatedAt: getNowString(),
    };
    const samples = [...get().samples, newSample];
    setSamples(samples);
    set({ samples });
    return newSample;
  },

  updateSample: (id, updates) => {
    const samples = get().samples.map(s =>
      s.id === id ? { ...s, ...updates, updatedAt: getNowString() } : s
    );
    setSamples(samples);
    set({ samples });
  },

  getSampleById: (id) => get().samples.find(s => s.id === id),

  getSampleByTrackingNo: (trackingNo) => get().samples.find(s => s.trackingNo === trackingNo),

  addFlowLog: (logData) => {
    const newLog: FlowLog = {
      ...logData,
      id: generateId(),
      operatedAt: getNowString(),
    };
    const flowLogs = [...get().flowLogs, newLog];
    setFlowLogs(flowLogs);
    set({ flowLogs });
    return newLog;
  },

  getFlowLogsBySampleId: (sampleId) =>
    get().flowLogs.filter(l => l.sampleId === sampleId).sort((a, b) =>
      new Date(a.operatedAt).getTime() - new Date(b.operatedAt).getTime()
    ),

  updateSampleStage: (sampleId, toStage, operator, remark = '') => {
    const sample = get().getSampleById(sampleId);
    if (!sample) return;

    if (sample.currentStage !== toStage) {
      get().addFlowLog({
        sampleId,
        fromStage: sample.currentStage,
        toStage,
        operator,
        remark,
      });
    }

    let status = sample.status;
    if (toStage === 'completed') {
      status = 'completed';
    } else if (toStage === 'testing' || toStage === 'preparation') {
      status = 'testing';
    }

    get().updateSample(sampleId, { currentStage: toStage, status });
  },

  addExperiment: (expData) => {
    const newExp: Experiment = {
      ...expData,
      id: generateId(),
      startedAt: getNowString(),
    };
    const experiments = [...get().experiments, newExp];
    setExperiments(experiments);
    set({ experiments });
    return newExp;
  },

  addExperimentStep: (stepData) => {
    const newStep: ExperimentStep = {
      ...stepData,
      id: generateId(),
    };
    const steps = [...get().experimentSteps, newStep];
    setExperimentSteps(steps);
    set({ experimentSteps: steps });
    return newStep;
  },

  updateExperimentStep: (id, updates) => {
    const steps = get().experimentSteps.map(s =>
      s.id === id ? { ...s, ...updates } : s
    );
    setExperimentSteps(steps);
    set({ experimentSteps: steps });
  },

  getExperimentById: (id) => get().experiments.find(e => e.id === id),

  getExperimentsBySampleId: (sampleId) =>
    get().experiments.filter(e => e.sampleId === sampleId),

  getStepsByExperimentId: (experimentId) =>
    get().experimentSteps
      .filter(s => s.experimentId === experimentId)
      .sort((a, b) => a.stepOrder - b.stepOrder),

  completeExperiment: (id) => {
    const experiments = get().experiments.map(e =>
      e.id === id ? { ...e, status: 'completed' as const, completedAt: getNowString() } : e
    );
    setExperiments(experiments);
    set({ experiments });
  },

  addTemplate: (templateData) => {
    const newTemplate: Template = {
      ...templateData,
      id: generateId(),
      createdAt: getNowString(),
    };
    const templates = [...get().templates, newTemplate];
    setTemplates(templates);
    set({ templates });
    return newTemplate;
  },

  updateTemplate: (id, updates) => {
    const templates = get().templates.map(t =>
      t.id === id ? { ...t, ...updates } : t
    );
    setTemplates(templates);
    set({ templates });
  },

  deleteTemplate: (id) => {
    const templates = get().templates.filter(t => t.id !== id);
    setTemplates(templates);
    set({ templates });
  },

  getTemplateById: (id) => get().templates.find(t => t.id === id),

  addReport: (reportData) => {
    const newReport: Report = {
      ...reportData,
      id: generateId(),
      createdAt: getNowString(),
      history: reportData.history ?? [{
        id: generateId(),
        action: 'save',
        operator: reportData.createdBy || '系统',
        operatedAt: getNowString(),
      }],
    };
    const reports = [...get().reports, newReport];
    setReports(reports);
    set({ reports });
    return newReport;
  },

  addReportHistory: (id, action, operator, remark) => {
    const reports = get().reports.map(r => {
      if (r.id !== id) return r;
      return {
        ...r,
        history: [...r.history, {
          id: generateId(),
          action,
          operator,
          operatedAt: getNowString(),
          remark,
        }],
      };
    });
    setReports(reports);
    set({ reports });
  },

  addReportComment: (reportId, authorId, authorName, content) => {
    const newComment: ReportComment = {
      id: generateId(),
      reportId,
      authorId,
      authorName,
      content,
      resolved: false,
      createdAt: getNowString(),
    };
    const reportComments = [...get().reportComments, newComment];
    setReportComments(reportComments);
    set({ reportComments });
    return newComment;
  },

  resolveReportComment: (commentId, resolvedBy, resolveRemark) => {
    const reportComments = get().reportComments.map(c =>
      c.id === commentId ? {
        ...c,
        resolved: true,
        resolvedBy,
        resolvedAt: getNowString(),
        resolveRemark,
      } : c
    );
    setReportComments(reportComments);
    set({ reportComments });
  },

  getCommentsByReportId: (reportId) =>
    get().reportComments.filter(c => c.reportId === reportId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),

  updateReport: (id, updates) => {
    const reports = get().reports.map(r =>
      r.id === id ? { ...r, ...updates } : r
    );
    setReports(reports);
    set({ reports });
  },

  getReportById: (id) => get().reports.find(r => r.id === id),

  getReportsBySampleId: (sampleId) =>
    get().reports.filter(r => r.sampleId === sampleId),

  addAbnormalResult: (abnData) => {
    const existing = get().abnormalResults.find(
      a => a.experimentStepId === abnData.experimentStepId && !a.resolved
    );
    if (existing) {
      const abnormalResults = get().abnormalResults.map(a =>
        a.id === existing.id ? {
          ...a,
          description: abnData.description,
          severity: abnData.severity,
          updatedAt: getNowString(),
        } : a
      );
      setAbnormalResults(abnormalResults);
      set({ abnormalResults });
      return { ...existing, description: abnData.description, severity: abnData.severity };
    }

    const step = get().experimentSteps.find(s => s.id === abnData.experimentStepId);
    const newAbn: AbnormalResult = {
      ...abnData,
      id: generateId(),
      experimentId: step?.experimentId || abnData.experimentId || '',
      resolved: false,
      createdAt: getNowString(),
    };
    const abnormalResults = [...get().abnormalResults, newAbn];
    setAbnormalResults(abnormalResults);
    set({ abnormalResults });

    const managers = get().users.filter(u => u.role === 'manager');
    managers.forEach(manager => {
      get().addNotification({
        abnormalResultId: newAbn.id,
        recipient: manager.realName,
        content: `样品检测发现异常：${newAbn.description}`,
        status: 'sent',
      });
    });

    return newAbn;
  },

  resolveAbnormal: (experimentStepId) => {
    const abnormalResults = get().abnormalResults.map(a =>
      a.experimentStepId === experimentStepId && !a.resolved
        ? { ...a, resolved: true, resolvedAt: getNowString() }
        : a
    );
    setAbnormalResults(abnormalResults);
    set({ abnormalResults });

    const sampleIds = new Set(
      abnormalResults
        .filter(a => a.experimentStepId === experimentStepId)
        .map(a => a.sampleId)
    );

    sampleIds.forEach(sid => {
      const sampleAbnormals = abnormalResults.filter(a => a.sampleId === sid && !a.resolved);
      if (sampleAbnormals.length === 0) {
        const sample = get().getSampleById(sid);
        if (sample && sample.status === 'abnormal') {
          get().updateSample(sid, { status: 'testing' });
        }
      }
    });
  },

  handleAbnormalResult: (id, handledBy, handledRemark) => {
    const abnormalResults = get().abnormalResults.map(a =>
      a.id === id ? {
        ...a,
        handled: true,
        handledBy,
        handledRemark,
        handledAt: getNowString(),
      } : a
    );
    setAbnormalResults(abnormalResults);
    set({ abnormalResults });

    const allHandled = abnormalResults.filter(a => !a.handled).length === 0;
    if (allHandled) {
      const abn = get().abnormalResults.find(a => a.id === id);
      if (abn) {
        const sample = get().getSampleById(abn.sampleId);
        if (sample && sample.status === 'abnormal') {
          get().updateSample(sample.id, { status: 'testing' });
        }
      }
    }
  },

  getUnhandledAbnormalCount: () =>
    get().abnormalResults.filter(a => !a.handled).length,

  addNotification: (notifData) => {
    const newNotif: Notification = {
      ...notifData,
      id: generateId(),
      sentAt: getNowString(),
    };
    const notifications = [...get().notifications, newNotif];
    setNotifications(notifications);
    set({ notifications });
    return newNotif;
  },

  markNotificationRead: (id) => {
    const notifications = get().notifications.map(n =>
      n.id === id ? { ...n, status: 'read' as const } : n
    );
    setNotifications(notifications);
    set({ notifications });
  },

  getUnreadNotificationCount: () =>
    get().notifications.filter(n => n.status === 'sent').length,

  getEquipmentById: (id) => get().equipments.find(e => e.id === id),

  getEquipmentBySerialNo: (serialNo) => get().equipments.find(e => e.serialNo === serialNo),

  getCalibrationRecordsByEquipmentId: (equipmentId) =>
    get().calibrationRecords.filter(r => r.equipmentId === equipmentId).sort(
      (a, b) => new Date(b.calibratedAt).getTime() - new Date(a.calibratedAt).getTime()
    ),

  getEquipmentsUsedBySample: (sampleId) => {
    const experiments = get().getExperimentsBySampleId(sampleId);
    const experimentIds = experiments.map(e => e.id);
    const steps = get().experimentSteps.filter(s => experimentIds.includes(s.experimentId) && s.instrumentNo);
    const serialNos = new Set(steps.map(s => s.instrumentNo));
    return get().equipments.filter(e => serialNos.has(e.serialNo));
  },

  addSampleRetention: (retentionData) => {
    const newRetention: SampleRetention = {
      ...retentionData,
      id: generateId(),
    };
    const sampleRetentions = [...get().sampleRetentions, newRetention];
    setSampleRetentions(sampleRetentions);
    set({ sampleRetentions });

    const sample = get().getSampleById(retentionData.sampleId);
    if (sample && sample.status !== 'retained') {
      get().updateSample(retentionData.sampleId, { status: 'retained' });
    }

    return newRetention;
  },

  updateSampleRetention: (id, updates) => {
    const sampleRetentions = get().sampleRetentions.map(r =>
      r.id === id ? { ...r, ...updates } : r
    );
    setSampleRetentions(sampleRetentions);
    set({ sampleRetentions });
  },

  getRetentionsBySampleId: (sampleId) =>
    get().sampleRetentions.filter(r => r.sampleId === sampleId).sort(
      (a, b) => new Date(b.retentionDate).getTime() - new Date(a.retentionDate).getTime()
    ),

  addSampleDisposal: (disposalData) => {
    const newDisposal: SampleDisposal = {
      ...disposalData,
      id: generateId(),
    };
    const sampleDisposals = [...get().sampleDisposals, newDisposal];
    setSampleDisposals(sampleDisposals);
    set({ sampleDisposals });

    const sample = get().getSampleById(disposalData.sampleId);
    if (sample && sample.status !== 'destroyed') {
      get().updateSample(disposalData.sampleId, { status: 'destroyed' });
    }

    if (disposalData.retentionId) {
      get().updateSampleRetention(disposalData.retentionId, { status: 'destroyed' });
    }

    return newDisposal;
  },

  getDisposalsBySampleId: (sampleId) =>
    get().sampleDisposals.filter(d => d.sampleId === sampleId).sort(
      (a, b) => new Date(b.disposalDate).getTime() - new Date(a.disposalDate).getTime()
    ),

  checkAndCreateAbnormal: (stepId, result, templateStepId, sampleId) => {
    const step = get().experimentSteps.find(s => s.id === stepId);
    const template = get().templates.find(t =>
      t.steps.some(ts => ts.id === templateStepId)
    );
    const templateStep = template?.steps.find(ts => ts.id === templateStepId);

    if (!step || !templateStep) return;

    const isAbnormal = checkAbnormal(result, templateStep);

    get().updateExperimentStep(stepId, { result, isAbnormal });

    if (isAbnormal) {
      const severity = getSeverity(result, templateStep);
      const description = getAbnormalDescription(result, templateStep);

      get().addAbnormalResult({
        experimentStepId: stepId,
        experimentId: step.experimentId,
        sampleId,
        description,
        severity,
        handled: false,
        resolved: false,
      });

      const sample = get().getSampleById(sampleId);
      if (sample && sample.status !== 'abnormal') {
        get().updateSample(sampleId, { status: 'abnormal' });
      }
    } else {
      get().resolveAbnormal(stepId);
    }
  },

  createExperimentFromTemplate: (templateId, sampleId, title, operator) => {
    const template = get().getTemplateById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const experiment = get().addExperiment({
      sampleId,
      templateId,
      title,
      operator,
      status: 'in_progress',
    });

    const steps: ExperimentStep[] = template.steps.map(ts => ({
      id: generateId(),
      experimentId: experiment.id,
      stepOrder: ts.stepOrder,
      name: ts.name,
      description: ts.description,
      instrumentNo: '',
      parameters: {},
      observation: '',
      result: '',
      isAbnormal: false,
      completed: false,
    }));

    setExperimentSteps([...get().experimentSteps, ...steps]);
    set({ experimentSteps: [...get().experimentSteps, ...steps] });

    return { experiment, steps };
  },
}));
