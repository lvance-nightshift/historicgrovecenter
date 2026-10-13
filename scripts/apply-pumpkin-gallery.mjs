/*
 * One-off (prod): put the Pumpkin Fest main graphic back to the FB-post image
 * (media 13) and add Joy's live-music flyer (media 23) to the event gallery.
 *
 *   node scripts/prod-db.mjs --run scripts/apply-pumpkin-gallery.mjs
 *
 * Media ids are the production ids (see media table). Idempotent.
 */
const SLUG = "fall-pumpkin-fest-2026";
const HERO_MEDIA_ID = 13; // "Pumpkin Festival FB Post.jpg" — original main graphic
const FLYER_MEDIA_ID = 23; // "Fall Pumpkin Fest live music flyer.png" (events collection)

export default async function apply(sql) {
  await sql`UPDATE events SET hero_media_id = ${HERO_MEDIA_ID}, updated_at = now() WHERE slug = ${SLUG}`;

  const [ev] = await sql`SELECT id FROM events WHERE slug = ${SLUG}`;
  if (!ev) throw new Error(`event ${SLUG} not found`);

  const existing = await sql`
    SELECT id FROM media_attachments
    WHERE target_type = 'event' AND target_id = ${ev.id}
      AND purpose = 'gallery' AND media_id = ${FLYER_MEDIA_ID}`;
  if (existing.length === 0) {
    await sql`
      INSERT INTO media_attachments (media_id, target_type, target_id, purpose, sort_order)
      VALUES (${FLYER_MEDIA_ID}, 'event', ${ev.id}, 'gallery', 0)`;
  }

  const gallery = await sql`
    SELECT id, media_id, sort_order FROM media_attachments
    WHERE target_type = 'event' AND target_id = ${ev.id} AND purpose = 'gallery'
    ORDER BY sort_order, id`;
  console.log(`✓ hero reset to media ${HERO_MEDIA_ID}; gallery:`, gallery);
}
