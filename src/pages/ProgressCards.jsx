import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import {
  Award,
  Eye,
  Download,
  Printer,
  Search,
  RefreshCw,
  User,
  Edit3,
  Save,
  BookOpen,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  ArrowUp,
  ArrowDown,
  ClipboardList,
  Pencil,
  Check,
  X
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import Pagination from '../components/ui/Pagination';
import { PageLoader } from '../components/ui/Spinner';
import { toastError, toastSuccess, toastWarning } from '../services/toastService';
import StudentProgressCard from '../components/StudentProgressCard';
import { getImageUrl } from '../utils/imageUrl';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

const GRADE_OPTIONS = ['A+', 'A', 'B+', 'B', 'C', 'D'];
const TERM_OPTIONS = ['TERM - I', 'TERM - II', 'TERM - III', 'ANNUAL'];
const EXAMPLE_EXAM_NAMES = [
  'TERM - I',
  'TERM - II',
  'TERM - III',
  'Quarterly Examination',
  'Half-Yearly Examination',
  'Annual Examination',
  'Monthly Test'
];

const PRESET_SCHOLASTIC_SUBJECTS = [
  'Tamil',
  'English I',
  'English II',
  'Maths',
  'EVS',
  'Science',
  'Social Science',
  'Computer',
  'Hindi'
];

const PRESET_CO_SCHOLASTIC_SUBJECTS = [
  'G.K',
  'V.E',
  'ENGLISH DICTATION',
  'TAMIL DICTATION',
  'EVS DICTATION',
  'Drawing',
  'Physical Education',
  'Art & Craft'
];

const computeGradeFromMark = (mark, maxMarks = 100) => {
  if (mark === '' || mark === null || mark === undefined) return '';
  const num = parseFloat(mark);
  if (isNaN(num)) return '';
  const max = parseFloat(maxMarks) || 100;
  const pct = (num / max) * 100;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  return 'D';
};

const GRADE_TO_SCORE = {
  'A+': 95,
  'A': 85,
  'B+': 75,
  'B': 65,
  'C': 55,
  'D': 40
};

const computeTotals = (scholastic = []) => {
  const numericEntries = scholastic.filter(
    (item) => item.mark !== '' && item.mark !== null && item.mark !== undefined && !isNaN(parseFloat(item.mark))
  );
  if (numericEntries.length > 0) {
    const rawTotal = numericEntries.reduce((sum, item) => sum + parseFloat(item.mark), 0);
    const totalMarks = Number.isInteger(rawTotal) ? rawTotal : Number(rawTotal.toFixed(2));
    const totalMax = numericEntries.reduce((sum, item) => sum + (parseFloat(item.maxMarks) || 100), 0);
    const overallGrade = computeGradeFromMark(totalMarks, totalMax || 100);
    return { totalMarks, overallGrade };
  }

  const gradeEntries = scholastic.filter(
    (item) => item.grade && GRADE_TO_SCORE[String(item.grade).trim().toUpperCase()] !== undefined
  );
  if (gradeEntries.length > 0) {
    const avg =
      gradeEntries.reduce((sum, item) => sum + GRADE_TO_SCORE[String(item.grade).trim().toUpperCase()], 0) /
      gradeEntries.length;
    return { totalMarks: '', overallGrade: computeGradeFromMark(avg, 100) };
  }

  return { totalMarks: '', overallGrade: '' };
};

const waitForImagesToLoad = async (container) => {
  if (!container) return;
  const images = Array.from(container.querySelectorAll('img'));
  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
        setTimeout(resolve, 3000);
      });
    })
  );
};

