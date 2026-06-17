import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle, AlertTriangle, Clock, User, FlaskConical, SaveAll, ChevronDown, ChevronUp } from 'lucide-react';
import { useLabStore } from '@/store/useLabStore';
import { useToast } from '@/components/common/Toast';
import { useAutoSave } from '@/hooks/useAutoSave';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDateTime } from '@/utils/dateFormat';
import { generateReportContent } from '@/utils/pdfGenerator';
import { checkAbnormal } from '@/utils/validator';
import type { ExperimentStep, TemplateStep } from '@/types';

const ExperimentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    getExperimentById,
    getStepsByExperimentId,
    getSampleById,
    getTemplateById,
    updateExperimentStep,
    completeExperiment,
    checkAndCreateAbnormal,
    addReport,
    currentUser,
  } = useLabStore();

  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [localSteps, setLocalSteps] = useState<ExperimentStep[]>([]);

  const experiment = id ? getExperimentById(id) : undefined;
  const steps = useMemo(() => id ? getStepsByExperimentId(id) : [], [id, getStepsByExperimentId]);
  const sample = experiment ? getSampleById(experiment.sampleId) : undefined;
  const template = experiment ? getTemplateById(experiment.templateId) : undefined;

  useEffect(() => {
    setLocalSteps(steps);
  }, [steps]);

  const getTemplateStep = (stepOrder: number): TemplateStep | undefined => {
    return template?.steps.find(s => s.stepOrder === stepOrder);
  };

  const saveStep = (stepId: string, updates: Partial<ExperimentStep>) => {
    setLocalSteps(prev => prev.map(s => {
      if (s.id !== stepId) return s;
      const updated = { ...s, ...updates };
      if (updates.result !== undefined && updates.result !== s.result) {
        const templateStep = getTemplateStep(s.stepOrder);
        if (templateStep) {
          updated.isAbnormal = checkAbnormal(updates.result, templateStep);
          if (updated.isAbnormal && experiment) {
            checkAndCreateAbnormal(s.id, updates.result, templateStep.id, experiment.sampleId);
          }
        }
      }
      return updated;
    }));
  };

  const { saveStatus, lastSaved, forceSave } = useAutoSave(
    localSteps,
    async (stepsToSave) => {
      stepsToSave.forEach(step => {
        const originalStep = steps.find(s => s.id === step.id);
        if (originalStep && JSON.stringify(originalStep) !== JSON.stringify(step)) {
          updateExperimentStep(step.id, {
            instrumentNo: step.instrumentNo,
            parameters: step.parameters,
            observation: step.observation,
            result: step.result,
            isAbnormal: step.isAbnormal,
          });
        }
      });
    },
    { delay: 500 }
  );

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const handleStepComplete = (stepId: string, completed: boolean) => {
    const step = localSteps.find(s => s.id === stepId);
    if (!step) return;

    const updates: Partial<ExperimentStep> = {
      completed,
      completedAt: completed ? new Date().toISOString() : undefined,
    };

    saveStep(stepId, updates);
    updateExperimentStep(stepId, updates);
    forceSave();

    if (completed) {
      showToast('步骤已完成', 'success');
    }
  };

  const handleParameterChange = (stepId: string, key: string, value: string) => {
    const step = localSteps.find(s => s.id === stepId);
    if (!step) return;
    saveStep(stepId, {
      parameters: { ...step.parameters, [key]: value },
    });
  };

  const handleCompleteExperiment = () => {
    if (!experiment || !id) return;

    const allCompleted = localSteps.every(s => s.completed);
    if (!allCompleted) {
      showToast('请先完成所有实验步骤', 'error');
      return;
    }

    forceSave();
    completeExperiment(id);

    if (currentUser && sample) {
      const content = generateReportContent(sample, experiment, localSteps, false);
      addReport({
        experimentId: id,
        sampleId: experiment.sampleId,
        title: `${sample.name} - ${experiment.title} 报告`,
        content,
        status: 'draft',
        createdBy: currentUser.realName,
        hasElectronicSeal: false,
      });
    }

    showToast('实验已完成，报告草稿已生成', 'success');
    navigate('/reports');
  };

  const completedCount = useMemo(() => 
    localSteps.filter(s => s.completed).length,
    [localSteps]
  );

  const abnormalCount = useMemo(() =>
    localSteps.filter(s => s.isAbnormal).length,
    [localSteps]
  );

  const progress = localSteps.length > 0 ? (completedCount / localSteps.length) * 100 : 0;

  if (!experiment) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-neutral-500">
          <FlaskConical size={48} className="mx-auto mb-4 text-neutral-300" />
          <p>实验不存在</p>
        </div>
      </div>
    );
  }

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving': return '保存中...';
      case 'saved': return '已保存';
      case 'error': return '保存失败';
      default: return lastSaved ? `上次保存: ${formatDateTime(lastSaved.toISOString())}` : '';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/experiments')}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-neutral-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-800">{experiment.title}</h1>
            <div className="flex items-center space-x-4 mt-1 text-sm text-neutral-500">
              <span className="flex items-center space-x-1">
                <User size={14} />
                <span>操作人: {experiment.operator}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock size={14} />
                <span>开始于: {formatDateTime(experiment.startedAt)}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-neutral-500 flex items-center space-x-2">
            {saveStatus === 'saving' && <SaveAll size={16} className="animate-spin text-primary-500" />}
            {saveStatus === 'saved' && <CheckCircle size={16} className="text-success-500" />}
            {saveStatus === 'error' && <AlertTriangle size={16} className="text-danger-500" />}
            <span>{getSaveStatusText()}</span>
          </div>
          <StatusBadge status={experiment.status} type="experiment" />
          {experiment.status !== 'completed' && (
            <button
              onClick={handleCompleteExperiment}
              disabled={completedCount !== localSteps.length}
              className="px-4 py-2 bg-success-500 text-white rounded-lg hover:bg-success-600 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
            >
              <CheckCircle size={18} />
              <span>完成实验</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-800">实验进度</h3>
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-neutral-600">
                  {completedCount}/{localSteps.length} 步骤已完成
                </span>
                {abnormalCount > 0 && (
                  <span className="text-danger-600 flex items-center space-x-1">
                    <AlertTriangle size={14} />
                    <span>{abnormalCount} 项异常</span>
                  </span>
                )}
              </div>
            </div>
            <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-success-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="p-4 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-800">实验步骤</h3>
              <p className="text-sm text-neutral-500 mt-1">
                按顺序完成每个步骤，填写操作参数和结果。数据会自动保存(Ctrl+S可手动保存)
              </p>
            </div>

            <div className="divide-y divide-neutral-100">
              {localSteps.map((step, index) => {
                const templateStep = getTemplateStep(step.stepOrder);
                const isExpanded = expandedSteps.has(step.id);
                const isFirstIncomplete = !step.completed && localSteps.slice(0, index).every(s => s.completed);

                return (
                  <div
                    key={step.id}
                    className={`transition-colors ${
                      step.isAbnormal ? 'bg-danger-50/50' : isFirstIncomplete ? 'bg-primary-50/30' : ''
                    }`}
                  >
                    <div
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50 transition-colors"
                      onClick={() => toggleStep(step.id)}
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-medium transition-all ${
                            step.completed
                              ? 'bg-success-500 text-white'
                              : isFirstIncomplete
                              ? 'bg-primary-500 text-white ring-4 ring-primary-100'
                              : 'bg-neutral-200 text-neutral-600'
                          }`}
                        >
                          {step.completed ? <CheckCircle size={16} /> : step.stepOrder}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`font-medium ${step.completed ? 'text-neutral-500 line-through' : 'text-neutral-800'}`}>
                              {step.name}
                            </span>
                            {step.isAbnormal && (
                              <span className="px-2 py-0.5 bg-danger-100 text-danger-700 text-xs rounded-full flex items-center space-x-1">
                                <AlertTriangle size={10} />
                                <span>异常</span>
                              </span>
                            )}
                          </div>
                          {templateStep && (templateStep.referenceMin !== undefined || templateStep.referenceMax !== undefined) && (
                            <p className="text-xs text-neutral-500 mt-0.5">
                              参考范围: {templateStep.referenceMin ?? '-'} ~ {templateStep.referenceMax ?? '-'} {templateStep.unit || ''}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {step.completedAt && (
                          <span className="text-xs text-neutral-500">
                            {formatDateTime(step.completedAt)}
                          </span>
                        )}
                        {isExpanded ? <ChevronUp size={18} className="text-neutral-400" /> : <ChevronDown size={18} className="text-neutral-400" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-neutral-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-neutral-700">
                              仪器编号
                              {templateStep?.requiredInstrument && <span className="text-danger-500"> *</span>}
                            </label>
                            <input
                              type="text"
                              value={step.instrumentNo}
                              onChange={(e) => saveStep(step.id, { instrumentNo: e.target.value })}
                              disabled={step.completed}
                              placeholder="请输入仪器编号"
                              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-neutral-50 disabled:text-neutral-500"
                            />
                          </div>

                          {templateStep?.referenceMin !== undefined || templateStep?.referenceMax !== undefined ? (
                            <div className="space-y-1.5">
                              <label className="block text-sm font-medium text-neutral-700">
                                检测结果 {templateStep?.unit && <span className="text-neutral-500">({templateStep.unit})</span>}
                              </label>
                              <input
                                type="text"
                                value={step.result}
                                onChange={(e) => saveStep(step.id, { result: e.target.value })}
                                disabled={step.completed}
                                placeholder="请输入检测结果"
                                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-neutral-50 disabled:text-neutral-500 ${
                                  step.isAbnormal ? 'border-danger-500 bg-danger-50' : 'border-neutral-300'
                                }`}
                              />
                              {step.isAbnormal && (
                                <p className="text-xs text-danger-500">结果超出参考范围</p>
                              )}
                            </div>
                          ) : null}
                        </div>

                        <div className="space-y-1.5 mb-4">
                          <label className="block text-sm font-medium text-neutral-700">操作参数</label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {['温度', '时间', '浓度', 'pH值'].map((param) => (
                              <div key={param} className="space-y-1">
                                <label className="block text-xs text-neutral-500">{param}</label>
                                <input
                                  type="text"
                                  value={step.parameters[param] || ''}
                                  onChange={(e) => handleParameterChange(step.id, param, e.target.value)}
                                  disabled={step.completed}
                                  placeholder={`输入${param}`}
                                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-neutral-50 disabled:text-neutral-500"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5 mb-4">
                          <label className="block text-sm font-medium text-neutral-700">观测结果</label>
                          <textarea
                            value={step.observation}
                            onChange={(e) => saveStep(step.id, { observation: e.target.value })}
                            disabled={step.completed}
                            rows={3}
                            placeholder="请输入实验观测结果和现象描述..."
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none disabled:bg-neutral-50 disabled:text-neutral-500"
                          />
                        </div>

                        {!step.completed && experiment.status !== 'completed' && (
                          <div className="flex justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStepComplete(step.id, true);
                              }}
                              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium flex items-center space-x-2"
                            >
                              <CheckCircle size={16} />
                              <span>标记完成</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <h3 className="font-semibold text-neutral-800 mb-4">关联样品</h3>
            {sample && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">样品名称</span>
                  <span className="text-neutral-800 font-medium">{sample.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">追踪编号</span>
                  <span className="text-primary-600 font-mono font-medium">{sample.trackingNo}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">样品类型</span>
                  <span className="text-neutral-800">{sample.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">委托方</span>
                  <span className="text-neutral-800">{sample.client}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">当前状态</span>
                  <StatusBadge status={sample.status} type="sample" size="sm" />
                </div>
                <button
                  onClick={() => navigate(`/samples/${sample.id}`)}
                  className="w-full mt-2 px-3 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium"
                >
                  查看样品详情
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <h3 className="font-semibold text-neutral-800 mb-4">使用模板</h3>
            {template && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">模板名称</span>
                  <span className="text-neutral-800 font-medium">{template.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">分类</span>
                  <span className="text-neutral-800">{template.category}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">步骤数量</span>
                  <span className="text-neutral-800">{template.steps.length} 步</span>
                </div>
                <p className="text-sm text-neutral-600 mt-2 pt-2 border-t border-neutral-100">
                  {template.description}
                </p>
              </div>
            )}
          </div>

          <div className="bg-primary-50 rounded-xl border border-primary-200 p-5">
            <div className="flex items-start space-x-3">
              <Save size={20} className="text-primary-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-primary-800">自动保存已启用</h4>
                <p className="text-sm text-primary-600 mt-1">
                  所有输入会在500ms后自动保存，按 Ctrl+S 可立即保存。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExperimentDetail;
