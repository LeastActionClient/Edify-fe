import React, { useRef, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Printer, Download, X, Clock, User, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { toastSuccess, toastError } from '../../services/toastService';

export default function PrintableTimetables({
  isOpen,
  onClose,
  printType = 'class', // 'class' | 'teacher' | 'all-classes'
  printData,
  academicYear
}) {
  const [downloading, setDownloading] = useState(false);
  const printableAreaRef = useRef(null);

  if (!isOpen || !printData) return null;

  // Browser Direct Print Logic
  const handlePrint = () => {
    const printContent = printableAreaRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toastError('Pop-up blocked! Please allow pop-ups to print timetable.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Edify School Timetable - ${printType.toUpperCase()}</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 10mm;
            }
            body {
              font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #111827;
              margin: 0;
              padding: 0;
              background: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .print-container {
              width: 100%;
              page-break-after: always;
            }
            .print-container:last-child {
              page-break-after: avoid;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 12px;
            }
            th, td {
              border: 1px solid #94a3b8;
              padding: 6px 8px;
              text-align: left;
              font-size: 11px;
            }
            th {
              background-color: #f1f5f9 !important;
              font-weight: 700;
              text-transform: uppercase;
              color: #334155;
            }
            .break-cell {
              background-color: #fef3c7 !important;
              color: #92400e;
              font-weight: bold;
              text-align: center;
            }
            .school-header {
              text-align: center;
              border-bottom: 2px solid #2563eb;
              padding-bottom: 8px;
              margin-bottom: 12px;
            }
            .school-title {
              font-size: 18px;
              font-weight: 800;
              color: #1e3a8a;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .doc-subtitle {
              font-size: 13px;
              font-weight: 700;
              color: #1e293b;
              margin-top: 3px;
            }
            .meta-bar {
              font-size: 11px;
              color: #475569;
              display: flex;
              justify-content: space-between;
              margin-top: 4px;
            }
            .subject-badge {
              display: inline-block;
              font-weight: 700;
              color: #0f172a;
              font-size: 11px;
            }
            .teacher-line {
              font-size: 10px;
              color: #475569;
              margin-top: 2px;
            }
            .free-badge {
              color: #059669;
              font-weight: 700;
              font-size: 10px;
              text-transform: uppercase;
            }
            .sign-row {
              margin-top: 35px;
              display: flex;
              justify-content: space-between;
              padding: 0 30px;
            }
            .sign-col {
              border-top: 1px solid #64748b;
              width: 140px;
              text-align: center;
              font-size: 10px;
              font-weight: 700;
              padding-top: 4px;
              color: #334155;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  // PDF Generation Logic (Landscape A4)
  const handleDownloadPDF = async () => {
    const printContent = printableAreaRef.current;
    if (!printContent) return;

    setDownloading(true);
    try {
      const canvas = await html2canvas(printContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = 297; // A4 landscape width in mm
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 5, pdfWidth, Math.min(200, pdfHeight));

      const filename =
        printType === 'class'
          ? `Timetable_Class_${(printData?.timetable?.className || 'Schedule').replace(/\s+/g, '_')}.pdf`
          : printType === 'teacher'
          ? `Timetable_Teacher_${(printData?.teacher?.name || 'Faculty').replace(/\s+/g, '_')}.pdf`
          : `All_Classes_Timetables_${academicYear.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

      pdf.save(filename);
      toastSuccess('Timetable PDF downloaded successfully!');
    } catch (err) {
      console.error('Error generating PDF:', err);
      toastError('Failed to generate Timetable PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Print / Export Timetable (${printType.toUpperCase()})`}
      className="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Action Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-xs text-gray-600">
            Preview formatted for <strong>Landscape A4 Printing</strong> with school letterhead and verification signatures.
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer size={15} className="mr-1.5 text-gray-700" />
              Print Directly
            </Button>
            <Button
              size="sm"
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              <Download size={15} className="mr-1.5" />
              {downloading ? 'Rendering PDF...' : 'Download PDF'}
            </Button>
          </div>
        </div>

        {/* Printable Document Sheet Preview */}
        <div className="border border-gray-300 rounded-lg p-6 bg-white max-h-[60vh] overflow-y-auto shadow-inner">
          <div ref={printableAreaRef}>
            {/* 1. CLASS TIMETABLE PRINT */}
            {printType === 'class' && (
              <div className="print-container">
                <div className="school-header text-center border-b-2 border-blue-600 pb-2 mb-3">
                  <div className="text-lg font-extrabold text-blue-900 tracking-wide uppercase">
                    Edify School
                  </div>
                  <div className="text-xs font-bold text-gray-800 mt-0.5">
                    CLASS TIMETABLE: {printData.timetable?.className}{' '}
                    {printData.timetable?.sectionName ? `(SECTION ${printData.timetable.sectionName})` : ''}
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-600 mt-1">
                    <span>Academic Year: {academicYear}</span>
                    <span>Status: {printData.timetable?.isPublished ? 'OFFICIAL / PUBLISHED' : 'DRAFT'}</span>
                    <span>Generated: {new Date().toLocaleDateString('en-GB')}</span>
                  </div>
                </div>

                <table className="w-full border-collapse text-xs mt-3">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-400 p-1.5 text-left w-28">Period / Time</th>
                      {(printData.config?.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']).map(
                        (d) => (
                          <th key={d} className="border border-gray-400 p-1.5 text-center font-bold">
                            {d}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {(printData.config?.periods || []).map((p) => {
                      if (p.isBreak) {
                        return (
                          <tr key={p.periodNumber} className="bg-amber-50">
                            <td className="border border-gray-400 p-1.5 font-bold text-amber-900">
                              {p.name} ({p.startTime} - {p.endTime})
                            </td>
                            <td
                              colSpan={printData.config?.workingDays?.length || 6}
                              className="border border-gray-400 p-1.5 text-center font-bold text-amber-800 uppercase tracking-wider"
                            >
                              ☕ {p.name}
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={p.periodNumber}>
                          <td className="border border-gray-400 p-1.5 bg-gray-50 font-bold text-gray-800">
                            <div>{p.name}</div>
                            <div className="text-[10px] text-gray-500 font-normal">
                              {p.startTime} - {p.endTime}
                            </div>
                          </td>
                          {(printData.config?.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']).map(
                            (d) => {
                              const entry = (printData.entries || []).find(
                                (e) => e.day === d && Number(e.periodNumber) === Number(p.periodNumber)
                              );
                              return (
                                <td key={d} className="border border-gray-400 p-1.5 align-top">
                                  {entry ? (
                                    <div>
                                      <div className="font-bold text-gray-900 text-xs">
                                        {entry.subjectName}
                                      </div>
                                      <div className="text-[11px] text-gray-600 mt-0.5">
                                        {entry.teacherName}
                                      </div>
                                      {entry.room && (
                                        <div className="text-[9px] text-gray-400">Rm: {entry.room}</div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-gray-300 text-center py-2 text-[10px]">-</div>
                                  )}
                                </td>
                              );
                            }
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="sign-row flex justify-between mt-10 px-8 text-xs font-bold text-gray-700">
                  <div className="border-t border-gray-500 w-36 text-center pt-1">Class Teacher</div>
                  <div className="border-t border-gray-500 w-36 text-center pt-1">Timetable Coordinator</div>
                  <div className="border-t border-gray-500 w-36 text-center pt-1">Principal / Head</div>
                </div>
              </div>
            )}

            {/* 2. TEACHER SCHEDULE PRINT */}
            {printType === 'teacher' && (
              <div className="print-container">
                <div className="school-header text-center border-b-2 border-blue-600 pb-2 mb-3">
                  <div className="text-lg font-extrabold text-blue-900 tracking-wide uppercase">
                    Edify School
                  </div>
                  <div className="text-xs font-bold text-gray-800 mt-0.5">
                    FACULTY WEEKLY SCHEDULE: {printData.teacher?.name} ({printData.teacher?.designation || 'Faculty'})
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-600 mt-1">
                    <span>Teacher ID: {printData.teacher?.teacherId || 'N/A'}</span>
                    <span>Academic Year: {academicYear}</span>
                    <span>
                      Workload: {printData.stats?.assignedPeriods} Periods Assigned / {printData.stats?.freePeriods} Free
                    </span>
                  </div>
                </div>

                <table className="w-full border-collapse text-xs mt-3">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-400 p-1.5 text-left w-28">Period / Time</th>
                      {(printData.config?.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']).map(
                        (d) => (
                          <th key={d} className="border border-gray-400 p-1.5 text-center font-bold">
                            {d}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {(printData.config?.periods || []).map((p) => {
                      if (p.isBreak) {
                        return (
                          <tr key={p.periodNumber} className="bg-amber-50">
                            <td className="border border-gray-400 p-1.5 font-bold text-amber-900">
                              {p.name}
                            </td>
                            <td
                              colSpan={printData.config?.workingDays?.length || 6}
                              className="border border-gray-400 p-1.5 text-center font-bold text-amber-800 uppercase"
                            >
                              ☕ {p.name}
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={p.periodNumber}>
                          <td className="border border-gray-400 p-1.5 bg-gray-50 font-bold text-gray-800">
                            <div>{p.name}</div>
                            <div className="text-[10px] text-gray-500 font-normal">
                              {p.startTime} - {p.endTime}
                            </div>
                          </td>
                          {(printData.config?.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']).map(
                            (d) => {
                              const entry = printData.schedule?.[d]?.[p.periodNumber];
                              return (
                                <td key={d} className="border border-gray-400 p-1.5 align-top">
                                  {entry ? (
                                    <div>
                                      <div className="font-bold text-gray-900 text-xs">
                                        {entry.className} {entry.sectionName ? `(Sec ${entry.sectionName})` : ''}
                                      </div>
                                      <div className="text-[11px] text-blue-700 font-semibold mt-0.5">
                                        {entry.subjectName}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-emerald-700 font-bold text-[10px] text-center py-2 bg-emerald-50/50 rounded">
                                      FREE PERIOD
                                    </div>
                                  )}
                                </td>
                              );
                            }
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="sign-row flex justify-between mt-10 px-8 text-xs font-bold text-gray-700">
                  <div className="border-t border-gray-500 w-36 text-center pt-1">Teacher Signature</div>
                  <div className="border-t border-gray-500 w-36 text-center pt-1">Timetable Coordinator</div>
                  <div className="border-t border-gray-500 w-36 text-center pt-1">Principal</div>
                </div>
              </div>
            )}

            {/* 3. ALL CLASSES CONSOLIDATED PRINT */}
            {printType === 'all-classes' && (
              <div className="space-y-8">
                {(printData.timetables || []).map((tt, index) => (
                  <div key={tt._id} className="print-container border-b-2 border-gray-300 pb-8 last:border-b-0">
                    <div className="school-header text-center border-b-2 border-blue-600 pb-2 mb-3">
                      <div className="text-lg font-extrabold text-blue-900 tracking-wide uppercase">
                        Edify School
                      </div>
                      <div className="text-xs font-bold text-gray-800 mt-0.5">
                        CLASS TIMETABLE: {tt.className} {tt.sectionName ? `(SECTION ${tt.sectionName})` : ''}
                      </div>
                      <div className="flex justify-between text-[11px] text-gray-600 mt-1">
                        <span>Academic Year: {academicYear}</span>
                        <span>Status: {tt.isPublished ? 'OFFICIAL / PUBLISHED' : 'DRAFT'}</span>
                        <span>Class {index + 1} of {printData.timetables.length}</span>
                      </div>
                    </div>

                    <table className="w-full border-collapse text-xs mt-3">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-400 p-1.5 text-left w-28">Period / Time</th>
                          {(printData.config?.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']).map(
                            (d) => (
                              <th key={d} className="border border-gray-400 p-1.5 text-center font-bold">
                                {d}
                              </th>
                            )
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {(printData.config?.periods || []).map((p) => {
                          if (p.isBreak) {
                            return (
                              <tr key={p.periodNumber} className="bg-amber-50">
                                <td className="border border-gray-400 p-1.5 font-bold text-amber-900">
                                  {p.name}
                                </td>
                                <td
                                  colSpan={printData.config?.workingDays?.length || 6}
                                  className="border border-gray-400 p-1.5 text-center font-bold text-amber-800 uppercase"
                                >
                                  ☕ {p.name}
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr key={p.periodNumber}>
                              <td className="border border-gray-400 p-1.5 bg-gray-50 font-bold text-gray-800">
                                <div>{p.name}</div>
                                <div className="text-[10px] text-gray-500 font-normal">
                                  {p.startTime} - {p.endTime}
                                </div>
                              </td>
                              {(printData.config?.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']).map(
                                (d) => {
                                  const entry = (tt.entries || []).find(
                                    (e) => e.day === d && Number(e.periodNumber) === Number(p.periodNumber)
                                  );
                                  return (
                                    <td key={d} className="border border-gray-400 p-1.5 align-top">
                                      {entry ? (
                                        <div>
                                          <div className="font-bold text-gray-900 text-xs">
                                            {entry.subjectName}
                                          </div>
                                          <div className="text-[11px] text-gray-600 mt-0.5">
                                            {entry.teacherName}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-gray-300 text-center py-2 text-[10px]">-</div>
                                      )}
                                    </td>
                                  );
                                }
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
