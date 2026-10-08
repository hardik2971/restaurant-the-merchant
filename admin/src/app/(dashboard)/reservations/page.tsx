import { ReservationsManager } from '@/components/reservations/ReservationsManager';
import { requirePermission } from '@/lib/guard';
import { getReservations } from '@/lib/queries';
import { RESERVATIONS } from '@/lib/reservations-data';

export default async function ReservationsPage() {
  await requirePermission('manage:reservations');
  const reservations = await getReservations().catch(() => RESERVATIONS);
  return <ReservationsManager initialReservations={reservations} />;
}
