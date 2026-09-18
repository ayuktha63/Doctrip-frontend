/**
 * Department iconography — ported verbatim from the mockup's `deptArt` map
 * (HospitalAdmin.dc.html) so the Departments and Treatments screens render
 * the same tinted glyph per department the mockup does, instead of a generic
 * initials avatar. Tint = badge background, accent = icon stroke color.
 */
export interface DeptArt {
  tint: string;
  accent: string;
  icon: string;
}

const DEPT_ART: Record<string, DeptArt> = {
  Orthopaedics: {
    tint: '#E7EFFC',
    accent: '#0F62D6',
    icon: 'M12 2.8v18.4 M8.8 4.6h6.4 M8.2 8.4h7.6 M8.2 12.2h7.6 M8.8 16h6.4 M9.6 19.4h4.8',
  },
  Cardiology: {
    tint: '#FBECEA',
    accent: '#B42318',
    icon: 'M12 20.2S3.6 14.7 3.6 9.1a4.7 4.7 0 0 1 8.4-2.9 4.7 4.7 0 0 1 8.4 2.9c0 5.6-8.4 11.1-8.4 11.1z M4.7 10.9h3.2l1.5-2.7 2.2 4.8 1.5-3 1 .9h5.2',
  },
  Oncology: {
    tint: '#F0EAFB',
    accent: '#6D28D9',
    icon: 'M12 3.6a8.4 8.4 0 1 0 0 16.8 8.4 8.4 0 0 0 0-16.8z M12 8.9a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2z M12 1.6v3 M12 19.4v3 M1.6 12h3 M19.4 12h3',
  },
  Neurology: {
    tint: '#EEF0FE',
    accent: '#4F46E5',
    icon: 'M12 4.4C10.6 3.2 8 3.4 6.6 5c-.7.8-1 1.7-.8 2.6C3.9 8.2 3.1 10 4 11.4c-1.1 1.1-1 3 .5 3.9-.1 2 1.6 3.7 3.6 3.5H12Z M12 4.4C13.4 3.2 16 3.4 17.4 5c.7.8 1 1.7.8 2.6 1.9.6 2.7 2.4 1.8 3.8 1.1 1.1 1 3-.5 3.9.1 2-1.6 3.7-3.6 3.5H12Z M12 4.4v14.5 M12 18.9v1.9 M8.6 8.1c1.3.3 2 1.5 1.8 2.8 M15.4 8.1c-1.3.3-2 1.5-1.8 2.8 M6.9 13c1.5-.1 2.7.9 2.9 2.3 M17.1 13c-1.5-.1-2.7.9-2.9 2.3',
  },
  'Fertility and IVF': {
    tint: '#FDECF3',
    accent: '#DB2777',
    icon: 'M14.8 8a5.9 5.9 0 1 0 0 11.8 5.9 5.9 0 0 0 0-11.8z M14.8 11.5a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8z M7.2 4.6a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6z M5.5 5.2C4.3 4 3 4.3 2.6 5.3c-.4 1 .5 1.9 1.4 1.5',
  },
  'Dental care': {
    tint: '#E4F2FB',
    accent: '#0284C7',
    icon: 'M12 3.8c-1.9 0-2.4-.9-4.1-.9-2 0-3.2 1.8-3.2 4.4 0 2.5.9 3.5 1.6 6 .4 2.2.5 4.8 2.1 4.8s1.5-3.4 2.5-5.3c.4-.9 2.2-.9 2.6 0 1 1.9 1 5.3 2.5 5.3s1.7-2.6 2.1-4.8c.7-2.5 1.6-3.5 1.6-6 0-2.6-1.2-4.4-3.2-4.4-1.7 0-2.2.9-4.1.9z',
  },
  Gastroenterology: {
    tint: '#FEF3E2',
    accent: '#D97706',
    icon: 'M11.4 2.8v3.4 M11.4 6.2c-3.3.5-5.6 3.1-5.6 6.4a6 6 0 0 0 6 6c3.2 0 5.6-2.1 6-5.1.3-2.5-.8-4.7-2.9-5.9-.8-.5-1.4-1-1.5-1.4 M9.3 10.6c1.5 1.7 3.4 2.6 5.7 2.6 M9.9 14.4c1.4 1.1 3 1.6 4.9 1.6',
  },
  'Cosmetic surgery': {
    tint: '#E6F6F6',
    accent: '#0D9488',
    icon: 'M16.6 20.9v-2.3c0-1.2.5-2.3 1.4-3.1A7.9 7.9 0 0 0 12.4 3.2 7.9 7.9 0 0 0 4.8 9.5l-1.4 3.3a.7.7 0 0 0 .6 1h1.7v2.4a2.4 2.4 0 0 0 2.4 2.4h1.4v2.3 M9.5 9.9h.02 M14.6 9.9h.02',
  },
  'Eye care': {
    tint: '#E6F4EC',
    accent: '#0E7C4A',
    icon: 'M2.6 12s3.6-6.6 9.4-6.6S21.4 12 21.4 12s-3.6 6.6-9.4 6.6S2.6 12 2.6 12z M12 9.1a2.9 2.9 0 1 0 0 5.8 2.9 2.9 0 0 0 0-5.8z',
  },
};

const FALLBACK: DeptArt = {
  tint: '#EDF1F7',
  accent: '#4E5A6B',
  icon: 'M12 3.4v17.2 M3.4 12h17.2 M12 3.4a8.6 8.6 0 1 0 0 17.2 8.6 8.6 0 0 0 0-17.2z',
};

export function deptArtFor(departmentName: string): DeptArt {
  return DEPT_ART[departmentName] ?? FALLBACK;
}
