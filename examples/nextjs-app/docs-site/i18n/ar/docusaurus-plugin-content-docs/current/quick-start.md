---
sidebar_position: 2
title: البدء السريع
description: >-
  احصل على أول مستند مترجم لك في أقل من خمس دقائق باستخدام ai-i18n-tools من خلال
  مشروع Next.js التوضيحي هذا.
translation_last_updated: '2026-05-02T23:39:40.417Z'
source_file_mtime: '2026-04-20T20:03:51.319Z'
source_file_hash: 3781b3b6f01b12a0aa8b7f15cc792f0282715729066828ccf371d959d933a447
translation_language: ar
source_file_path: docs-site/docs/quick-start.md
translation_models:
  - qwen/qwen3-235b-a22b-2507
---



اتبع الخطوات أدناه لتشغيل أول ترجمة لك باستخدام `ai-i18n-tools`. يستخدم هذا الدليل مشروع Next.js التوضيحي الذي تقرأه حاليًا — يجب تنفيذ كل أمر من الدليل `examples/nextjs-app/`.

---

## المتطلبات الأساسية {#prerequisites}

قبل أن تبدأ، تأكد من توفر ما يلي:

- **Node.js 22.16+** — تحقق باستخدام `node --version`
- **مفتاح واجهة برمجة تطبيقات OpenRouter** — سجّل في [openrouter.ai](https://openrouter.ai) وانسخ مفتاحك من لوحة التحكم
- **pnpm 10.33+** — تحقق باستخدام `pnpm --version`

---

## الخطوة 1 — تثبيت التبعيات {#step-1--install-dependencies}

```bash
cd examples/nextjs-app
npm install
```

يقوم هذا بالتثبيت `ai-i18n-tools` مع حزم Next.js وDocusaurus المستخدمة في هذا المثال.

---

## الخطوة 2 — تعيين مفتاح واجهة برمجة التطبيقات الخاص بك {#step-2--set-your-api-key}

أنشئ ملف `.env` في الدليل `examples/nextjs-app/`:

```bash
echo "OPENROUTER_API_KEY=sk-or-..." > .env
```

يقوم `ai-i18n-tools` بقراءة هذا المتغير تلقائيًا. لا تقم أبدًا بإرسال `.env` إلى نظام التحكم بالإصدار.

---

## الخطوة 3 — مراجعة التهيئة {#step-3--review-the-configuration}

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

تُخبر المصفوفة `contentPaths` الأداة بأي المجلدات (أو الملفات الفردية) يجب ترجمتها. ويتم كتابة الملفات المترجمة في `outputDir`.

---

## الخطوة 4 — تشغيل المزامنة {#step-4--run-the-sync}

ترجم وثائق فقط (تجاهل سلاسل واجهة المستخدم وملفات SVG مؤقتًا):

```bash
npx ai-i18n-tools sync --no-ui --no-svg
```

سترى مخرجات مشابهة لما يلي:

```text
[docs] Scanning docs-site/docs/ — 2 files found
[docs] Translating to: es, fr, de, pt-BR
[docs] feature-showcase.md — 14 segments translated (4 locales)
[docs] quick-start.md — 11 segments translated (4 locales)
[docs] Done in 8.3 s (cache: 0 hits, 100 misses)
```

في التشغيل الثاني، ستكون معظم المقاطع **إصابات في الكاش** وستكتمل الترجمة في أقل من ثانية.

---

## الخطوة 5 — فحص المخرجات {#step-5--inspect-the-output}

تُكتب الملفات المترجمة إلى `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/`. افتح ملفًا واحدًا لمقارنته مع المصدر:

```bash
# Compare Spanish translation with English source
diff docs-site/docs/quick-start.md \
     docs-site/i18n/es/docusaurus-plugin-content-docs/current/quick-start.md
```

الأمور الرئيسية التي يجب التحقق منها:

- تظل كتل التعليمات البرمجية **مطابقة تمامًا** للمصدر — لم يتم ترجمة أي كود.
- يتم ترجمة قيم الجزء الأمامي (`title`, `description`).
- تُحفظ العناصر المضمنة `code spans` داخل النص الأصلي كما هي.
- تحتفظ الروابط بـ `href` الأصلية؛ ويتم تغيير نص الرابط فقط.

---

## الخطوة 6 — بدء تشغيل Docusaurus {#step-6--start-docusaurus}

```bash
cd docs-site
npm run start -- --locale de
```

يبدأ هذا الخادم التجريبي لـ Docusaurus باللغة الألمانية. افتح [http://localhost:3000/de/](http://localhost:3000/de/) في متصفحك لاستعراض الوثائق المترجمة.

---

## الخطوة 7 — استكشاف عرض Next.js (اللغة المحلية + أشكال الجمع) {#step-7--explore-the-nextjs-demo-locale--cardinal-plurals}

تستخدم ترجمة الوثائق في هذا البرنامج التعليمي **اللغة Markdown فقط**. كما يحتوي نفس مستودع الأمثلة على واجهة مستخدم **Next.js** على المنفذ **3030** حيث يمكنك رؤية استدعاءات **`t()`**، وعناوين URL **`?locale=`**، وعرض توضيحي لـ **صيغ الجمع العددي**.

من `examples/nextjs-app/`:

```bash
npm run dev
```

ثم افتح [http://localhost:3030](http://localhost:3030).

- قم بتبديل اللغات باستخدام قائمة منسدلة **Locale**، أو أضف **`?locale=<code>`** (على سبيل المثال `http://localhost:3030/?locale=ar`). تحافظ الواجهة على توافق سلسلة الاستعلام مع القائمة المنسدلة.
- مرر لأسفل إلى **الجمع: مثال على استخدام التوليد التلقائي**. تتكرر الصفحة عبارة "تحتوي هذه الصفحة على ... أقسام" بعدد ثابت من العينات (**1**، **2**، **5**، **50**) لكي تتمكن من مقارنة قواعد الجمع عبر اللغات المحلية (بما في ذلك اللغات التي تحتوي على أشكال جمع متعددة).
- تستخدم الاستدعاءات **`t("…", { plurals: true, count })`**. مع **`extract`** / **`translate-ui`**، يصبح هذا المفتاح مجموعة جمع في `locales/strings.json`؛ تحمل الملفات المسطحة **`public/locales/*.json`** الأشكال المزودة بلاحقة. يتم التعامل مع الربط أثناء التشغيل في **`src/lib/i18n.ts`** — راجع قسم **مثال الجمع العددي** في [دليل المثال](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/README.md) للحصول على شرح موجز.

---

## ما الذي يجب استكشافه بعد ذلك {#what-to-explore-next}

- اقرأ [عرض ميزات الترجمة](./feature-showcase) لترى كل عنصر في Markdown الذي يمكن لـ `ai-i18n-tools` التعامل معه — بما في ذلك كيفية ارتباط **سلاسل واجهة المستخدم للجمع العددي** بخط أنابيب الوثائق هذا.
- عدّل جملة في `docs-site/docs/feature-showcase.md` وأعد تشغيل `sync` — سيتم إرسال هذا الجزء فقط إلى نموذج اللغة الكبيرة (LLM)؛ بينما تُستعاد باقي الأجزاء من الذاكرة المؤقتة.
- أضف مصطلحًا إلى `glossary-user.csv` لفرض اتساق المصطلحات عبر جميع اللغات المحلية.
- فعّل خط أنابيب سلاسل واجهة المستخدم عن طريق تعيين `"translateUIStrings": true` وتشغيل `sync` دون استخدام علامة `--no-ui`.
