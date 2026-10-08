import { StaffManager } from '@/components/staff/StaffManager';
import { requirePermission } from '@/lib/guard';
import { getEmployees } from '@/lib/queries';
import { EMPLOYEES } from '@/lib/employees-data';

export default async function StaffPage() {
  await requirePermission('manage:staff');
  const employees = await getEmployees().catch(() => EMPLOYEES);
  return <StaffManager initialEmployees={employees} />;
}
