import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Sample, Experiment, ExperimentStep, Report } from '@/types';
import { formatDateTime } from './dateFormat';

export async function generateReportPDF(
  reportElement: HTMLElement,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  report: Report,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sample: Sample,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  experiment: Experiment,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  steps: ExperimentStep[]
): Promise<Blob> {
  const canvas = await html2canvas(reportElement, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  let heightLeft = imgHeight;
  let position = 0;
  
  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;
  
  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }
  
  return pdf.output('blob');
}

export function generateReportContent(
  sample: Sample,
  experiment: Experiment,
  steps: ExperimentStep[],
  hasElectronicSeal: boolean
): string {
  const abnormalSteps = steps.filter(s => s.isAbnormal);
  
  let content = `
<div style="font-family: 'Source Han Sans', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto;">
  <div style="text-align: center; border-bottom: 2px solid #165DFF; padding-bottom: 20px; margin-bottom: 30px;">
    <h1 style="color: #165DFF; font-size: 28px; margin: 0 0 10px 0;">实验室检测报告</h1>
    <p style="color: #4E5969; font-size: 14px; margin: 0;">Laboratory Test Report</p>
  </div>

  <div style="margin-bottom: 30px;">
    <h2 style="color: #1D2129; font-size: 18px; border-left: 4px solid #165DFF; padding-left: 12px; margin-bottom: 15px;">样品信息</h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <tr>
        <td style="padding: 8px; border: 1px solid #E5E6EB; background-color: #F7F8FA; width: 25%;">追踪编号</td>
        <td style="padding: 8px; border: 1px solid #E5E6EB;">${sample.trackingNo}</td>
        <td style="padding: 8px; border: 1px solid #E5E6EB; background-color: #F7F8FA; width: 25%;">样品名称</td>
        <td style="padding: 8px; border: 1px solid #E5E6EB;">${sample.name}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #E5E6EB; background-color: #F7F8FA;">样品类型</td>
        <td style="padding: 8px; border: 1px solid #E5E6EB;">${sample.type}</td>
        <td style="padding: 8px; border: 1px solid #E5E6EB; background-color: #F7F8FA;">样品来源</td>
        <td style="padding: 8px; border: 1px solid #E5E6EB;">${sample.source}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #E5E6EB; background-color: #F7F8FA;">委托方</td>
        <td style="padding: 8px; border: 1px solid #E5E6EB;">${sample.client}</td>
        <td style="padding: 8px; border: 1px solid #E5E6EB; background-color: #F7F8FA;">接收日期</td>
        <td style="padding: 8px; border: 1px solid #E5E6EB;">${sample.receivedDate}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #E5E6EB; background-color: #F7F8FA;">数量</td>
        <td style="padding: 8px; border: 1px solid #E5E6EB;">${sample.quantity}</td>
        <td style="padding: 8px; border: 1px solid #E5E6EB; background-color: #F7F8FA;">检测人员</td>
        <td style="padding: 8px; border: 1px solid #E5E6EB;">${experiment.operator}</td>
      </tr>
    </table>
  </div>

  <div style="margin-bottom: 30px;">
    <h2 style="color: #1D2129; font-size: 18px; border-left: 4px solid #165DFF; padding-left: 12px; margin-bottom: 15px;">检测项目</h2>
    <p style="font-size: 16px; color: #1D2129; margin: 0;">${experiment.title}</p>
  </div>

  <div style="margin-bottom: 30px;">
    <h2 style="color: #1D2129; font-size: 18px; border-left: 4px solid #165DFF; padding-left: 12px; margin-bottom: 15px;">检测结果</h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <thead>
        <tr style="background-color: #165DFF; color: white;">
          <th style="padding: 10px; border: 1px solid #165DFF; width: 5%;">序号</th>
          <th style="padding: 10px; border: 1px solid #165DFF; width: 25%;">检测步骤</th>
          <th style="padding: 10px; border: 1px solid #165DFF; width: 20%;">检测结果</th>
          <th style="padding: 10px; border: 1px solid #165DFF; width: 20%;">参考范围</th>
          <th style="padding: 10px; border: 1px solid #165DFF; width: 15%;">仪器编号</th>
          <th style="padding: 10px; border: 1px solid #165DFF; width: 15%;">完成时间</th>
        </tr>
      </thead>
      <tbody>
  `;

  steps.forEach((step, index) => {
    const bgColor = step.isAbnormal ? '#FFEBE8' : (index % 2 === 0 ? '#F7F8FA' : '#FFFFFF');
    const textColor = step.isAbnormal ? '#F53F3F' : '#1D2129';
    const fontWeight = step.isAbnormal ? 'bold' : 'normal';
    
    content += `
        <tr style="background-color: ${bgColor};">
          <td style="padding: 8px; border: 1px solid #E5E6EB; text-align: center;">${index + 1}</td>
          <td style="padding: 8px; border: 1px solid #E5E6EB; color: ${textColor}; font-weight: ${fontWeight};">${step.name}</td>
          <td style="padding: 8px; border: 1px solid #E5E6EB; color: ${textColor}; font-weight: ${fontWeight};">${step.result || '-'}</td>
          <td style="padding: 8px; border: 1px solid #E5E6EB;">${step.description}</td>
          <td style="padding: 8px; border: 1px solid #E5E6EB;">${step.instrumentNo || '-'}</td>
          <td style="padding: 8px; border: 1px solid #E5E6EB;">${step.completedAt ? formatDateTime(step.completedAt) : '-'}</td>
        </tr>
    `;
  });

  content += `
      </tbody>
    </table>
  </div>
  `;

  if (abnormalSteps.length > 0) {
    content += `
  <div style="margin-bottom: 30px; padding: 15px; background-color: #FFEBE8; border-left: 4px solid #F53F3F;">
    <h3 style="color: #F53F3F; font-size: 16px; margin: 0 0 10px 0;">⚠️ 异常结果说明</h3>
    <ul style="margin: 0; padding-left: 20px; color: #A11919; font-size: 14px;">
      ${abnormalSteps.map(s => `<li>${s.name}: ${s.result} - ${s.observation}</li>`).join('')}
    </ul>
  </div>
    `;
  }

  content += `
  <div style="margin-bottom: 30px;">
    <h2 style="color: #1D2129; font-size: 18px; border-left: 4px solid #165DFF; padding-left: 12px; margin-bottom: 15px;">结论</h2>
    <p style="font-size: 14px; color: #1D2129; line-height: 1.8;">${sample.description || '本次检测结果仅供参考，具体诊断请结合临床。'}</p>
  </div>

  <div style="margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end;">
    <div style="font-size: 14px; color: #4E5969;">
      <p>报告生成时间: ${formatDateTime(new Date())}</p>
      <p>检测人员签字: _______________</p>
      <p>审核人员签字: _______________</p>
    </div>
    ${hasElectronicSeal ? `
    <div style="text-align: center;">
      <div style="width: 120px; height: 120px; border: 3px solid #F53F3F; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #F53F3F; font-weight: bold; font-size: 14px; transform: rotate(-15deg);">
        实验室<br/>专用章
      </div>
    </div>
    ` : ''}
  </div>

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E6EB; text-align: center; color: #86909C; font-size: 12px;">
    <p>本报告仅对送检样品负责，未经实验室书面批准不得复制</p>
    <p>地址：实验室地址 | 电话：000-00000000 | 邮编：000000</p>
  </div>
</div>
  `;

  return content;
}
