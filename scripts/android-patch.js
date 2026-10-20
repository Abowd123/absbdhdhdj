#!/usr/bin/env node
/* ═══ تعديلاتُ android/ بعد توليده ═══
   android/ يولّده `npx cap add android` ولا يُلتزَم في المستودع، فتعديلاتُه
   تُطبَّق هنا آلياً (محلّياً وفي GitHub Actions):
   · MainActivity: setTextZoom(100) — خطُّ النظام الكبير لا يكسر الشريط
   · AndroidManifest: adjustResize — الكيبورد لا يغطّي الحقول
   · build.gradle: versionName من package.json و versionCode من رقم البناء
   التشغيل: node scripts/android-patch.js [versionCode]   (آمنٌ للتكرار) */
import {readFileSync,writeFileSync,existsSync} from "node:fs";
import {join,dirname} from "node:path";
import {fileURLToPath} from "node:url";

const ROOT=join(dirname(fileURLToPath(import.meta.url)),"..");
const A=join(ROOT,"android");
if(!existsSync(A)){console.error("لا مجلّد android/ — شغّل npx cap add android أوّلاً");process.exit(1)}
const pkg=JSON.parse(readFileSync(join(ROOT,"package.json"),"utf8"));
const cfg=JSON.parse(readFileSync(join(ROOT,"capacitor.config.json"),"utf8"));
const code=Math.max(1,parseInt(process.argv[2]||process.env.VERSION_CODE||"1",10)||1);

const act=join(A,"app/src/main/java",...cfg.appId.split("."),"MainActivity.java");
writeFileSync(act,`package ${cfg.appId};

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    getBridge().getWebView().getSettings().setTextZoom(100);
  }
}
`);
console.log("✓ MainActivity: textZoom 100");

const man=join(A,"app/src/main/AndroidManifest.xml");
let m=readFileSync(man,"utf8");
if(!m.includes("windowSoftInputMode"))
 m=m.replace(/<activity\b/,'<activity\n            android:windowSoftInputMode="adjustResize"');
writeFileSync(man,m); console.log("✓ AndroidManifest: adjustResize");

const g=join(A,"app/build.gradle");
let s=readFileSync(g,"utf8");
s=s.replace(/versionCode\s+\d+/,`versionCode ${code}`)
   .replace(/versionName\s+"[^"]*"/,`versionName "${pkg.version}"`);
writeFileSync(g,s); console.log(`✓ build.gradle: ${pkg.version} (${code})`);
