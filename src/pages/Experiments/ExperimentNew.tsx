import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, FileText, FlaskConical } from 'lucide-react';
import { useLabStore } from '@/store/useLabStore';
import { useToast } from '@/components/common/Toast';
import { InputWithScan } from '@/components/forms/InputWithScan';
import type { Sample, Template } from '@/types';

const ExperimentNew: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { samples, templates, currentUser, createExperimentFromTemplate, updateSampleStage } = useLabStore();
  
  const [formData, setFormData] = useState({
    trackingNo: '',
    sampleId: '',
    templateId: '',
    title: '',
  });

  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleScanComplete = (value: string) => {
    const sample = samples.find(s => s.trackingNo === value);
    if (sample) {
      setSelectedSample(sample);
      setFormData({ ...formData, trackingNo: value, sampleId: sample.id });
      setErrors({ ...errors, trackingNo: '' });
    } else {
      showToast('未找到该追踪号对应的样品', 'error');
    }
  };

  const handleSampleSelect = (sampleId: string) => {
    const sample = samples.find(s => s.id === sampleId);
    if (sample) {
      setSelectedSample(sample);
      setFormData({ ...formData, sampleId, trackingNo: sample.trackingNo });
      setErrors({ ...errors, sampleId: '' });
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId && t.isActive);
    if (template) {
      setSelectedTemplate(template);
      setFormData({ 
        ...formData, 
        templateId, 
        title: `${selectedSample?.name || '样品'} - ${template.name}` 
      });
      setErrors({ ...errors, templateId: '' });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.sampleId) {
      newErrors.sampleId = '请选择样品';
    }
    if (!formData.templateId) {
      newErrors.templateId = '请选择实验模板';
    }
    if (!formData.title.trim()) {
      newErrors.title = '请输入实验名称';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      showToast('请完善所有必填信息', 'error');
      return;
    }

    if (!currentUser) {
      showToast('用户未登录', 'error');
      return;
    }

    try {
      const { experiment } = createExperimentFromTemplate(
        formData.templateId,
        formData.sampleId,
        formData.title,
        currentUser.realName
      );

      updateSampleStage(formData.sampleId, 'testing', currentUser.realName, '开始实验检测');

      showToast('实验创建成功！', 'success');
      navigate(`/experiments/${experiment.id}`);
    } catch {
      showToast('创建实验失败，请重试', 'error');
    }
  };

  const availableSamples = samples.filter(s => 
    s.status !== 'completed' && s.status !== 'archived'
  );

  const activeTemplates = templates.filter(t => t.isActive);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/experiments')}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-neutral-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">新建实验</h1>
          <p className="text-neutral-500 mt-1">选择样品和模板，创建标准化实验流程</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center space-x-2">
            <FlaskConical size={20} className="text-primary-500" />
            <span>选择样品</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputWithScan
              label="扫描样品追踪号"
              value={formData.trackingNo}
              onChange={(v) => setFormData({ ...formData, trackingNo: v })}
              onScanComplete={handleScanComplete}
              placeholder="扫描或输入样品追踪号"
              error={errors.trackingNo}
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700">
                或手动选择样品 <span className="text-danger-500">*</span>
              </label>
              <select
                value={formData.sampleId}
                onChange={(e) => handleSampleSelect(e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white ${
                  errors.sampleId ? 'border-danger-500' : 'border-neutral-300'
                }`}
              >
                <option value="">请选择样品</option>
                {availableSamples.map((sample) => (
                  <option key={sample.id} value={sample.id}>
                    {sample.name} - {sample.trackingNo}
                  </option>
                ))}
              </select>
              {errors.sampleId && (
                <p className="text-xs text-danger-500">{errors.sampleId}</p>
              )}
            </div>
          </div>

          {selectedSample && (
            <div className="mt-4 bg-primary-50 rounded-lg p-4 border border-primary-100">
              <h4 className="font-medium text-primary-700 mb-3">样品信息</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-neutral-500">样品名称：</span>
                  <span className="text-neutral-800 font-medium">{selectedSample.name}</span>
                </div>
                <div>
                  <span className="text-neutral-500">追踪编号：</span>
                  <span className="text-neutral-800 font-mono font-medium">{selectedSample.trackingNo}</span>
                </div>
                <div>
                  <span className="text-neutral-500">样品类型：</span>
                  <span className="text-neutral-800 font-medium">{selectedSample.type}</span>
                </div>
                <div>
                  <span className="text-neutral-500">委托方：</span>
                  <span className="text-neutral-800 font-medium">{selectedSample.client}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-neutral-200 pt-6">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center space-x-2">
            <FileText size={20} className="text-primary-500" />
            <span>选择实验模板</span>
          </h3>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-700">
              实验模板 <span className="text-danger-500">*</span>
            </label>
            <select
              value={formData.templateId}
              onChange={(e) => handleTemplateSelect(e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white ${
                errors.templateId ? 'border-danger-500' : 'border-neutral-300'
              }`}
            >
              <option value="">请选择实验模板</option>
              {activeTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.category} - {template.steps.length}个步骤)
                </option>
              ))}
            </select>
            {errors.templateId && (
              <p className="text-xs text-danger-500">{errors.templateId}</p>
            )}
          </div>

          {selectedTemplate && (
            <div className="mt-4 bg-neutral-50 rounded-lg p-4 border border-neutral-200">
              <h4 className="font-medium text-neutral-800 mb-3">{selectedTemplate.name}</h4>
              <p className="text-sm text-neutral-600 mb-4">{selectedTemplate.description}</p>
              <div className="space-y-2">
                {selectedTemplate.steps.map((step) => (
                  <div key={step.id} className="flex items-center space-x-3 text-sm">
                    <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-medium">
                      {step.stepOrder}
                    </div>
                    <span className="text-neutral-800">{step.name}</span>
                    {(step.referenceMin !== undefined || step.referenceMax !== undefined) && (
                      <span className="text-xs text-neutral-500">
                        (参考范围: {step.referenceMin ?? '-'} ~ {step.referenceMax ?? '-'} {step.unit || ''})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-neutral-200 pt-6">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-700">
              实验名称 <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (errors.title) setErrors({ ...errors, title: '' });
              }}
              placeholder="请输入实验名称"
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                errors.title ? 'border-danger-500' : 'border-neutral-300'
              }`}
            />
            {errors.title && (
              <p className="text-xs text-danger-500">{errors.title}</p>
            )}
          </div>
        </div>

        <div className="flex justify-between pt-6 border-t border-neutral-200">
          <button
            onClick={() => navigate('/experiments')}
            className="px-6 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedSample || !selectedTemplate}
            className="px-6 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2 shadow-lg shadow-primary-500/20"
          >
            <Save size={18} />
            <span>创建实验</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExperimentNew;
