import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ToastProvider } from "@/components/common/Toast";
import Dashboard from "@/pages/Dashboard";
import SampleList from "@/pages/Samples/SampleList";
import SampleNew from "@/pages/Samples/SampleNew";
import SampleDetail from "@/pages/Samples/SampleDetail";
import Flow from "@/pages/Flow";
import ExperimentList from "@/pages/Experiments/ExperimentList";
import ExperimentNew from "@/pages/Experiments/ExperimentNew";
import ExperimentDetail from "@/pages/Experiments/ExperimentDetail";
import TemplateList from "@/pages/Templates/TemplateList";
import TemplateForm from "@/pages/Templates/TemplateForm";
import TemplateDetail from "@/pages/Templates/TemplateDetail";
import ReportList from "@/pages/Reports/ReportList";
import ReportDetail from "@/pages/Reports/ReportDetail";
import AbnormalCenter from "@/pages/Abnormal/AbnormalCenter";

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="samples" element={<SampleList />} />
            <Route path="samples/new" element={<SampleNew />} />
            <Route path="samples/:id" element={<SampleDetail />} />
            <Route path="flow" element={<Flow />} />
            <Route path="experiments" element={<ExperimentList />} />
            <Route path="experiments/new" element={<ExperimentNew />} />
            <Route path="experiments/:id" element={<ExperimentDetail />} />
            <Route path="templates" element={<TemplateList />} />
            <Route path="templates/new" element={<TemplateForm />} />
            <Route path="templates/:id" element={<TemplateDetail />} />
            <Route path="templates/:id/edit" element={<TemplateForm />} />
            <Route path="reports" element={<ReportList />} />
            <Route path="reports/:id" element={<ReportDetail />} />
            <Route path="abnormal" element={<AbnormalCenter />} />
          </Route>
          <Route path="*" element={<div className="text-center text-xl py-20">页面不存在</div>} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}
