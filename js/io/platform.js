/* ═══ طبقة المنصّة — متصفّحٌ أو تطبيقُ أندرويد (Capacitor) ═══
   نقطةٌ واحدةٌ لكلّ ما يختلف بين المتصفّح والتطبيق:
   · الحفظ: في المتصفّح <a download>، وفي التطبيق لا يعمل التنزيل داخل
     WebView، فيُكتب الملفُّ في Documents/CivilDraft ثم تُفتح نافذةُ المشاركة.
   · دورةُ الحياة: beforeunload لا يصل على أندرويد، فالحفظُ عند الإيقاف.
   · زرُّ الرجوع: يُغلق المفتوح كما يفعل Escape، وضغطتان للخروج.
   بلا اعتماديات: الإضافاتُ تُقرأ من window.Capacitor الذي يحقنه الجسرُ
   الأصليّ، فلا استيرادَ لحزم npm ولا بناءَ إلزاميّ. */

const CAP=()=>(typeof window!=="undefined"&&window.Capacitor)||null;
export const isNative=()=>{
 const c=CAP();
 try{return !!(c&&(c.isNativePlatform?c.isNativePlatform():c.platform!=="web"))}
 catch(e){return false}
};
export const platform=()=>{const c=CAP(); try{return c?(c.getPlatform?c.getPlatform():c.platform):"web"}catch(e){return "web"}};

function plugin(name){
 const c=CAP(); if(!c)return null;
 try{ if(c.Plugins&&c.Plugins[name])return c.Plugins[name] }catch(e){}
 try{ if(typeof c.registerPlugin==="function")return c.registerPlugin(name) }catch(e){}
 return null;
}

let SAY=null;
export function setSay(fn){SAY=fn}
const say=(lv,m)=>{try{SAY&&SAY(lv,m)}catch(e){}};

function blobToB64(b){
 return new Promise((res,rej)=>{
  const r=new FileReader();
  r.onload=()=>{const s=String(r.result||""); res(s.slice(s.indexOf(",")+1))};
  r.onerror=()=>rej(r.error||new Error("قراءةُ الملفّ فشلت"));
  r.readAsDataURL(b);
 });
}
const safeName=n=>String(n||"civildraft").replace(/[\\/:*?"<>|]+/g,"_").slice(0,120);

function browserSave(blob,name,keepMs=1500){
 const u=URL.createObjectURL(blob);
 const a=document.createElement("a");
 a.href=u; a.download=name;
 document.body.appendChild(a); a.click();
 setTimeout(()=>{URL.revokeObjectURL(u); a.remove()},keepMs);
}

async function nativeSave(blob,name){
 const FS=plugin("Filesystem");
 if(!FS)throw new Error("إضافةُ Filesystem غير مثبّتة");
 const data=await blobToB64(blob);
 const path="CivilDraft/"+safeName(name);
 let res=null, where="Documents/CivilDraft";
 try{ res=await FS.writeFile({path,data,directory:"DOCUMENTS",recursive:true}) }
 catch(e){ res=await FS.writeFile({path,data,directory:"CACHE",recursive:true}); where=null }
 const uri=res&&res.uri;
 const SH=plugin("Share");
 if(SH&&uri){
  try{ await SH.share({title:name,files:[uri]}) }
  catch(e){ try{await SH.share({title:name,url:uri})}catch(e2){} }
 }
 say("ok",where?`حُفظ «${name}» في ${where}`:`«${name}» جاهزٌ للمشاركة`);
 return uri;
}

/* الواجهةُ الوحيدةُ للحفظ: تُعيد الحجمَ متزامناً كما كانت dl() القديمة،
   والكتابةُ الأصليةُ تجري في الخلفية وتُبلَّغ نتيجتُها. */
export function saveBlob(name,data,mime,keepMs){
 const b=(data instanceof Blob)?data
  :new Blob([data],{type:mime||"application/octet-stream"});
 if(isNative()){
  nativeSave(b,name).catch(e=>{
   say("er","تعذّر حفظ الملفّ: "+((e&&e.message)||e));
  });
 }else browserSave(b,name,keepMs);
 return b.size;
}

/* ═══ دورةُ الحياة وزرُّ الرجوع ═══ */
let lastBack=0;
export function initNative({onPause}={}){
 if(!isNative())return false;
 try{document.documentElement.classList.add("native","plat-"+platform())}catch(e){}
 const App=plugin("App");
 if(App&&App.addListener){
  try{App.addListener("appStateChange",s=>{ if(s&&!s.isActive&&onPause)onPause() })}catch(e){}
  try{App.addListener("pause",()=>{ onPause&&onPause() })}catch(e){}
  try{App.addListener("backButton",()=>{
   /* Escape اصطناعيّ: يُغلق المساعد/القوائم/الأداة الجارية بالترتيب نفسه
      الذي يتبعه الكيبورد (ui/keymap.js). وإن لم يكن شيءٌ مفتوحاً فضغطتان
      خلال ثانيتين تُخرجان (مع حفظٍ قبل الخروج). */
   const ev=new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true});
   const t=document.activeElement&&document.activeElement!==document.body?document.activeElement:document;
   if(document.activeElement&&document.activeElement.blur&&/input|textarea|select/i.test(document.activeElement.tagName||""))
    document.activeElement.blur();
   const handled=!t.dispatchEvent(ev);
   if(handled){lastBack=0; return}
   const now=Date.now();
   if(now-lastBack<2000){ try{onPause&&onPause()}catch(e){} App.exitApp&&App.exitApp(); return }
   lastBack=now; say("in","اضغط رجوع مرّةً أخرى للخروج");
  })}catch(e){}
 }
 const SB=plugin("StatusBar");
 if(SB){ try{SB.setOverlaysWebView&&SB.setOverlaysWebView({overlay:false})}catch(e){}
  try{SB.setBackgroundColor&&SB.setBackgroundColor({color:"#0f172a"})}catch(e){} }
 const SP=plugin("SplashScreen");
 if(SP){ try{setTimeout(()=>SP.hide&&SP.hide(),300)}catch(e){} }
 return true;
}
