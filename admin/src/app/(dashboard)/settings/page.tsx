import { SettingsView } from '@/components/settings/SettingsView';
import { requirePermission } from '@/lib/guard';
import { getProfile, getUsers, type ProfileData, type TeamMember } from '@/lib/queries';

const FALLBACK_PROFILE: ProfileData = {
  name: 'The Merchant Boston',
  currency: 'USD',
  timezone: 'America/New_York',
  address: '60 Franklin Street, Boston, MA',
  phone: '+1 617 482 6060',
  email: 'hello@themerchantboston.com',
};

export default async function SettingsPage() {
  const session = await requirePermission('manage:settings');
  const [profile, team] = await Promise.all([
    getProfile().catch(() => FALLBACK_PROFILE),
    getUsers().catch(() => [] as TeamMember[]),
  ]);

  const account = {
    name: session.user.name ?? 'User',
    email: session.user.email ?? '',
    role: session.user.role,
  };

  return <SettingsView profile={profile} team={team} account={account} />;
}
