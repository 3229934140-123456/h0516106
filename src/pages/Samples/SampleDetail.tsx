import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FlaskConical, Calendar, User, Building, FileText, QrCode, Edit3, Play, Printer, AlertTriangle, CheckCircle, RotateCcw, Activity, CalendarClock, Trash2, Archive } from 'lucide-react';
import { useLabStore } from '@/store/useLabStore';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDateTime } from '@/utils/dateFormat';
import { QRCodePrint } from '@/components/common/QRCodePrint';
import { useToast } from '@/components/common/Toast';
import type { FlowLog, Experiment, AbnormalResult, Equipment, SampleRetention, SampleDisposal } from '@/types';
import { STAGES, RETENTION_STATUS_LABELS } from '@/types';

const SampleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    getSampleById,
    getFlowLogsBySampleId,
    getExperimentsBySampleId,
    getReportsBySampleId,
    templates,
    getEquipmentsUsedBySample,
    getRetentionsBySampleId,
    getDisposalsBySampleId,
    addSampleRetention,
    addSampleDisposal,
    currentUser,
  } = useLabStore();

  const [showPrint, setShowPrint] = useState(false);
  const [showRetentionModal, setShowRetentionModal] = useState(false);
  const [showDisposalModal, setShowDisposalModal] = useState(false);
  const [retentionForm, setRetentionForm] = useState({
    location: '',
    container: '',
    quantity: '',
    expiryDate: '',
    remark: '',
  });
  const [disposalForm, setDisposalForm] = useState({
    disposalMethod: '',
    witness: '',
    remark: '',
    retentionId: '',
  });

  const sample = id ? getSampleById(id) : undefined;
  const flowLogs = id ? getFlowLogsBySampleId(id) : [];
  const experiments = id ? getExperimentsBySampleId(id) : [];
  const reports = id ? getReportsBySampleId(id) : [];
  const usedEquipments = id ? getEquipmentsUsedBySample(id) : [];
  const retentions = id ? getRetentionsBySampleId(id) : [];
  const disposals = id ? getDisposalsBySampleId(id) : [];
  const abnormalResults = useLabStore((state) =>
    state.abnormalResults.filter((a: AbnormalResult) => a.sampleId === id)
  );

  if (!sample) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FlaskConical size={64} className="text-neutral-300 mb-4" />
        <p className="text-neutral-500 mb-4">样品不存在</p>
        <button
          onClick={() => navigate('/samples')}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          返回列表
        </button>
      </div>
    );
  }

  const getCurrentStageIndex = () => {
    return STAGES.findIndex(s => s.key === sample.currentStage);
  };

  const handleStartExperiment = () => {
    if (templates.length === 0) {
      showToast('请先创建实验流程模板', 'warning');
      return;
    }
    navigate('/experiments/new', { state: { sampleId: sample.id, sampleName: sample.name } });
  };

  const getStageIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      Package: <span className="text-lg">📦</span>,
      FlaskConical: <span className="text-lg">🧪</span>,
      Microscope: <span className="text-lg">🔬</span>,
      BarChart3: <span className="text-lg">📊</span>,
      FileCheck: <span className="text-lg">✅</span>,
      Archive: <span className="text-lg">📁</span>,
    };
    return icons[iconName] || <span className="text-lg">📋</span>;
  };

  const handleRetentionSubmit = () => {
    if (!id || !sample || !currentUser) return;
    if (!retentionForm.location || !retentionForm.expiryDate) {
      showToast('请填写留样位置和到期日期', 'warning');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    addSampleRetention({
      sampleId: id,
      location: retentionForm.location,
      container: retentionForm.container,
      quantity: retentionForm.quantity,
      retentionDate: today,
      expiryDate: retentionForm.expiryDate,
      status: 'active',
      handler: currentUser.realName,
      remark: retentionForm.remark,
    });

    showToast('留样登记成功', 'success');
    setShowRetentionModal(false);
    setRetentionForm({ location: '', container: '', quantity: '', expiryDate: '', remark: '' });
  };

  const handleDisposalSubmit = () => {
    if (!id || !sample || !currentUser) return;
    if (!disposalForm.disposalMethod) {
      showToast('请填写销毁方式', 'warning');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    addSampleDisposal({
      sampleId: id,
      retentionId: disposalForm.retentionId || undefined,
      disposalDate: today,
      disposalMethod: disposalForm.disposalMethod,
      handler: currentUser.realName,
      witness: disposalForm.witness || undefined,
      remark: disposalForm.remark,
    });

    showToast('销毁登记成功', 'success');
    setShowDisposalModal(false);
    setDisposalForm({ disposalMethod: '', witness: '', remark: '', retentionId: '' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/samples')}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-neutral-600" />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-neutral-800">{sample.name}</h1>
              <StatusBadge status={sample.status} type="sample" />
            </div>
            <p className="text-neutral-500 mt-1 font-mono">{sample.trackingNo}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowPrint(true)}
            className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium flex items-center space-x-2"
          >
            <QrCode size={16} />
            <span>打印标签</span>
          </button>
          <button
            onClick={handleStartExperiment}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium flex items-center space-x-2 shadow-lg shadow-primary-500/20"
          >
            <Play size={16} />
            <span>开始实验</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold text-neutral-800 mb-4">样品信息</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FlaskConical size={18} className="text-primary-500" />
                </div>
                <div>
                  <p className="text-sm text-neutral-500">样品类型</p>
                  <p className="text-neutral-800 font-medium">{sample.type}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building size={18} className="text-primary-500" />
                </div>
                <div>
                  <p className="text-sm text-neutral-500">样品来源</p>
                  <p className="text-neutral-800 font-medium">{sample.source}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User size={18} className="text-primary-500" />
                </div>
                <div>
                  <p className="text-sm text-neutral-500">委托方</p>
                  <p className="text-neutral-800 font-medium">{sample.client}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar size={18} className="text-primary-500" />
                </div>
                <div>
                  <p className="text-sm text-neutral-500">接收日期</p>
                  <p className="text-neutral-800 font-medium">{sample.receivedDate}</p>
                </div>
              </div>
            </div>
            {sample.description && (
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <p className="text-sm text-neutral-500 mb-1">样品描述</p>
                <p className="text-neutral-700">{sample.description}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold text-neutral-800 mb-4">流转进度</h2>
            <div className="relative">
              {STAGES.map((stage, index) => {
                const isCurrent = stage.key === sample.currentStage;
                const isPast = index < getCurrentStageIndex();
                const stageFlow = flowLogs.find(l => l.toStage === stage.key);

                return (
                  <div key={stage.key} className="relative pb-8 last:pb-0">
                    {index < STAGES.length - 1 && (
                      <div
                        className={`absolute left-5 top-10 w-0.5 h-full ${
                          isPast ? 'bg-success-500' : 'bg-neutral-200'
                        }`}
                      />
                    )}
                    <div className="flex items-start space-x-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          isCurrent
                            ? 'bg-primary-500 text-white ring-4 ring-primary-100 shadow-lg shadow-primary-500/30'
                            : isPast
                            ? 'bg-success-500 text-white'
                            : 'bg-neutral-200 text-neutral-400'
                        }`}
                      >
                        {isPast ? (
                          <span className="text-sm">✓</span>
                        ) : (
                          getStageIcon(stage.icon)
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex items-center justify-between">
                          <h4
                            className={`font-medium ${
                              isCurrent ? 'text-primary-600' : isPast ? 'text-neutral-800' : 'text-neutral-400'
                            }`}
                          >
                            {stage.label}
                          </h4>
                          {stageFlow && (
                            <span className="text-sm text-neutral-500">
                              {formatDateTime(stageFlow.operatedAt)}
                            </span>
                          )}
                        </div>
                        {stageFlow && (
                          <p className="text-sm text-neutral-500 mt-1">
                            操作人：{stageFlow.operator}
                            {stageFlow.remark && ` · ${stageFlow.remark}`}
                          </p>
                        )}
                        {isCurrent && (
                          <span className="inline-block mt-2 px-2 py-0.5 bg-primary-100 text-primary-600 text-xs font-medium rounded-full animate-pulse">
                            当前环节
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-800">流转记录</h2>
              <button
                onClick={() => navigate('/flow', { state: { sampleId: sample.id } })}
                className="text-sm text-primary-500 hover:text-primary-600 flex items-center space-x-1"
              >
                <Edit3 size={14} />
                <span>更新状态</span>
              </button>
            </div>
            {flowLogs.length === 0 ? (
              <p className="text-neutral-500 text-center py-8">暂无流转记录</p>
            ) : (
              <div className="space-y-3">
                {[...flowLogs].reverse().map((log: FlowLog) => (
                  <div
                    key={log.id}
                    className="flex items-start space-x-3 p-3 rounded-lg bg-neutral-50"
                  >
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-neutral-800">
                          <span className="text-neutral-500">从</span>{' '}
                          <span className="font-medium">
                            {STAGES.find(s => s.key === log.fromStage)?.label || log.fromStage}
                          </span>{' '}
                          <span className="text-neutral-500">流转到</span>{' '}
                          <span className="font-medium text-primary-600">
                            {STAGES.find(s => s.key === log.toStage)?.label || log.toStage}
                          </span>
                        </p>
                        <span className="text-xs text-neutral-400 flex-shrink-0 ml-2">
                          {formatDateTime(log.operatedAt)}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        操作人：{log.operator}
                        {log.remark && ` · 备注：${log.remark}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {abnormalResults.length > 0 && (
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-neutral-800 flex items-center space-x-2">
                  <AlertTriangle size={20} className="text-danger-500" />
                  <span>异常记录</span>
                </h2>
                <StatusBadge
                  status={abnormalResults.filter((a: AbnormalResult) => !a.handled && !a.resolved).length > 0 ? 'high' : 'low'}
                  type="severity"
                />
              </div>
              <div className="space-y-3">
                {abnormalResults.map((abn: AbnormalResult) => (
                  <div
                    key={abn.id}
                    className={`p-4 rounded-xl border ${
                      abn.resolved
                        ? 'bg-neutral-50 border-neutral-200 opacity-75'
                        : abn.handled
                        ? 'bg-success-50/40 border-success-200'
                        : abn.severity === 'critical' || abn.severity === 'high'
                        ? 'bg-danger-50 border-danger-200'
                        : 'bg-warning-50 border-warning-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <StatusBadge status={abn.severity} type="severity" size="sm" />
                          <span className="text-xs text-neutral-500">
                            {formatDateTime(abn.createdAt)}
                          </span>
                          {abn.resolved ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-neutral-200 text-neutral-600 text-xs rounded-full">
                              <RotateCcw size={10} />
                              <span>已恢复</span>
                              {abn.resolvedAt && <span className="text-neutral-500 ml-1">· {formatDateTime(abn.resolvedAt)}</span>}
                            </span>
                          ) : abn.handled ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-success-100 text-success-700 text-xs rounded-full">
                              <CheckCircle size={10} />
                              <span>已处理</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-danger-100 text-danger-700 text-xs rounded-full animate-pulse">
                              <AlertTriangle size={10} />
                              <span>待处理</span>
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-800 font-medium">{abn.description}</p>
                        {abn.handled && (
                          <div className="mt-3 pt-3 border-t border-dashed border-neutral-300">
                            <p className="text-xs text-neutral-500">
                              <span className="font-medium">处理人：</span>{abn.handledBy || '-'}
                              {abn.handledAt && <span className="ml-3">{formatDateTime(abn.handledAt)}</span>}
                            </p>
                            {abn.handledRemark && (
                              <p className="text-xs text-neutral-600 mt-1">
                                <span className="font-medium">处理说明：</span>{abn.handledRemark}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-800 flex items-center space-x-2">
                <Archive size={20} className="text-primary-500" />
                <span>留样与销毁</span>
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowRetentionModal(true)}
                  className="px-3 py-1.5 text-sm border border-primary-300 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors flex items-center space-x-1"
                >
                  <Archive size={14} />
                  <span>登记留样</span>
                </button>
                <button
                  onClick={() => {
                    if (retentions.length > 0) {
                      setDisposalForm(prev => ({ ...prev, retentionId: retentions[0].id }));
                    }
                    setShowDisposalModal(true);
                  }}
                  className="px-3 py-1.5 text-sm border border-danger-300 text-danger-600 rounded-lg hover:bg-danger-50 transition-colors flex items-center space-x-1"
                >
                  <Trash2 size={14} />
                  <span>登记销毁</span>
                </button>
              </div>
            </div>

            {retentions.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-neutral-700 mb-2">留样记录</h3>
                <div className="space-y-2">
                  {retentions.map((ret: SampleRetention) => {
                    const isExpired = new Date(ret.expiryDate) < new Date();
                    return (
                      <div
                        key={ret.id}
                        className={`p-3 rounded-lg border ${
                          ret.status === 'destroyed'
                            ? 'bg-neutral-50 border-neutral-200 opacity-70'
                            : isExpired
                            ? 'bg-warning-50 border-warning-200'
                            : 'bg-primary-50/30 border-primary-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-neutral-800 text-sm">{ret.location}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            ret.status === 'destroyed'
                              ? 'bg-neutral-200 text-neutral-600'
                              : isExpired
                              ? 'bg-warning-200 text-warning-700'
                              : 'bg-primary-100 text-primary-700'
                          }`}>
                            {RETENTION_STATUS_LABELS[ret.status]}
                            {isExpired && ret.status === 'active' && ' (已到期)'}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-500 space-y-1">
                          <p>容器: {ret.container || '-'} | 数量: {ret.quantity || '-'}</p>
                          <p>留样日期: {ret.retentionDate} | 到期日期: {ret.expiryDate}</p>
                          <p>处理人: {ret.handler}</p>
                          {ret.remark && <p className="text-neutral-600">备注: {ret.remark}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {disposals.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-neutral-700 mb-2">销毁记录</h3>
                <div className="space-y-2">
                  {disposals.map((disp: SampleDisposal) => (
                    <div
                      key={disp.id}
                      className="p-3 rounded-lg border border-neutral-200 bg-neutral-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-neutral-800 text-sm flex items-center space-x-1">
                          <Trash2 size={14} className="text-neutral-500" />
                          <span>{disp.disposalMethod}</span>
                        </span>
                        <span className="text-xs text-neutral-500">{disp.disposalDate}</span>
                      </div>
                      <div className="text-xs text-neutral-500 space-y-1">
                        <p>销毁人: {disp.handler}{disp.witness && ` | 见证人: ${disp.witness}`}</p>
                        {disp.remark && <p className="text-neutral-600">备注: {disp.remark}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {retentions.length === 0 && disposals.length === 0 && (
              <p className="text-neutral-500 text-center py-8 text-sm">暂无留样和销毁记录</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="font-semibold text-neutral-800 mb-4">相关实验</h3>
            {experiments.length === 0 ? (
              <p className="text-neutral-500 text-center py-6 text-sm">暂无实验记录</p>
            ) : (
              <div className="space-y-3">
                {experiments.map((exp: Experiment) => (
                  <div
                    key={exp.id}
                    className="p-3 rounded-lg border border-neutral-100 hover:border-primary-200 hover:bg-primary-50/30 cursor-pointer transition-all"
                    onClick={() => navigate(`/experiments/${exp.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-neutral-800 text-sm truncate">{exp.title}</p>
                      <StatusBadge status={exp.status} type="experiment" size="sm" />
                    </div>
                    <p className="text-xs text-neutral-500">
                      操作人：{exp.operator}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {formatDateTime(exp.startedAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="font-semibold text-neutral-800 mb-4">相关报告</h3>
            {reports.length === 0 ? (
              <p className="text-neutral-500 text-center py-6 text-sm">暂无报告</p>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="p-3 rounded-lg border border-neutral-100 hover:border-primary-200 hover:bg-primary-50/30 cursor-pointer transition-all"
                    onClick={() => navigate(`/reports/${report.id}`)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <FileText size={14} className="text-primary-500" />
                        <p className="font-medium text-neutral-800 text-sm truncate">{report.title}</p>
                      </div>
                      <StatusBadge status={report.status} type="report" size="sm" />
                    </div>
                    <p className="text-xs text-neutral-400 mt-1">
                      {formatDateTime(report.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {usedEquipments.length > 0 && (
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <h3 className="font-semibold text-neutral-800 mb-4">使用仪器</h3>
              <div className="space-y-3">
                {usedEquipments.map((eq: Equipment) => {
                  const isCalibrationDue = new Date(eq.calibrationDueDate) < new Date();
                  return (
                    <div key={eq.id} className="p-3 rounded-lg border border-neutral-100 bg-neutral-50/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Activity size={14} className="text-primary-500" />
                          <span className="font-medium text-neutral-800 text-sm">{eq.name}</span>
                        </div>
                        <StatusBadge status={eq.status} type="equipment" size="sm" />
                      </div>
                      <div className="text-xs text-neutral-500 space-y-1">
                        <p>编号: {eq.serialNo}</p>
                        <p>型号: {eq.model}</p>
                        <p className={`flex items-center space-x-1 ${isCalibrationDue ? 'text-danger-500' : ''}`}>
                          <CalendarClock size={12} />
                          <span>
                            校准到期: {eq.calibrationDueDate}
                            {isCalibrationDue && ' (已到期)'}
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="font-semibold text-neutral-800 mb-4">追溯二维码</h3>
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg border-2 border-dashed border-neutral-300 mb-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${sample.trackingNo}`}
                  alt="QR Code"
                  className="w-36 h-36"
                />
              </div>
              <p className="text-xs text-neutral-500 text-center">
                扫描二维码查看样品完整信息和流转记录
              </p>
              <button
                onClick={() => setShowPrint(true)}
                className="mt-4 w-full px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
              >
                <Printer size={14} />
                <span>打印标签</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPrint && (
        <QRCodePrint
          trackingNo={sample.trackingNo}
          sampleName={sample.name}
          onClose={() => setShowPrint(false)}
        />
      )}

      {showRetentionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[480px] max-w-[90vw] max-h-[90vh] overflow-auto animate-slide-in-right">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-800">登记留样</h3>
              <button
                onClick={() => setShowRetentionModal(false)}
                className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                X
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  留样位置 <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  value={retentionForm.location}
                  onChange={(e) => setRetentionForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="如：留样冷库A-03架"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    容器类型
                  </label>
                  <input
                    type="text"
                    value={retentionForm.container}
                    onChange={(e) => setRetentionForm(prev => ({ ...prev, container: e.target.value }))}
                    placeholder="如：棕色玻璃瓶"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    留样数量
                  </label>
                  <input
                    type="text"
                    value={retentionForm.quantity}
                    onChange={(e) => setRetentionForm(prev => ({ ...prev, quantity: e.target.value }))}
                    placeholder="如：约200g"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  到期日期 <span className="text-danger-500">*</span>
                </label>
                <input
                  type="date"
                  value={retentionForm.expiryDate}
                  onChange={(e) => setRetentionForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  备注
                </label>
                <textarea
                  value={retentionForm.remark}
                  onChange={(e) => setRetentionForm(prev => ({ ...prev, remark: e.target.value }))}
                  rows={3}
                  placeholder="请输入备注信息..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowRetentionModal(false)}
                className="flex-1 px-4 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={handleRetentionSubmit}
                className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <Archive size={18} />
                <span>确认登记</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showDisposalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[480px] max-w-[90vw] max-h-[90vh] overflow-auto animate-slide-in-right">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-800">登记销毁</h3>
              <button
                onClick={() => setShowDisposalModal(false)}
                className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                X
              </button>
            </div>
            <div className="space-y-4">
              {retentions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    关联留样
                  </label>
                  <select
                    value={disposalForm.retentionId}
                    onChange={(e) => setDisposalForm(prev => ({ ...prev, retentionId: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
                  >
                    <option value="">不关联</option>
                    {retentions.filter(r => r.status !== 'destroyed').map((ret) => (
                      <option key={ret.id} value={ret.id}>
                        {ret.location} - {ret.retentionDate}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  销毁方式 <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  value={disposalForm.disposalMethod}
                  onChange={(e) => setDisposalForm(prev => ({ ...prev, disposalMethod: e.target.value }))}
                  placeholder="如：高温高压灭菌后按危废处理"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  见证人
                </label>
                <input
                  type="text"
                  value={disposalForm.witness}
                  onChange={(e) => setDisposalForm(prev => ({ ...prev, witness: e.target.value }))}
                  placeholder="请输入见证人姓名"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  备注
                </label>
                <textarea
                  value={disposalForm.remark}
                  onChange={(e) => setDisposalForm(prev => ({ ...prev, remark: e.target.value }))}
                  rows={3}
                  placeholder="请输入备注信息..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowDisposalModal(false)}
                className="flex-1 px-4 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={handleDisposalSubmit}
                className="flex-1 px-4 py-2.5 bg-danger-500 text-white rounded-lg hover:bg-danger-600 transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <Trash2 size={18} />
                <span>确认销毁</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SampleDetail;
