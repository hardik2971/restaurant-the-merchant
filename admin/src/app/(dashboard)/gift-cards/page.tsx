import { GiftCardsManager } from '@/components/giftcards/GiftCardsManager';
import { requirePermission } from '@/lib/guard';
import { getGiftCards } from '@/lib/queries';
import { GIFT_CARDS } from '@/lib/giftcards-data';

export default async function GiftCardsPage() {
  await requirePermission('manage:coupons');
  const cards = await getGiftCards().catch(() => GIFT_CARDS);
  return <GiftCardsManager initialCards={cards} />;
}
