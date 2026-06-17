import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, GripVertical, AlertCircle } from 'lucide-react';
import { useLabStore } from '@/store/useLabStore';
import { useToast } from '@/components/common/Toast';
import { generateId } from '@/utils/trackingNo';
import type { TemplateStep } from '@/types';

const categories = ['水质检测', '食品检测', '土壤检测', '空气检测', '生物检测', '其他'];

const TemplateForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { addTemplate, updateTemplate, getTemplateById } = useLabStore();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    isActive: true,
  });

  const [steps, setSteps] = useState<TemplateStep[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit && id) {
      const template = getTemplateById(id);
      if (template) {
        setFormData({
          name: template.name,
          description: template.description,
          category: template.category,
          isActive: template.isActive,
        });
        setSteps(template.steps);
      }
    }
  }, [isEdit, id, getTemplateById]);

  const addStep = () => {
    const newStep: TemplateStep = {
      id: generateId(),
      stepOrder: steps.length + 1,
      name: '',
      description: '',
      requiredInstrument: false,
      isRequired: true,
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (stepId: string) => {
    const newSteps = steps
      .filter(s => s.id !== stepId)
      .map((s, index) => ({ ...s, stepOrder: index + 1 }));
    setSteps(newSteps);
  };

  const updateStep = (stepId: string, updates: Partial<TemplateStep>) => {
    setSteps(steps.map(s => s.id === stepId ? { ...s, ...updates } : s));
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === steps.length - 1) return;

    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    
    newSteps.forEach((s, i) => {
      s.stepOrder = i + 1;
    });
    
    setSteps(newSteps);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入模板名称';
    }
    if (!formData.category) {
      newErrors.category = '请选择模板分类';
    }
    if (steps.length === 0) {
      newErrors.steps = '请至少添加一个实验步骤';
    }

    steps.forEach((step, index) => {
      if (!step.name.trim()) {
        newErrors[`step_${index}_name`] = `请输入步骤${index + 1}的名称`;
      }
      if (step.referenceMin !== undefined && step.referenceMax !== undefined) {
        if (step.referenceMin > step.referenceMax) {
          newErrors[`step_${index}_range`] = `步骤${index + 1}的参考范围最小值不能大于最大值`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      showToast('请完善所有必填信息', 'error');
      return;
    }

    if (isEdit && id) {
      updateTemplate(id, {
        ...formData,
        steps,
      });
      showToast('模板更新成功！', 'success');
    } else {
      addTemplate({
        ...formData,
        steps,
      });
      showToast('模板创建成功！', 'success');
    }

    navigate('/templates');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/templates')}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-neutral-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">
            {isEdit ? '编辑模板' : '新建模板'}
          </h1>
          <p className="text-neutral-500 mt-1">
            {isEdit ? '修改实验流程模板' : '创建标准化实验流程模板'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-700">
              模板名称 <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              placeholder="请输入模板名称"
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                errors.name ? 'border-danger-500' : 'border-neutral-300'
              }`}
            />
            {errors.name && (
              <p className="text-xs text-danger-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-700">
              模板分类 <span className="text-danger-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => {
                setFormData({ ...formData, category: e.target.value });
                if (errors.category) setErrors({ ...errors, category: '' });
              }}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white ${
                errors.category ? 'border-danger-500' : 'border-neutral-300'
              }`}
            >
              <option value="">请选择模板分类</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-xs text-danger-500">{errors.category}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-700">模板描述</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            placeholder="请输入模板描述信息..."
            className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
          />
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
          />
          <label htmlFor="isActive" className="text-sm text-neutral-700">
            启用此模板
          </label>
        </div>

        <div className="border-t border-neutral-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-neutral-800">实验步骤</h3>
              <p className="text-sm text-neutral-500 mt-1">
                添加并配置实验步骤，设置参考范围用于异常检测
              </p>
            </div>
            <button
              onClick={addStep}
              className="px-4 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors font-medium flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>添加步骤</span>
            </button>
          </div>

          {errors.steps && (
            <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg flex items-start space-x-2">
              <AlertCircle size={16} className="text-danger-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-danger-600">{errors.steps}</p>
            </div>
          )}

          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="border border-neutral-200 rounded-lg p-4 bg-neutral-50/50"
              >
                <div className="flex items-start space-x-3 mb-4">
                  <div className="flex flex-col items-center space-y-1 py-1">
                    <button
                      onClick={() => moveStep(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <GripVertical size={16} className="rotate-90" />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-medium text-sm">
                      {step.stepOrder}
                    </div>
                    <button
                      onClick={() => moveStep(index, 'down')}
                      disabled={index === steps.length - 1}
                      className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <GripVertical size={16} className="rotate-90" />
                    </button>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-neutral-700">
                          步骤名称 <span className="text-danger-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={step.name}
                          onChange={(e) => {
                            updateStep(step.id, { name: e.target.value });
                            const errKey = `step_${index}_name`;
                            if (errors[errKey]) {
                              const newErrors = { ...errors };
                              delete newErrors[errKey];
                              setErrors(newErrors);
                            }
                          }}
                          placeholder="请输入步骤名称"
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                            errors[`step_${index}_name`] ? 'border-danger-500' : 'border-neutral-300'
                          }`}
                        />
                        {errors[`step_${index}_name`] && (
                          <p className="text-xs text-danger-500">{errors[`step_${index}_name`]}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-neutral-700">单位</label>
                        <input
                          type="text"
                          value={step.unit || ''}
                          onChange={(e) => updateStep(step.id, { unit: e.target.value })}
                          placeholder="如：mg/L, %"
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-neutral-700">步骤描述</label>
                      <textarea
                        value={step.description}
                        onChange={(e) => updateStep(step.id, { description: e.target.value })}
                        rows={2}
                        placeholder="请输入步骤描述或参考范围说明..."
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-neutral-700">参考最小值</label>
                        <input
                          type="number"
                          step="any"
                          value={step.referenceMin ?? ''}
                          onChange={(e) => {
                            const val = e.target.value ? parseFloat(e.target.value) : undefined;
                            updateStep(step.id, { referenceMin: val });
                          }}
                          placeholder="最小值"
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                            errors[`step_${index}_range`] ? 'border-danger-500' : 'border-neutral-300'
                          }`}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-neutral-700">参考最大值</label>
                        <input
                          type="number"
                          step="any"
                          value={step.referenceMax ?? ''}
                          onChange={(e) => {
                            const val = e.target.value ? parseFloat(e.target.value) : undefined;
                            updateStep(step.id, { referenceMax: val });
                          }}
                          placeholder="最大值"
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                            errors[`step_${index}_range`] ? 'border-danger-500' : 'border-neutral-300'
                          }`}
                        />
                      </div>
                      {errors[`step_${index}_range`] && (
                        <div className="md:col-span-1">
                          <p className="text-xs text-danger-500 pt-6">{errors[`step_${index}_range`]}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-6">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={step.requiredInstrument}
                          onChange={(e) => updateStep(step.id, { requiredInstrument: e.target.checked })}
                          className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-neutral-700">需要填写仪器编号</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={step.isRequired}
                          onChange={(e) => updateStep(step.id, { isRequired: e.target.checked })}
                          className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-neutral-700">此步骤为必填项</span>
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={() => removeStep(step.id)}
                    className="p-2 text-neutral-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors"
                    title="删除步骤"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}

            {steps.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-neutral-200 rounded-lg">
                <div className="text-neutral-400 mb-2">
                  <Plus size={32} className="mx-auto" />
                </div>
                <p className="text-neutral-500">暂无步骤，点击上方"添加步骤"按钮添加</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between pt-6 border-t border-neutral-200">
          <button
            onClick={() => navigate('/templates')}
            className="px-6 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium flex items-center space-x-2 shadow-lg shadow-primary-500/20"
          >
            <Save size={18} />
            <span>{isEdit ? '保存修改' : '创建模板'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateForm;
