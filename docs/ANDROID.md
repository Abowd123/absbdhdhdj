# CivilDraft على أندرويد (APK)

التطبيقُ نفسُه بلا إعادة كتابة: نفس ملفّات الويب داخل حزمة Capacitor.
كلُّ ما يختلف بين المتصفّح والهاتف في ملفٍّ واحد: `js/io/platform.js`.

## ما تغيّر في الشيفرة
| الموضع | التغيير |
|---|---|
| `js/io/platform.js` (جديد) | حفظٌ موحَّد: متصفّح ← `<a download>` · أندرويد ← `Documents/CivilDraft` + نافذةُ مشاركة. زرُّ الرجوع ← Escape ثم ضغطتان للخروج. الحفظُ عند إيقاف التطبيق. |
| `js/io/project.js` · `boqcsv.js` · `report.js` · `ui/studio.js` | التنزيلاتُ الأربعة تمرّ عبر `saveBlob` (DXF/PDF/PNG/SVG/CSV/المشروع/الفيديو). |
| `js/app.js` | لا عاملَ خدمةٍ داخل التطبيق، و`initNative` بعد `beforeunload`. |
| `js/ui/store.js` | أوّلُ تشغيلٍ على هاتف: كثافةٌ لمسية + وضعُ المبتدئ (يُغيَّران من القائمة). |
| `index.html` | `viewport-fit=cover` و`interactive-widget=resizes-content` (الكيبورد لا يغطّي الحقول). |
| `css/touch.css` | حوافُّ الشاشة الآمنة، ولا سحبَ-للتحديث ولا تحديدَ نصٍّ عرضيّ داخل التطبيق. |
| `scripts/build-android.js` (جديد) | `dist/` ← `www/` بلا `sw.js`/`_headers`/`404.html`، وCSP بلا localhost. |
| `capacitor.config.json` (جديد) | `com.civildraft.app` · `webDir: www` · مخطّط https · شاشةُ البداية وشريطُ الحالة. |

## الأسهل: GitHub يبني الـ APK عنك
1. ارفع المشروع إلى مستودع على GitHub (الفرع main).
2. Settings ← Actions ← General ← Workflow permissions ← **Read and write**.
3. كلُّ دفعٍ يبني التطبيق تلقائياً (أو Actions ← Android APK ← Run workflow).
4. بعد ~٨ دقائق: صفحة **Releases** ← حمّل `CivilDraft-N.apk` على الهاتف وثبّته.

بلا أسرار يُبنى APK تجريبيّ (debug) يعمل ويُثبَّت عادياً. ولإصدارٍ موقَّعٍ ثابت
(يلزم للتحديث فوق النسخة السابقة دون حذفها، ولـ Google Play) أضف في
Settings ← Secrets and variables ← Actions أربعة أسرار:
`ANDROID_KEYSTORE_BASE64` (ناتج `base64 -w0 civildraft.jks`) ·
`ANDROID_KEYSTORE_PASSWORD` · `ANDROID_KEY_ALIAS` · `ANDROID_KEY_PASSWORD`.

## البناء محلّياً (اختياريّ)
### المتطلّبات (مرّةً واحدة)
- Node 18+ · JDK 17 · Android Studio (SDK 34)

## البناء
```sh
npm install
npm run build:android          # يبني www/
npx cap add android            # مرّةً واحدة: يولّد مجلّد android/
node scripts/android-patch.js  # تعديلاتُ الخطّ والكيبورد والإصدار (آليّاً)
npx @capacitor/assets generate --android --iconBackgroundColor "#0f172a" \
  --splashBackgroundColor "#0f172a"   # الأيقونات (انظر أدناه)
npm run android:apk            # ← android/app/build/outputs/apk/debug/app-debug.apk
```
للتجربة على هاتفٍ موصول: `npm run android:run`. وبعد أيّ تعديل: `npm run android:sync`.

**الأيقونات:** انسخ `icons/icon-maskable-512.png` إلى `assets/icon-only.png`
(و`assets/splash.png` إن أردت) قبل أمر `@capacitor/assets`.

## (مرجع) ما يطبّقه android-patch.js
حجمُ خطّ النظام الكبير يكسر الشريط. في
`android/app/src/main/java/com/civildraft/app/MainActivity.java`:
```java
package com.civildraft.app;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
public class MainActivity extends BridgeActivity {
  @Override public void onCreate(Bundle b){
    super.onCreate(b);
    getBridge().getWebView().getSettings().setTextZoom(100);
  }
}
```
وفي `AndroidManifest.xml` داخل `<activity>`: `android:windowSoftInputMode="adjustResize"`.

## الإصدار الموقَّع
```sh
keytool -genkey -v -keystore civildraft.jks -alias civildraft -keyalg RSA -keysize 2048 -validity 10000
```
ثم Android Studio ← Build ← Generate Signed Bundle/APK (AAB لـ Google Play، APK للتثبيت المباشر).
ارفع `versionCode`/`versionName` في `android/app/build.gradle` مع الرقم في `js/core/version.js`.
**لا تلتزم ملفَّ keystore في المستودع** (مُدرَجٌ في `.gitignore`).

## قائمةُ الفحص على الجهاز
- [ ] رسمُ جدارٍ وفتحةٍ بالإصبع، والتكبير بإصبعين
- [ ] الضغطُ المطوّل يفتح قائمة السياق
- [ ] حفظُ المشروع ← يظهر في Documents/CivilDraft ونافذةُ المشاركة تُفتح
- [ ] تصديرُ DXF وPDF وPNG وCSV
- [ ] فتحُ مشروعٍ واستيرادُ DXF وصورةِ خلفية
- [ ] زرُّ الرجوع يغلق القوائم ثم ضغطتان تُخرجان
- [ ] الخروجُ إلى الشاشة الرئيسية ثم قتلُ التطبيق ← الرسمُ محفوظ عند العودة
- [ ] الوضعُ الأفقيّ والرأسيّ، والكيبورد لا يغطّي حقلَ الإدخال
- [ ] المساعدُ الذكي بمفتاح مزوّدٍ سحابيّ
