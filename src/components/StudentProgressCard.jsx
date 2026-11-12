import React from 'react';
import { User } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';
import schoolLogo from '../assets/progress_card_logo.png';

export const StudentProgressCard = React.forwardRef(({ student, printMode = false }, ref) => {
  if (!student) return null;

  const photo = student.passport_photo || student.photoUrl || '';
  const studentName = (student.studentName || 'STUDENT NAME').toUpperCase();
  const currentClass = student.currentClass || 'II';
  const section = student.section || 'A';
  const admissionNo = student.admissionNumber || '-';
  const fatherName = (student.fatherName || '').toUpperCase();
  const motherName = (student.motherName || '').toUpperCase();
  const mobileNo = student.mobileNo || student.fatherPhone || student.phone || '';
  const address = student.address || '';
  const academicYear = student.academicYear || '2025 - 2026';
  const term = student.term || 'TERM - II';

  const formatDob = (dob) => {
    if (!dob) return '-';
    try {
      const d = new Date(dob);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
    } catch (e) {
      // ignore
    }
    return String(dob);
  };

  const dobDisplay = formatDob(student.dob || student.dateOfBirth);

  const attendance = student.attendance || { totalWorkingDays: 58, studentAttendance: 54 };
  const healthStatus = student.healthStatus || { bloodGroup: '', height: '', weight: '', dentalHygiene: '' };
  const scholastic = student.scholastic || [
    { subject: 'Tamil', mark: 57, grade: 'B' },
    { subject: 'English I', mark: 55, grade: 'B' },
    { subject: 'Maths', mark: 60, grade: 'B' },
    { subject: 'EVS', mark: 63, grade: 'B' },
    { subject: 'Com', mark: 83, grade: 'A' },
    { subject: 'Hindi', mark: 76, grade: 'B+' },
    { subject: 'ENGLISH II', mark: 54, grade: 'C' }
  ];

  const totalMarks = student.totalMarks !== undefined ? student.totalMarks : scholastic.reduce((acc, row) => acc + (parseFloat(row.mark) || 0), 0);
  const overallGrade = student.overallGrade || 'B';

  const coScholastic = student.coScholastic || [
    { subject: 'G.K', grade: 'A' },
    { subject: 'V.E', grade: 'B' },
    { subject: 'ENGLISH DICTATION', grade: 'D' },
    { subject: 'TAMIL DICTATION', grade: 'D' },
    { subject: 'EVS DICTATION', grade: 'B+' }
  ];

  const selfAwareness = student.selfAwareness || {
    goals: '',
    strengths: '',
    interestsHobbies: '',
    responsibilitiesAchievements: ''
  };

  return (
    <div
      ref={ref}
      className={`progress-card-container bg-white text-gray-900 mx-auto select-none font-sans ${printMode ? '' : 'shadow-2xl'}`}
      style={{
        width: '794px', // standard A4 display width at 96 DPI
        minHeight: '1123px',
        boxSizing: 'border-box',
        padding: '24px',
        backgroundColor: '#ffffff'
      }}
    >
      {/* ================= PAGE 1 ================= */}
      <div className="progress-card-page mb-8 pb-6 border-b-2 border-dashed border-gray-300 print:border-none print:mb-0 print:pb-0" style={{ pageBreakAfter: 'always' }}>
        
        {/* Header Banner */}
        <div className="border border-[#00599c] flex items-stretch mb-4" style={{ minHeight: '108px' }}>
          {/* Logo on Left */}
          <div className="w-[190px] border-r border-[#00599c] flex items-center justify-center p-2 bg-white">
            <img src={schoolLogo} alt="Stanford Park Logo" className="max-h-[92px] max-w-full object-contain" />
          </div>

          {/* School Name and Info on Right */}
          <div className="flex-1 bg-[#00599c] text-white flex flex-col justify-center items-center text-center px-4 py-2">
            <h1 className="text-[20px] font-black tracking-wide uppercase leading-tight mb-1">
              STANFORD PARK EDIFY N &amp; P SCHOOL
            </h1>
            <p className="text-[12px] font-medium leading-tight mb-1 text-blue-50">
              1st West Cross Road, Gandhi Nagar(West), Near BTM Mahal, – 632006.
            </p>
            <p className="text-[11px] font-semibold leading-tight text-white">
              Mobile : 8124713111, Email : stanfordparkvellore@gmail.com .
            </p>
          </div>
        </div>

        {/* Report Card Title Strip */}
        <div className="bg-[#00599c] text-white text-center py-1.5 font-bold text-[14px] uppercase tracking-wider mb-2">
          Report Card : {academicYear} {term}
        </div>

        {/* Student Profile Info Table */}
        <div className="border border-[#00599c] mb-3 text-[12px]">
          <div className="flex">
            {/* Student Photo Column */}
            <div className="w-[110px] border-r border-[#00599c] flex items-center justify-center p-2 bg-gray-50">
              {photo ? (
                <img
                  src={getImageUrl(photo)}
                  alt={studentName}
                  className="w-[94px] h-[116px] object-cover border border-gray-300 rounded"
                />
              ) : (
                <div className="w-[94px] h-[116px] bg-white border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                  <User size={36} />
                  <span className="text-[10px] mt-1 text-center font-bold">Student Image</span>
                </div>
              )}
            </div>

            {/* Profile Fields Grid */}
            <div className="flex-1">
              {/* Row 1: Student Name | Father Name */}
              <div className="grid grid-cols-12 border-b border-gray-300">
                <div className="col-span-3 bg-gray-50 p-2 font-bold text-gray-700 border-r border-gray-300">Student Name</div>
                <div className="col-span-3 p-2 font-black text-gray-900 border-r border-gray-300 uppercase">{studentName}</div>
                <div className="col-span-3 bg-gray-50 p-2 font-bold text-gray-700 border-r border-gray-300">Father Name</div>
                <div className="col-span-3 p-2 font-bold text-gray-900 uppercase">{fatherName || '-'}</div>
              </div>

              {/* Row 2: Class | Mother Name */}
              <div className="grid grid-cols-12 border-b border-gray-300">
                <div className="col-span-3 bg-gray-50 p-2 font-bold text-gray-700 border-r border-gray-300">Class</div>
                <div className="col-span-3 p-2 font-bold text-gray-900 border-r border-gray-300">{currentClass}</div>
                <div className="col-span-3 bg-gray-50 p-2 font-bold text-gray-700 border-r border-gray-300">Mother Name</div>
                <div className="col-span-3 p-2 font-bold text-gray-900 uppercase">{motherName || '-'}</div>
              </div>

              {/* Row 3: Section | Mobile No */}
              <div className="grid grid-cols-12 border-b border-gray-300">
                <div className="col-span-3 bg-gray-50 p-2 font-bold text-gray-700 border-r border-gray-300">Section</div>
                <div className="col-span-3 p-2 font-bold text-gray-900 border-r border-gray-300">{section}</div>
                <div className="col-span-3 bg-gray-50 p-2 font-bold text-gray-700 border-r border-gray-300">Mobile No</div>
                <div className="col-span-3 p-2 font-bold text-gray-900">{mobileNo || '-'}</div>
              </div>

              {/* Row 4: Admission No | Address */}
              <div className="grid grid-cols-12 border-b border-gray-300">
                <div className="col-span-3 bg-gray-50 p-2 font-bold text-gray-700 border-r border-gray-300">Admission No</div>
                <div className="col-span-3 p-2 font-bold text-gray-900 border-r border-gray-300">{admissionNo}</div>
                <div className="col-span-3 bg-gray-50 p-2 font-bold text-gray-700 border-r border-gray-300">Address</div>
                <div className="col-span-3 p-2 font-medium text-gray-800 text-[11px] leading-tight uppercase" rowSpan={2}>
                  {address || '-'}
                </div>
              </div>

              {/* Row 5: DOB */}
              <div className="grid grid-cols-12">
                <div className="col-span-3 bg-gray-50 p-2 font-bold text-gray-700 border-r border-gray-300">DOB</div>
                <div className="col-span-3 p-2 font-bold text-gray-900 border-r border-gray-300">{dobDisplay}</div>
                <div className="col-span-6 p-2 bg-white"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="border border-[#00599c] mb-3 text-[12px]">
          <div className="grid grid-cols-12 bg-[#00599c] text-white font-bold text-center">
            <div className="col-span-3 p-2 border-r border-white/30 text-left pl-3">Attendance</div>
            <div className="col-span-4 p-2 border-r border-white/30">Total Working Days</div>
            <div className="col-span-5 p-2">Total Attendance of the Student</div>
          </div>
          <div className="grid grid-cols-12 text-center font-bold">
            <div className="col-span-3 bg-[#00599c] text-white p-2 text-left pl-3">{term}</div>
            <div className="col-span-4 p-2 border-r border-gray-300 text-gray-800">{attendance.totalWorkingDays}</div>
            <div className="col-span-5 p-2 text-gray-800">{attendance.studentAttendance}</div>
          </div>
        </div>

        {/* Health Status Table */}
        <div className="border border-[#00599c] mb-3 text-[12px]">
          <div className="grid grid-cols-12 bg-[#00599c] text-white font-bold text-center">
            <div className="col-span-3 p-2 border-r border-white/30 text-left pl-3">Health Status</div>
            <div className="col-span-2 p-2 border-r border-white/30">Blood Group</div>
            <div className="col-span-2 p-2 border-r border-white/30">Height</div>
            <div className="col-span-2 p-2 border-r border-white/30">Weight</div>
            <div className="col-span-3 p-2">Dental Hygiene</div>
          </div>
          <div className="grid grid-cols-12 text-center font-bold">
            <div className="col-span-3 bg-[#00599c] text-white p-2 text-left pl-3">{term}</div>
            <div className="col-span-2 p-2 border-r border-gray-300 text-gray-800">{healthStatus.bloodGroup || '-'}</div>
            <div className="col-span-2 p-2 border-r border-gray-300 text-gray-800">{healthStatus.height || '-'}</div>
            <div className="col-span-2 p-2 border-r border-gray-300 text-gray-800">{healthStatus.weight || '-'}</div>
            <div className="col-span-3 p-2 text-gray-800">{healthStatus.dentalHygiene || '-'}</div>
          </div>
        </div>

        {/* Scholastic Table */}
        <div className="border border-[#00599c] text-[12px]">
          {/* Header Bar */}
          <div className="bg-[#00599c] text-white font-bold p-2 text-left pl-3 text-[13px]">
            Scholastic
          </div>
          {/* Table Column Titles */}
          <div className="grid grid-cols-12 bg-white font-bold text-center border-b border-[#00599c] text-gray-800 py-1.5">
            <div className="col-span-4 border-r border-gray-300">Subject</div>
            <div className="col-span-4 border-r border-gray-300">{term}</div>
            <div className="col-span-4">Grade</div>
          </div>
          {/* Subject Rows */}
          {scholastic.map((item, idx) => (
            <div
              key={idx}
              className={`grid grid-cols-12 text-center py-1.5 border-b border-gray-200 text-gray-800 ${idx % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'}`}
            >
              <div className="col-span-4 border-r border-gray-300 font-bold text-gray-900">{item.subject}</div>
              <div className="col-span-4 border-r border-gray-300 font-bold">{item.mark !== '' ? item.mark : '-'}</div>
              <div className="col-span-4 font-bold">{item.grade || '-'}</div>
            </div>
          ))}
          {/* Total Row */}
          <div className="grid grid-cols-12 text-center py-2 bg-gray-50 font-black text-gray-900 text-[13px]">
            <div className="col-span-4 border-r border-gray-300">Total</div>
            <div className="col-span-4 border-r border-gray-300">{totalMarks}</div>
            <div className="col-span-4">{overallGrade}</div>
          </div>
        </div>
      </div>

      {/* ================= PAGE 2 ================= */}
      <div className="progress-card-page pt-2" style={{ pageBreakBefore: 'always' }}>
        {/* Co-Scholastic Table */}
        <div className="border border-[#00599c] mb-4 text-[12px]">
          <div className="bg-[#00599c] text-white font-bold p-2 text-left pl-3 text-[13px]">
            Co - Scholastic
          </div>
          <div className="grid grid-cols-12 bg-white font-bold text-center border-b border-[#00599c] text-gray-800 py-1.5">
            <div className="col-span-6 border-r border-gray-300">Subject</div>
            <div className="col-span-6">Grade</div>
          </div>
          {coScholastic.map((item, idx) => (
            <div
              key={idx}
              className={`grid grid-cols-12 text-center py-1.5 border-b border-gray-200 text-gray-800 ${idx % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'}`}
            >
              <div className="col-span-6 border-r border-gray-300 font-bold text-gray-900 uppercase">{item.subject}</div>
              <div className="col-span-6 font-bold">{item.grade || '-'}</div>
            </div>
          ))}
        </div>

        {/* Self Awareness & Scheme of Studies Side by Side */}
        <div className="border border-[#00599c] mb-4 text-[12px] flex items-stretch">
          {/* Left: Self Awareness */}
          <div className="w-7/12 border-r border-[#00599c] flex flex-col">
            <div className="bg-[#00599c] text-white font-bold p-2 text-center text-[13px] uppercase">
              SELF AWARENESS
            </div>
            <div className="p-3 space-y-3 flex-1 flex flex-col justify-around text-gray-800">
              <p className="font-bold">
                My Goals: <span className="font-normal text-gray-700 ml-1">{selfAwareness.goals || ''}</span>
              </p>
              <p className="font-bold">
                My strengths: <span className="font-normal text-gray-700 ml-1">{selfAwareness.strengths || ''}</span>
              </p>
              <p className="font-bold">
                My Interests and hobbies: <span className="font-normal text-gray-700 ml-1">{selfAwareness.interestsHobbies || ''}</span>
              </p>
              <p className="font-bold leading-relaxed">
                Responsibilities Discharged / Exceptional Achievements :{' '}
                <span className="font-normal text-gray-700 ml-1">{selfAwareness.responsibilitiesAchievements || ''}</span>
              </p>
            </div>
          </div>

          {/* Right: Scheme of Studies */}
          <div className="w-5/12 flex flex-col">
            <div className="bg-[#00599c] text-white font-bold p-2 text-center text-[13px] uppercase">
              SCHEME OF STUDIES
            </div>
            <div className="text-[12px] divide-y divide-gray-200 flex-1 flex flex-col justify-around">
              <div className="grid grid-cols-12 py-1.5 px-3">
                <div className="col-span-3 font-black text-[#00599c]">A+</div>
                <div className="col-span-9 font-bold text-gray-800 uppercase">OUTSTANDING</div>
              </div>
              <div className="grid grid-cols-12 py-1.5 px-3">
                <div className="col-span-3 font-black text-[#00599c]">A</div>
                <div className="col-span-9 font-bold text-gray-800 uppercase">EXCELLENT</div>
              </div>
              <div className="grid grid-cols-12 py-1.5 px-3">
                <div className="col-span-3 font-black text-[#00599c]">B+</div>
                <div className="col-span-9 font-bold text-gray-800 uppercase">VERY GOOD</div>
              </div>
              <div className="grid grid-cols-12 py-1.5 px-3">
                <div className="col-span-3 font-black text-[#00599c]">B</div>
                <div className="col-span-9 font-bold text-gray-800 uppercase">GOOD</div>
              </div>
              <div className="grid grid-cols-12 py-1.5 px-3">
                <div className="col-span-3 font-black text-[#00599c]">C</div>
                <div className="col-span-9 font-bold text-gray-800 uppercase">SCOPE FOR IMPROVEMENT</div>
              </div>
              <div className="grid grid-cols-12 py-1.5 px-3">
                <div className="col-span-3 font-black text-[#00599c]">D</div>
                <div className="col-span-9 font-bold text-gray-800 uppercase">Need to improve</div>
              </div>
            </div>
          </div>
        </div>

        {/* Signature Box */}
        <div className="border border-[#00599c] text-[12px]">
          <div className="bg-[#00599c] text-white font-bold p-2 text-center text-[13px]">
            Signature
          </div>
          <div className="h-[75px] bg-white"></div>
          <div className="grid grid-cols-3 border-t border-gray-300 text-center font-bold text-gray-900 py-2">
            <div className="border-r border-gray-300">Class Teacher</div>
            <div className="border-r border-gray-300">Principal</div>
            <div>Parent</div>
          </div>
        </div>
      </div>
    </div>
  );
});

StudentProgressCard.displayName = 'StudentProgressCard';

export default StudentProgressCard;
