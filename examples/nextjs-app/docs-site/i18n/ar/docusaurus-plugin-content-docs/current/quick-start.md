---
sidebar_position: 2
title: البدء السريع
description: >-
  احصل على أول مستند مترجم لك في أقل من خمس دقائق باستخدام ai-i18n-tools مع
  مشروع المثال هذا الخاص بـ Next.js.
translation_last_updated: '2026-04-18T22:42:43.514Z'
source_file_mtime: '2026-04-18T18:55:03.274Z'
source_file_hash: 3959ea2c2c86befb8702ecbb126b291ff7bf1392e0bc282080c16ea52e8e1a3b
translation_language: ar
source_file_path: docs-site/docs/quick-start.md
translation_models:
  - qwen/qwen3-235b-a22b-2507
---



# البدء السريع

اتبع الخطوات أدناه لتشغيل أول ترجمة لك باستخدام `ai-i18n-tools`. يستخدم هذا الدليل مشروع المثال Next.js الذي تقرأه حاليًا — يجب تنفيذ كل أمر من الأوامر من داخل الدليل `examples/nextjs-app/`.

---

## المتطلبات المسبقة

قبل أن تبدأ، تأكد من توفر ما يلي:

- **Node.js 18+** — تحقق باستخدام الأمر `node --version`
- **مفتاح واجهة برمجة تطبيقات OpenRouter** — سجّل في [openrouter.ai](https://openrouter.ai) وانسخ مفتاحك من لوحة التحكم
- **npm أو pnpm** — يمكن استخدام أي من مدير الحزم

---

## الخطوة 1 — تثبيت التبعيات

```bash
cd examples/nextjs-app
npm install
```

يقوم هذا بتثبيت `ai-i18n-tools` مع حزم Next.js و Docusaurus المستخدمة في هذا المثال.

---

## الخطوة 2 — تعيين مفتاح واجهة برمجة التطبيقات الخاص بك

أنشئ ملف `.env` في دليل `examples/nextjs-app/`:

```bash
echo "OPENROUTER_API_KEY=sk-or-..." > .env
```

يقرأ `ai-i18n-tools` هذا المتغير تلقائيًا. لا تقم أبدًا بإرسال ملف `.env` إلى نظام التحكم بالإصدار.

---

## الخطوة 3 — مراجعة التهيئة

افتح ملف `ai-i18n-tools.config.json`. القسم المتعلق بترجمة الوثائق يبدو كالتالي:

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["es", "fr", "de", "pt-BR"],
  "features": {
    "translateMarkdown": true,
    "translateJSON": true
  },
  "documentations": [
    {
      "description": "Docusaurus docs and JSON UI strings under docs-site",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "markdownOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    }
  ]
}
```

يُخبر مصفوفة `contentPaths` الأداة بأي المجلدات (أو الملفات الفردية) يجب ترجمتها. ويُشير `outputDir` إلى المكان الذي تُكتب فيه الملفات المترجمة.

---

## الخطوة 4 — تشغيل المزامنة

ترجم وثائق الموقع فقط (تجاهل سلاسل واجهة المستخدم وملفات SVG مؤقتًا):

```bash
npx ai-i18n-tools sync --no-ui --no-svg
```

سترى مخرجات مشابهة لما يلي:

```
[docs] Scanning docs-site/docs/ — 2 files found
[docs] Translating to: es, fr, de, pt-BR
[docs] feature-showcase.md — 14 segments translated (4 locales)
[docs] quick-start.md — 11 segments translated (4 locales)
[docs] Done in 8.3 s (cache: 0 hits, 100 misses)
```

في التشغيل الثاني، ستكون معظم المقاطع **إصابات ذاكرة التخزين المؤقت** وسيكتمل الترجمة في أقل من ثانية.

---

## الخطوة 5 — فحص المخرجات

تُكتب الملفات المترجمة إلى `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/`. افتح أحد الملفات لمقارنته مع المصدر:

```bash
# Compare Spanish translation with English source
diff docs-site/docs/quick-start.md \
     docs-site/i18n/es/docusaurus-plugin-content-docs/current/quick-start.md
```

الأمور الرئيسية التي يجب التحقق منها:

- كتل الكود **مطابقة تمامًا** للمصدر — لم يتم ترجمة أي كود.
- تمت ترجمة قيم البيانات الوصفية (`title`، `description`).
- تم الحفاظ على النصوص البرمجية المضمنة `code spans` داخل النص الأصلي كما هي دون تغيير.
- تحتفظ الروابط بعنوان `href` الأصلي؛ ويتم تغيير نص الرابط فقط.

---

## الخطوة 6 — بدء تشغيل Docusaurus

```bash
cd docs-site
npm run start -- --locale de
```

يبدأ هذا الأمر خادم التطوير الخاص بـ Docusaurus باللغة الألمانية. افتح [http://localhost:3000/de/](http://localhost:3000/de/) في متصفحك لاستعراض الوثائق المترجمة.

---

## الخطوة 7 — استكشاف عرض Next.js (لغة محلية + جمع عددي)

تستخدم ترجمة الوثائق في هذا البرنامج التعليمي **Markdown فقط**. كما يُوفِّر مستودع المثال نفسه واجهة مستخدم **Next.js** على المنفذ **3030** حيث يمكنك رؤية استدعاءات **`t()`**، وعناوين URL **`?locale=`**، وعرض توضيحي للصيغة **العددية الأساسية**.

من `examples/nextjs-app/`:

```bash
npm run dev
```

ثم افتح [http://localhost:3030](http://localhost:3030).

- قم بتبديل اللغات باستخدام القائمة المنسدلة **Locale**، أو أضف **`?locale=<code>`** (مثلاً `http://localhost:3030/?locale=ar`). تحتفظ واجهة المستخدم بسلاسل الاستعلام والقائمة المنسدلة متزامنة.
- قم بالتمرير إلى **الجمع: مثال على استخدام التوليد التلقائي**. تتكرر العبارة «تحتوي هذه الصفحة على … أقسام» بعدد عينات ثابت (**1**، **2**، **5**، **50**) بحيث يمكنك مقارنة قواعد الجمع عبر اللغات المحلية (بما في ذلك اللغات التي تحتوي على أشكال جمع متعددة).
- تستخدم الاستدعاءات **`t("…", { plurals: true, count })`**. مع **`extract`** / **`translate-ui`**، يصبح هذا المفتاح مجموعة جمع في `locales/strings.json`؛ أما الملفات المسطحة **`public/locales/*.json`** فتحمل الأشكال المسبوقة بلاحقة. يتم التعامل مع الربط أثناء التشغيل في **`src/lib/i18n.ts`** — راجع قسم **Cardinal plurals example** في [ملف README المثال](../../README.md) للحصول على شرح موجز.

---

## ما الذي يمكنك استكشافه بعد ذلك

- اقرأ [عرض ميزات الترجمة](./feature-showcase) لترى كل عنصر Markdown يمكن لـ `ai-i18n-tools` التعامل معه — بما في ذلك كيفية ارتباط **السلاسل النصية للجمع العددي في واجهة المستخدم** بخط أنابيب الوثائق هذا.
- قم بتحرير جملة في `docs-site/docs/feature-showcase.md` وأعد تشغيل `sync` — سيتم إرسال هذا الجزء فقط إلى نموذج اللغة الكبير (LLM)؛ أما البقية فتُستَخدم من الكاش.
- أضف مصطلحًا إلى `glossary-user.csv` لفرض اتساق المصطلحات عبر جميع اللغات المحلية.
- فعّل خط أنابيب سلاسل واجهة المستخدم عن طريق تعيين `"translateUIStrings": true` وتشغيل `sync` دون استخدام العلامة `--no-ui`.
