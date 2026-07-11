/**
 * update-rating.js
 * يسحب rating و user_ratings_total من Google Places API
 * ويحدّث aggregateRating داخل index.html تلقائياً.
 *
 * يحتاج متغيرين بيئة (GitHub Secrets):
 *  - GOOGLE_PLACES_API_KEY
 *  - GOOGLE_PLACE_ID
 */

const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACE_ID = process.env.GOOGLE_PLACE_ID;
const INDEX_PATH = path.join(__dirname, '..', 'index.html');

if (!API_KEY || !PLACE_ID) {
  console.error('❌ يجب ضبط GOOGLE_PLACES_API_KEY و GOOGLE_PLACE_ID كـ GitHub Secrets');
  process.exit(1);
}

async function main() {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=rating,user_ratings_total,name&key=${API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== 'OK') {
    console.error('❌ فشل طلب Google Places API:', data.status, data.error_message || '');
    process.exit(1);
  }

  const rating = data.result.rating;
  const reviewCount = data.result.user_ratings_total;

  if (!rating || !reviewCount) {
    console.error('❌ لا يوجد تقييمات كافية بعد، تم إلغاء التحديث لتجنب كتابة رقم فارغ.');
    process.exit(0); // ليس خطأ فادح، فقط لا يوجد بيانات كافية
  }

  console.log(`✅ Google rating: ${rating} (${reviewCount} reviews) — لـ ${data.result.name}`);

  let html = fs.readFileSync(INDEX_PATH, 'utf8');

  const ratingRegex = /"ratingValue":\s*"[^"]*"/;
  const reviewCountRegex = /"reviewCount":\s*"[^"]*"/;

  if (!ratingRegex.test(html) || !reviewCountRegex.test(html)) {
    console.error('❌ لم يتم العثور على "ratingValue" أو "reviewCount" داخل index.html.');
    console.error('   تأكد أن ملف index.html المرفوع على GitHub يحتوي فعلاً على بلوك aggregateRating.');
    process.exit(1);
  }

  const updated = html
    .replace(ratingRegex, `"ratingValue": "${rating}"`)
    .replace(reviewCountRegex, `"reviewCount": "${reviewCount}"`);

  if (updated === html) {
    console.log('ℹ️ الرقم لم يتغيّر منذ آخر تحديث، لا حاجة لعمل commit جديد.');
    process.exit(0);
  }

  fs.writeFileSync(INDEX_PATH, updated, 'utf8');
  console.log('✅ تم تحديث index.html بنجاح.');
}

main().catch((err) => {
  console.error('❌ خطأ غير متوقع:', err);
  process.exit(1);
});
