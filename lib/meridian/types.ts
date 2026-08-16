export type Pagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type Employee = {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  role: string;
  department: string;
  employmentStatus: "ACTIVE" | "ON_LEAVE" | "TERMINATED";
  hireDate: string;
  terminationDate?: string;
};

export type Facility = {
  facilityId: string;
  name: string;
  city: string;
  state: string;
  timezone: string;
  beds: number;
  additionalRequiredCredentials: string[];
};

export type Worker = {
  workerId: string;
  displayName: string;
  workEmail: string;
  homeFacilityId: string;
  roles: string[];
  employmentType: "W2" | "AGENCY";
  notes?: string;
};

export type Shift = {
  shiftId: string;
  facilityId: string;
  role: "RN" | "LVN" | "CNA" | "PT";
  date: string;
  startTime: string;
  endTime: string;
  endDate?: string;
  requiredCredentials: string[];
  workerId: string | null;
  status: "OPEN" | "ASSIGNED" | "COMPLETED" | "CANCELLED";
};

export type CredentialRecord = {
  recordId: string;
  employeeId: string;
  credentialType: string;
  licenseNumber: string;
  issuedOn: string;
  expiresOn: string;
  status: "ACTIVE" | "EXPIRED";
  issuingAuthority: string;
};

export type Page<T> = {
  data: T[];
  pagination: Pagination;
};