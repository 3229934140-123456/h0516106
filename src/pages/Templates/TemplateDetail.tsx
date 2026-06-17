import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit2, Play, FileText, AlertCircle, Info } from 'lucide-react';
import { useLabStore } from '@/store/useLabStore';
import { formatDateTime } from '@/utils/dateFormat';
import { StatusBadge } from '@/components/common/StatusBadge';

const TemplateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTemplateById, samples, currentUser, createExperimentFromTemplate, updateSampleStage } = useLabStore();

  const template = id ? getTemplateById(id) : undefined;

  if (!template) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-neutral-500">
          <FileText size={48} className="mx-auto mb-4 text-neutral-300" />
          <p>模板不存在</p>
        </div>
      </div>
    );
  }

  const handleCreateExperiment = () => {
    const availableSamples = samples.filter(s => 
      s.status !== 'completed' && s.status !== 'archived'
    );

    if (availableSamples.length === 0) {
      alert('暂无可用样品，请先录入样品');
      navigate('/samples/new');
      return;
    }

    const sample = availableSamples[0];
    
    if (currentUser) {
      const { experiment } = createExperimentFromTemplate(
        template.id,
        sample.id,
        `${sample.name} - ${template.name}`,
        currentUser.realName
      );

      updateSampleStage(sample.id, 'testing', currentUser.realName, '开始实验检测');
      navigate(`/experiments/${experiment.id}`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/templates')}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-neutral-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-800">{template.name}</h1>
            <div className="flex items-center space-x-3 mt-1">
              <span className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded-full">
                {template.category}
              </span>
              <StatusBadge 
                status={template.isActive ? 'active' : 'inactive'} 
                type="sample" 
                size="sm" 
              />
              <span className="text-sm text-neutral-500">
                创建于 {formatDateTime(template.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(`/templates/${template.id}/edit`)}
            className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium flex items-center space-x-2"
          >
            <Edit2 size={16} />
            <span>编辑模板</span>
          </button>
          {template.isActive && (
            <button
              onClick={handleCreateExperiment}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium flex items-center space-x-2 shadow-lg shadow-primary-500/20"
            >
              <Play size={16} />
              <span>创建实验</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-neutral-800 mb-2">模板描述</h3>
          <p className="text-neutral-600">{template.description || '暂无描述'}</p>
        </div>

        <div className="bg-primary-50 rounded-lg p-4 border border-primary-100 mb-6">
          <div className="flex items-start space-x-3">
            <Info size={20} className="text-primary-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-primary-800">模板信息</h4>
              <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-primary-600">步骤数量</span>
                  <span className="text-primary-800 font-medium">{template.steps.length} 步</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary-600">必填步骤</span>
                  <span className="text-primary-800 font-medium">
                    {template.steps.filter(s => s.isRequired).length} 步
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary-600">需仪器编号</span>
                  <span className="text-primary-800 font-medium">
                    {template.steps.filter(s => s.requiredInstrument).length} 步
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary-600">含参考范围</span>
                  <span className="text-primary-800 font-medium">
                    {template.steps.filter(s => s.referenceMin !== undefined || s.referenceMax !== undefined).length} 步
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">实验步骤</h3>
          <div className="space-y-4">
            {template.steps.map((step) => {
              const hasReference = step.referenceMin !== undefined || step.referenceMax !== undefined;
              
              return (
                <div
                  key={step.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    hasReference ? 'bg-neutral-50/50 border-neutral-200' : 'bg-white border-neutral-200'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-medium bg-primary-500 text-white ring-4 ring-primary-100 transition-all"
                    >
                      {step.stepOrder}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-neutral-800">{step.name}</span>
                        {step.isRequired && (
                          <span className="px-1.5 py-0.5 bg-warning-50 text-warning-700 text-xs rounded">
                            必填
                          </span>
                        )}
                        {step.requiredInstrument && (
                          <span className="px-1.5 py-0.5 bg-info-50 text-info-700 text-xs rounded">
                            需仪器
                          </span>
                        )}
                      </div>

                      {step.description && (
                        <p className="text-sm text-neutral-600 mb-3">{step.description}</p>
                      )}

                      {hasReference && (
                        <div className="bg-white rounded-lg p-3 border border-neutral-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <AlertCircle size={14} className="text-info-500" />
                            <span className="text-sm font-medium text-neutral-700">参考范围</span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-neutral-500">最小值: </span>
                              <span className="text-neutral-800 font-medium">{step.referenceMin ?? '-'}</span>
                            </div>
                            <div>
                              <span className="text-neutral-500">最大值: </span>
                              <span className="text-neutral-800 font-medium">{step.referenceMax ?? '-'}</span>
                            </div>
                            <div>
                              <span className="text-neutral-500">单位: </span>
                              <span className="text-neutral-800 font-medium">{step.unit || '-'}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateDetail;
