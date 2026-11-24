import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner, PageLoader } from '../components/ui/Spinner';
import { toastError } from '../services/toastService';
import ClassTimetableTab from '../components/timetable/ClassTimetableTab';
import TeacherScheduleTab from '../components/timetable/TeacherScheduleTab';
import TimetableConfigTab from '../components/timetable/TimetableConfigTab';
import PrintableTimetables from '../components/timetable/PrintableTimetables';
import {
  CalendarRange,
  Users,
  BookOpen,
  Clock,
  AlertTriangle,
  CheckCircle,
  Layers,
  GraduationCap,
  Printer,
  ShieldCheck,
  RefreshCw,
  Lock,
  Unlock
} from 'lucide-react';

export default function Timetable() {
  const [activeTab, setActiveTab] = useState('class'); // 'class' | 'teacher' | 'config'
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Print modal state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [printType, setPrintType] = useState('class');

  // Initial load
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [yearsRes, classesRes, subjectsRes, teachersRes] = await Promise.all([
        api.get('/academic-years').catch(() => ({ data: [] })),
        api.get('/classes').catch(() => ({ data: [] })),
        api.get('/timetable/subjects').catch(() => ({ data: [] })),
        api.get('/teachers').catch(() => ({ data: [] }))
      ]);

      const yrs = yearsRes.data || [];
      setAcademicYears(yrs);
      const active = yrs.find((y) => y.status === 'Active')?.year || yrs[0]?.year || '2026–2027';
      setSelectedYear(active);

      setClasses(classesRes.data || []);
      setSubjects(subjectsRes.data || []);
      setTeachers(teachersRes.data || []);

      // Fetch dashboard summary
      await fetchDashboardStats(active);
    } catch (err) {
      console.error('Error loading timetable initial data:', err);
      toastError('Failed to load timetable system data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async (year) => {
    try {
      const res = await api.get('/timetable/dashboard-summary', {
        params: { academicYear: year || selectedYear }
      });
      setDashboardStats(res.data);
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const [subjectsRes, teachersRes, classesRes] = await Promise.all([
        api.get('/timetable/subjects'),
        api.get('/teachers'),
        api.get('/classes')
      ]);
      setSubjects(subjectsRes.data || []);
      setTeachers(teachersRes.data || []);
      setClasses(classesRes.data || []);
      await fetchDashboardStats(selectedYear);
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleYearChange = (newYear) => {
    setSelectedYear(newYear);
    fetchDashboardStats(newYear);
  };

  // Open Print modal from child tabs
  const handleOpenPrint = (data, type = 'class') => {
    setPrintData(data);
    setPrintType(type);
    setIsPrintModalOpen(true);
  };

  // Open All Classes Print
  const handleOpenAllClassesPrint = async () => {
    try {
      const res = await api.get('/timetable/all-classes', {
        params: { academicYear: selectedYear }
      });
      setPrintData(res.data);
      setPrintType('all-classes');
      setIsPrintModalOpen(true);
    } catch (err) {
      toastError('Failed to load all classes timetables for printing.');
    }
  };

  if (loading) {
    return <PageLoader text="Loading Smart Timetable System..." />;
  }

  const conflictsCount = dashboardStats?.teacherConflicts || 0;
  const isConflictFree = conflictsCount === 0;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* ------------------------------------------------------------- */}
      {/* HEADER SECTION                                                */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <CalendarRange className="text-blue-600 h-7 w-7" />
              Smart Timetable Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Automated conflict-free scheduling, teacher workload balancing, and class timetables.
          </p>
        </div>

        {/* Academic Year Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-lg px-3 py-1.5 shadow-2xs">
            <span className="text-xs font-bold text-gray-500 uppercase">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-900 focus:outline-none cursor-pointer"
            >
              {academicYears.map((y) => (
                <option key={y._id || y.year} value={y.year}>
                  {y.year} {y.status === 'Active' ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenAllClassesPrint}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold"
          >
            <Printer size={15} className="mr-1.5 text-gray-600" />
            Print All Classes
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
            title="Refresh statistics"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* DASHBOARD STATISTICS CARDS (Requirement 9)                   */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Total Classes */}
        <Card className="border border-gray-200/80 shadow-2xs bg-white hover:shadow-xs transition-shadow">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Classes</span>
              <Layers size={15} className="text-blue-500" />
            </div>
            <div className="text-xl font-black text-gray-900">
              {dashboardStats?.totalClasses || classes.length}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">Active Class Roster</div>
          </CardContent>
        </Card>

        {/* Total Teachers */}
        <Card className="border border-gray-200/80 shadow-2xs bg-white hover:shadow-xs transition-shadow">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Faculty</span>
              <GraduationCap size={15} className="text-indigo-500" />
            </div>
            <div className="text-xl font-black text-gray-900">
              {dashboardStats?.totalTeachers || teachers.length}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">Teaching Staff</div>
          </CardContent>
        </Card>

        {/* Total Subjects */}
        <Card className="border border-gray-200/80 shadow-2xs bg-white hover:shadow-xs transition-shadow">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Subjects</span>
              <BookOpen size={15} className="text-emerald-500" />
            </div>
            <div className="text-xl font-black text-gray-900">
              {dashboardStats?.totalSubjects || subjects.length}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">Curriculum Courses</div>
          </CardContent>
        </Card>

        {/* Scheduled Periods */}
        <Card className="border border-gray-200/80 shadow-2xs bg-white hover:shadow-xs transition-shadow">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Scheduled</span>
              <Clock size={15} className="text-amber-500" />
            </div>
            <div className="text-xl font-black text-gray-900">
              {dashboardStats?.totalScheduledPeriods || 0}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">Allocated Periods</div>
          </CardContent>
        </Card>

        {/* Unassigned Periods */}
        <Card className="border border-gray-200/80 shadow-2xs bg-white hover:shadow-xs transition-shadow">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Unassigned</span>
              <Clock size={15} className="text-slate-400" />
            </div>
            <div className="text-xl font-black text-gray-700">
              {dashboardStats?.unassignedPeriods ?? '-'}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">Open Slots</div>
          </CardContent>
        </Card>

        {/* Teacher Conflicts (Crucial Business Rule Status) */}
        <Card
          className={`border shadow-2xs transition-shadow ${
            isConflictFree
              ? 'border-emerald-200 bg-emerald-50/40'
              : 'border-red-300 bg-red-50/50'
          }`}
        >
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider ${
                  isConflictFree ? 'text-emerald-800' : 'text-red-700'
                }`}
              >
                Clashes
              </span>
              {isConflictFree ? (
                <ShieldCheck size={16} className="text-emerald-600" />
              ) : (
                <AlertTriangle size={16} className="text-red-600" />
              )}
            </div>
            <div
              className={`text-xl font-black ${
                isConflictFree ? 'text-emerald-700' : 'text-red-600'
              }`}
            >
              {conflictsCount}
            </div>
            <div
              className={`text-[10px] font-semibold mt-0.5 ${
                isConflictFree ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {isConflictFree ? '100% Conflict Free' : 'Teacher Clashes Detected'}
            </div>
          </CardContent>
        </Card>

        {/* Publication Status */}
        <Card className="border border-gray-200/80 shadow-2xs bg-white hover:shadow-xs transition-shadow">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Published</span>
              <CheckCircle size={15} className="text-blue-500" />
            </div>
            <div className="text-xl font-black text-gray-900">
              {dashboardStats?.publicationStatus?.publishedCount || 0}
              <span className="text-xs font-normal text-gray-400">
                {' '}
                / {dashboardStats?.publicationStatus?.totalTimetables || 0}
              </span>
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">Classes Live</div>
          </CardContent>
        </Card>
      </div>

      {/* Conflicts Alert Banner if any conflict found */}
      {!isConflictFree && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
          <div className="flex items-center gap-2 font-bold text-sm text-red-900">
            <AlertTriangle size={18} className="text-red-600 shrink-0" />
            Attention: {conflictsCount} Teacher Allocation Conflict(s) Detected in Database
          </div>
          <p>
            The following allocations have teachers booked into multiple classes at the same time:
          </p>
          <ul className="list-disc ml-5 space-y-0.5">
            {dashboardStats.conflictsList.map((c, i) => (
              <li key={i}>{c.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MAIN NAVIGATION TABS                                          */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center gap-1 bg-gray-200/70 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('class')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'class'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Layers size={15} />
          Class Timetable
        </button>

        <button
          onClick={() => setActiveTab('teacher')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'teacher'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users size={15} />
          Teacher-Wise Schedule
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'config'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Clock size={15} />
          Timetable Configuration & Rules
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB CONTENT VIEWS                                             */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'class' && (
        <ClassTimetableTab
          academicYear={selectedYear}
          classes={classes}
          subjects={subjects}
          teachers={teachers}
          onRefreshStats={() => fetchDashboardStats(selectedYear)}
          onOpenPrint={handleOpenPrint}
        />
      )}

      {activeTab === 'teacher' && (
        <TeacherScheduleTab
          academicYear={selectedYear}
          teachers={teachers}
          subjects={subjects}
          onRefreshData={handleRefresh}
          onOpenPrint={handleOpenPrint}
        />
      )}

      {activeTab === 'config' && (
        <TimetableConfigTab
          academicYear={selectedYear}
          classes={classes}
          subjects={subjects}
          teachers={teachers}
          onRefreshData={handleRefresh}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* PRINTABLE TIMETABLE MODAL                                     */}
      {/* ------------------------------------------------------------- */}
      <PrintableTimetables
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        printData={printData}
        printType={printType}
        academicYear={selectedYear}
      />
    </div>
  );
}
