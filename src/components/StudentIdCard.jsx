import React, { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';
import templateImg from '../assets/student_id_template_new.png';

export const StudentIdCard = React.forwardRef(({ student }, ref) => {
  if (!student) return null;

  const photo = student.passport_photo || student.photoUrl || student.photo || '';
  const studentName = (student.studentName || 'STUDENT NAME').toUpperCase();
  const [photoLoadFailed, setPhotoLoadFailed] = useState(false);

  useEffect(() => {
    setPhotoLoadFailed(false);
  }, [photo]);

  const rawClass = (student.currentClass || '').toUpperCase();
  const getRomanClass = (cls) => {
    const num = parseInt(cls, 10);
    const romanMap = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X', 11: 'XI', 12: 'XII' };
    return romanMap[num] || cls;
  };
  const formattedClass = getRomanClass(rawClass);
  const classDisplay = formattedClass
    ? (formattedClass.startsWith('GRADE') ? formattedClass : `GRADE -${formattedClass}`)
    : 'GRADE -V';

  const formatDob = (dob) => {
    if (!dob) return '26-01-2017';
    try {
      const d = new Date(dob);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
      }
    } catch (e) {
      // ignore
    }
    return String(dob);
  };
  const dobDisplay = formatDob(student.dob || student.dateOfBirth);

  const parentName = (student.fatherName || student.parentName || student.motherName || 'MEGANATHAN E').trim().toUpperCase();
  const gender = (student.gender || student.sex || '').toLowerCase().trim();
  const isGirl = gender === 'female' || gender === 'f' || gender === 'girl';
  const parentPrefix = isGirl ? 'D/O:' : 'S/O:';
  const parentDisplay = `${parentPrefix} ${parentName}`;

  const getPhoneNumber = () => {
    const raw = student.fatherPhone || student.phone || student.whatsappNumber || student.motherPhone || '';
    return String(raw).replace(/^[Pp][Hh]:?\s*/, '').trim();
  };
  const studentPhone = getPhoneNumber();

  const formatAddressToLines = (addr) => {
    if (!addr) {
      return ['NO 21 GANAPATHY GARDEN', '3rd STREET', 'VELLORE-632006.'];
    }

    const raw = String(addr).trim();
    if (!raw) {
      return ['NO 21 GANAPATHY GARDEN', '3rd STREET', 'VELLORE-632006.'];
    }

    let parts = raw
      .replace(/\n+/g, ',')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    if (parts.length === 0) return [raw.toUpperCase()];

    let first = parts[0].toUpperCase();
    if (/^[0-9/\-\s]+$/.test(first)) {
      parts[0] = `NO ${first}`.replace(/\s+/g, ' ');
    } else if (!/^(NO|D\.?NO|DOOR)/i.test(first)) {
      const match = first.match(/^([0-9/\-]+)\s+(.*)/);
      if (match) {
        parts[0] = `NO ${match[1]} ${match[2]}`.replace(/\s+/g, ' ');
      }
    } else {
      parts[0] = first;
    }

    if (parts.length > 1 && parts[0].length <= 10) {
      parts[0] = `${parts[0]} ${parts[1]}`.trim();
      parts.splice(1, 1);
    }

    if (parts.length <= 3) {
      return parts.map((p) => p.toUpperCase().trim());
    }

    const line1 = parts[0].toUpperCase().trim();
    const line3 = parts[parts.length - 1].toUpperCase().trim();
    const line2 = parts.slice(1, -1).join(', ').toUpperCase().trim();

    return [line1, line2, line3];
  };

  const addressLines = formatAddressToLines(student.address);

  return (
    <div
      ref={ref}
      className="id-card-container relative overflow-hidden shadow-2xl select-none shrink-0"
      style={{
        width: '687px',
        height: '1024px',
        borderRadius: '30px',
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
        fontFamily: "Arial, sans-serif"
      }}
    >
      {/* Official School ID Card Template Graphic */}
      <img
        src={templateImg}
        alt="Student ID Card Template"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
      />

      {/* Student Photo in Circular Frame */}
      <div
        className="absolute z-10 overflow-hidden flex items-center justify-center rounded-full"
        style={{
          top: '264px',
          left: '195px',
          width: '296px',
          height: '296px',
          borderRadius: '50%',
          boxSizing: 'border-box',
          backgroundColor: '#ffffff'
        }}
      >
        {photo && !photoLoadFailed ? (
          <img
            src={getImageUrl(photo)}
            alt={studentName}
            className="w-full h-full object-cover"
            style={{ objectPosition: 'center 15%' }}
            onError={() => setPhotoLoadFailed(true)}
          />
        ) : (
          <div className="w-full h-full bg-gray-50 flex items-center justify-center">
            <User className="w-24 h-24 text-gray-300" />
          </div>
        )}
      </div>

      {/* Student Name */}
      <div
        className="absolute z-10 w-full text-center px-4 flex justify-center"
        style={{ top: '574px' }}
      >
        <h2
          className="font-black uppercase tracking-tight whitespace-nowrap"
          style={{
            fontFamily: "'Arial Black', Arial, sans-serif",
            fontWeight: 900,
            color: '#0607a5',
            fontSize: studentName.length > 22 ? '36px' : studentName.length > 18 ? '44px' : '52px',
            lineHeight: 1.1
          }}
        >
          {studentName}
        </h2>
      </div>

      {/* DOB & Grade Row */}
      <div
        className="absolute z-10 w-full flex items-center justify-between"
        style={{ top: '648px', paddingLeft: '56px', paddingRight: '56px' }}
      >
        <div
          className="flex items-center leading-none tracking-tight font-black"
          style={{
            fontFamily: "'Arial Black', Arial, sans-serif",
            fontSize: '31px'
          }}
        >
          <span
            className="font-black mr-2"
            style={{ color: '#a11b23' }}
          >
            D.O.B:
          </span>
          <span className="text-black font-black">{dobDisplay}</span>
        </div>
        <div
          className="leading-none uppercase font-bold"
          style={{
            fontFamily: "'Times New Roman', Times, Georgia, serif",
            fontWeight: 700,
            color: '#120e80',
            fontSize: '36px',
            letterSpacing: '0.5px'
          }}
        >
          {classDisplay}
        </div>
      </div>

      {/* Parent Name (D/O for Girls, S/O for Boys) */}
      <div
        className="absolute z-10 w-full text-center px-4"
        style={{ top: '702px' }}
      >
        <p
          className="font-black tracking-tight uppercase"
          style={{
            fontFamily: "'Arial Black', Arial, sans-serif",
            fontWeight: 900,
            color: '#0607a5',
            fontSize: parentDisplay.length > 24 ? '32px' : parentDisplay.length > 20 ? '36px' : '41px',
            lineHeight: 1.15
          }}
        >
          {parentDisplay}
        </p>
      </div>

      {/* Address */}
      <div
        className="absolute z-10 w-full flex flex-col items-center text-center px-6"
        style={{ top: '758px' }}
      >
        <div
          className="font-bold text-black uppercase"
          style={{
            fontSize: addressLines.length > 2 ? '25px' : '28px',
            lineHeight: '1.25',
            maxWidth: '590px',
            fontFamily: "'Times New Roman', Times, Georgia, serif",
            letterSpacing: '0.2px'
          }}
        >
          {addressLines.map((line, idx) => (
            <p key={idx} className="whitespace-nowrap">
              {line}
            </p>
          ))}
        </div>
      </div>

      {/* Dynamic Student / Father Phone Number */}
      {studentPhone && (
        <div
          className="absolute z-10 flex items-center"
          style={{ top: '912px', left: '84px' }}
        >
          <p
            className="font-black text-black leading-none"
            style={{
              fontFamily: "'Arial Black', Arial, sans-serif",
              fontSize: '32px',
              letterSpacing: '1px'
            }}
          >
            {studentPhone}
          </p>
        </div>
      )}
    </div>
  );
});

StudentIdCard.displayName = 'StudentIdCard';

export default StudentIdCard;
