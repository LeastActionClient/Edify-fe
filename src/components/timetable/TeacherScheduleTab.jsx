import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { Modal } from '../ui/Modal';
import { Label } from '../ui/Label';
import { Input } from '../ui/Input';
import { useConfirm } from '../ui/ConfirmDialog';
import { toastSuccess, toastError } from '../../services/toastService';
import {
  GraduationCap,
  Calendar,
  Clock,
  Printer,
  Sparkles,
  CheckCircle,
  Phone,
  UserCheck,
  BookOpen,
  Plus,
  X,
  Layers
} from 'lucide-react';

const PALETTE = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6366F1'  // Indigo
];

export default function TeacherScheduleTab({
  academicYear,
  teachers = [],
  subjects = [],
  onOpenPrint,
  onRefreshData
}) {
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [allSubjects, setAllSubjects] = useState(subjects || []);

  // Subject Assignment & Creation State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignMode, setAssignMode] = useState('existing'); // 'existing' | 'create_new'
  const [assignForm, setAssignForm] = useState({
    subjectId: '',
    maxWeeklyPeriods: 30
  });
  const [newSubjectForm, setNewSubjectForm] = useState({
    name: '',
    code: '',
    category: 'Core',
    color: '#3B82F6',
    defaultWeeklyPeriods: 6
  });
  const [assigning, setAssigning] = useState(false);

  const confirm = useConfirm();

  useEffect(() => {
    if (teachers.length > 0 && !selectedTeacherId) {
      setSelectedTeacherId(teachers[0]._id);
    }
  }, [teachers]);

  useEffect(() => {
    if (subjects && subjects.length > 0) {
      setAllSubjects(subjects);
    } else {
      api.get('/timetable/subjects')
        .then((res) => setAllSubjects(res.data || []))
        .catch(() => {});
    }
  }, [subjects]);

  const fetchTeacherSchedule = async () => {
    if (!selectedTeacherId) return;
    setLoading(true);
    try {
      const res = await api.get(`/timetable/teacher-schedule/${selectedTeacherId}`, {
        params: { academicYear }
      });
      setScheduleData(res.data);
    } catch (err) {
      console.error('Error fetching teacher schedule:', err);
      toastError(err.response?.data?.error || 'Failed to load teacher schedule.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherSchedule();
  }, [selectedTeacherId, academicYear]);

  const teacher = scheduleData?.teacher;
  const config = scheduleData?.config;
  const schedule = scheduleData?.schedule || {};
  const stats = scheduleData?.stats || { assignedPeriods: 0, freePeriods: 0, totalWeeklySlots: 0 };
  const teacherSubjects = scheduleData?.teacherSubjects || [];

  const workingDays = config?.workingDays || [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ];
  const periods = (config?.periods || []).slice().sort((a, b) => a.periodNumber - b.periodNumber);

  // Handle Opening Modal
  const handleOpenAssignModal = () => {
    setAssignMode('existing');
    const available = allSubjects.find(
      (s) => !teacherSubjects.some((ts) => ts.subjectId?._id === s._id)
    );
    setAssignForm({
      subjectId: available?._id || (allSubjects[0]?._id || ''),
      maxWeeklyPeriods: 30
    });
    setNewSubjectForm({
      name: '',
      code: '',
      category: 'Core',
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      defaultWeeklyPeriods: 6
    });
    setIsAssignModalOpen(true);
  };

  // Handle Assigning (Existing or New) Subject to this teacher
  const handleAssignSubjectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeacherId) return;

    setAssigning(true);
    try {
      let targetSubjectId = assignForm.subjectId;

      if (assignMode === 'create_new') {
        if (!newSubjectForm.name.trim() || !newSubjectForm.code.trim()) {
          toastError('Subject Name and Code are required.');
          setAssigning(false);
          return;
        }

        // 1. Create the new subject in the curriculum
        const resSubject = await api.post('/timetable/subjects', {
          name: newSubjectForm.name.trim(),
          code: newSubjectForm.code.trim().toUpperCase(),
          category: newSubjectForm.category,
          color: newSubjectForm.color,
          defaultWeeklyPeriods: Number(newSubjectForm.defaultWeeklyPeriods) || 5
        });

        const createdSubject = resSubject.data;
        targetSubjectId = createdSubject._id;

        // Update local subjects list immediately
        setAllSubjects((prev) => [...prev, createdSubject]);
      } else {
        if (!targetSubjectId) {
          toastError('Please choose a subject.');
          setAssigning(false);
          return;
        }
      }

      // 2. Assign the subject to the teacher
      await api.post('/timetable/teacher-subjects', {
        teacherId: selectedTeacherId,
        subjectId: targetSubjectId,
        maxWeeklyPeriods: Number(assignForm.maxWeeklyPeriods) || 30
      });

      const subjectName = assignMode === 'create_new'
        ? newSubjectForm.name.trim()
        : allSubjects.find((s) => s._id === targetSubjectId)?.name || 'Subject';

      toastSuccess(`"${subjectName}" assigned to ${teacher?.name || 'teacher'} successfully!`);
      setIsAssignModalOpen(false);
      await fetchTeacherSchedule();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to assign subject.');
    } finally {
      setAssigning(false);
    }
  };

  // Handle Unassigning Subject
  const handleUnassignSubject = async (mappingId, subjectName) => {
    const isConfirmed = await confirm({
      title: `Unassign Subject?`,
      description: `Are you sure you want to unassign "${subjectName}" from ${teacher?.name || 'this teacher'}?`,
      confirmText: 'Unassign',
      tone: 'danger'
    });
    if (!isConfirmed) return;

    try {
      await api.delete(`/timetable/teacher-subjects/${mappingId}`);
      toastSuccess(`Unassigned ${subjectName} successfully.`);
      await fetchTeacherSchedule();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to unassign subject.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Teacher Selector and Stats Bar */}
      <Card className="border border-gray-200 shadow-xs bg-white">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Teacher Dropdown & Quick Badges */}
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Select Faculty / Teacher
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="h-9 px-3 bg-gray-50 border border-gray-300 rounded-lg text-sm font-semibold text-gray-800 focus:bg-white focus:border-blue-500 focus:outline-none min-w-[220px]"
                >
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.teacherId || t.designation || 'Faculty'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Teacher Summary Badges */}
              {teacher && (
                <div className="flex flex-wrap items-center gap-2 pt-5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    <GraduationCap size={13} className="text-blue-600" />
                    {teacher.designation || 'Faculty'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Assigned: {stats.assignedPeriods} Periods
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle size={13} className="text-emerald-600" />
                    Free: {stats.freePeriods} Periods
                  </span>
                </div>
              )}
            </div>

            {/* Print Action */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenPrint && onOpenPrint(scheduleData, 'teacher')}
                className="border-blue-200 text-blue-700 hover:bg-blue-50 font-semibold"
                disabled={!teacher}
              >
                <Printer size={15} className="mr-1.5 text-blue-600" />
                Print Teacher Schedule
              </Button>
            </div>
          </div>

          {/* Assigned Subjects Management Row */}
          {teacher && (
            <div className="mt-4 pt-3.5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5 mr-1">
                  <BookOpen size={14} className="text-blue-600" />
                  Assigned Subjects ({teacherSubjects.length}):
                </span>

                {teacherSubjects.map((ts) => {
                  const sub = ts.subjectId;
                  if (!sub) return null;
                  const color = sub.color || '#3B82F6';
                  return (
                    <span
                      key={ts._id}
                      className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg text-xs font-bold border transition-all shadow-2xs"
                      style={{
                        backgroundColor: `${color}15`,
                        borderColor: `${color}40`,
                        color: color
                      }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      {sub.name} ({sub.code})
                      <button
                        type="button"
                        onClick={() => handleUnassignSubject(ts._id, sub.name)}
                        className="ml-1 p-0.5 rounded hover:bg-black/10 text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
                        title={`Unassign ${sub.name}`}
                      >
                        <X size={13} />
                      </button>
                    </span>
                  );
                })}

                {teacherSubjects.length === 0 && (
                  <span className="text-xs text-gray-400 italic">
                    No subjects assigned yet
                  </span>
                )}
              </div>

              <Button
                size="sm"
                onClick={handleOpenAssignModal}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-8 px-3 shadow-2xs"
              >
                <Plus size={14} className="mr-1" />
                Add Subject to Teacher
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Schedule Grid */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <Spinner size="lg" text="Loading teacher schedule..." />
        </div>
      ) : (
        <Card className="border border-gray-200 shadow-sm bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[850px]">
              {/* Header: Days of the week */}
              <thead>
                <tr className="bg-gray-100/80 border-b border-gray-200 text-gray-700">
                  <th className="py-3 px-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600 w-36 border-r border-gray-200">
                    Period / Time
                  </th>
                  {workingDays.map((day) => (
                    <th
                      key={day}
                      className="py-3 px-3 text-center text-xs font-bold uppercase tracking-wider text-gray-700 border-r border-gray-200 last:border-r-0"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Rows: Periods */}
              <tbody className="divide-y divide-gray-200">
                {periods.map((periodSlot) => {
                  // Break row
                  if (periodSlot.isBreak) {
                    return (
                      <tr key={periodSlot.periodNumber} className="bg-amber-50/60">
                        <td className="py-2 px-3 border-r border-amber-200 text-xs font-bold text-amber-900">
                          <div>{periodSlot.name}</div>
                          <div className="text-[11px] font-normal text-amber-700">
                            {periodSlot.startTime} - {periodSlot.endTime}
                          </div>
                        </td>
                        <td
                          colSpan={workingDays.length}
                          className="py-1.5 px-4 text-center text-xs font-bold tracking-wide uppercase text-amber-800"
                        >
                          ☕ {periodSlot.name} ({periodSlot.startTime} – {periodSlot.endTime})
                        </td>
                      </tr>
                    );
                  }

                  // Normal teaching period row
                  return (
                    <tr key={periodSlot.periodNumber} className="hover:bg-gray-50/50">
                      {/* Period Time Info */}
                      <td className="py-2.5 px-3 bg-gray-50 border-r border-gray-200 text-xs text-gray-700">
                        <div className="font-bold text-gray-900">{periodSlot.name}</div>
                        <div className="text-[11px] text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                          <Clock size={11} className="text-gray-400" />
                          {periodSlot.startTime} - {periodSlot.endTime}
                        </div>
                      </td>

                      {/* Days */}
                      {workingDays.map((day) => {
                        const entry = schedule[day]?.[periodSlot.periodNumber];

                        if (entry) {
                          const subColor = entry.subjectId?.color || '#3B82F6';
                          return (
                            <td
                              key={day}
                              className="p-1.5 border-r border-gray-200 last:border-r-0 align-top"
                            >
                              <div
                                className="rounded-lg p-2.5 shadow-2xs border transition-all"
                                style={{
                                  backgroundColor: `${subColor}10`,
                                  borderColor: `${subColor}40`
                                }}
                              >
                                {/* Class & Section */}
                                <div className="text-xs font-extrabold text-gray-900">
                                  {entry.className}{' '}
                                  {entry.sectionName ? `(Sec ${entry.sectionName})` : ''}
                                </div>

                                {/* Subject Pill */}
                                <div className="mt-1 flex items-center gap-1">
                                  <span
                                    className="inline-block px-2 py-0.5 rounded text-[11px] font-bold text-white shadow-2xs truncate"
                                    style={{ backgroundColor: subColor }}
                                  >
                                    {entry.subjectName}
                                  </span>
                                </div>

                                {/* Room */}
                                {entry.room && (
                                  <div className="text-[10px] text-gray-500 mt-1 truncate">
                                    Room: {entry.room}
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        }

                        // Free / Available Period
                        return (
                          <td
                            key={day}
                            className="p-1.5 border-r border-gray-200 last:border-r-0 align-top"
                          >
                            <div className="h-full min-h-[64px] rounded-lg border border-emerald-200 bg-emerald-50/40 p-2 flex flex-col items-center justify-center text-center">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                                <Sparkles size={11} className="text-emerald-500" />
                                Free Period
                              </span>
                              <span className="text-[10px] text-emerald-600/80 mt-0.5">
                                Available
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal: Assign or Create Subject for Teacher */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Assign Subject to ${teacher?.name || 'Faculty'}`}
        className="max-w-md"
      >
        <form onSubmit={handleAssignSubjectSubmit} className="space-y-4">
          {/* Sub-Tabs: Choose Existing vs Create New */}
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              onClick={() => setAssignMode('existing')}
              className={`flex-1 pb-2 text-xs font-bold border-b-2 transition-all ${
                assignMode === 'existing'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Choose Existing Subject
            </button>
            <button
              type="button"
              onClick={() => setAssignMode('create_new')}
              className={`flex-1 pb-2 text-xs font-bold border-b-2 transition-all ${
                assignMode === 'create_new'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              + Create & Assign New Subject
            </button>
          </div>

          {/* Mode 1: Choose Existing Subject */}
          {assignMode === 'existing' && (
            <div>
              <Label className="text-xs font-bold text-gray-700">Choose Subject *</Label>
              <select
                required
                value={assignForm.subjectId}
                onChange={(e) => {
                  if (e.target.value === '__create_new__') {
                    setAssignMode('create_new');
                  } else {
                    setAssignForm((prev) => ({ ...prev, subjectId: e.target.value }));
                  }
                }}
                className="w-full mt-1 h-9 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:border-blue-500 focus:outline-none"
              >
                <option value="">-- Select Subject --</option>
                {allSubjects.map((sub) => {
                  const isAlready = teacherSubjects.some((ts) => ts.subjectId?._id === sub._id);
                  return (
                    <option key={sub._id} value={sub._id} disabled={isAlready}>
                      {sub.name} ({sub.code}) - {sub.category} {isAlready ? '(Already Assigned)' : ''}
                    </option>
                  );
                })}
                <option value="__create_new__" className="font-bold text-blue-600">
                  + Create a brand new subject...
                </option>
              </select>
            </div>
          )}

          {/* Mode 2: Create Brand New Subject */}
          {assignMode === 'create_new' && (
            <div className="space-y-3.5 bg-blue-50/40 p-3.5 rounded-lg border border-blue-100">
              <div>
                <Label className="text-xs font-bold text-gray-700">Subject Name *</Label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. French, Robotics, Economics"
                  value={newSubjectForm.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    const autoCode = val.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase();
                    setNewSubjectForm((prev) => ({
                      ...prev,
                      name: val,
                      code: prev.code && prev.code !== prev.name.slice(0, 4).toUpperCase() ? prev.code : autoCode
                    }));
                  }}
                  className="mt-1 h-9 text-sm bg-white"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-gray-700">Subject Code *</Label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. FRE, ROB, ECO"
                  value={newSubjectForm.code}
                  onChange={(e) => setNewSubjectForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="mt-1 h-9 text-sm font-mono uppercase bg-white"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-gray-700">Category *</Label>
                <select
                  value={newSubjectForm.category}
                  onChange={(e) => setNewSubjectForm((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full mt-1 h-9 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:border-blue-500 focus:outline-none"
                >
                  <option value="Core">Core (Math, Science, Social)</option>
                  <option value="Language">Language (Tamil, English, Hindi, French)</option>
                  <option value="Science/Lab">Science / Lab / Computers</option>
                  <option value="Activity">Activity / PE / Arts / Music</option>
                  <option value="General">General / GK / Moral Science</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-bold text-gray-700">Badge Color *</Label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {PALETTE.map((color) => (
                    <button
                      type="button"
                      key={color}
                      onClick={() => setNewSubjectForm((prev) => ({ ...prev, color }))}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        newSubjectForm.color === color ? 'border-gray-900 scale-110 shadow-xs' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Common Field: Max Weekly Periods */}
          <div>
            <Label className="text-xs font-bold text-gray-700">Max Weekly Periods</Label>
            <Input
              type="number"
              min={1}
              max={60}
              value={assignForm.maxWeeklyPeriods}
              onChange={(e) => setAssignForm((prev) => ({ ...prev, maxWeeklyPeriods: Number(e.target.value) }))}
              className="mt-1 h-9 text-sm"
              placeholder="30"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Maximum periods this faculty can teach for this subject per week (Default: 30)
            </p>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAssignModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={assigning || (assignMode === 'existing' && !assignForm.subjectId) || (assignMode === 'create_new' && (!newSubjectForm.name.trim() || !newSubjectForm.code.trim()))}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {assigning
                ? 'Saving...'
                : assignMode === 'create_new'
                ? 'Create & Assign Subject'
                : 'Assign Subject'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