const ProgressCards = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUser = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}');
  const canManageExams = ['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role);

  // Exam Name Management Modal State
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [newExamName, setNewExamName] = useState('');
  const [newExamClass, setNewExamClass] = useState('ALL');
  const [savingExam, setSavingExam] = useState(false);
  const [editingExamId, setEditingExamId] = useState(null);
  const [editingExamName, setEditingExamName] = useState('');

  // Filters State
  const [filterYear, setFilterYear] = useState('');
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

  // Centralized Subject Management Modal State
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subjectModalYear, setSubjectModalYear] = useState('');
  const [subjectModalClass, setSubjectModalClass] = useState('');
  const [subjectModalCategory, setSubjectModalCategory] = useState('scholastic');
  const [modalSubjects, setModalSubjects] = useState([]);
  const [loadingModalSubjects, setLoadingModalSubjects] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectMaxMarks, setNewSubjectMaxMarks] = useState('100');
  const [selectedPresets, setSelectedPresets] = useState([]);
  const [savingSubject, setSavingSubject] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [editingSubjectName, setEditingSubjectName] = useState('');
  const [editingSubjectMaxMarks, setEditingSubjectMaxMarks] = useState('100');

  // Subject-Wise Marks Entry Modal State
  const [isSubjectEntryOpen, setIsSubjectEntryOpen] = useState(false);
  const [entryYear, setEntryYear] = useState('');
  const [entryClass, setEntryClass] = useState('');
  const [entrySection, setEntrySection] = useState('');
  const [entryTerm, setEntryTerm] = useState('TERM - II');
  const [entryCategory, setEntryCategory] = useState('scholastic');
  const [entrySubjectsList, setEntrySubjectsList] = useState([]);
  const [selectedEntrySubjectId, setSelectedEntrySubjectId] = useState('');
  const [entryRows, setEntryRows] = useState([]);
  const [loadingEntryData, setLoadingEntryData] = useState(false);
  const [savingBulkGrades, setSavingBulkGrades] = useState(false);

  // Download & Print States
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [printingCard, setPrintingCard] = useState(false);
  const [offscreenStudent, setOffscreenStudent] = useState(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [downloadingBulkPdf, setDownloadingBulkPdf] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(null);
  const selectAllCheckboxRef = useRef(null);

  const previewCardRef = useRef(null);
  const offscreenCardRef = useRef(null);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [classesRes, yearsRes] = await Promise.all([
        api.get('/classes', { skipToast: true }),
        api.get('/academic-years', { skipToast: true })
      ]);
      const loadedClasses = classesRes.data || [];
      const years = yearsRes.data || [];
      setClasses(loadedClasses);
      setAcademicYears(years);

      let selectedYear = filterYear;
      if (years.length > 0) {
        const activeYear = years.find((y) => y.status === 'Active' || y.isActive) || years[0];
        selectedYear = activeYear.year || '';
        setFilterYear(selectedYear);
      }

      const loadedExams = await fetchExams({ academicYear: selectedYear, className: filterClass });
      const activeTerm =
        loadedExams.find((ex) => ex.name === filterTerm)?.name ||
        loadedExams.find((ex) => ex.name === 'TERM - II')?.name ||
        loadedExams[0]?.name ||
        filterTerm;
      if (activeTerm !== filterTerm) {
        setFilterTerm(activeTerm);
      }

      await Promise.all([
        fetchStudents({ academicYear: selectedYear, term: activeTerm }),
        fetchClassSubjects({ academicYear: selectedYear, className: filterClass })
      ]);
    } catch (error) {
      console.error('Error loading initial Progress Cards data:', error);
      toastError('Failed to load Progress Cards data.');
    } finally {
      setLoading(false);
      isInitialLoad.current = false;
    }
  };

  const fetchStudents = async (overrides = {}) => {
    try {
      const params = {};
      const academicYear = overrides.academicYear ?? filterYear;
      const currentClass = overrides.currentClass ?? filterClass;
      const section = overrides.section ?? filterSection;
      const term = overrides.term ?? filterTerm;
      const search = overrides.search ?? filterSearch;
      if (academicYear) params.academicYear = academicYear;
      if (currentClass) params.currentClass = currentClass;
      if (section) params.section = section;
      if (term) params.term = term;
      if (search) params.search = search;

      const res = await api.get('/progress-cards', { params, cache: false, skipToast: true });
      setStudents(res.data || []);
    } catch (error) {
      console.error('Error fetching progress card students:', error);
      toastError('Error loading students progress list.');
    }
  };

  const fetchClassSubjects = async (overrides = {}) => {
    try {
      const academicYear = overrides.academicYear ?? filterYear;
      const className = overrides.className ?? filterClass;
      if (!academicYear) return;
      const params = { academicYear };
      if (className) params.className = className;
      const res = await api.get('/progress-cards/subjects', { params, cache: false, skipToast: true });
      setClassSubjects(res.data || []);
    } catch (error) {
      console.error('Error fetching class subjects:', error);
    }
  };

  const fetchExams = async (overrides = {}) => {
    try {
      const academicYear = overrides.academicYear ?? filterYear;
      const className = overrides.className ?? filterClass;
      if (!academicYear) return [];
      const params = { academicYear };
      if (className) params.className = className;
      const res = await api.get('/progress-cards/exams', { params, cache: false, skipToast: true });
      const list = res.data || [];
      setExams(list);
      return list;
    } catch (error) {
      console.error('Error fetching exams:', error);
      return [];
    }
  };

  useEffect(() => {
    if (isInitialLoad.current) return;
    fetchStudents();
    fetchClassSubjects();
    setCurrentPage(1);
  }, [filterYear, filterClass, filterSection, filterTerm, filterSearch]);

  useEffect(() => {
    if (isInitialLoad.current) return;
    fetchExams().then((loaded) => {
      if (loaded.length > 0 && !loaded.some((ex) => ex.name === filterTerm)) {
        const fallback = loaded.find((ex) => ex.name === 'TERM - II')?.name || loaded[0].name;
        setFilterTerm(fallback);
      }
    });
  }, [filterYear, filterClass]);

  const examOptions = React.useMemo(() => {
    const names = [];
    const seen = new Set();
    exams.forEach((ex) => {
      if (ex?.name && !seen.has(ex.name)) {
        seen.add(ex.name);
        names.push(ex.name);
      }
    });
    if (names.length === 0) {
      return TERM_OPTIONS;
    }
    return names;
  }, [exams]);

  const handleOpenExamModal = () => {
    setNewExamName('');
    setNewExamClass(filterClass || 'ALL');
    setEditingExamId(null);
    setEditingExamName('');
    setIsExamModalOpen(true);
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    const trimmed = newExamName.trim();
    if (!trimmed) {
      toastWarning('Please enter an exam name.');
      return;
    }
    const targetYear = filterYear || academicYears.find((y) => y.status === 'Active')?.year || academicYears[0]?.year;
    try {
      setSavingExam(true);
      const res = await api.post('/progress-cards/exams', {
        academicYear: targetYear,
        className: newExamClass || 'ALL',
        name: trimmed
      });
      const createdName = res.data?.exam?.name || trimmed;
      toastSuccess(res.data?.message || `Exam "${createdName}" added!`);
      setNewExamName('');
      await fetchExams({ academicYear: targetYear, className: filterClass });
      setFilterTerm(createdName);
      setEntryTerm(createdName);
    } catch (error) {
      toastError(error.response?.data?.error || 'Failed to add exam name.');
    } finally {
      setSavingExam(false);
    }
  };

  const handleSaveExamEdit = async (exam) => {
    const trimmed = editingExamName.trim();
    if (!trimmed) {
      toastWarning('Exam name cannot be empty.');
      return;
    }
    try {
      setSavingExam(true);
      const res = await api.put(`/progress-cards/exams/${exam._id}`, { name: trimmed });
      const updatedName = res.data?.exam?.name || trimmed;
      toastSuccess('Exam name updated!');
      setEditingExamId(null);
      await fetchExams();
      if (filterTerm === exam.name) {
        setFilterTerm(updatedName);
      }
      if (entryTerm === exam.name) {
        setEntryTerm(updatedName);
      }
      await fetchStudents({ term: filterTerm === exam.name ? updatedName : filterTerm });
    } catch (error) {
      toastError(error.response?.data?.error || 'Failed to update exam name.');
    } finally {
      setSavingExam(false);
    }
  };

  const handleDeleteExam = async (exam) => {
    try {
      setSavingExam(true);
      const res = await api.delete(`/progress-cards/exams/${exam._id}`);
      toastSuccess(res.data?.message || 'Exam deleted.');
      const updatedList = await fetchExams();
      if (filterTerm === exam.name && updatedList.length > 0) {
        const nextTerm = updatedList[0].name;
        setFilterTerm(nextTerm);
      }
    } catch (error) {
      toastError(error.response?.data?.error || 'Failed to delete exam.');
    } finally {
      setSavingExam(false);
    }
  };

  const selectedClassObj = classes.find((c) => c.name === filterClass);
  const availableSections = selectedClassObj?.sections || [];

  const paginatedStudents = students.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.max(1, Math.ceil(students.length / itemsPerPage));

  // Selection helpers & indeterminate checkbox effect
  const isAllSelectedOnPage =
    paginatedStudents.length > 0 &&
    paginatedStudents.every((s) => selectedStudentIds.includes(s._id));

  const isSomeSelectedOnPage =
    paginatedStudents.some((s) => selectedStudentIds.includes(s._id)) && !isAllSelectedOnPage;

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = isSomeSelectedOnPage;
    }
  }, [isSomeSelectedOnPage]);

  // Reset selection when search or filters change
  useEffect(() => {
    setSelectedStudentIds([]);
  }, [filterYear, filterClass, filterSection, filterTerm, filterSearch]);

  const handleToggleSelectAll = () => {
    if (isAllSelectedOnPage) {
      const pageIds = paginatedStudents.map((s) => s._id);
      setSelectedStudentIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      const pageIds = paginatedStudents.map((s) => s._id);
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleSelectStudent = (studentId) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = students.map((s) => s._id);
    setSelectedStudentIds(allFilteredIds);
  };

  // ================= CENTRALIZED SUBJECT MANAGEMENT =================
  const loadModalSubjects = async (year, cls) => {
    if (!year || !cls) {
      setModalSubjects([]);
      return;
    }
    try {
      setLoadingModalSubjects(true);
      const res = await api.get('/progress-cards/subjects', {
        params: { academicYear: year, className: cls, includeInactive: 'true' },
        cache: false,
        skipToast: true
      });
      setModalSubjects(res.data || []);
    } catch (error) {
      console.error('Error loading modal subjects:', error);
      toastError('Failed to load subjects for selected class.');
    } finally {
      setLoadingModalSubjects(false);
    }
  };

  const handleOpenSubjectManager = () => {
    const defaultYear = filterYear || academicYears.find((y) => y.status === 'Active')?.year || academicYears[0]?.year || '';
    const defaultClass = filterClass || classes[0]?.name || '';
    setSubjectModalYear(defaultYear);
    setSubjectModalClass(defaultClass);
    setSelectedPresets([]);
    setNewSubjectName('');
    setNewSubjectMaxMarks('100');
    setEditingSubjectId(null);
    setIsSubjectModalOpen(true);
    loadModalSubjects(defaultYear, defaultClass);
  };

  useEffect(() => {
    if (isSubjectModalOpen && subjectModalYear && subjectModalClass) {
      loadModalSubjects(subjectModalYear, subjectModalClass);
    }
  }, [subjectModalYear, subjectModalClass, isSubjectModalOpen]);

  const handleAddCustomSubject = async (e) => {
    e.preventDefault();
    if (!subjectModalClass) {
      toastWarning('Please select a class first.');
      return;
    }
    if (!newSubjectName.trim()) {
      toastWarning('Please enter a subject name.');
      return;
    }
    try {
      setSavingSubject(true);
      await api.post('/progress-cards/subjects', {
        academicYear: subjectModalYear,
        className: subjectModalClass,
        category: subjectModalCategory,
        name: newSubjectName.trim(),
        maxMarks: subjectModalCategory === 'scholastic' ? Number(newSubjectMaxMarks) || 100 : 100
      });
      toastSuccess(`Subject "${newSubjectName.trim()}" added for Class ${subjectModalClass}`);
      setNewSubjectName('');
      await Promise.all([
        loadModalSubjects(subjectModalYear, subjectModalClass),
        fetchClassSubjects(),
        fetchStudents()
      ]);
    } catch (error) {
      toastError(error.response?.data?.error || 'Failed to add subject.');
    } finally {
      setSavingSubject(false);
    }
  };

  const handleTogglePreset = (presetName) => {
    setSelectedPresets((prev) =>
      prev.includes(presetName) ? prev.filter((item) => item !== presetName) : [...prev, presetName]
    );
  };

  const handleAddSelectedPresets = async () => {
    if (!subjectModalClass) {
      toastWarning('Please select a class first.');
      return;
    }
    if (selectedPresets.length === 0) {
      toastWarning('Please select at least one subject.');
      return;
    }
    try {
      setSavingSubject(true);
      const res = await api.post('/progress-cards/subjects', {
        academicYear: subjectModalYear,
        className: subjectModalClass,
        category: subjectModalCategory,
        subjects: selectedPresets.map((name) => ({
          name,
          maxMarks: subjectModalCategory === 'scholastic' ? 100 : 100
        }))
      });
      toastSuccess(res.data?.message || 'Selected subjects added!');
      setSelectedPresets([]);
      await Promise.all([
        loadModalSubjects(subjectModalYear, subjectModalClass),
        fetchClassSubjects(),
        fetchStudents()
      ]);
    } catch (error) {
      toastError(error.response?.data?.error || 'Failed to add selected subjects.');
    } finally {
      setSavingSubject(false);
    }
  };

  const handleToggleSubjectActive = async (subj) => {
    try {
      await api.put(`/progress-cards/subjects/${subj._id}`, {
        isActive: !subj.isActive
      });
      toastSuccess(`${subj.name} ${!subj.isActive ? 'enabled' : 'hidden'} for Class ${subjectModalClass}`);
      await Promise.all([
        loadModalSubjects(subjectModalYear, subjectModalClass),
        fetchClassSubjects(),
        fetchStudents()
      ]);
    } catch (error) {
      toastError(error.response?.data?.error || 'Failed to update subject status.');
    }
  };

  const handleSaveSubjectEdit = async (subj) => {
    if (!editingSubjectName.trim()) {
      toastWarning('Subject name cannot be empty.');
      return;
    }
    try {
      setSavingSubject(true);
      await api.put(`/progress-cards/subjects/${subj._id}`, {
        name: editingSubjectName.trim(),
        maxMarks: subj.category === 'scholastic' ? Number(editingSubjectMaxMarks) || 100 : 100
      });
      toastSuccess('Subject updated across class & cards!');
      setEditingSubjectId(null);
      await Promise.all([
        loadModalSubjects(subjectModalYear, subjectModalClass),
        fetchClassSubjects(),
        fetchStudents()
      ]);
    } catch (error) {
      toastError(error.response?.data?.error || 'Failed to update subject.');
    } finally {
      setSavingSubject(false);
    }
  };

  const handleMoveSubject = async (subj, direction) => {
    const sameCat = modalSubjects.filter((s) => s.category === subj.category);
    const idx = sameCat.findIndex((s) => s._id === subj._id);
    const swapIdx = idx + direction;
    if (idx < 0 || swapIdx < 0 || swapIdx >= sameCat.length) return;

    const target = sameCat[swapIdx];
    try {
      await Promise.all([
        api.put(`/progress-cards/subjects/${subj._id}`, { displayOrder: target.displayOrder }),
        api.put(`/progress-cards/subjects/${target._id}`, { displayOrder: subj.displayOrder === target.displayOrder ? target.displayOrder + direction : subj.displayOrder })
      ]);
      await Promise.all([
        loadModalSubjects(subjectModalYear, subjectModalClass),
        fetchClassSubjects(),
        fetchStudents()
      ]);
    } catch (error) {
      toastError('Failed to reorder subject.');
    }
  };

  const handleDeleteSubject = async (subj) => {
    try {
      const res = await api.delete(`/progress-cards/subjects/${subj._id}`);
      toastSuccess(res.data?.message || 'Subject removed.');
      await Promise.all([
        loadModalSubjects(subjectModalYear, subjectModalClass),
        fetchClassSubjects(),
        fetchStudents()
      ]);
    } catch (error) {
      toastError(error.response?.data?.error || 'Failed to remove subject.');
    }
  };

  // ================= SUBJECT-WISE MARKS / GRADE ENTRY =================
  const loadSubjectEntryData = async (year, cls, sec, term, category, preferredSubjectId = '') => {
    if (!year || !cls) {
      setEntrySubjectsList([]);
      setEntryRows([]);
      return;
    }
    try {
      setLoadingEntryData(true);
      const [subjRes, cardsRes] = await Promise.all([
        api.get('/progress-cards/subjects', {
          params: { academicYear: year, className: cls, category },
          cache: false,
          skipToast: true
        }),
        api.get('/progress-cards', {
          params: {
            academicYear: year,
            currentClass: cls,
            ...(sec ? { section: sec } : {}),
            term
          },
          cache: false,
          skipToast: true
        })
      ]);

      const subjs = subjRes.data || [];
      const stuList = cardsRes.data || [];
      setEntrySubjectsList(subjs);

      const chosenSubj =
        subjs.find((s) => s._id === preferredSubjectId) ||
        subjs[0] ||
        null;

      setSelectedEntrySubjectId(chosenSubj?._id || '');

      if (chosenSubj) {
        buildEntryRows(stuList, chosenSubj, category);
      } else {
        setEntryRows([]);
      }
    } catch (error) {
      console.error('Error loading subject entry data:', error);
      toastError('Failed to load subject entry sheet.');
    } finally {
      setLoadingEntryData(false);
    }
  };

  const buildEntryRows = (stuList, subjectObj, category) => {
    const rows = stuList.map((stu) => {
      const list = category === 'scholastic' ? stu.scholastic || [] : stu.coScholastic || [];
      const found = list.find(
        (item) =>
          (item.subjectId && item.subjectId === subjectObj._id) ||
          String(item.subject || '').trim().toLowerCase() === subjectObj.name.trim().toLowerCase()
      );
      return {
        studentId: stu._id,
        admissionNumber: stu.admissionNumber,
        studentName: stu.studentName,
        currentClass: stu.currentClass,
        section: stu.section,
        mark: found?.mark !== undefined && found?.mark !== null ? found.mark : '',
        grade: found?.grade || ''
      };
    });
    setEntryRows(rows);
  };

  const handleOpenSubjectEntry = () => {
    const defaultYear = filterYear || academicYears.find((y) => y.status === 'Active')?.year || academicYears[0]?.year || '';
    const defaultClass = filterClass || classes[0]?.name || '';
    const defaultSec = filterClass ? filterSection : '';
    setEntryYear(defaultYear);
    setEntryClass(defaultClass);
    setEntrySection(defaultSec);
    setEntryTerm(filterTerm);
    setEntryCategory('scholastic');
    setIsSubjectEntryOpen(true);
    loadSubjectEntryData(defaultYear, defaultClass, defaultSec, filterTerm, 'scholastic');
  };

  const handleSubjectSelectionChange = async (newSubjectId) => {
    setSelectedEntrySubjectId(newSubjectId);
    const subjObj = entrySubjectsList.find((s) => s._id === newSubjectId);
    if (!subjObj) {
      setEntryRows([]);
      return;
    }
    try {
      setLoadingEntryData(true);
      const cardsRes = await api.get('/progress-cards', {
        params: {
          academicYear: entryYear,
          currentClass: entryClass,
          ...(entrySection ? { section: entrySection } : {}),
          term: entryTerm
        },
        cache: false,
        skipToast: true
      });
      buildEntryRows(cardsRes.data || [], subjObj, entryCategory);
    } catch {
      toastError('Failed to load student scores for subject.');
    } finally {
      setLoadingEntryData(false);
    }
  };

  const handleEntryRowChange = (idx, field, value) => {
    const selectedSubj = entrySubjectsList.find((s) => s._id === selectedEntrySubjectId);
    const maxMarks = selectedSubj?.maxMarks || 100;
    setEntryRows((prev) => {
      const next = [...prev];
      const row = { ...next[idx], [field]: value };
      if (field === 'mark' && entryCategory === 'scholastic') {
        row.grade = computeGradeFromMark(value, maxMarks);
      }
      next[idx] = row;
      return next;
    });
  };

  const handleSaveBulkSubjectGrades = async () => {
    const selectedSubj = entrySubjectsList.find((s) => s._id === selectedEntrySubjectId);
    if (!selectedSubj) {
      toastWarning('Please select a subject first.');
      return;
    }
    if (entryRows.length === 0) {
      toastWarning('No students available to save.');
      return;
    }
    try {
      setSavingBulkGrades(true);
      const res = await api.post('/progress-cards/bulk-subject-save', {
        academicYear: entryYear,
        term: entryTerm,
        className: entryClass,
        category: entryCategory,
        subjectId: selectedSubj._id,
        subjectName: selectedSubj.name,
        maxMarks: selectedSubj.maxMarks || 100,
        entries: entryRows.map((r) => ({
          studentId: r.studentId,
          currentClass: r.currentClass,
          section: r.section,
          mark: r.mark,
          grade: r.grade
        }))
      });
      toastSuccess(res.data?.message || 'Subject grades saved successfully!');
      setIsSubjectEntryOpen(false);
      await fetchStudents();
    } catch (error) {
      toastError(error.response?.data?.error || 'Failed to save subject grades.');
    } finally {
      setSavingBulkGrades(false);
    }
  };

  // ================= INDIVIDUAL STUDENT EDIT =================
  const handleOpenPreview = (student) => {
    setPreviewStudent(student);
    setIsPreviewModalOpen(true);
  };

  const handleOpenEdit = (student) => {
    setEditingStudent(JSON.parse(JSON.stringify(student)));
    setIsEditModalOpen(true);
  };

  const handleScholasticChange = (index, field, value) => {
    const updated = { ...editingStudent };
    updated.scholastic = [...(updated.scholastic || [])];
    updated.scholastic[index] = { ...updated.scholastic[index], [field]: value };

    if (field === 'mark') {
      const maxMarks = updated.scholastic[index].maxMarks || 100;
      updated.scholastic[index].grade = computeGradeFromMark(value, maxMarks);
    }

    const totals = computeTotals(updated.scholastic);
    updated.totalMarks = totals.totalMarks;
    updated.overallGrade = totals.overallGrade;
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
      await fetchStudents();
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

  // ================= TWO-PAGE A4 PDF & PRINT =================
  const getTargetContainerForExport = async (student) => {
    if (isPreviewModalOpen && previewStudent?._id === student._id && previewCardRef.current) {
      await waitForImagesToLoad(previewCardRef.current);
      return previewCardRef.current;
    }
    setOffscreenStudent(student);
    await new Promise((resolve) => setTimeout(resolve, 300));
    let retries = 0;
    while (retries < 15) {
      if (offscreenCardRef.current) {
        const text = offscreenCardRef.current.textContent || '';
        if (
          text.includes(student.studentName) ||
          (student.admissionNumber && text.includes(String(student.admissionNumber)))
        ) {
          break;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
      retries++;
    }
    if (offscreenCardRef.current) {
      await waitForImagesToLoad(offscreenCardRef.current);
    }
    return offscreenCardRef.current;
  };

  const generateStudentPdf = async (student) => {
    const cardElement = await getTargetContainerForExport(student);
    if (!cardElement) {
      throw new Error('Failed to capture report card.');
    }

    const pageElements = cardElement.querySelectorAll('.progress-card-page');
    if (pageElements.length === 0) {
      throw new Error('No report card pages found.');
    }

    const pdf = new jsPDF('p', 'mm', 'a4');
    const a4Width = pdf.internal.pageSize.getWidth(); // 210mm
    const a4Height = pdf.internal.pageSize.getHeight(); // 297mm

    for (let i = 0; i < pageElements.length; i++) {
      if (i > 0) pdf.addPage();
      const canvas = await html2canvas(pageElements[i], {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.96);
      let renderWidth = a4Width;
      let renderHeight = (canvas.height * renderWidth) / canvas.width;

      if (renderHeight > a4Height) {
        const ratio = a4Height / renderHeight;
        renderHeight = a4Height;
        renderWidth = renderWidth * ratio;
      }
      const xOffset = (a4Width - renderWidth) / 2;
      pdf.addImage(imgData, 'JPEG', xOffset, 0, renderWidth, renderHeight);
    }

    const cleanName = (student.studentName || 'Student')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    const cleanTerm = (student.term || filterTerm || 'TERM_II')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    const filename = `${cleanName}_${cleanTerm}.pdf`;

    pdf.save(filename);
    return filename;
  };

  const handleDownloadPdf = async (student) => {
    if (!student) return;
    try {
      setDownloadingPdf(true);
      const filename = await generateStudentPdf(student);
      toastSuccess(`Report card PDF downloaded (${filename})`);
    } catch (error) {
      console.error('Error downloading progress card PDF:', error);
      toastError(error.message || 'Failed to export PDF.');
    } finally {
      setDownloadingPdf(false);
      setOffscreenStudent(null);
    }
  };

  const handleDownloadBulkPdf = async () => {
    const targetStudents = students.filter((s) => selectedStudentIds.includes(s._id));
    if (targetStudents.length === 0) {
      toastWarning('Please select at least one student to download.');
      return;
    }

    try {
      setDownloadingBulkPdf(true);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const a4Width = pdf.internal.pageSize.getWidth(); // 210mm
      const a4Height = pdf.internal.pageSize.getHeight(); // 297mm
      let totalPagesAdded = 0;
      let processedStudentsCount = 0;

      for (let idx = 0; idx < targetStudents.length; idx++) {
        const student = targetStudents[idx];
        setBulkProgress({
          current: idx + 1,
          total: targetStudents.length,
          studentName: student.studentName
        });

        try {
          const cardElement = await getTargetContainerForExport(student);
          if (!cardElement) {
            console.error(`Failed to capture report card container for ${student.studentName}`);
            continue;
          }

          const pageElements = cardElement.querySelectorAll('.progress-card-page');
          if (pageElements.length === 0) {
            console.error(`No progress-card-page found for ${student.studentName}`);
            continue;
          }

          for (let p = 0; p < pageElements.length; p++) {
            if (totalPagesAdded > 0) {
              pdf.addPage();
            }

            const canvas = await html2canvas(pageElements[p], {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.96);
            let renderWidth = a4Width;
            let renderHeight = (canvas.height * renderWidth) / canvas.width;

            if (renderHeight > a4Height) {
              const ratio = a4Height / renderHeight;
              renderHeight = a4Height;
              renderWidth = renderWidth * ratio;
            }
            const xOffset = (a4Width - renderWidth) / 2;
            pdf.addImage(imgData, 'JPEG', xOffset, 0, renderWidth, renderHeight);
            totalPagesAdded++;
          }
          processedStudentsCount++;
        } catch (studentErr) {
          console.error(`Error processing student ${student.studentName} for combined PDF:`, studentErr);
        }

        // Brief delay before rendering next student
        if (idx < targetStudents.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      }

      if (totalPagesAdded > 0) {
        const cleanTerm = (filterTerm || 'TERM_II')
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');

        const filename =
          targetStudents.length === 1
            ? `${(targetStudents[0].studentName || 'Student').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '')}_${cleanTerm}.pdf`
            : `Student_Progress_Cards_${cleanTerm}.pdf`;

        pdf.save(filename);
        toastSuccess(
          `Downloaded combined PDF: ${filename} (${processedStudentsCount} student${processedStudentsCount > 1 ? 's' : ''}, ${totalPagesAdded} pages)`
        );
        setSelectedStudentIds([]);
      } else {
        toastError('Failed to generate combined report card PDF.');
      }
    } catch (error) {
      console.error('Error generating combined PDF:', error);
      toastError('An unexpected error occurred while generating combined PDF.');
    } finally {
      setDownloadingBulkPdf(false);
      setBulkProgress(null);
      setOffscreenStudent(null);
    }
  };

  const handlePrintCard = async (student) => {
    if (!student) return;
    try {
      setPrintingCard(true);
      const cardElement = await getTargetContainerForExport(student);
      if (!cardElement) {
        toastError('Failed to capture report card for printing.');
        return;
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toastError('Pop-up blocked! Please allow pop-ups to print Progress Card.');
        return;
      }

      const page1El = cardElement.querySelector('.progress-card-page-1');
      const page2El = cardElement.querySelector('.progress-card-page-2');
      const pagesHtml = `
        <div class="print-page-1">${page1El ? page1El.outerHTML : cardElement.innerHTML}</div>
        ${page2El ? `<div class="print-page-2">${page2El.outerHTML}</div>` : ''}
      `;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <base href="${window.location.origin}/" />
            <title>Progress Card - ${student.studentName}</title>
            <style>
              @page {
                size: A4 portrait;
                margin: 8mm;
              }
              * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              html, body {
                margin: 0;
                padding: 0;
                background: #ffffff;
                font-family: Arial, Helvetica, sans-serif;
              }
              .progress-card-page {
                width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              .print-page-1 {
                page-break-after: always;
                break-after: page;
              }
              .print-page-2 {
                page-break-inside: avoid;
                break-inside: avoid;
              }
            </style>
          </head>
          <body>
            ${pagesHtml}
            <script>
              window.onload = function() {
                const imgs = Array.from(document.images);
                Promise.all(imgs.map(img => img.complete ? Promise.resolve() : new Promise(res => {
                  img.onload = res;
                  img.onerror = res;
                  setTimeout(res, 2500);
                }))).then(() => {
                  setTimeout(() => {
                    window.focus();
                    window.print();
                  }, 150);
                });
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error('Error printing progress card:', error);
      toastError('Failed to print progress card.');
    } finally {
      setPrintingCard(false);
      setOffscreenStudent(null);
    }
  };

  // Summary of active subjects for selected year/class
  const activeScholasticCount = classSubjects.filter((s) => s.category === 'scholastic' && s.isActive).length;
  const activeCoScholasticCount = classSubjects.filter((s) => s.category === 'coScholastic' && s.isActive).length;

  const entryClassObj = classes.find((c) => c.name === entryClass);
  const entrySections = entryClassObj?.sections || [];

  const modalScholasticSubjects = modalSubjects.filter((s) => s.category === 'scholastic');
  const modalCoScholasticSubjects = modalSubjects.filter((s) => s.category === 'coScholastic');
  const displayedModalSubjects =
    subjectModalCategory === 'scholastic' ? modalScholasticSubjects : modalCoScholasticSubjects;
  const currentPresets =
    subjectModalCategory === 'scholastic' ? PRESET_SCHOLASTIC_SUBJECTS : PRESET_CO_SCHOLASTIC_SUBJECTS;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Award className="text-[#00599c]" size={28} />
            Student Progress Cards
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage class-wise subjects, enter student marks &amp; grades, preview, and print two-page A4 report cards.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedStudentIds.length > 0 && (
            <Button
              onClick={handleDownloadBulkPdf}
              disabled={downloadingBulkPdf}
              className="bg-[#00599c] hover:bg-[#004880] text-white flex items-center gap-1.5 text-sm font-bold shadow-sm"
              title="Download selected student report cards as one combined PDF"
            >
              <Download size={16} className={downloadingBulkPdf ? 'animate-bounce' : ''} />
              {downloadingBulkPdf
                ? `Generating Combined PDF (${bulkProgress?.current || 1}/${bulkProgress?.total || selectedStudentIds.length})...`
                : `${selectedStudentIds.length} Selected | Download Combined PDF`}
            </Button>
          )}
          <Button
            onClick={handleOpenSubjectManager}
            className="bg-[#00599c] hover:bg-[#004880] text-white flex items-center gap-1.5 text-sm"
          >
            <BookOpen size={16} /> Manage Subjects
          </Button>
          <Button
            variant="outline"
            onClick={handleOpenSubjectEntry}
            className="border-[#00599c] text-[#00599c] hover:bg-blue-50 flex items-center gap-1.5 text-sm font-semibold"
          >
            <ClipboardList size={16} /> Enter Subject Marks
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setFilterClass('');
              setFilterSection('');
              setFilterSearch('');
              fetchStudents({ currentClass: '', section: '', search: '' });
            }}
            className="flex items-center gap-1.5 text-sm"
          >
            <RefreshCw size={15} /> Reset
          </Button>
        </div>
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
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs font-bold text-gray-600 block">Term / Exam</Label>
                {canManageExams && (
                  <button
                    type="button"
                    onClick={handleOpenExamModal}
                    className="text-[11px] font-bold text-[#00599c] hover:underline flex items-center gap-0.5"
                    title="Add or manage exam names"
                  >
                    <Plus size={12} /> Add Exam
                  </button>
                )}
              </div>
              <select
                className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00599c]"
                value={filterTerm}
                onChange={(e) => {
                  if (e.target.value === '__ADD_NEW_EXAM__') {
                    handleOpenExamModal();
                    return;
                  }
                  setFilterTerm(e.target.value);
                }}
              >
                {examOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
                {canManageExams && (
                  <option value="__ADD_NEW_EXAM__">+ Add Exam Name...</option>
                )}
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

          {/* Centralized Subjects Status Strip */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2 text-gray-600">
              <span className="font-bold text-[#00599c] flex items-center gap-1">
                <BookOpen size={14} />
                Subjects ({filterYear || 'Active'}{filterClass ? ` • Class ${filterClass}` : ''}):
              </span>
              {activeScholasticCount === 0 && activeCoScholasticCount === 0 ? (
                <span className="text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full font-medium border border-amber-200">
                  No centralized subjects configured yet
                </span>
              ) : (
                <>
                  <span className="bg-blue-50 text-[#00599c] px-2.5 py-0.5 rounded-full font-semibold">
                    Scholastic: {activeScholasticCount}
                  </span>
                  <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-semibold">
                    Co-Scholastic: {activeCoScholasticCount}
                  </span>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={handleOpenSubjectManager}
              className="text-[#00599c] hover:underline font-bold"
            >
              Add / Select Subjects &rarr;
            </button>
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
              <p className="text-sm text-gray-400 mt-1">Try selecting a different academic year, class, section, or clear your search.</p>
            </div>
          ) : (
            <>
              {/* Table Action Bar / Bulk Download Strip */}
              <div className="p-3.5 sm:px-5 bg-gray-50/70 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm">
                  <span className="font-bold text-gray-800">
                    Students ({students.length})
                  </span>
                  {selectedStudentIds.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2 pl-3 border-l border-gray-300">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-[#00599c] text-white shadow-xs">
                        {selectedStudentIds.length} Selected
                      </span>
                      {students.length > paginatedStudents.length && selectedStudentIds.length < students.length && (
                        <button
                          type="button"
                          onClick={handleSelectAllFiltered}
                          className="text-xs font-semibold text-[#00599c] hover:underline"
                        >
                          Select all {students.length} students
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedStudentIds([])}
                        className="text-xs font-semibold text-gray-500 hover:text-red-600 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 font-medium">
                      (Use checkboxes to select students for bulk PDF download)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleDownloadBulkPdf}
                    disabled={selectedStudentIds.length === 0 || downloadingBulkPdf}
                    className={`${
                      selectedStudentIds.length > 0
                        ? 'bg-[#00599c] hover:bg-[#004880] text-white shadow-sm'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                    } flex items-center gap-1.5 text-xs font-bold transition-all`}
                    title={
                      selectedStudentIds.length === 0
                        ? 'Select at least one student to download'
                        : `Download ${selectedStudentIds.length} selected student report cards as one combined PDF`
                    }
                  >
                    <Download size={14} className={downloadingBulkPdf ? 'animate-bounce' : ''} />
                    {downloadingBulkPdf
                      ? `Generating Combined PDF (${bulkProgress?.current || 1}/${bulkProgress?.total || selectedStudentIds.length})...`
                      : selectedStudentIds.length > 0
                      ? `${selectedStudentIds.length} Student${selectedStudentIds.length > 1 ? 's' : ''} Selected | Download Selected`
                      : 'Download Selected'}
                  </Button>
                </div>
              </div>

              {/* Bulk Download Progress Indicator Strip */}
              {downloadingBulkPdf && bulkProgress && (
                <div className="bg-blue-50/90 border-b border-blue-200 px-4 py-2.5 flex items-center justify-between text-xs text-[#00599c]">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-[#00599c] border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>
                      Adding Pages <strong>{((bulkProgress.current - 1) * 2) + 1}–{bulkProgress.current * 2}</strong> (Student <strong>{bulkProgress.current}</strong> of <strong>{bulkProgress.total}</strong>:{' '}
                      <span className="font-semibold">{bulkProgress.studentName}</span>) to Combined PDF...
                    </span>
                  </div>
                  <span className="font-mono font-bold text-xs">
                    {Math.round((bulkProgress.current / bulkProgress.total) * 100)}%
                  </span>
                </div>
              )}

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80">
                      <TableHead className="w-10 text-center">
                        <input
                          ref={selectAllCheckboxRef}
                          type="checkbox"
                          aria-label="Select all students on page"
                          checked={isAllSelectedOnPage}
                          onChange={handleToggleSelectAll}
                          className="w-4 h-4 rounded border-gray-300 text-[#00599c] focus:ring-[#00599c] cursor-pointer"
                        />
                      </TableHead>
                      <TableHead className="w-14">#</TableHead>
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
                    {paginatedStudents.map((student, idx) => {
                      const isSelected = selectedStudentIds.includes(student._id);
                      const thumb = student.passport_photo || student.photoUrl;
                      return (
                        <TableRow
                          key={student._id}
                          className={`hover:bg-blue-50/30 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}
                        >
                          <TableCell className="w-10 text-center">
                            <input
                              type="checkbox"
                              aria-label={`Select ${student.studentName}`}
                              checked={isSelected}
                              onChange={() => handleToggleSelectStudent(student._id)}
                              className="w-4 h-4 rounded border-gray-300 text-[#00599c] focus:ring-[#00599c] cursor-pointer"
                            />
                          </TableCell>
                          <TableCell className="text-gray-500 text-xs">
                            {(currentPage - 1) * itemsPerPage + idx + 1}
                          </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 shrink-0">
                              {thumb ? (
                                <img
                                  src={getImageUrl(thumb)}
                                  alt={student.studentName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User size={16} className="text-gray-400" />
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-gray-900 block">{student.studentName}</span>
                              <span className="text-xs text-gray-500">
                                Father: {student.fatherName || '-'}
                                {student.aadId ? ` • AAD: ${student.aadId}` : ''}
                              </span>
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
                          {student.attendance?.studentAttendance ?? 0} / {student.attendance?.totalWorkingDays ?? 0} days
                        </TableCell>
                        <TableCell className="font-bold text-gray-900">
                          {student.totalMarks !== '' && student.totalMarks !== undefined && student.totalMarks !== null
                            ? student.totalMarks
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {student.overallGrade ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-green-100 text-green-800">
                              {student.overallGrade}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 font-medium">Not Graded</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
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
                              title="Edit Marks, Attendance & Health"
                              className="text-amber-600 hover:bg-amber-50"
                            >
                              <Edit3 size={16} className="mr-1" /> Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePrintCard(student)}
                              disabled={printingCard || downloadingBulkPdf}
                              title="Print Two-Page A4 Card"
                              className="text-gray-700 hover:bg-gray-100"
                            >
                              <Printer size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadPdf(student)}
                              disabled={downloadingPdf || downloadingBulkPdf}
                              title="Download Two-Page A4 PDF"
                              className="text-indigo-600 hover:bg-indigo-50"
                            >
                              <Download size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
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
        className="max-w-4xl"
      >
        <div className="flex flex-col items-center">
          {/* Top Modal Action Buttons */}
          <div className="w-full flex flex-wrap justify-between items-center gap-2 pb-4 mb-4 border-b border-gray-200">
            <div className="text-sm text-gray-500">
              Showing preview for <span className="font-bold text-gray-800">{previewStudent?.studentName}</span> (Class {previewStudent?.currentClass} - {previewStudent?.section})
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenEdit(previewStudent)}
                className="flex items-center gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-50"
              >
                <Edit3 size={15} /> Edit Marks
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePrintCard(previewStudent)}
                disabled={printingCard || downloadingBulkPdf}
                className="flex items-center gap-1.5"
              >
                <Printer size={16} /> {printingCard ? 'Preparing...' : 'Print A4'}
              </Button>
              <Button
                size="sm"
                onClick={() => handleDownloadPdf(previewStudent)}
                disabled={downloadingPdf || downloadingBulkPdf}
                className="bg-[#00599c] hover:bg-[#004880] text-white flex items-center gap-1.5"
              >
                <Download size={16} /> {downloadingPdf ? 'Exporting...' : 'Download PDF'}
              </Button>
            </div>
          </div>

          {/* Render Actual Progress Card */}
          <div className="w-full overflow-x-auto p-4 bg-gray-100 rounded-lg flex justify-center">
            {previewStudent && <StudentProgressCard ref={previewCardRef} student={previewStudent} />}
          </div>
        </div>
      </Modal>

      {/* ================= CENTRALIZED SUBJECT MANAGEMENT MODAL ================= */}
      <Modal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        title="Centralized Subject Management"
        className="max-w-3xl"
      >
        <div className="space-y-5">
          {/* Class & Academic Year Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-lg border border-gray-200">
            <div>
              <Label className="text-xs font-bold text-gray-600 mb-1 block">Academic Year</Label>
              <select
                className="w-full h-9 px-3 bg-white border border-gray-300 rounded-md text-sm"
                value={subjectModalYear}
                onChange={(e) => setSubjectModalYear(e.target.value)}
              >
                {academicYears.map((y) => (
                  <option key={y._id} value={y.year}>
                    {y.year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs font-bold text-gray-600 mb-1 block">Target Class (Applies to all students in class)</Label>
              <select
                className="w-full h-9 px-3 bg-white border border-gray-300 rounded-md text-sm"
                value={subjectModalClass}
                onChange={(e) => setSubjectModalClass(e.target.value)}
              >
                {classes.map((c) => (
                  <option key={c._id} value={c.name}>
                    Class {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              onClick={() => {
                setSubjectModalCategory('scholastic');
                setSelectedPresets([]);
              }}
              className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${
                subjectModalCategory === 'scholastic'
                  ? 'border-[#00599c] text-[#00599c]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Scholastic Subjects ({modalScholasticSubjects.filter((s) => s.isActive).length})
            </button>
            <button
              type="button"
              onClick={() => {
                setSubjectModalCategory('coScholastic');
                setSelectedPresets([]);
              }}
              className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${
                subjectModalCategory === 'coScholastic'
                  ? 'border-[#00599c] text-[#00599c]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Co-Scholastic Subjects ({modalCoScholasticSubjects.filter((s) => s.isActive).length})
            </button>
          </div>

          {/* Quick Subject Selection */}
          <div className="border border-blue-100 bg-blue-50/40 rounded-lg p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#00599c] uppercase">
                Quick Select {subjectModalCategory === 'scholastic' ? 'Scholastic' : 'Co-Scholastic'} Subjects
              </span>
              {selectedPresets.length > 0 && (
                <Button
                  size="sm"
                  onClick={handleAddSelectedPresets}
                  disabled={savingSubject}
                  className="h-7 px-3 text-xs bg-[#00599c] hover:bg-[#004880] text-white"
                >
                  <Plus size={14} className="mr-1" /> Add Selected ({selectedPresets.length})
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {currentPresets.map((preset) => {
                const alreadyActive = displayedModalSubjects.some(
                  (s) => s.isActive && s.name.trim().toLowerCase() === preset.toLowerCase()
                );
                const isSelected = selectedPresets.includes(preset);
                return (
                  <button
                    key={preset}
                    type="button"
                    disabled={alreadyActive}
                    onClick={() => handleTogglePreset(preset)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${
                      alreadyActive
                        ? 'bg-green-50 border-green-200 text-green-700 cursor-default'
                        : isSelected
                          ? 'bg-[#00599c] border-[#00599c] text-white'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-[#00599c]'
                    }`}
                  >
                    {alreadyActive ? (
                      <Check size={12} />
                    ) : isSelected ? (
                      <CheckSquare size={12} />
                    ) : (
                      <Square size={12} />
                    )}
                    {preset}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add Custom Subject */}
          <form onSubmit={handleAddCustomSubject} className="flex flex-col sm:flex-row gap-2 items-end">
            <div className="flex-1 w-full">
              <Label className="text-xs font-bold text-gray-600 mb-1 block">Add Custom Subject</Label>
              <Input
                placeholder={`Enter ${subjectModalCategory === 'scholastic' ? 'Scholastic' : 'Co-Scholastic'} subject name...`}
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
              />
            </div>
            {subjectModalCategory === 'scholastic' && (
              <div className="w-full sm:w-28">
                <Label className="text-xs font-bold text-gray-600 mb-1 block">Max Marks</Label>
                <Input
                  type="number"
                  min={1}
                  value={newSubjectMaxMarks}
                  onChange={(e) => setNewSubjectMaxMarks(e.target.value)}
                />
              </div>
            )}
            <Button
              type="submit"
              disabled={savingSubject}
              className="bg-[#00599c] hover:bg-[#004880] text-white shrink-0 w-full sm:w-auto"
            >
              <Plus size={16} className="mr-1" /> Add Subject
            </Button>
          </form>

          {/* Existing Configured Subjects List */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-3.5 py-2 border-b border-gray-200 text-xs font-bold text-gray-600 flex justify-between items-center">
              <span>
                Configured Subjects for Class {subjectModalClass} ({subjectModalYear})
              </span>
              <span className="text-gray-400 font-normal">Checked subjects appear on all students&apos; cards</span>
            </div>

            {loadingModalSubjects ? (
              <div className="p-8 text-center text-sm text-gray-500">Loading subjects...</div>
            ) : displayedModalSubjects.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No {subjectModalCategory === 'scholastic' ? 'scholastic' : 'co-scholastic'} subjects configured yet.
                Select from above or add a custom subject.
              </div>
            ) : (
              <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
                {displayedModalSubjects.map((subj, idx) => {
                  const isEditing = editingSubjectId === subj._id;
                  return (
                    <div
                      key={subj._id}
                      className={`px-3.5 py-2.5 flex items-center justify-between gap-2 ${
                        subj.isActive ? 'bg-white' : 'bg-gray-50 opacity-75'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleSubjectActive(subj)}
                          title={subj.isActive ? 'Unselect (hide without deleting marks)' : 'Select (show on cards)'}
                          className="text-[#00599c] shrink-0"
                        >
                          {subj.isActive ? <CheckSquare size={18} /> : <Square size={18} className="text-gray-400" />}
                        </button>

                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={editingSubjectName}
                              onChange={(e) => setEditingSubjectName(e.target.value)}
                              className="h-8 text-sm"
                            />
                            {subj.category === 'scholastic' && (
                              <Input
                                type="number"
                                min={1}
                                value={editingSubjectMaxMarks}
                                onChange={(e) => setEditingSubjectMaxMarks(e.target.value)}
                                className="h-8 w-20 text-sm text-center"
                              />
                            )}
                            <Button
                              size="sm"
                              onClick={() => handleSaveSubjectEdit(subj)}
                              disabled={savingSubject}
                              className="h-8 px-2 bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Check size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingSubjectId(null)}
                              className="h-8 px-2"
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        ) : (
                          <div className="truncate">
                            <span className={`font-bold text-sm ${subj.isActive ? 'text-gray-900' : 'text-gray-500 line-through'}`}>
                              {subj.name}
                            </span>
                            {subj.category === 'scholastic' && (
                              <span className="ml-2 text-xs text-gray-500">(Max: {subj.maxMarks || 100})</span>
                            )}
                            {!subj.isActive && (
                              <span className="ml-2 text-[11px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                                Hidden (Data Preserved)
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {!isEditing && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveSubject(subj, -1)}
                            disabled={idx === 0}
                            className="p-1 text-gray-500 hover:text-gray-800 disabled:opacity-30"
                            title="Move Up"
                          >
                            <ArrowUp size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveSubject(subj, 1)}
                            disabled={idx === displayedModalSubjects.length - 1}
                            className="p-1 text-gray-500 hover:text-gray-800 disabled:opacity-30"
                            title="Move Down"
                          >
                            <ArrowDown size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSubjectId(subj._id);
                              setEditingSubjectName(subj.name);
                              setEditingSubjectMaxMarks(String(subj.maxMarks || 100));
                            }}
                            className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                            title="Rename / Edit Subject"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubject(subj)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Remove Subject (preserves historical report card data)"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* ================= SUBJECT-WISE MARKS / GRADE ENTRY MODAL ================= */}
      <Modal
        isOpen={isSubjectEntryOpen}
        onClose={() => setIsSubjectEntryOpen(false)}
        title="Subject-Wise Marks & Grade Entry"
        className="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-gray-50 p-3.5 rounded-lg border border-gray-200">
            <div>
              <Label className="text-xs font-bold text-gray-600 mb-1 block">Academic Year</Label>
              <select
                className="w-full h-9 px-2 bg-white border border-gray-300 rounded-md text-xs"
                value={entryYear}
                onChange={(e) => {
                  const val = e.target.value;
                  setEntryYear(val);
                  loadSubjectEntryData(val, entryClass, entrySection, entryTerm, entryCategory);
                }}
              >
                {academicYears.map((y) => (
                  <option key={y._id} value={y.year}>
                    {y.year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-600 mb-1 block">Class</Label>
              <select
                className="w-full h-9 px-2 bg-white border border-gray-300 rounded-md text-xs"
                value={entryClass}
                onChange={(e) => {
                  const val = e.target.value;
                  setEntryClass(val);
                  setEntrySection('');
                  loadSubjectEntryData(entryYear, val, '', entryTerm, entryCategory);
                }}
              >
                {classes.map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-600 mb-1 block">Section</Label>
              <select
                className="w-full h-9 px-2 bg-white border border-gray-300 rounded-md text-xs"
                value={entrySection}
                onChange={(e) => {
                  const val = e.target.value;
                  setEntrySection(val);
                  loadSubjectEntryData(entryYear, entryClass, val, entryTerm, entryCategory, selectedEntrySubjectId);
                }}
              >
                <option value="">All Sections</option>
                {entrySections.map((s, idx) => (
                  <option key={idx} value={s.name || s}>
                    {s.name || s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-600 mb-1 block">Term</Label>
              <select
                className="w-full h-9 px-2 bg-white border border-gray-300 rounded-md text-xs"
                value={entryTerm}
                onChange={(e) => {
                  const val = e.target.value;
                  setEntryTerm(val);
                  loadSubjectEntryData(entryYear, entryClass, entrySection, val, entryCategory, selectedEntrySubjectId);
                }}
              >
                {examOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-600 mb-1 block">Category</Label>
              <select
                className="w-full h-9 px-2 bg-white border border-gray-300 rounded-md text-xs"
                value={entryCategory}
                onChange={(e) => {
                  const val = e.target.value;
                  setEntryCategory(val);
                  loadSubjectEntryData(entryYear, entryClass, entrySection, entryTerm, val);
                }}
              >
                <option value="scholastic">Scholastic</option>
                <option value="coScholastic">Co-Scholastic</option>
              </select>
            </div>
          </div>

          {/* Select Subject Dropdown */}
          <div>
            <Label className="text-xs font-bold text-[#00599c] mb-1 block uppercase">
              Select Subject
            </Label>
            {entrySubjectsList.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex justify-between items-center">
                <span>
                  No {entryCategory === 'scholastic' ? 'Scholastic' : 'Co-Scholastic'} subjects configured for Class {entryClass} ({entryYear}).
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsSubjectEntryOpen(false);
                    setSubjectModalYear(entryYear);
                    setSubjectModalClass(entryClass);
                    setSubjectModalCategory(entryCategory);
                    setIsSubjectModalOpen(true);
                    loadModalSubjects(entryYear, entryClass);
                  }}
                  className="h-7 text-xs border-amber-400 text-amber-900"
                >
                  Add Subjects
                </Button>
              </div>
            ) : (
              <select
                className="w-full h-10 px-3 bg-white border border-[#00599c] rounded-lg text-sm font-bold text-gray-900"
                value={selectedEntrySubjectId}
                onChange={(e) => handleSubjectSelectionChange(e.target.value)}
              >
                {entrySubjectsList.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} {s.category === 'scholastic' ? `(Max Marks: ${s.maxMarks || 100})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Students Marks/Grade Sheet */}
          {loadingEntryData ? (
            <div className="py-10 text-center text-sm text-gray-500">Loading student list...</div>
          ) : entrySubjectsList.length > 0 && entryRows.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-500">
              No students found in Class {entryClass}{entrySection ? ` - ${entrySection}` : ''} ({entryYear}).
            </div>
          ) : (
            entrySubjectsList.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                      <tr>
                        <th className="py-2 px-3 text-left text-xs font-bold text-gray-600 w-10">#</th>
                        <th className="py-2 px-3 text-left text-xs font-bold text-gray-600">Adm No</th>
                        <th className="py-2 px-3 text-left text-xs font-bold text-gray-600">Student Name</th>
                        {entryCategory === 'scholastic' && (
                          <th className="py-2 px-3 text-center text-xs font-bold text-gray-600 w-28">Marks</th>
                        )}
                        <th className="py-2 px-3 text-center text-xs font-bold text-gray-600 w-28">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {entryRows.map((row, idx) => (
                        <tr key={row.studentId} className="hover:bg-blue-50/30">
                          <td className="py-2 px-3 text-xs text-gray-500">{idx + 1}</td>
                          <td className="py-2 px-3 text-xs font-mono font-semibold">{row.admissionNumber}</td>
                          <td className="py-2 px-3 font-semibold text-gray-900">
                            {row.studentName}
                            <span className="ml-1.5 text-xs text-gray-400">({row.currentClass}-{row.section})</span>
                          </td>
                          {entryCategory === 'scholastic' && (
                            <td className="py-1.5 px-3">
                              <Input
                                type="number"
                                className="h-8 text-center font-bold"
                                placeholder="-"
                                value={row.mark}
                                onChange={(e) => handleEntryRowChange(idx, 'mark', e.target.value)}
                              />
                            </td>
                          )}
                          <td className="py-1.5 px-3">
                            <select
                              className="w-full h-8 px-2 bg-white border border-gray-300 rounded-md text-center font-bold text-sm"
                              value={row.grade}
                              onChange={(e) => handleEntryRowChange(idx, 'grade', e.target.value)}
                            >
                              <option value="">-</option>
                              {GRADE_OPTIONS.map((g) => (
                                <option key={g} value={g}>
                                  {g}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
            <Button variant="outline" onClick={() => setIsSubjectEntryOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveBulkSubjectGrades}
              disabled={savingBulkGrades || entryRows.length === 0 || !selectedEntrySubjectId}
              className="bg-[#00599c] hover:bg-[#004880] text-white flex items-center gap-1.5"
            >
              <Save size={16} /> {savingBulkGrades ? 'Saving...' : 'Save Subject Grades'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ================= EDIT INDIVIDUAL STUDENT MARKS & ATTENDANCE MODAL ================= */}
      {editingStudent && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Progress Data - ${editingStudent.studentName}`}
          className="max-w-3xl"
        >
          <div className="space-y-5 max-h-[75vh] overflow-y-auto px-1">
            {/* Attendance & Health */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 space-y-3">
              <h3 className="font-bold text-sm text-[#00599c] uppercase">Attendance &amp; Health Status</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-gray-600">Total Working Days</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editingStudent.attendance?.totalWorkingDays ?? 0}
                    onChange={(e) => {
                      const updated = { ...editingStudent };
                      updated.attendance = {
                        ...updated.attendance,
                        totalWorkingDays: parseInt(e.target.value, 10) || 0
                      };
                      setEditingStudent(updated);
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Student Attendance</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editingStudent.attendance?.studentAttendance ?? 0}
                    onChange={(e) => {
                      const updated = { ...editingStudent };
                      updated.attendance = {
                        ...updated.attendance,
                        studentAttendance: parseInt(e.target.value, 10) || 0
                      };
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
                  <Label className="text-xs text-gray-600">Height</Label>
                  <Input
                    value={editingStudent.healthStatus?.height || ''}
                    placeholder="e.g. 125 cm"
                    onChange={(e) => {
                      const updated = { ...editingStudent };
                      updated.healthStatus = { ...updated.healthStatus, height: e.target.value };
                      setEditingStudent(updated);
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Weight</Label>
                  <Input
                    value={editingStudent.healthStatus?.weight || ''}
                    placeholder="e.g. 26 kg"
                    onChange={(e) => {
                      const updated = { ...editingStudent };
                      updated.healthStatus = { ...updated.healthStatus, weight: e.target.value };
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
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-[#00599c] uppercase">Scholastic Subjects &amp; Marks</h3>
                <span className="text-xs text-gray-500">
                  Class {editingStudent.currentClass} ({editingStudent.academicYear})
                </span>
              </div>

              {(!editingStudent.scholastic || editingStudent.scholastic.length === 0) ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex justify-between items-center">
                  <span>No scholastic subjects configured for Class {editingStudent.currentClass}.</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setSubjectModalYear(editingStudent.academicYear || filterYear);
                      setSubjectModalClass(editingStudent.currentClass);
                      setSubjectModalCategory('scholastic');
                      setIsSubjectModalOpen(true);
                      loadModalSubjects(editingStudent.academicYear || filterYear, editingStudent.currentClass);
                    }}
                    className="h-7 text-xs"
                  >
                    Manage Subjects
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs font-bold text-gray-500 uppercase px-2">
                    <div className="col-span-6">Subject</div>
                    <div className="col-span-3 text-center">Marks</div>
                    <div className="col-span-3 text-center">Grade</div>
                  </div>
                  {editingStudent.scholastic.map((item, idx) => (
                    <div key={item.subjectId || idx} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded">
                      <div className="col-span-6 font-bold text-gray-800 text-sm">
                        {item.subject}
                        <span className="ml-1.5 text-[11px] font-normal text-gray-500">/ {item.maxMarks || 100}</span>
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          className="text-center h-8 font-bold"
                          placeholder="-"
                          value={item.mark ?? ''}
                          onChange={(e) => handleScholasticChange(idx, 'mark', e.target.value)}
                        />
                      </div>
                      <div className="col-span-3">
                        <select
                          className="w-full h-8 px-2 bg-white border border-gray-300 rounded-md text-center font-bold text-sm"
                          value={item.grade || ''}
                          onChange={(e) => handleScholasticChange(idx, 'grade', e.target.value)}
                        >
                          <option value="">-</option>
                          {GRADE_OPTIONS.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Total Marks & Overall Grade Manual Selector Row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-3 border-t border-gray-200 px-3 py-2.5 bg-blue-50/40 rounded-lg gap-3">
                {/* Total Marks Manual Input */}
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-black text-gray-900 uppercase tracking-wide shrink-0 mb-0">
                    Total Marks:
                  </Label>
                  <Input
                    type="number"
                    className="w-28 h-8 text-center font-black text-sm bg-white border-gray-300 focus:border-[#00599c]"
                    placeholder="Total"
                    value={editingStudent.totalMarks ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingStudent({
                        ...editingStudent,
                        totalMarks: val === '' ? '' : (parseFloat(val) || 0)
                      });
                    }}
                  />
                </div>

                {/* Overall Grade Manual Selector & Auto Re-calc */}
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-black text-[#00599c] uppercase tracking-wide shrink-0 mb-0">
                    Overall Grade:
                  </Label>
                  <select
                    className="w-28 h-8 px-2 bg-white border-2 border-[#00599c] rounded-md text-center font-black text-sm text-[#00599c] focus:outline-none focus:ring-2 focus:ring-[#00599c]"
                    value={editingStudent.overallGrade || ''}
                    onChange={(e) => {
                      setEditingStudent({
                        ...editingStudent,
                        overallGrade: e.target.value
                      });
                    }}
                  >
                    <option value="">-</option>
                    {GRADE_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const totals = computeTotals(editingStudent.scholastic || []);
                      setEditingStudent({
                        ...editingStudent,
                        totalMarks: totals.totalMarks,
                        overallGrade: totals.overallGrade
                      });
                    }}
                    title="Auto-calculate Total Marks & Overall Grade from subject marks"
                    className="h-8 px-2.5 text-xs text-gray-600 hover:text-[#00599c] hover:bg-white border-gray-300 flex items-center gap-1 font-bold"
                  >
                    <RefreshCw size={13} /> Auto
                  </Button>
                </div>
              </div>
            </div>

            {/* Co-Scholastic Grades */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white space-y-3">
              <h3 className="font-bold text-sm text-[#00599c] uppercase">Co-Scholastic Subjects</h3>
              {(!editingStudent.coScholastic || editingStudent.coScholastic.length === 0) ? (
                <div className="p-3 bg-gray-50 rounded text-xs text-gray-500">
                  No co-scholastic subjects configured for Class {editingStudent.currentClass}.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {editingStudent.coScholastic.map((item, idx) => (
                    <div key={item.subjectId || idx} className="flex justify-between items-center p-2 bg-gray-50 rounded gap-2">
                      <span className="text-xs font-bold text-gray-800 uppercase truncate">{item.subject}</span>
                      <select
                        className="w-24 h-8 px-2 bg-white border border-gray-300 rounded-md text-center font-bold text-sm shrink-0"
                        value={item.grade || ''}
                        onChange={(e) => {
                          const updated = { ...editingStudent };
                          updated.coScholastic = [...updated.coScholastic];
                          updated.coScholastic[idx] = { ...updated.coScholastic[idx], grade: e.target.value };
                          setEditingStudent(updated);
                        }}
                      >
                        <option value="">-</option>
                        {GRADE_OPTIONS.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Self Awareness & Teacher Remarks */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 space-y-3">
              <h3 className="font-bold text-sm text-[#00599c] uppercase">Self Awareness &amp; Assessment Details</h3>
              <div className="space-y-2.5 text-xs">
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
                <div>
                  <Label className="text-xs text-gray-600">Responsibilities Discharged / Exceptional Achievements</Label>
                  <Input
                    value={editingStudent.selfAwareness?.responsibilitiesAchievements || ''}
                    onChange={(e) => {
                      const updated = { ...editingStudent };
                      updated.selfAwareness = {
                        ...updated.selfAwareness,
                        responsibilitiesAchievements: e.target.value
                      };
                      setEditingStudent(updated);
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Class Teacher Remarks / Assessment Details</Label>
                  <textarea
                    rows={2}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00599c]"
                    value={editingStudent.teacherRemarks || ''}
                    placeholder="Enter overall assessment remarks..."
                    onChange={(e) => {
                      setEditingStudent({ ...editingStudent, teacherRemarks: e.target.value });
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

      {/* ================= ADD / MANAGE EXAM NAME MODAL ================= */}
      <Modal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        title="Manage Exam Names"
        className="max-w-lg"
      >
        <div className="space-y-4">
          <form onSubmit={handleCreateExam} className="space-y-3 bg-gray-50 p-3.5 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <Label className="text-xs font-bold text-gray-600 mb-1 block">New Exam Name</Label>
                <Input
                  placeholder="e.g. Quarterly Examination, Monthly Test"
                  value={newExamName}
                  onChange={(e) => setNewExamName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-gray-600 mb-1 block">Applicable Class</Label>
                <select
                  className="w-full h-10 px-2.5 bg-white border border-gray-300 rounded-md text-sm"
                  value={newExamClass}
                  onChange={(e) => setNewExamClass(e.target.value)}
                >
                  <option value="ALL">All Classes</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c.name}>
                      Class {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-gray-500 block mb-1.5">
                Quick Examples (click to fill):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLE_EXAM_NAMES.map((exName) => (
                  <button
                    key={exName}
                    type="button"
                    onClick={() => setNewExamName(exName)}
                    className="px-2 py-0.5 text-[11px] font-medium rounded border border-gray-300 bg-white text-gray-700 hover:border-[#00599c] hover:text-[#00599c] transition-colors"
                  >
                    {exName}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={savingExam}
                className="bg-[#00599c] hover:bg-[#004880] text-white h-9 px-4 text-xs font-bold"
              >
                <Plus size={15} className="mr-1" /> {savingExam ? 'Saving...' : 'Add Exam'}
              </Button>
            </div>
          </form>

          {/* Existing Exams List */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-3.5 py-2 border-b border-gray-200 text-xs font-bold text-gray-600 flex justify-between items-center">
              <span>
                Saved Exams ({filterYear || 'Active'}{filterClass ? ` • Class ${filterClass}` : ''})
              </span>
              <span className="text-[11px] font-normal text-gray-400">Historical grades are always preserved</span>
            </div>
            <div className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
              {exams.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-500">No exams configured yet.</div>
              ) : (
                exams.map((exam) => {
                  const isEditing = editingExamId === exam._id;
                  const isSelected = filterTerm === exam.name;
                  return (
                    <div
                      key={exam._id}
                      className={`px-3.5 py-2 flex items-center justify-between gap-2 ${
                        isSelected ? 'bg-blue-50/50' : 'bg-white'
                      }`}
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={editingExamName}
                            onChange={(e) => setEditingExamName(e.target.value)}
                            className="h-8 text-sm flex-1"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSaveExamEdit(exam)}
                            disabled={savingExam}
                            className="h-8 px-2 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Check size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingExamId(null)}
                            className="h-8 px-2"
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setFilterTerm(exam.name);
                              setIsExamModalOpen(false);
                            }}
                            className="text-left flex-1 min-w-0"
                            title="Select this exam"
                          >
                            <span className={`font-bold text-sm ${isSelected ? 'text-[#00599c]' : 'text-gray-900'}`}>
                              {exam.name}
                            </span>
                            <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                              {exam.className === 'ALL' ? 'All Classes' : `Class ${exam.className}`}
                            </span>
                          </button>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingExamId(exam._id);
                                setEditingExamName(exam.name);
                              }}
                              className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                              title="Edit Exam Name"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteExam(exam)}
                              disabled={savingExam}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Delete Exam (preserves historical student grades)"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Hidden Offscreen Container for Direct Row Print / PDF */}
      {offscreenStudent && (
        <div
          aria-hidden="true"
          style={{ position: 'fixed', left: '-99999px', top: 0, width: '794px', zIndex: -1 }}
        >
          <StudentProgressCard ref={offscreenCardRef} student={offscreenStudent} printMode />
        </div>
      )}
    </div>
  );
};

export default ProgressCards;
