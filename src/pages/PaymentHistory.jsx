import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { 
  History, 
  Search, 
  Download, 
  Printer, 
  FileSpreadsheet, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  IndianRupee, 
  User, 
  GraduationCap, 
  Calendar, 
  Layers,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Loader2,
  X
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Spinner } from '../components/ui/Spinner';
import { toastError, toastSuccess } from '../services/toastService';
import api from '../services/api';
import { 
  useStudentsQuery, 
  useClassesQuery, 
  useAcademicYearsQuery, 
  useActiveAcademicYearQuery,
  useStudentPaymentHistoryQuery 
} from '../hooks/useSchoolQueries';

const formatCurrency = (val) => {
  const num = Number(val || 0);
  return `₹${num.toLocaleString('en-IN')}`;
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const PaymentHistory = () => {
  const navigate = useNavigate();

  // Search input dropdown reference & state
  const searchContainerRef = useRef(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Filter selections
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  
  // Table search & downloading state
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [downloadingPaymentId, setDownloadingPaymentId] = useState(null);

  // Queries
  const { data: academicYears = [], isLoading: loadingYears } = useAcademicYearsQuery();
  const { data: activeYearData } = useActiveAcademicYearQuery();
  const { data: classes = [], isLoading: loadingClasses } = useClassesQuery();
  const { data: students = [], isLoading: loadingStudents } = useStudentsQuery();

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Set default academic year on initial load
  useEffect(() => {
    if (!selectedAcademicYear) {
      if (activeYearData?.year) {
        setSelectedAcademicYear(activeYearData.year);
      } else if (academicYears.length > 0) {
        setSelectedAcademicYear(academicYears[0].year);
      }
    }
  }, [activeYearData, academicYears, selectedAcademicYear]);

  // Derived sections for the chosen class
  const availableSections = useMemo(() => {
    if (!selectedClass) return [];
    const cls = classes.find((c) => c.name === selectedClass);
    if (cls && Array.isArray(cls.sections) && cls.sections.length > 0) {
      return cls.sections.map((s) => s.name || s);
    }
    // Fallback: extract distinct sections from students in this class
    const set = new Set();
    students.forEach((s) => {
      if (s.currentClass === selectedClass && s.section) {
        set.add(s.section);
      }
    });
    return Array.from(set).sort();
  }, [selectedClass, classes, students]);

  // Robust normalization for class & section matching
  const normClass = (str) => String(str || '').replace(/^class\s*/i, '').trim().toLowerCase();
  const normSec = (str) => String(str || '').trim().toLowerCase();

  // The active selected student object
  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return students.find((s) => (s._id || s.id) === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  // Smart multi-field search results across all students for the top search input
  const searchResults = useMemo(() => {
    const q = studentSearchQuery.trim().toLowerCase();
    if (!q) return [];

    const cleanQ = q.replace(/[^a-z0-9]/g, '');
    const terms = q.split(/\s+/).filter(Boolean);

    const matches = students.filter((s) => {
      const name = String(s.studentName || '').toLowerCase();
      const adm = String(s.admissionNumber || '').toLowerCase();
      const cleanAdm = adm.replace(/[^a-z0-9]/g, '');
      const roll = String(s.rollNumber || '').toLowerCase();
      const father = String(s.fatherName || '').toLowerCase();

      // Check if admission number matches directly or alphanumeric-cleaned
      if (adm.includes(q) || (cleanQ && cleanAdm.includes(cleanQ))) return true;

      // Check all query terms across name, adm, roll, father
      return terms.every((term) =>
        name.includes(term) ||
        adm.includes(term) ||
        roll.includes(term) ||
        father.includes(term)
      );
    });

    // Score and sort results by relevance
    return matches.sort((a, b) => {
      const aName = String(a.studentName || '').toLowerCase();
      const bName = String(b.studentName || '').toLowerCase();
      const aAdm = String(a.admissionNumber || '').toLowerCase();
      const bAdm = String(b.admissionNumber || '').toLowerCase();

      // 1. Exact match on admission number
      if (aAdm === q && bAdm !== q) return -1;
      if (bAdm === q && aAdm !== q) return 1;

      // 2. Admission number starts with query
      if (aAdm.startsWith(q) && !bAdm.startsWith(q)) return -1;
      if (bAdm.startsWith(q) && !aAdm.startsWith(q)) return 1;

      // 3. Exact match on student name
      if (aName === q && bName !== q) return -1;
      if (bName === q && aName !== q) return 1;

      // 4. Student name starts with query
      if (aName.startsWith(q) && !bName.startsWith(q)) return -1;
      if (bName.startsWith(q) && !aName.startsWith(q)) return 1;

      // 5. Prioritize current class if selected
      if (selectedClass) {
        const aSameClass = normClass(a.currentClass) === normClass(selectedClass);
        const bSameClass = normClass(b.currentClass) === normClass(selectedClass);
        if (aSameClass && !bSameClass) return -1;
        if (!aSameClass && bSameClass) return 1;
      }

      return aName.localeCompare(bName);
    }).slice(0, 20);
  }, [students, studentSearchQuery, selectedClass]);

  // Filter students for Dropdown #4 based on Class & Section
  const filteredStudents = useMemo(() => {
    let list = students;
    if (selectedClass) {
      list = list.filter((student) => normClass(student.currentClass) === normClass(selectedClass));
    }
    if (selectedSection) {
      list = list.filter((student) => normSec(student.section) === normSec(selectedSection));
    }
    // Make sure the currently selected student is always present in dropdown options
    if (selectedStudent && !list.some((s) => (s._id || s.id) === (selectedStudent._id || selectedStudent.id))) {
      list = [selectedStudent, ...list];
    }
    return list;
  }, [students, selectedClass, selectedSection, selectedStudent]);

  // Full selection of a student object (updates dropdowns, query, and loads history)
  const handleSelectStudentObject = (student) => {
    if (!student) return;
    const studentId = student._id || student.id;
    setSelectedStudentId(studentId);
    if (student.currentClass) {
      setSelectedClass(student.currentClass);
    }
    if (student.section) {
      setSelectedSection(student.section);
    } else {
      setSelectedSection('');
    }
    setStudentSearchQuery(`${student.studentName} (${student.admissionNumber})`);
    setIsSearchOpen(false);
    setHighlightedIndex(-1);
  };

  // When a student is picked from dropdown #4
  const handleStudentSelect = (studentId) => {
    setSelectedStudentId(studentId);
    if (studentId) {
      const student = students.find((s) => (s._id || s.id) === studentId);
      if (student) {
        if (student.currentClass) {
          setSelectedClass(student.currentClass);
        }
        if (student.section) {
          setSelectedSection(student.section);
        } else {
          setSelectedSection('');
        }
        setStudentSearchQuery(`${student.studentName} (${student.admissionNumber})`);
      }
    } else {
      setStudentSearchQuery('');
    }
    setIsSearchOpen(false);
  };

  // Keyboard navigation inside search input
  const handleSearchKeyDown = (e) => {
    if (!isSearchOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      if (studentSearchQuery.trim()) {
        setIsSearchOpen(true);
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (searchResults.length > 0) {
        setHighlightedIndex((prev) => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (searchResults.length > 0) {
        setHighlightedIndex((prev) => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0) {
        const target = (highlightedIndex >= 0 && searchResults[highlightedIndex])
          ? searchResults[highlightedIndex]
          : searchResults[0];
        handleSelectStudentObject(target);
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

  // Clear search input & selection
  const handleClearSearch = () => {
    setStudentSearchQuery('');
    setSelectedStudentId('');
    setIsSearchOpen(false);
    setHighlightedIndex(-1);
  };

  // Change class filter
  const handleClassChange = (newClass) => {
    setSelectedClass(newClass);
    setSelectedSection('');
    if (selectedStudent && newClass && normClass(selectedStudent.currentClass) !== normClass(newClass)) {
      setSelectedStudentId('');
      setStudentSearchQuery('');
    }
  };

  // Change section filter
  const handleSectionChange = (newSec) => {
    setSelectedSection(newSec);
    if (selectedStudent && newSec && normSec(selectedStudent.section) !== normSec(newSec)) {
      setSelectedStudentId('');
      setStudentSearchQuery('');
    }
  };

  // Fetch payment history and category balances from backend
  const { 
    data: historyData, 
    isLoading: loadingHistory, 
    isFetching: fetchingHistory, 
    refetch: refetchHistory 
  } = useStudentPaymentHistoryQuery(selectedStudentId, selectedAcademicYear, Boolean(selectedStudentId));

  const studentInfo = historyData?.student || null;
  const summary = historyData?.summary || { totalAssignedFees: 0, totalAmountPaid: 0, totalRemainingFees: 0 };
  const rawPayments = historyData?.payments || [];
  const categoryBalances = historyData?.categoryBalances || [];

  // Filter previous payments by search term
  const filteredPayments = useMemo(() => {
    if (!historySearchTerm.trim()) return rawPayments;
    const term = historySearchTerm.trim().toLowerCase();
    return rawPayments.filter((p) => {
      const receipt = String(p.receiptNumber || '').toLowerCase();
      const cat = String(p.feeCategory || '').toLowerCase();
      const trm = String(p.term || '').toLowerCase();
      const mode = String(p.paymentMode || '').toLowerCase();
      const collected = String(p.collectedBy || '').toLowerCase();
      const remarks = String(p.remarks || '').toLowerCase();
      const dateStr = formatDate(p.paymentDate).toLowerCase();
      return (
        receipt.includes(term) ||
        cat.includes(term) ||
        trm.includes(term) ||
        mode.includes(term) ||
        collected.includes(term) ||
        remarks.includes(term) ||
        dateStr.includes(term)
      );
    });
  }, [rawPayments, historySearchTerm]);

  // Total successful payments in the table
  const tableTotalPaid = useMemo(() => {
    return filteredPayments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
  }, [filteredPayments]);

  // Category table summary totals
  const categoryTotals = useMemo(() => {
    return categoryBalances.reduce((acc, c) => ({
      totalAssigned: acc.totalAssigned + (Number(c.totalAssignedFee) || 0),
      totalPaid: acc.totalPaid + (Number(c.totalPaid) || 0),
      totalRemaining: acc.totalRemaining + (Number(c.remainingAmount) || 0),
    }), { totalAssigned: 0, totalPaid: 0, totalRemaining: 0 });
  }, [categoryBalances]);

  // Print/View Receipt
  const handleViewReceipt = (payment) => {
    const paymentId = payment.paymentId || payment._id || payment.id;
    if (!paymentId) {
      toastError('Payment ID missing');
      return;
    }
    navigate(`/dashboard/payments/invoice/${paymentId}`);
  };

  // Direct PDF Download
  const handleDownloadReceipt = async (payment) => {
    const paymentId = payment.paymentId || payment._id || payment.id;
    if (!paymentId) return;

    setDownloadingPaymentId(paymentId);
    try {
      const response = await api.get(`/payments/invoice/${paymentId}`, {
        responseType: 'blob'
      });
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      const safeReceipt = String(payment.receiptNumber || paymentId).replace(/[^a-zA-Z0-9._-]/g, '_');
      link.setAttribute('download', `receipt_${safeReceipt}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toastSuccess('Receipt downloaded successfully');
    } catch (err) {
      console.error('Error downloading receipt:', err);
      toastError('Failed to download receipt');
    } finally {
      setDownloadingPaymentId(null);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredPayments.length === 0) {
      toastError('No payment records to export');
      return;
    }

    const data = filteredPayments.map((p) => ({
      'Payment Date': formatDate(p.paymentDate),
      'Receipt Number': p.receiptNumber || '-',
      'Fee Category': p.feeCategory || '-',
      'Term': p.term || '-',
      'Amount Paid (Rs.)': Number(p.amountPaid || 0),
      'Payment Mode': p.paymentMode || '-',
      'Collected By': p.collectedBy || '-',
      'Remarks': p.remarks || '-'
    }));

    // Add summary row at the bottom
    data.push({
      'Payment Date': '',
      'Receipt Number': '',
      'Fee Category': '',
      'Term': 'TOTAL SUCCESSFUL PAYMENTS',
      'Amount Paid (Rs.)': tableTotalPaid,
      'Payment Mode': '',
      'Collected By': '',
      'Remarks': ''
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payment History');

    const studentNameClean = String(studentInfo?.studentName || 'Student').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${studentNameClean}_Payment_History_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, filename);
    toastSuccess('Payment history exported to Excel');
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredPayments.length === 0) {
      toastError('No payment records to export');
      return;
    }

    const headers = ['Payment Date', 'Receipt Number', 'Fee Category', 'Term', 'Amount Paid', 'Payment Mode', 'Collected By', 'Remarks'];
    const rows = filteredPayments.map((p) => [
      `"${formatDate(p.paymentDate)}"`,
      `"${p.receiptNumber || '-'}"`,
      `"${p.feeCategory || '-'}"`,
      `"${p.term || '-'}"`,
      p.amountPaid || 0,
      `"${p.paymentMode || '-'}"`,
      `"${p.collectedBy || '-'}"`,
      `"${p.remarks || '-'}"`
    ]);

    // Append total row
    rows.push(['', '', '', '"TOTAL SUCCESSFUL PAYMENTS"', tableTotalPaid, '', '', '']);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const studentNameClean = String(studentInfo?.studentName || 'Student').replace(/[^a-zA-Z0-9]/g, '_');
    link.setAttribute('download', `${studentNameClean}_Payment_History_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    toastSuccess('Payment history exported to CSV');
  };

  // Helper for Status Badge styling
  const renderStatusBadge = (status, overpaidAmount = 0) => {
    switch (status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Paid
          </span>
        );
      case 'Partial':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
            <Clock className="h-3.5 w-3.5 text-amber-600" /> Partial
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
            <AlertCircle className="h-3.5 w-3.5 text-rose-600" /> Pending
          </span>
        );
      case 'Overpaid':
        return (
          <div className="flex flex-col items-start gap-0.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs">
              <ShieldAlert className="h-3.5 w-3.5 text-purple-700" /> Overpaid
            </span>
            {overpaidAmount > 0 && (
              <span className="text-[11px] font-semibold text-purple-700 pl-1">
                (+{formatCurrency(overpaidAmount)})
              </span>
            )}
          </div>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
              <History className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payment History</h1>
              <p className="text-sm text-gray-500">
                View previous transactions and category-wise remaining balances together
              </p>
            </div>
          </div>
        </div>

        {selectedStudentId && (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetchHistory()} 
              disabled={fetchingHistory}
              className="gap-2 text-gray-700 border-gray-300 hover:bg-gray-100"
            >
              <RefreshCw className={`h-4 w-4 ${fetchingHistory ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        )}
      </div>

      {/* 1. Student Selection Bar (Academic Year -> Class -> Section -> Student) */}
      <Card className="border-blue-100 shadow-sm bg-white">
        <CardHeader className="py-3.5 px-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Search className="h-4.5 w-4.5 text-blue-600" />
            Student Selection
          </CardTitle>

          {/* Top Search Input with Autocomplete Dropdown */}
          <div className="relative w-full sm:w-80" ref={searchContainerRef}>
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search student name or adm no..."
                value={studentSearchQuery}
                onChange={(e) => {
                  setStudentSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                  setHighlightedIndex(0);
                }}
                onFocus={() => {
                  if (studentSearchQuery.trim()) {
                    setIsSearchOpen(true);
                  }
                }}
                onKeyDown={handleSearchKeyDown}
                className="text-xs h-9 pl-9 pr-8 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 w-full bg-white shadow-2xs font-medium text-gray-800 placeholder-gray-400"
              />
              {studentSearchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2 p-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {isSearchOpen && studentSearchQuery.trim() && (
              <div className="absolute right-0 left-0 sm:left-auto sm:w-96 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-[11px] font-semibold text-gray-500">
                  <span>
                    {searchResults.length > 0 
                      ? `Found ${searchResults.length} matching student${searchResults.length > 1 ? 's' : ''}`
                      : 'No matches'}
                  </span>
                  {searchResults.length > 0 && (
                    <span className="text-[10px] text-gray-400">Press Enter ↵ to select</span>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                  {searchResults.length > 0 ? (
                    searchResults.map((s, idx) => {
                      const isHighlighted = idx === highlightedIndex;
                      const isCurrentlySelected = (s._id || s.id) === selectedStudentId;

                      return (
                        <div
                          key={s._id || s.id}
                          onClick={() => handleSelectStudentObject(s)}
                          onMouseEnter={() => setHighlightedIndex(idx)}
                          className={`p-3 cursor-pointer transition-colors text-left flex items-center justify-between gap-3 ${
                            isHighlighted ? 'bg-blue-50 text-blue-900' : 'hover:bg-gray-50 text-gray-800'
                          } ${isCurrentlySelected ? 'border-l-4 border-blue-600 font-semibold' : ''}`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-gray-900 truncate">
                                {s.studentName}
                              </span>
                              <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                                {s.admissionNumber}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                              <span>Class: {s.currentClass || '-'}{s.section ? ` (${s.section})` : ''}</span>
                              {s.fatherName && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">S/O {s.fatherName}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0 text-blue-600 text-xs font-semibold">
                            Select →
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center text-xs text-gray-500">
                      <Search className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                      <p className="font-semibold text-gray-700">No students found</p>
                      <p className="mt-0.5 text-gray-400">
                        No matches for "{studentSearchQuery}". Try student name or admission number.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {/* 1. Academic Year */}
            <div className="space-y-1.5">
              <Label htmlFor="academicYearFilter" className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-blue-600" /> 1. Academic Year
              </Label>
              <select
                id="academicYearFilter"
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                disabled={loadingYears}
              >
                <option value="">-- All Academic Years --</option>
                {academicYears.map((ay) => (
                  <option key={ay._id || ay.year} value={ay.year}>
                    {ay.year} {ay.status === 'Active' ? '(Active)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Class */}
            <div className="space-y-1.5">
              <Label htmlFor="classFilter" className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-blue-600" /> 2. Class
              </Label>
              <select
                id="classFilter"
                value={selectedClass}
                onChange={(e) => handleClassChange(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                disabled={loadingClasses}
              >
                <option value="">-- All Classes --</option>
                {classes.map((c) => (
                  <option key={c._id || c.name} value={c.name}>
                    Class {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Section */}
            <div className="space-y-1.5">
              <Label htmlFor="sectionFilter" className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-blue-600" /> 3. Section
              </Label>
              <select
                id="sectionFilter"
                value={selectedSection}
                onChange={(e) => handleSectionChange(e.target.value)}
                disabled={!selectedClass || availableSections.length === 0}
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">-- All Sections --</option>
                {availableSections.map((sec) => (
                  <option key={sec} value={sec}>
                    Section {sec}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Student Name Dropdown */}
            <div className="space-y-1.5">
              <Label htmlFor="studentSelect" className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-blue-600" /> 4. Student Name
              </Label>
              <select
                id="studentSelect"
                value={selectedStudentId}
                onChange={(e) => handleStudentSelect(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 disabled:bg-gray-100 disabled:text-gray-400"
                disabled={loadingStudents || filteredStudents.length === 0}
              >
                <option value="">
                  {loadingStudents
                    ? '-- Loading students... --'
                    : filteredStudents.length === 0
                    ? (selectedClass ? '-- No students in this Class/Section --' : '-- No students found --')
                    : `-- Select Student (${filteredStudents.length}) --`}
                </option>
                {filteredStudents.map((s) => (
                  <option key={s._id || s.id} value={s._id || s.id}>
                    {s.admissionNumber} - {s.studentName} {selectedClass ? (s.section ? `(Sec ${s.section})` : '') : `(Class ${s.currentClass}${s.section ? ` - Sec ${s.section}` : ''})`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State for History */}
      {selectedStudentId && loadingHistory && (
        <div className="flex flex-col items-center justify-center py-10 px-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
          <p className="text-sm font-semibold text-gray-700">Loading payment history...</p>
          <p className="text-xs text-gray-400 mt-0.5">Fetching transactions and category balances</p>
        </div>
      )}

      {/* Placeholder State (No Student Selected) */}
      {!selectedStudentId && (
        <Card className="border-dashed border-2 border-gray-300 bg-gray-50/50">
          <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="p-4 bg-blue-100 text-blue-600 rounded-full mb-3">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Select a Student to View History</h3>
            <p className="text-sm text-gray-500 max-w-md mt-1">
              Choose an Academic Year, Class, Section, and Student from the filters above to automatically load their complete payment transactions and category-wise remaining balances.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Selected Student Content */}
      {selectedStudentId && !loadingHistory && studentInfo && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* 2. Student Information Card */}
          <Card className="border-blue-200/80 shadow-sm bg-white overflow-hidden">
            <div 
              className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
              style={{ backgroundColor: '#f8fafc' }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="h-16 w-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-md shrink-0"
                  style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                >
                  {studentInfo.studentName?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 
                      className="text-2xl sm:text-3xl font-extrabold tracking-tight"
                      style={{ color: '#0f172a' }}
                    >
                      {studentInfo.studentName || 'Student Name'}
                    </h2>
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-bold border"
                      style={{ backgroundColor: '#dbeafe', color: '#1e40af', borderColor: '#bfdbfe' }}
                    >
                      Class {studentInfo.className} - {studentInfo.section}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold mt-2" style={{ color: '#475569' }}>
                    <div>
                      Admission No: <span className="font-mono text-base font-extrabold" style={{ color: '#0f172a' }}>{studentInfo.admissionNumber}</span>
                    </div>
                    <span style={{ color: '#cbd5e1' }}>•</span>
                    <div>
                      Academic Year: <span className="font-extrabold" style={{ color: '#2563eb' }}>{studentInfo.academicYear}</span>
                    </div>
                    {studentInfo.fatherName && (
                      <>
                        <span style={{ color: '#cbd5e1' }}>•</span>
                        <div>
                          Father: <span className="font-bold" style={{ color: '#1e293b' }}>{studentInfo.fatherName}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                <div 
                  className="px-4 py-2.5 rounded-xl border text-center min-w-[120px] shadow-xs"
                  style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Class & Sec</div>
                  <div className="text-sm font-black" style={{ color: '#0f172a' }}>{studentInfo.className} - {studentInfo.section}</div>
                </div>
                <div 
                  className="px-4 py-2.5 rounded-xl border text-center min-w-[120px] shadow-xs"
                  style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Academic Year</div>
                  <div className="text-sm font-black" style={{ color: '#2563eb' }}>{studentInfo.academicYear}</div>
                </div>
              </div>
            </div>

            <CardContent className="p-6">
              {/* 3 Metric Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Total Assigned Fees */}
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-900 uppercase tracking-wider">
                    <span>Total Assigned Fees</span>
                    <IndianRupee className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-black text-blue-950">
                    {formatCurrency(summary.totalAssignedFees)}
                  </div>
                  <p className="text-[11px] text-blue-700 font-medium">
                    Applicable fees for {studentInfo.academicYear} (net of concessions)
                  </p>
                </div>

                {/* Total Amount Paid */}
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    <span>Total Amount Paid</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-emerald-700">
                    {formatCurrency(summary.totalAmountPaid)}
                  </div>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    Total successful payments collected
                  </p>
                </div>

                {/* Total Remaining Fees */}
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900 uppercase tracking-wider">
                    <span>Total Remaining Fees</span>
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className={`text-2xl font-black ${summary.totalRemainingFees === 0 ? 'text-emerald-600' : 'text-amber-700'}`}>
                    {formatCurrency(summary.totalRemainingFees)}
                  </div>
                  <p className="text-[11px] text-amber-700 font-medium">
                    {summary.totalRemainingFees === 0 ? 'All fees settled' : 'Outstanding payable dues'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Previous Payment History Table */}
          <Card className="border-gray-200 shadow-sm bg-white">
            <CardHeader className="py-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <History className="h-5 w-5 text-blue-600" />
                  Previous Payment History
                </CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  Showing all successful historical payments (newest first). Excludes cancelled or failed transactions.
                </p>
              </div>

              {/* Action Buttons: Search, Excel, CSV */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    placeholder="Filter transactions..."
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                    className="h-9 w-48 sm:w-56 pl-8 text-xs bg-gray-50 focus:bg-white"
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExportExcel}
                  disabled={filteredPayments.length === 0}
                  className="gap-1.5 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                  title="Export to Excel"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                  Excel
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExportCSV}
                  disabled={filteredPayments.length === 0}
                  className="gap-1.5 text-xs text-blue-700 border-blue-300 hover:bg-blue-50"
                  title="Export to CSV"
                >
                  <FileText className="h-3.5 w-3.5 text-blue-600" />
                  CSV
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50/80">
                  <TableRow>
                    <TableHead className="font-bold text-gray-700">Payment Date</TableHead>
                    <TableHead className="font-bold text-gray-700">Receipt Number</TableHead>
                    <TableHead className="font-bold text-gray-700">Fee Category</TableHead>
                    <TableHead className="font-bold text-gray-700">Term</TableHead>
                    <TableHead className="font-bold text-gray-700 text-right">Amount Paid</TableHead>
                    <TableHead className="font-bold text-gray-700 text-center">Payment Mode</TableHead>
                    <TableHead className="font-bold text-gray-700">Collected By</TableHead>
                    <TableHead className="font-bold text-gray-700 text-center">Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-gray-500 font-medium">
                        {rawPayments.length === 0
                          ? 'No payment transactions recorded for this student in this academic year.'
                          : 'No transactions match your search filter.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id} className="hover:bg-blue-50/30 transition-colors">
                        <TableCell className="font-medium text-gray-800 whitespace-nowrap">
                          {formatDate(payment.paymentDate)}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-blue-700 whitespace-nowrap">
                          {payment.receiptNumber || 'N/A'}
                        </TableCell>
                        <TableCell className="font-semibold text-gray-900">
                          {payment.feeCategory}
                        </TableCell>
                        <TableCell className="text-gray-600 whitespace-nowrap">
                          {payment.term || '-'}
                        </TableCell>
                        <TableCell className="font-black text-gray-900 text-right whitespace-nowrap">
                          {formatCurrency(payment.amountPaid)}
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">
                            {payment.paymentMode || 'CASH'}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-600 text-xs whitespace-nowrap">
                          {payment.collectedBy || 'Admin'}
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs gap-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                              onClick={() => handleViewReceipt(payment)}
                              title="View and Print Receipt"
                            >
                              <Printer className="h-3 w-3" />
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                              disabled={downloadingPaymentId === payment.paymentId}
                              onClick={() => handleDownloadReceipt(payment)}
                              title="Download PDF Receipt"
                            >
                              {downloadingPaymentId === payment.paymentId ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600" />
                              ) : (
                                <Download className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Table Footer: Total Successful Payments */}
              {filteredPayments.length > 0 && (
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
                  <div className="text-xs text-gray-500 font-medium">
                    Showing {filteredPayments.length} transaction {filteredPayments.length === 1 ? 'record' : 'records'}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-700">Total Successful Payments:</span>
                    <span className="text-base font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200">
                      {formatCurrency(tableTotalPaid)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 5. Remaining Fees by Category (Directly BELOW Payment History) */}
          <Card className="border-gray-200 shadow-sm bg-white">
            <CardHeader className="py-4 border-b border-gray-200">
              <div>
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <IndianRupee className="h-5 w-5 text-blue-600" />
                  Remaining Fees by Category
                </CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  Category-wise fee breakdown, total assigned fees (net of concessions), payments, and outstanding balances
                </p>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50/80">
                  <TableRow>
                    <TableHead className="font-bold text-gray-700">Fee Category</TableHead>
                    <TableHead className="font-bold text-gray-700 text-right">Total Assigned Fee</TableHead>
                    <TableHead className="font-bold text-gray-700 text-right">Total Paid</TableHead>
                    <TableHead className="font-bold text-gray-700 text-right">Remaining Amount</TableHead>
                    <TableHead className="font-bold text-gray-700 text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryBalances.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-gray-500 font-medium">
                        No fee categories assigned for this student in {studentInfo.academicYear}.
                      </TableCell>
                    </TableRow>
                  ) : (
                    categoryBalances.map((cat, idx) => (
                      <TableRow key={cat.studentFeeId || idx} className="hover:bg-blue-50/20 transition-colors">
                        <TableCell className="font-bold text-gray-900">
                          <div className="flex items-center gap-2">
                            <span>{cat.feeCategory}</span>
                            {cat.concessionAmount > 0 && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                Concession -₹{cat.concessionAmount}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-gray-800">
                          {formatCurrency(cat.totalAssignedFee)}
                        </TableCell>
                        <TableCell className="text-right font-black text-emerald-700">
                          {formatCurrency(cat.totalPaid)}
                        </TableCell>
                        <TableCell className="text-right font-black text-gray-900">
                          <span className={cat.remainingAmount === 0 ? 'text-emerald-600' : 'text-amber-700'}>
                            {formatCurrency(cat.remainingAmount)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {renderStatusBadge(cat.status, cat.overpaidAmount)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Category Balances Summary Footer */}
              {categoryBalances.length > 0 && (
                <div className="bg-gray-50 px-6 py-3.5 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4 text-sm font-bold">
                  <span className="text-gray-700">Total Across All Categories:</span>
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm">
                    <div>
                      Assigned: <span className="font-black text-blue-900">{formatCurrency(categoryTotals.totalAssigned)}</span>
                    </div>
                    <div>
                      Paid: <span className="font-black text-emerald-700">{formatCurrency(categoryTotals.totalPaid)}</span>
                    </div>
                    <div>
                      Remaining: <span className="font-black text-amber-700">{formatCurrency(categoryTotals.totalRemaining)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
