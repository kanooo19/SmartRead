<div align="center">

<img src="icons/icon128.png" width="88" alt="SmartRead">

# SmartRead

**The smart reading engine for Arabic–English mixed content.**

Fix broken RTL rendering on Claude, Gemini, and any AI tool — with a single click.

[![Version](https://img.shields.io/badge/version-1.2.0-2563EB?style=flat-square)](https://github.com/kanooo19/SmartRead)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-F6C915?style=flat-square&logo=googlechrome&logoColor=black)](https://github.com/kanooo19/SmartRead)
[![License](https://img.shields.io/badge/license-MIT-10B981?style=flat-square)](LICENSE)
[![Status](https://img.shields.io/badge/status-production--ready-7C3AED?style=flat-square)](https://github.com/kanooo19/SmartRead)

</div>

---

## Overview

Arab professionals who use AI tools daily face a persistent problem: mixed Arabic–English output renders with scrambled word order, incorrect reading direction, and broken punctuation spacing. Existing browser settings don't understand AI tool DOM structure. SmartRead solves this with zero setup — open the page, click once, text is fixed.

---

## Features

| | Feature | Description |
|---|---|---|
| ✦ | **Smart Direction Detection** | First-character algorithm + Arabic ratio fallback — per block, not per page |
| ✦ | **BiDi Text Isolation** | `<bdi>` wrapping at Arabic–Latin boundaries for correct rendering |
| ✦ | **10 Arabic Typefaces** | Tajawal · Cairo · IBM Plex · Naskh · Amiri · Almarai · El Messiri · Reem Kufi · Changa · Lateef |
| ✦ | **Font Size Control** | S / M / L / XL — applied via `--smartread-font-size` CSS variable |
| ✦ | **Input Field Enhancement** | Smart floating button on focused inputs — fixes direction and spacing inline |
| ✦ | **Global Floating Button** | One fixed button per page — no per-paragraph clutter, no duplication |
| ✦ | **Reading Mode** | Optimized line-height and letter-spacing for long AI responses |
| ✦ | **Custom Sites** | Extend SmartRead beyond Claude and Gemini to any hostname |
| ✦ | **Live Detection** | MutationObserver with 150 ms debounce catches every streamed response |

---

## Installation

SmartRead is a Chrome Extension loaded in Developer Mode. No build step required.

```
1.  Clone this repository
    git clone https://github.com/kanooo19/SmartRead.git

2.  Open Chrome and navigate to
    chrome://extensions

3.  Enable Developer Mode  (toggle in the top-right corner)

4.  Click "Load unpacked" and select the SmartRead folder

5.  Open Claude (claude.ai) or Gemini (gemini.google.com)
    The ✦ floating button appears in the bottom-right corner
```

---

## Usage

**Fix a page**
Click the ✦ floating button. SmartRead scans all text blocks, sets the correct reading direction, and improves Arabic–Latin spacing. Click again to reset.

**Change font or size**
Open the SmartRead popup (click the extension icon). Choose from 10 Arabic fonts and 4 size levels. Changes apply instantly — no reload required.

**Direction control**
Use the Direction segment in the popup: Auto (default), RTL (force right-to-left), or LTR (force left-to-right).

**Input fields**
Focus any text input or contenteditable area. A small ✦ button appears at the edge of the field. Click it to apply direction correction and spacing fixes to your typed text.

**Reading Mode**
Toggle Reading Mode in the popup for comfortable line-height and spacing on AI tool responses.

**Custom sites**
Add any hostname in the popup (e.g. `chatgpt.com`) to activate SmartRead on sites beyond the built-in list.

---

## Architecture

```
manifest.json           Extension config, Manifest V3, v1.2.0

content/
  direction.js          Unicode-aware RTL/LTR detection
  engine.js             Block scanning, BDI wrapping, processRoot / resetRoot
  typography.js         10 Arabic fonts via Google Fonts (loaded on demand)
  observer.js           Debounced MutationObserver (150 ms, ancestor-dedup)
  ui.js                 Global FAB  idle → loading → active
  input_enhancer.js     Input field smart button (rAF position tracking)

styles/
  content.css           FAB, input button, font classes, font size, reading mode

popup/
  popup.html            Dashboard UI
  popup.css             Compact premium design (340 px)
  popup.js              State sync, font / size / direction controls

content_script.js       Thin coordinator, message router
background.js           Custom site injection (scripting + CSS)
```

---

## Tech Stack

| Technology | Role |
|---|---|
| Chrome Extension Manifest V3 | Extension framework |
| Vanilla JavaScript | Zero runtime dependencies |
| CSS Custom Properties | `--smartread-font-size` for live font scaling |
| Google Fonts API | 10 Arabic typefaces, loaded on demand |
| MutationObserver | Captures streamed AI responses in real time |
| Unicode BiDi (`<bdi>`) | Script-level text isolation |
| `chrome.storage.sync` | Per-site state, synced across devices |

---

## Supported Sites

Built-in: **claude.ai** · **gemini.google.com**
Custom: any hostname added via the popup dashboard

---

<br>

---

<!-- ═══════════════════════════════════════════════════════════════════════════
     MULTILINGUAL SECTIONS
     One language per block — structure and length are consistent across all
     ═══════════════════════════════════════════════════════════════════════════ -->

<div dir="rtl">

---

## العربية

**SmartRead** — محرك قراءة ذكي للنصوص العربية والإنجليزية المختلطة.

صُمِّم لمن يستخدمون أدوات الذكاء الاصطناعي يومياً ويعانون من تعطّل عرض النصوص المختلطة في Claude وGemini وما سواهما.

**ما الذي يفعله؟**
- يكتشف اتجاه النص تلقائياً لكل فقرة على حدة — يمين لليسار أو يسار لليمين
- يُصلح المسافات عند حدود الكتابة العربية واللاتينية
- يوفر 10 خطوط عربية احترافية يمكن اختيارها من لوحة التحكم
- يتحكم في حجم الخط عبر أربعة مستويات
- يعمل داخل حقول الإدخال والنصوص القابلة للتحرير
- يرصد الردود المبثوثة ويُصلحها تلقائياً دون تدخل

**طريقة الاستخدام**
انقر على زر ✦ العائم في أسفل يمين الصفحة لإصلاح النص دفعةً واحدة. افتح لوحة الإضافة لتغيير الخط أو الحجم أو وضع القراءة.

</div>

---

<div dir="rtl">

## עברית

**SmartRead** — מנוע קריאה חכם לטקסטים מעורבים ערבית–אנגלית.

פותח עבור אנשי מקצוע הדוברים ערבית המשתמשים בכלי AI יומיומית ומתמודדים עם בעיות עיבוד טקסט דו-כיווני ב-Claude, Gemini ואחרים.

**מה הוא עושה?**
- מזהה אוטומטית את כיוון הטקסט לכל פסקה בנפרד — RTL או LTR
- מתקן רווחים בגבולות בין כתב ערבי ולטיני
- מציע 10 גופנים ערביים מקצועיים הנטענים לפי בחירה
- תומך בשינוי גודל הגופן ב-4 רמות
- פועל גם בתוך שדות קלט ואזורים הניתנים לעריכה
- מזהה בזמן אמת תגובות AI שמוזרמות לדף

**שימוש**
לחץ על כפתור ✦ הצף בפינה הימנית-תחתונה לתיקון הדף. פתח את פאנל ההרחבה לשינוי גופן, גודל וכיוון.

</div>

---

<div dir="rtl">

## فارسی

**SmartRead** — موتور خواندن هوشمند برای متن‌های مخلوط عربی–انگلیسی.

برای متخصصانی طراحی شده که روزانه با ابزارهای هوش مصنوعی مانند Claude و Gemini کار می‌کنند و با نمایش نادرست متن‌های دوجهته روبرو هستند.

**چه کاری انجام می‌دهد؟**
- جهت متن را برای هر پاراگراف به‌صورت خودکار تشخیص می‌دهد — راست به چپ یا چپ به راست
- فاصله‌گذاری در مرز میان متن عربی و لاتین را اصلاح می‌کند
- ۱۰ فونت حرفه‌ای عربی ارائه می‌دهد که به صورت پویا بارگذاری می‌شوند
- کنترل اندازه فونت در چهار سطح را پشتیبانی می‌کند
- در فیلدهای ورودی و متن‌های قابل ویرایش نیز کار می‌کند
- پاسخ‌های جریانی AI را بلادرنگ تشخیص داده و اصلاح می‌کند

**نحوه استفاده**
روی دکمه ✦ شناوری که در گوشه پایین-راست صفحه است کلیک کنید. برای تغییر فونت، اندازه و حالت خواندن، پنل افزونه را باز کنید.

</div>

---

<div dir="rtl">

## اردو

**SmartRead** — عربی اور انگریزی ملے جلے متن کے لیے ذہین ریڈنگ انجن۔

ان پیشہ ور افراد کے لیے بنایا گیا ہے جو روزانہ Claude اور Gemini جیسے AI ٹولز استعمال کرتے ہیں اور دو طرفہ متن کی درست نمائش میں مسائل کا سامنا کرتے ہیں۔

**یہ کیا کرتا ہے؟**
- ہر پیراگراف کے لیے متن کی سمت خود بخود پہچانتا ہے — دائیں سے بائیں یا بائیں سے دائیں
- عربی اور لاطینی متن کی سرحدوں پر فاصلے درست کرتا ہے
- ۱۰ پیشہ ور عربی فونٹ فراہم کرتا ہے جو انتخاب پر لوڈ ہوتے ہیں
- چار درجوں میں فونٹ سائز کنٹرول فراہم کرتا ہے
- انپٹ فیلڈز اور قابل ترمیم متن میں بھی کام کرتا ہے
- AI کے براہ راست آنے والے جوابات کو خودکار طریقے سے ٹھیک کرتا ہے

**استعمال**
صفحے کے نیچے دائیں کونے میں ✦ بٹن پر کلیک کریں۔ فونٹ، سائز اور ریڈنگ موڈ بدلنے کے لیے ایکسٹینشن پینل کھولیں۔

</div>

---

<div dir="rtl">

## Kurdî

**SmartRead** — motorek xwendinê ya jîr ji bo nivîsarên Erebî–Îngilîzî yên tevlihev.

Ji bo pisporên ku her roj bi amûrên AI yên wekî Claude û Gemini dixebitin û bi pirsgirêkên rêgeza nivîsara dualiyek re rû bi rû ne hatiye çêkirin.

**Çi dike?**
- Rêgeza nivîsarê bixwe ji bo her paragrafê tespît dike — ji rastê ber bi çepê an ji çepê ber bi rastê
- Cihên di navbera nivîsara Erebî û Latînî de sererast dike
- 10 tîpên profesyonel ên Erebî pêşkêş dike
- Kontrola mezinahiya tîpan di çar astên S / M / L / XL de piştgirî dike
- Di qadên têketinê û nivîsarên guhêrbar de jî dixebite
- Bersivên AI yên zindî di dem rast de rastdike

**Bikar anîn**
Li ser bişkojka ✦ ya herikbar a quncika jêr-rastê rûpelê bikirtînin. Ji bo guherandina tîp û mezinahiyê panela pêvekan veke.

</div>

---

<div dir="rtl">

## پښتو

**SmartRead** — د عربي او انګریزي ګډ متن لپاره هوښیار د لوستلو انجن۔

د هغو مسلکي کسانو لپاره جوړ شوی دی چې هره ورځ د Claude او Gemini غوندې AI وسیلو سره کار کوي او د دوه اړخیز متن سمه ښودنه یې ستونزمنه ده.

**د هغه دنده:**
- د هر پراګراف لپاره د متن لوری پخپله پیژني — ښي خوا یا کیڼ خوا ته
- د عربي او لاتیني متن تر منځ فاصلې سموي
- ۱۰ مسلکي عربي فونتونه وړاندې کوي
- د S / M / L / XL درجو کې د فونت د اندازې کنترول لري
- د ننوتلو ساحو او د سمولو وړ متن کې هم کار کوي
- د AI مستقیم ځوابونه سمدلاسه سموي

**کارونه**
د مخ لاندې-ښي کونج کې د ✦ تڼۍ کلیک وکړئ۔ د فونت او اندازه بدلولو لپاره د اضافې پینل خلاص کړئ۔

</div>

---

<div dir="rtl">

## ܣܘܪܝܝܐ

**SmartRead** — ܡܚܘܝܢܐ ܚܟܝܡܐ ܠܟܬܒ̈ܐ ܡܚܠܛ̈ܐ ܕܥܪܒܝ ܘܐܢܓܠܝ.

ܦܠܚ̈ܐ ܡܩܨܝ̈ܐ ܕܦܠܚܝܢ ܟܠ ܝܘܡ ܥܡ ܥܠ̈ ܕ AI ܐܝܟ Claude ܘ Gemini ܡܬܩܛܥܝܢ ܒܡܚܘܝܢܘܬܐ ܕܟܬܒ̈ܐ ܡܚܠܛ̈ܐ.

**ܡܢܐ ܥܒܕ؟**
- ܦܫܩ ܐܘܪܚܐ ܕܟܬܒܐ ܒܢܦܫܗ ܠܟܠ ܦܣܩܐ — ܡܢ ܝܡܝܢ ܠܣܡܠ ܐܘ ܡܢ ܣܡܠ ܠܝܡܝܢ
- ܬܘܩܢ ܦܬܚ̈ܐ ܒܝܬ ܟܬܒ̈ܐ ܕܥܪܒܝ ܘܠܐܛܝܢ
- ܡܩܪܒ 10 ܐܣ̈ܛܘܟ̈ܣܐ ܡܩܨܝ̈ܐ ܕܥܪܒܝ
- ܥܒܕ ܒܓܘ ܩܝ̈ܛ̈ܐ ܕܡܥܠܢܐ ܘܟܬܒ̈ܐ ܕܡܫܬܚܠܦܝܢ
- ܚܙܐ ܦܬܓܡ̈ܐ ܕ AI ܒܙܒܢ ܕܡܛܝܢ ܘܬܘܩܢ ܐܢܘܢ

**ܦܘܠܚܢܐ**
ܢܩܘܫ ܥܠ ܟܦܬܪܐ ✦ ܕܡܬܚܙܐ ܒܩܘܪܢܐ ܬܚܬܝܐ ܝܡܝܢܝܐ ܕܦܬܚܐ. ܦܬܚ ܠܘܚܐ ܕܡܘܙܝܦܐ ܠܫܘܚܠܦ ܐܣ̈ܛܘܟ̈ܣܐ ܘܡܘܡܫ̈ܐ.

</div>

---

<br>

<div align="center">

Built for Arabic-speaking professionals · Made with care by [Kenan ALSIR](https://github.com/kanooo19)

</div>
