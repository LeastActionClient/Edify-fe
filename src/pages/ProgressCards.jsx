import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Award, Eye, Download, Printer, Search, RefreshCw, X, User, Edit3, Save, Check } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import Pagination from '../components/ui/Pagination';
import { PageLoader } from '../components/ui/Spinner';
import { toastError, toastSuccess } from '../services/toastService';
import StudentProgressCard from '../components/StudentProgressCard';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

const ProgressCards = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filterYear, setFilterYear] = useState('2025 - 2026');
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterTerm, setFilterTerm] = useState('TERM - II');
  const [filterSearch, setFilterSearch] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Preview Modal State
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewStudent, setPreviewStudent] = useState(null);

  // Edit Marks Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Download & Print States
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [printingCard, setPrintingCard] = useState(false);

  const previewCardRef = useRef(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [classesRes, yearsRes] = await Promise.all([
        api.get('/classes'),
        api.get('/academic-years')
      ]);
      setClasses(classesRes.data || []);
      const years = yearsRes.data || [];
      setAcademicYears(years);
      if (years.length > 0) {
        const activeYear = years.find(y => y.isActive) || years[0];
        setFilterYear(activeYear.year || '2025 - 2026');
      }
      fetchStudents();
    } catch (error) {
      console.error('Error loading initial Progress Cards data:', error);
      toastError('Failed to load filter data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const params = {};
      if (filterYear) params.academicYear = filterYear;
      if (filterClass) params.currentClass = filterClass;
      if (filterSection) params.section = filterSection;
      if (filterTerm) params.term = filterTerm;
      if (filterSearch) params.search = filterSearch;

      const res = await api.get('/progress-cards', { params });
      setStudents(res.data || []);
    } catch (error) {
      console.error('Error fetching progress card students:', error);
      toastError('Error loading students progress list.');
    }
  };

  useEffect(() => {
    fetchStudents();
    setCurrentPage(1);
  }, [filterYear, filterClass, filterSection, filterTerm, filterSearch]);

  const selectedClassObj = classes.find(c => c.name === filterClass);
  const availableSections = selectedClassObj?.sections || [];

  const paginatedStudents = students.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.max(1, Math.ceil(students.length / itemsPerPage));

  // Open Preview
  const handleOpenPreview = (student) => {
    setPreviewStudent(student);
    setIsPreviewModalOpen(true);
  };

  // Open Edit Marks Modal
  const handleOpenEdit = (student) => {
    setEditingStudent(JSON.parse(JSON.stringify(student)));
    setIsEditModalOpen(true);
  };

  const handleScholasticChange = (index, field, value) => {
    const updated = { ...editingStudent };
    updated.scholastic[index][field] = value;

    if (field === 'mark') {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        if (num >= 90) updated.scholastic[index].grade = 'A+';
        else if (num >= 80) updated.scholastic[index].grade = 'A';
        else if (num >= 70) updated.scholastic[index].grade = 'B+';
        else if (num >= 60) updated.scholastic[index].grade = 'B';
        else if (num >= 50) updated.scholastic[index].grade = 'C';
        else updated.scholastic[index].grade = 'D';
      }
      // Recalculate total
      const total = updated.scholastic.reduce((sum, item) => sum + (parseFloat(item.mark) || 0), 0);
      updated.totalMarks = total;
      const avg = total / (updated.scholastic.length || 1);
      if (avg >= 90) updated.overallGrade = 'A+';
      else if (avg >= 80) updated.overallGrade = 'A';
      else if (avg >= 70) updated.overallGrade = 'B+';
      else if (avg >= 60) updated.overallGrade = 'B';
      else if (avg >= 50) updated.overallGrade = 'C';
      else updated.overallGrade = 'D';
    }

    setEditingStudent(updated);
  };

  const handleSaveProgress = async () => {
    if (!editingStudent) return;
    try {
      setSavingEdit(true);
      await api.post('/progress-cards/save', {
        studentId: editingStudent._id,
        academicYear: editingStudent.academicYear || filterYear,
        term: editingStudent.term || filterTerm,
        currentClass: editingStudent.currentClass,
        section: editingStudent.section,
        attendance: editingStudent.attendance,
        healthStatus: editingStudent.healthStatus,
        scholastic: editingStudent.scholastic,
        totalMarks: editingStudent.totalMarks,
        overallGrade: editingStudent.overallGrade,
        coScholastic: editingStudent.coScholastic,
        selfAwareness: editingStudent.selfAwareness,
        teacherRemarks: editingStudent.teacherRemarks
      });
      toastSuccess('Progress card saved successfully!');
      setIsEditModalOpen(false);
      fetchStudents();
      if (previewStudent && previewStudent._id === editingStudent._id) {
        setPreviewStudent(editingStudent);
      }
    } catch (error) {
      console.error('Error saving progress card:', error);
      toastError('Failed to save progress card.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Download Single Student PDF
  const handleDownloadPdf = async (student) => {
    try {
      setDownloadingPdf(true);
      setPreviewStudent(student);
      setIsPreviewModalOpen(true);

      // Allow DOM to settle
      await new Promise(resolve => setTimeout(resolve, 400));

      const cardElement = previewCardRef.current;
      if (!cardElement) {
        toastError('Failed to capture card element.');
        return;
      }

      const canvas = await html2canvas(cardElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`ProgressCard_${student.studentName.replace(/\s+/g, '_')}_${filterTerm}.pdf`);
      toastSuccess('Progress Card PDF downloaded successfully!');
    } catch (error) {
      console.error('Error downloading progress card PDF:', error);
      toastError('Failed to export PDF.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Print Single Student Card
  const handlePrintCard = async (student) => {
    try {
      setPrintingCard(true);
      setPreviewStudent(student);
      setIsPreviewModalOpen(true);

      await new Promise(resolve => setTimeout(resolve, 400));

      const cardElement = previewCardRef.current;
      if (!cardElement) {
        toastError('Failed to capture card element for printing.');
        return;
      }

      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Progress Card - ${student.studentName}</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>
              @page { size: A4 portrait; margin: 10mm; }
              body { margin: 0; background-color: #fff; }
              .progress-card-container { width: 100% !important; box-shadow: none !important; }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            ${cardElement.outerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error('Error printing progress card:', error);
      toastError('Failed to print progress card.');
    } finally {
      setPrintingCard(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Award className="text-[#00599c]" size={28} />
            Student Progress Cards
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Filter by Class and Section, view academic &amp; co-scholastic progress, update marks, and export or print report cards.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setFilterClass('');
            setFilterSection('');
            setFilterSearch('');
            fetchStudents();
          }}
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} /> Reset Filters
        </Button>
      </div>

      {/* Filters Bar */}
      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {/* Academic Year */}
            <div>
              <Label className="text-xs font-bold text-gray-600 mb-1 block">Academic Year</Label>
              <select
                className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00599c]"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
              >
                {academicYears.map((y) => (
                  <option key={y._id} value={y.year}>
                    {y.year}
                  </option>
                ))}
              </select>
            </div>

            {/* Class */}
            <div>
              <Label className="text-xs font-bold text-gray-600 mb-1 block">Class</Label>
              <select
                className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00599c]"
                value={filterClass}
                onChange={(e) => {
                  setFilterClass(e.target.value);
                  setFilterSection('');
                }}
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Section */}
            <div>
              <Label className="text-xs font-bold text-gray-600 mb-1 block">Section</Label>
              <select
                className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00599c]"
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                disabled={!filterClass}
              >
                <option value="">All Sections</option>
                {availableSections.map((s, idx) => (
                  <option key={idx} value={s.name || s}>
                    {s.name || s}
                  </option>
                ))}
              </select>
            </div>

            {/* Term */}
            <div>
              <Label className="text-xs font-bold text-gray-600 mb-1 block">Term / Exam</Label>
              <select
                className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00599c]"
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
              >
                <option value="TERM - I">TERM - I</option>
                <option value="TERM - II">TERM - II</option>
                <option value="TERM - III">TERM - III</option>
                <option value="ANNUAL">ANNUAL</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <Label className="text-xs font-bold text-gray-600 mb-1 block">Search Student</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <Input
                  placeholder="Search Name / Adm No..."
                  className="pl-9 h-10"
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Progress Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 flex justify-center">
              <PageLoader />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-16">
              <Award className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-base font-semibold text-gray-700">No students found matching your criteria</p>
              <p className="text-sm text-gray-400 mt-1">Try selecting a different class, section, or clear your search.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Adm No</TableHead>
                    <TableHead>Class &amp; Sec</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Total Marks</TableHead>
                    <TableHead>Overall Grade</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStudents.map((student, idx) => (
                    <TableRow key={student._id} className="hover:bg-blue-50/30 transition-colors">
                      <TableCell className="text-gray-500 text-xs">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 shrink-0">
                            {student.photoUrl || student.passport_photo ? (
                              <img
                                src={student.photoUrl || student.passport_photo}
                                alt={student.studentName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User size={16} className="text-gray-400" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 block">{student.studentName}</span>
                            <span className="text-xs text-gray-500">Father: {student.fatherName || '-'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold">{student.admissionNumber}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700">
                          {student.currentClass} - {student.section}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-gray-700">{filterTerm}</TableCell>
                      <TableCell className="text-xs font-semibold text-gray-700">
                        {student.attendance?.studentAttendance || 54} / {student.attendance?.totalWorkingDays || 58} days
                      </TableCell>
                      <TableCell className="font-bold text-gray-900">{student.totalMarks ?? 448}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-green-100 text-green-800">
                          {student.overallGrade || 'B'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenPreview(student)}
                            title="View Progress Card"
                            className="text-[#00599c] hover:bg-blue-50"
                          >
                            <Eye size={16} className="mr-1" /> View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(student)}
                            title="Edit Marks & Attendance"
                            className="text-amber-600 hover:bg-amber-50"
                          >
                            <Edit3 size={16} className="mr-1" /> Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePrintCard(student)}
                            title="Print Card"
                            className="text-gray-700 hover:bg-gray-100"
                          >
                            <Printer size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadPdf(student)}
                            title="Download PDF"
                            className="text-indigo-600 hover:bg-indigo-50"
                          >
                            <Download size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {students.length > itemsPerPage && (
            <div className="p-4 border-t border-gray-100">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => setCurrentPage(p)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================= PREVIEW MODAL ================= */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title="Student Progress Report Card Preview"
        maxWidth="max-w-4xl"
      >
        <div className="flex flex-col items-center">
          {/* Top Modal Action Buttons */}
          <div className="w-full flex justify-between items-center pb-4 mb-4 border-b border-gray-200">
            <div className="text-sm text-gray-500">
              Showing preview for <span className="font-bold text-gray-800">{previewStudent?.studentName}</span> ({previewStudent?.currentClass} - {previewStudent?.section})
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePrintCard(previewStudent)}
                disabled={printingCard}
                className="flex items-center gap-1.5"
              >
                <Printer size={16} /> Print
              </Button>
              <Button
                size="sm"
                onClick={() => handleDownloadPdf(previewStudent)}
                disabled={downloadingPdf}
                className="bg-[#00599c] hover:bg-[#004880] text-white flex items-center gap-1.5"
              >
                <Download size={16} /> {downloadingPdf ? 'Exporting...' : 'Download PDF'}
              </Button>
            </div>
          </div>

          {/* Render Actual Progress Card */}
          <div className="w-full overflow-x-auto p-4 bg-gray-100 rounded-lg flex justify-center">
            {previewStudent && (
              <StudentProgressCard ref={previewCardRef} student={previewStudent} />
            )}
          </div>
        </div>
      </Modal>

      {/* ================= EDIT MARKS & ATTENDANCE MODAL ================= */}
      {editingStudent && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Progress Data - ${editingStudent.studentName}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-6 max-h-[75vh] overflow-y-auto px-1">
            {/* Attendance & Health */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 space-y-3">
              <h3 className="font-bold text-sm text-[#00599c] uppercase">Attendance &amp; Health</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs text-gray-600">Total Working Days</Label>
                  <Input
                    type="number"
                    value={editingStudent.attendance?.totalWorkingDays ?? 58}
                    onChange={(e) => {
                      const updated = { ...editingStudent };
                      updated.attendance = { ...updated.attendance, totalWorkingDays: parseInt(e.target.value) || 0 };
                      setEditingStudent(updated);
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Student Attendance</Label>
                  <Input
                    type="number"
                    value={editingStudent.attendance?.studentAttendance ?? 54}
                    onChange={(e) => {
                      const updated = { ...editingStudent };
                      updated.attendance = { ...updated.attendance, studentAttendance: parseInt(e.target.value) || 0 };
                      setEditingStudent(updated);
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Blood Group</Label>
                  <Input
                    value={editingStudent.healthStatus?.bloodGroup || ''}
                    placeholder="e.g. O+ve"
                    onChange={(e) => {
                      const updated = { ...editingStudent };
                      updated.healthStatus = { ...updated.healthStatus, bloodGroup: e.target.value };
                      setEditingStudent(updated);
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Dental Hygiene</Label>
                  <Input
                    value={editingStudent.healthStatus?.dentalHygiene || ''}
                    placeholder="e.g. Good"
                    onChange={(e) => {
                      const updated = { ...editingStudent };
                      updated.healthStatus = { ...updated.healthStatus, dentalHygiene: e.target.value };
                      setEditingStudent(updated);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Scholastic Marks */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white space-y-3">
              <h3 className="font-bold text-sm text-[#00599c] uppercase">Scholastic Subjects &amp; Marks</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs font-bold text-gray-500 uppercase px-2">
                  <div className="col-span-6">Subject</div>
                  <div className="col-span-3 text-center">Marks (out of 100)</div>
                  <div className="col-span-3 text-center">Grade</div>
                </div>
                {editingStudent.scholastic?.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded">
                    <div className="col-span-6 font-bold text-gray-800 text-sm">{item.subject}</div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        className="text-center h-8 font-bold"
                        value={item.mark}
                        onChange={(e) => handleScholasticChange(idx, 'mark', e.target.value)}
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        className="text-center h-8 font-bold uppercase"
                        value={item.grade}
                        onChange={(e) => handleScholasticChange(idx, 'grade', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 px-2 font-black">
                <span>Total Marks: {editingStudent.totalMarks}</span>
                <span className="text-[#00599c]">Overall Grade: {editingStudent.overallGrade}</span>
              </div>
            </div>

            {/* Co-Scholastic Grades */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white space-y-3">
              <h3 className="font-bold text-sm text-[#00599c] uppercase">Co-Scholastic Subjects</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {editingStudent.coScholastic?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-xs font-bold text-gray-800">{item.subject}</span>
                    <Input
                      className="w-20 text-center h-8 font-bold uppercase"
                      value={item.grade}
                      onChange={(e) => {
                        const updated = { ...editingStudent };
                        updated.coScholastic[idx].grade = e.target.value.toUpperCase();
                        setEditingStudent(updated);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Self Awareness */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 space-y-3">
              <h3 className="font-bold text-sm text-[#00599c] uppercase">Self Awareness</h3>
              <div className="space-y-2 text-xs">
                <div>
                  <Label className="text-xs text-gray-600">My Goals</Label>
                  <Input
                    value={editingStudent.selfAwareness?.goals || ''}
                    onChange={(e) => {
                      const updated = { ...editingStudent };
                      updated.selfAwareness = { ...updated.selfAwareness, goals: e.target.value };
                      setEditingStudent(updated);
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">My Strengths</Label>
                  <Input
                    value={editingStudent.selfAwareness?.strengths || ''}
                    onChange={(e) => {
                      const updated = { ...editingStudent };
                      updated.selfAwareness = { ...updated.selfAwareness, strengths: e.target.value };
                      setEditingStudent(updated);
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">My Interests and Hobbies</Label>
                  <Input
                    value={editingStudent.selfAwareness?.interestsHobbies || ''}
                    onChange={(e) => {
                      const updated = { ...editingStudent };
                      updated.selfAwareness = { ...updated.selfAwareness, interestsHobbies: e.target.value };
                      setEditingStudent(updated);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveProgress}
                disabled={savingEdit}
                className="bg-[#00599c] hover:bg-[#004880] text-white flex items-center gap-1.5"
              >
                <Save size={16} /> {savingEdit ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ProgressCards;
