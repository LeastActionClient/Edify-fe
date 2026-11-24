import React, { useState, useEffect, useRef, useMemo } from 'react';
import Select from 'react-select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { PageLoader } from '../components/ui/Spinner';
import {
  Award,
  Printer,
  Download,
  Search,
  RefreshCw,
  User,
  FileCheck,
  Calendar,
  CheckCircle,
  FileText,
  Trash2,
  Eye,
  Sliders,
  Sparkles
} from 'lucide-react';
import BonafideCertificateCard from '../components/BonafideCertificateCard';
import api from '../services/api';
import { toastError, toastSuccess, toastWarning, toastInfo } from '../services/toastService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

const BonafideCertificate = () => {
  // Data lists
  const [students, setStudents] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [issuedCertificates, setIssuedCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active view tab: 'generator' | 'history'
  const [activeTab, setActiveTab] = useState('generator');

  // Selected student
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('');

  // Processing states
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [printingCert, setPrintingCert] = useState(false);
  const [savingRecord, setSavingRecord] = useState(false);

  // Display modes
  const [isBlankMode, setIsBlankMode] = useState(false);
  const [wordingPreset, setWordingPreset] = useState('personalized'); // 'personalized' | 'template'
  const [logoType, setLogoType] = useState('crest'); // 'crest' (official school crest) | 'circle' (circular badge)
  const [zoomLevel, setZoomLevel] = useState(0.58); // Preview zoom (fit nicely on desktop without side clip)

  // Printable & PDF refs
  const certificateRef = useRef(null);
  const pdfExportRef = useRef(null);
  const printContainerRef = useRef(null);

  // Certificate Editable Form State
  const [certData, setCertData] = useState({
    serialNo: '',
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    studentName: '',
    salutation: 'Master',
    relation: 'son of',
    parentSalutation: 'Mr',
    parentName: '',
    statusText: 'studying in',
    verb: 'is a',
    classGrade: '',
    academicYear: '',
    dateOfBirth: '',
    additionalText: ''
  });

  // Fetch initial data: Students, Academic Years, Classes, Next Serial, and Issued History
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [studentsRes, yearsRes, classesRes, serialRes, certsRes] = await Promise.all([
          api.get('/students', { skipToast: true }),
          api.get('/academic-years', { skipToast: true }),
          api.get('/classes', { skipToast: true }),
          api.get('/bonafide-certificates/next-serial', { skipToast: true }).catch(() => ({ data: {} })),
          api.get('/bonafide-certificates', { skipToast: true }).catch(() => ({ data: { certificates: [] } }))
        ]);

        if (!isMounted) return;

        const studentList = studentsRes.data?.students || studentsRes.data || [];
        setStudents(studentList);

        const yearList = yearsRes.data?.academicYears || yearsRes.data || [];
        setAcademicYears(yearList);

        const classList = classesRes.data?.classes || classesRes.data || [];
        setClasses(classList);

        const certList = certsRes.data?.certificates || [];
        setIssuedCertificates(certList);

        // Active Academic Year
        const activeYear = yearList.find(y => y.status === 'ACTIVE')?.year || `${new Date().getFullYear()} - ${new Date().getFullYear() + 1}`;
        const autoSerial = serialRes.data?.serialNo || serialRes.data?.shortSerialNo || '001';

        setCertData(prev => ({
          ...prev,
          serialNo: autoSerial,
          academicYear: activeYear
        }));
      } catch (err) {
        console.error('Error loading bonafide data:', err);
        toastError('Failed to load student data for certificates.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Format Date utility
  const formatDateToDisplay = (dateVal) => {
    if (!dateVal) return '';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return String(dateVal);
    }
  };

  // Convert grade string to clean Grade label e.g., "Grade II" or "Grade 2"
  const formatGradeString = (className, section) => {
    if (!className) return '';
    let clean = className.trim();
    if (!clean.toLowerCase().startsWith('grade') && !clean.toLowerCase().startsWith('class')) {
      clean = `Grade ${clean}`;
    }
    if (section && section.trim() && !clean.includes(section)) {
      clean = `${clean} - ${section.trim()}`;
    }
    return clean;
  };

  // When a student is selected from dropdown, automatically populate details
  const handleStudentSelect = (studentId) => {
    setSelectedStudentId(studentId);
    if (!studentId) return;

    const student = students.find(s => (s._id || s.id) === studentId);
    if (!student) return;

    const isFemale = (student.gender || '').toLowerCase() === 'female' || (student.gender || '').toLowerCase() === 'girl';
    const autoSalutation = isFemale ? 'Miss' : 'Master';
    const autoRelation = isFemale ? 'daughter of' : 'son of';
    const autoParentName = student.fatherName || student.motherName || student.guardianName || '';
    const autoParentSalutation = student.fatherName ? 'Mr' : (student.motherName ? 'Mrs' : 'Mr');
    const autoClass = formatGradeString(student.currentClass, student.section);
    const autoDob = formatDateToDisplay(student.dateOfBirth);
    const autoYear = student.academicYear || certData.academicYear;

    setCertData(prev => ({
      ...prev,
      studentName: student.studentName || '',
      salutation: wordingPreset === 'template' ? 'Master/Miss.' : autoSalutation,
      relation: wordingPreset === 'template' ? 'son/daughter of' : autoRelation,
      parentSalutation: wordingPreset === 'template' ? 'Mr / Mrs' : autoParentSalutation,
      parentName: autoParentName,
      statusText: wordingPreset === 'template' ? 'studying in / last studied in' : 'studying in',
      verb: wordingPreset === 'template' ? 'is/ was a' : 'is a',
      classGrade: autoClass,
      academicYear: autoYear,
      dateOfBirth: autoDob
    }));

    toastSuccess(`Loaded details for ${student.studentName}`);
  };

  // Switch wording preset between Exact Template and Personalized
  const handleToggleWordingPreset = (preset) => {
    setWordingPreset(preset);
    const selectedStudent = students.find(s => (s._id || s.id) === selectedStudentId);
    const isFemale = selectedStudent && ((selectedStudent.gender || '').toLowerCase() === 'female' || (selectedStudent.gender || '').toLowerCase() === 'girl');

    if (preset === 'template') {
      setCertData(prev => ({
        ...prev,
        salutation: 'Master/Miss.',
        relation: 'son/daughter of',
        parentSalutation: 'Mr / Mrs',
        statusText: 'studying in / last studied in',
        verb: 'is/ was a'
      }));
    } else {
      setCertData(prev => ({
        ...prev,
        salutation: isFemale ? 'Miss' : 'Master',
        relation: isFemale ? 'daughter of' : 'son of',
        parentSalutation: 'Mr',
        statusText: 'studying in',
        verb: 'is a'
      }));
    }
  };

  // Filter students for dropdown
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchClass = !selectedClassFilter || s.currentClass === selectedClassFilter;
      const matchSection = !selectedSectionFilter || s.section === selectedSectionFilter;
      return matchClass && matchSection;
    });
  }, [students, selectedClassFilter, selectedSectionFilter]);

  // React-select options
  const studentOptions = useMemo(() => {
    return filteredStudents.map(s => ({
      value: s._id || s.id,
      label: `${s.studentName} — Adm: ${s.admissionNumber || 'N/A'} (Class ${s.currentClass || ''} ${s.section || ''})`,
      student: s
    }));
  }, [filteredStudents]);

  // Unique sections for filter
  const uniqueSections = useMemo(() => {
    if (!selectedClassFilter) return [];
    const secSet = new Set();
    students.forEach(s => {
      if (s.currentClass === selectedClassFilter && s.section) {
        secSet.add(s.section);
      }
    });
    return Array.from(secSet).sort();
  }, [students, selectedClassFilter]);

  // Refresh serial number from backend
  const handleRefreshSerial = async () => {
    try {
      const res = await api.get('/bonafide-certificates/next-serial', { skipToast: true });
      if (res.data?.serialNo) {
        setCertData(prev => ({ ...prev, serialNo: res.data.serialNo }));
        toastInfo(`Assigned next Serial Number: ${res.data.serialNo}`);
      }
    } catch {
      toastWarning('Could not fetch auto-serial number.');
    }
  };

  // Save certificate generation record to backend
  const handleSaveRecord = async (silent = false) => {
    if (!selectedStudentId) {
      if (!silent) toastWarning('Please select a student before saving.');
      return;
    }
    try {
      setSavingRecord(true);
      const student = students.find(s => (s._id || s.id) === selectedStudentId);
      const payload = {
        studentId: selectedStudentId,
        admissionNumber: student?.admissionNumber || '',
        serialNo: certData.serialNo,
        certificateDate: new Date(),
        studentName: certData.studentName,
        salutation: certData.salutation,
        relation: certData.relation,
        parentSalutation: certData.parentSalutation,
        parentName: certData.parentName,
        statusText: certData.statusText,
        classGrade: certData.classGrade,
        academicYear: certData.academicYear,
        dateOfBirth: certData.dateOfBirth,
        additionalText: certData.additionalText
      };

      const res = await api.post('/bonafide-certificates', payload);
      if (res.data?.certificate) {
        setIssuedCertificates(prev => [res.data.certificate, ...prev]);
        if (!silent) toastSuccess('Bonafide certificate record saved to database.');
      }
    } catch (err) {
      console.error('Error saving certificate record:', err);
      if (!silent) toastError('Failed to record certificate in database.');
    } finally {
      setSavingRecord(false);
    }
  };

  // High Quality PDF Download (Rendered from dedicated unscaled container)
  const handleDownloadPdf = async () => {
    const exportEl = pdfExportRef.current || certificateRef.current;
    if (!exportEl) {
      toastError('Certificate preview element not ready.');
      return;
    }

    try {
      setGeneratingPdf(true);
      toastInfo('Rendering high-resolution A4 landscape certificate...');

      // 1. Ensure web fonts are completely ready before rendering
      if (document.fonts) {
        await document.fonts.ready;
      }

      // 2. Ensure all images are fully loaded with dimensions
      const images = Array.from(exportEl.querySelectorAll('img'));
      await Promise.all(
        images.map(img => {
          if (img.complete && img.naturalWidth > 0) return Promise.resolve();
          return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve;
            setTimeout(resolve, 2000);
          });
        })
      );

      // Brief layout pause for DOM paint
      await new Promise(r => setTimeout(r, 150));

      // 3. Render unscaled canvas at 2.5x scale for razor-sharp typography
      const canvas = await html2canvas(exportEl, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);

      // 4. Create A4 Landscape PDF (297mm x 210mm)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210, undefined, 'FAST');

      const cleanStudent = (certData.studentName || 'Student').trim().replace(/[^a-zA-Z0-9]/g, '_');
      const cleanSerial = (certData.serialNo || '001').trim().replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Bonafide_Certificate_${cleanStudent}_${cleanSerial}.pdf`;

      pdf.save(filename);
      toastSuccess(`Certificate PDF downloaded: ${filename}`);

      // Auto-save record
      if (selectedStudentId) {
        handleSaveRecord(true);
      }
    } catch (err) {
      console.error('Error exporting certificate PDF:', err);
      toastError('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  // High Quality Native & Cross-Browser Print
  const handlePrint = async () => {
    const exportEl = pdfExportRef.current || certificateRef.current;
    if (!exportEl) {
      toastError('Certificate element not available for printing.');
      return;
    }

    try {
      setPrintingCert(true);

      const images = Array.from(exportEl.querySelectorAll('img'));
      await Promise.all(
        images.map(img => (img.complete && img.naturalWidth > 0 ? Promise.resolve() : new Promise(res => {
          img.onload = res;
          img.onerror = res;
          setTimeout(res, 2000);
        })))
      );

      const targetHtml = exportEl.innerHTML;

      const printWindow = window.open('', '_blank', 'width=1120,height=800');
      if (!printWindow) {
        // Fallback to window.print if popup blocked
        window.print();
        setPrintingCert(false);
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Bonafide Certificate - ${certData.studentName || 'Stanford Park'}</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&display=swap" rel="stylesheet">
            <style>
              @page {
                size: A4 landscape;
                margin: 0;
              }
              * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                width: 297mm;
                height: 210mm;
                overflow: hidden;
              }
              .bonafide-certificate-page {
                width: 297mm !important;
                height: 210mm !important;
                max-width: 297mm !important;
                max-height: 210mm !important;
                box-sizing: border-box !important;
                margin: 0 !important;
                padding: 10mm 15mm 10mm 15mm !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                overflow: hidden !important;
              }
            </style>
          </head>
          <body>
            <div class="bonafide-certificate-page">
              ${targetHtml}
            </div>
            <script>
              window.onload = function() {
                const imgs = Array.from(document.images);
                Promise.all(imgs.map(function(img) {
                  return img.complete ? Promise.resolve() : new Promise(function(r) {
                    img.onload = r;
                    img.onerror = r;
                    setTimeout(r, 2000);
                  });
                })).then(function() {
                  setTimeout(function() {
                    window.focus();
                    window.print();
                    window.close();
                  }, 400);
                });
              };
            </script>
          </body>
        </html>
      `);

      printWindow.document.close();

      // Auto-save record
      if (selectedStudentId) {
        handleSaveRecord(true);
      }
    } catch (err) {
      console.error('Error printing certificate:', err);
      toastError('Failed to initiate print.');
    } finally {
      setPrintingCert(false);
    }
  };

  // Delete certificate from history
  const handleDeleteHistory = async (certId) => {
    if (!window.confirm('Are you sure you want to delete this certificate record?')) return;
    try {
      await api.delete(`/bonafide-certificates/${certId}`);
      setIssuedCertificates(prev => prev.filter(c => c._id !== certId));
      toastSuccess('Certificate record deleted.');
    } catch (err) {
      console.error('Error deleting certificate record:', err);
      toastError('Failed to delete certificate record.');
    }
  };

  if (loading) {
    return <PageLoader text="Loading Bonafide Certificate Generator..." />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Print Specific CSS to isolate certificate */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          html, body {
            width: 297mm !important;
            height: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          .print-direct-certificate, .print-direct-certificate * {
            visibility: visible !important;
          }
          .print-direct-certificate {
            display: block !important;
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 297mm !important;
            height: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            z-index: 999999 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-blue-50 text-blue-700 shadow-xs border border-blue-100">
              <Award className="h-7 w-7" />
            </span>
            Bonafide Certificate Generator
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Dynamic Stanford Park Edify School Bonafide Certificate with live preview, A4 landscape printing, and high-resolution PDF download.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={printingCert}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold shadow-xs flex items-center gap-2"
          >
            <Printer size={16} />
            {printingCert ? 'Preparing Print...' : 'Print A4'}
          </Button>

          <Button
            onClick={handleDownloadPdf}
            disabled={generatingPdf}
            className="bg-[#00599c] hover:bg-[#004880] text-white font-semibold shadow-xs flex items-center gap-2"
          >
            <Download size={16} className={generatingPdf ? 'animate-bounce' : ''} />
            {generatingPdf ? 'Generating PDF...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-gray-200 no-print">
        <button
          onClick={() => setActiveTab('generator')}
          className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'generator'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Sparkles size={16} />
          Certificate Generator & Live Preview
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText size={16} />
          Issued Certificates History
          {issuedCertificates.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-bold">
              {issuedCertificates.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'generator' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= LEFT COLUMN: CONTROLS & FORM (5 COLS) ================= */}
          <div className="lg:col-span-5 space-y-5 no-print">
            {/* Student Search & Select Card */}
            <Card className="shadow-xs border-gray-200">
              <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/70 rounded-t-xl">
                <CardTitle className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User size={16} className="text-blue-600" />
                    Select Student
                  </span>
                  <span className="text-xs normal-case font-normal text-gray-500">
                    {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} available
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3.5">
                {/* Optional Class & Section Filters */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Filter Class</Label>
                    <select
                      value={selectedClassFilter}
                      onChange={(e) => {
                        setSelectedClassFilter(e.target.value);
                        setSelectedSectionFilter('');
                      }}
                      className="w-full text-xs h-9 rounded-lg border border-gray-300 bg-white px-2.5 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Classes</option>
                      {classes.map(c => (
                        <option key={c._id || c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Filter Section</Label>
                    <select
                      value={selectedSectionFilter}
                      onChange={(e) => setSelectedSectionFilter(e.target.value)}
                      disabled={!selectedClassFilter}
                      className="w-full text-xs h-9 rounded-lg border border-gray-300 bg-white px-2.5 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <option value="">All Sections</option>
                      {uniqueSections.map(sec => (
                        <option key={sec} value={sec}>{sec}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* React-Select Searchable Student Dropdown */}
                <div>
                  <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                    Student Search (Name or Admission Number) <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    options={studentOptions}
                    value={studentOptions.find(o => o.value === selectedStudentId) || null}
                    onChange={(opt) => handleStudentSelect(opt ? opt.value : '')}
                    placeholder="Search by student name or admission number..."
                    isClearable
                    isSearchable
                    className="text-sm"
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        borderColor: state.isFocused ? '#2563eb' : '#d1d5db',
                        boxShadow: state.isFocused ? '0 0 0 2px rgba(37,99,235,0.2)' : 'none',
                        borderRadius: '0.5rem',
                        minHeight: '40px'
                      })
                    }}
                  />
                </div>

                {/* Quick Blank Toggle & Preset Switch */}
                <div className="pt-2 flex items-center justify-between border-t border-gray-100 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={isBlankMode}
                      onChange={(e) => setIsBlankMode(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span>Blank Certificate Mode (Empty Lines)</span>
                  </label>

                  <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => handleToggleWordingPreset('personalized')}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                        wordingPreset === 'personalized' ? 'bg-white shadow-xs text-blue-700' : 'text-gray-600'
                      }`}
                    >
                      Personalized
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleWordingPreset('template')}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                        wordingPreset === 'template' ? 'bg-white shadow-xs text-blue-700' : 'text-gray-600'
                      }`}
                    >
                      Template
                    </button>
                  </div>
                </div>

                {/* School Logo Asset Choice */}
                <div className="pt-2 flex items-center justify-between border-t border-gray-100 text-xs">
                  <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                    <Award size={14} className="text-blue-600" /> School Logo:
                  </span>
                  <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setLogoType('crest')}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                        logoType === 'crest' ? 'bg-white shadow-xs text-blue-700' : 'text-gray-600 hover:text-gray-900'
                      }`}
                      title="Official Stanford Park Crest Logo"
                    >
                      Official Logo
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoType('circle')}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                        logoType === 'circle' ? 'bg-white shadow-xs text-blue-700' : 'text-gray-600 hover:text-gray-900'
                      }`}
                      title="Circular Badge Logo"
                    >
                      Circular Badge
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Editable Details Form Card */}
            <Card className="shadow-xs border-gray-200">
              <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/70 rounded-t-xl">
                <CardTitle className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Sliders size={16} className="text-blue-600" />
                    Editable Certificate Fields
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (selectedStudentId) {
                        handleStudentSelect(selectedStudentId);
                      }
                    }}
                    className="text-xs text-blue-600 h-7 px-2 hover:bg-blue-50"
                  >
                    <RefreshCw size={12} className="mr-1" /> Reset Fields
                  </Button>
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-4 space-y-4 text-xs">
                {/* Row 1: Serial No & Certificate Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-gray-700 mb-1 flex items-center justify-between">
                      <span>Serial Number</span>
                      <button
                        type="button"
                        onClick={handleRefreshSerial}
                        className="text-[10px] text-blue-600 hover:underline"
                      >
                        Auto-Gen
                      </button>
                    </Label>
                    <Input
                      value={certData.serialNo}
                      onChange={(e) => setCertData({ ...certData, serialNo: e.target.value })}
                      placeholder="e.g. 001 or SPES/BC/2026-27/001"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-700 mb-1 block">Certificate Date</Label>
                    <Input
                      value={certData.date}
                      onChange={(e) => setCertData({ ...certData, date: e.target.value })}
                      placeholder="DD/MM/YYYY"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                {/* Row 2: Salutation & Student Name */}
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-4">
                    <Label className="text-xs font-medium text-gray-700 mb-1 block">Salutation</Label>
                    <select
                      value={certData.salutation}
                      onChange={(e) => setCertData({ ...certData, salutation: e.target.value })}
                      className="w-full text-xs h-9 rounded-lg border border-gray-300 bg-white px-2 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Master">Master</option>
                      <option value="Miss">Miss</option>
                      <option value="Master/Miss.">Master/Miss.</option>
                    </select>
                  </div>

                  <div className="col-span-8">
                    <Label className="text-xs font-medium text-gray-700 mb-1 block">
                      Student Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={certData.studentName}
                      onChange={(e) => setCertData({ ...certData, studentName: e.target.value })}
                      placeholder="Student full name"
                      className="h-9 text-xs font-bold text-gray-800 uppercase"
                    />
                  </div>
                </div>

                {/* Row 3: Relation, Parent Salutation & Parent Name */}
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-4">
                    <Label className="text-xs font-medium text-gray-700 mb-1 block">Relation</Label>
                    <select
                      value={certData.relation}
                      onChange={(e) => setCertData({ ...certData, relation: e.target.value })}
                      className="w-full text-xs h-9 rounded-lg border border-gray-300 bg-white px-2 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="son of">son of</option>
                      <option value="daughter of">daughter of</option>
                      <option value="son/daughter of">son/daughter of</option>
                    </select>
                  </div>

                  <div className="col-span-3">
                    <Label className="text-xs font-medium text-gray-700 mb-1 block">Parent Title</Label>
                    <select
                      value={certData.parentSalutation}
                      onChange={(e) => setCertData({ ...certData, parentSalutation: e.target.value })}
                      className="w-full text-xs h-9 rounded-lg border border-gray-300 bg-white px-2 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Mr / Mrs">Mr / Mrs</option>
                      <option value="Mr. & Mrs.">Mr. & Mrs.</option>
                    </select>
                  </div>

                  <div className="col-span-5">
                    <Label className="text-xs font-medium text-gray-700 mb-1 block">Parent Name</Label>
                    <Input
                      value={certData.parentName}
                      onChange={(e) => setCertData({ ...certData, parentName: e.target.value })}
                      placeholder="Father / Mother Name"
                      className="h-9 text-xs font-semibold text-gray-800 uppercase"
                    />
                  </div>
                </div>

                {/* Row 4: Status (Studying in / Last studied in) & Verb (is / was) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-gray-700 mb-1 block">Enrollment Status</Label>
                    <select
                      value={certData.statusText}
                      onChange={(e) => setCertData({ ...certData, statusText: e.target.value })}
                      className="w-full text-xs h-9 rounded-lg border border-gray-300 bg-white px-2 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="studying in">studying in</option>
                      <option value="last studied in">last studied in</option>
                      <option value="studying in / last studied in">studying in / last studied in</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-700 mb-1 block">Verb</Label>
                    <select
                      value={certData.verb}
                      onChange={(e) => setCertData({ ...certData, verb: e.target.value })}
                      className="w-full text-xs h-9 rounded-lg border border-gray-300 bg-white px-2 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="is a">is a</option>
                      <option value="was a">was a</option>
                      <option value="is/ was a">is/ was a</option>
                    </select>
                  </div>
                </div>

                {/* Row 5: Grade / Class & Academic Year */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-gray-700 mb-1 block">Grade / Class</Label>
                    <Input
                      value={certData.classGrade}
                      onChange={(e) => setCertData({ ...certData, classGrade: e.target.value })}
                      placeholder="e.g. Grade II or Class 2 - A"
                      className="h-9 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-700 mb-1 block">Academic Year</Label>
                    <Input
                      value={certData.academicYear}
                      onChange={(e) => setCertData({ ...certData, academicYear: e.target.value })}
                      placeholder="e.g. 2026 - 2027"
                      className="h-9 text-xs font-semibold"
                    />
                  </div>
                </div>

                {/* Row 6: Date of Birth & Additional Text */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-gray-700 mb-1 block">Date of Birth</Label>
                    <Input
                      value={certData.dateOfBirth}
                      onChange={(e) => setCertData({ ...certData, dateOfBirth: e.target.value })}
                      placeholder="e.g. 01/01/2019"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-700 mb-1 block">Additional Note (Optional)</Label>
                    <Input
                      value={certData.additionalText}
                      onChange={(e) => setCertData({ ...certData, additionalText: e.target.value })}
                      placeholder="e.g. For Passport Purpose"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                {/* Bottom Action Strip */}
                <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSaveRecord(false)}
                    disabled={savingRecord || !selectedStudentId}
                    className="text-xs text-gray-700 border-gray-300 hover:bg-gray-50 flex items-center gap-1.5"
                  >
                    <CheckCircle size={14} className="text-green-600" />
                    {savingRecord ? 'Saving...' : 'Save to History'}
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handlePrint}
                      className="text-xs bg-gray-800 hover:bg-black text-white flex items-center gap-1.5"
                    >
                      <Printer size={13} /> Print
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleDownloadPdf}
                      disabled={generatingPdf}
                      className="text-xs bg-[#00599c] hover:bg-[#004880] text-white flex items-center gap-1.5"
                    >
                      <Download size={13} /> PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ================= RIGHT COLUMN: LIVE CERTIFICATE PREVIEW (7 COLS) ================= */}
          <div className="lg:col-span-7 space-y-4">
            {/* Preview Toolbar */}
            <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-2xs no-print">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye size={14} className="text-blue-600" /> Live Certificate Preview (A4 Landscape)
                </span>
                {isBlankMode && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    Blank Form Mode
                  </span>
                )}
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Scale:</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))}
                  className="px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 font-bold"
                >
                  -
                </button>
                <span className="font-mono text-gray-700 w-10 text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.min(1.2, prev + 0.1))}
                  className="px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 font-bold"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(0.58)}
                  className="px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-[11px]"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Scrollable Container with Scaled A4 Landscape Certificate */}
            <div className="bg-gray-200/80 p-4 sm:p-6 rounded-2xl border border-gray-300 shadow-inner flex justify-center items-start overflow-x-auto min-h-[460px]">
              <div
                style={{
                  width: `calc(297mm * ${zoomLevel})`,
                  height: `calc(210mm * ${zoomLevel})`,
                  position: 'relative',
                  flexShrink: 0
                }}
              >
                <div
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'top left',
                    width: '297mm',
                    height: '210mm',
                    position: 'absolute',
                    top: 0,
                    left: 0
                  }}
                  className="shadow-2xl rounded-sm"
                >
                  <BonafideCertificateCard
                    ref={certificateRef}
                    certificateData={certData}
                    isBlank={isBlankMode}
                    logoType={logoType}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= TAB 2: ISSUED CERTIFICATES HISTORY ================= */
        <Card className="shadow-xs border-gray-200">
          <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/70">
            <CardTitle className="text-base font-bold text-gray-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                Issued Bonafide Certificates Records ({issuedCertificates.length})
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {issuedCertificates.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileCheck size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="font-semibold text-gray-700">No Bonafide Certificates recorded yet.</p>
                <p className="text-xs text-gray-400 mt-1">
                  Generate and save a certificate from the Generator tab to see it recorded here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="w-12 text-center">#</TableHead>
                      <TableHead>Serial Number</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Adm No</TableHead>
                      <TableHead>Class / Grade</TableHead>
                      <TableHead>Academic Year</TableHead>
                      <TableHead>Date Issued</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {issuedCertificates.map((cert, idx) => (
                      <TableRow key={cert._id} className="hover:bg-blue-50/40">
                        <TableCell className="text-center font-medium text-gray-500">{idx + 1}</TableCell>
                        <TableCell className="font-mono font-bold text-blue-700 text-xs">
                          {cert.serialNo}
                        </TableCell>
                        <TableCell className="font-bold text-gray-800 uppercase">
                          {cert.studentName}
                        </TableCell>
                        <TableCell className="text-xs text-gray-600 font-mono">
                          {cert.admissionNumber}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-gray-700">
                          {cert.classGrade}
                        </TableCell>
                        <TableCell className="text-xs text-gray-600">
                          {cert.academicYear}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {new Date(cert.certificateDate || cert.createdAt).toLocaleDateString('en-GB')}
                        </TableCell>
                        <TableCell className="text-right space-x-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedStudentId(cert.studentId?._id || cert.studentId);
                              setCertData({
                                serialNo: cert.serialNo,
                                date: new Date(cert.certificateDate).toLocaleDateString('en-GB'),
                                studentName: cert.studentName,
                                salutation: cert.salutation || 'Master',
                                relation: cert.relation || 'son of',
                                parentSalutation: cert.parentSalutation || 'Mr',
                                parentName: cert.parentName || '',
                                statusText: cert.statusText || 'studying in',
                                verb: cert.statusText?.includes('last') ? 'was a' : 'is a',
                                classGrade: cert.classGrade || '',
                                academicYear: cert.academicYear || '',
                                dateOfBirth: cert.dateOfBirth || '',
                                additionalText: cert.additionalText || ''
                              });
                              setActiveTab('generator');
                              toastInfo(`Loaded record for ${cert.studentName}`);
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-2.5 text-xs"
                            title="Load in Editor"
                          >
                            <Eye size={14} className="mr-1" /> View / Edit
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteHistory(cert._id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                            title="Delete Record"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dedicated Offscreen Container for PDF Export (Always unscaled 297mm x 210mm) */}
      <div
        ref={pdfExportRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-99999px',
          top: 0,
          width: '297mm',
          height: '210mm',
          zIndex: -9999,
          backgroundColor: '#ffffff',
          overflow: 'hidden'
        }}
      >
        <BonafideCertificateCard
          certificateData={certData}
          isBlank={isBlankMode}
          logoType={logoType}
        />
      </div>

      {/* Hidden Container for Direct In-Page Print Mode Isolation */}
      <div className="print-direct-certificate hidden">
        <BonafideCertificateCard
          certificateData={certData}
          isBlank={isBlankMode}
          logoType={logoType}
        />
      </div>
    </div>
  );
};

export default BonafideCertificate;
