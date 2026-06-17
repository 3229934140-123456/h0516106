import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Eye, Edit2, Trash2, ToggleLeft, ToggleRight, FileText } from 'lucide-react';
import { DataTable, Column } from '@/components/common/DataTable';
import { useLabStore } from '@/store/useLabStore';
import { useToast } from '@/components/common/Toast';
import { formatDateTime } from '@/utils/dateFormat';
import type { Template } from '@/types';

const TemplateList: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { templates, updateTemplate, deleteTemplate } = useLabStore();
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const categories = useMemo(() => {
    const cats = new Set(templates.map(t => t.category));
    return Array.from(cats);
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    let result = [...templates];

    if (searchText) {
      const search = searchText.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search) ||
          t.category.toLowerCase().includes(search)
      );
    }

    if (categoryFilter !== 'all') {
      result = result.filter((t) => t.category === categoryFilter);
    }

    result.sort((a, b) => {
      const aVal = a[sortKey as keyof Template] as string;
      const bVal = b[sortKey as keyof Template] as string;
      const comparison = aVal.localeCompare(bVal);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [templates, searchText, categoryFilter, sortKey, sortOrder]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const handleToggleStatus = (id: string, isActive: boolean) => {
    updateTemplate(id, { isActive: !isActive });
    showToast(isActive ? '模板已禁用' : '模板已启用', 'success');
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除该模板吗？删除后无法恢复。')) {
      deleteTemplate(id);
      showToast('模板已删除', 'success');
    }
  };

  const columns: Column<Template>[] = [
    {
      key: 'name',
      header: '模板名称',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-2">
          <FileText size={18} className="text-primary-500" />
          <span className="font-medium text-neutral-800">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'category',
      header: '分类',
      sortable: true,
      render: (row) => (
        <span className="px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-full">
          {row.category}
        </span>
      ),
    },
    {
      key: 'description',
      header: '描述',
      render: (row) => (
        <span className="text-neutral-600 text-sm line-clamp-1">{row.description}</span>
      ),
    },
    {
      key: 'steps',
      header: '步骤数',
      align: 'center',
      render: (row) => (
        <span className="text-neutral-800 font-medium">{row.steps.length} 步</span>
      ),
    },
    {
      key: 'isActive',
      header: '状态',
      align: 'center',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleStatus(row.id, row.isActive);
          }}
          className="flex items-center justify-center"
        >
          {row.isActive ? (
            <ToggleRight size={24} className="text-success-500" />
          ) : (
            <ToggleLeft size={24} className="text-neutral-400" />
          )}
        </button>
      ),
    },
    {
      key: 'createdAt',
      header: '创建时间',
      sortable: true,
      render: (row) => (
        <span className="text-neutral-500 text-sm">
          {formatDateTime(row.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '操作',
      align: 'center',
      width: '140px',
      render: (row) => (
        <div className="flex items-center justify-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/templates/${row.id}`);
            }}
            className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
            title="查看详情"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/templates/${row.id}/edit`);
            }}
            className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
            title="编辑"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.id);
            }}
            className="p-2 text-neutral-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors"
            title="删除"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">流程模板</h1>
          <p className="text-neutral-500 mt-1">管理标准化实验流程模板</p>
        </div>
        <button
          onClick={() => navigate('/templates/new')}
          className="px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium flex items-center space-x-2 shadow-lg shadow-primary-500/20"
        >
          <Plus size={18} />
          <span>新建模板</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="搜索模板名称、描述、分类..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10 pr-4 py-2 border border-neutral-300 rounded-lg text-sm w-80 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter size={18} className="text-neutral-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
              >
                <option value="all">全部分类</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <DataTable<Template>
        columns={columns}
        data={filteredTemplates}
        sortKey={sortKey}
        sortOrder={sortOrder}
        onSort={handleSort}
        onRowClick={(row) => navigate(`/templates/${row.id}`)}
        emptyText="暂无模板数据"
      />
    </div>
  );
};

export default TemplateList;
