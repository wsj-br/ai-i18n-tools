---
sidebar_position: 2
title: البدء السريع
description: >-
  احصل على أول مستند ترجمته في أقل من خمس دقائق باستخدام ai-i18n-tools من خلال
  مشروع المثال هذا الخاص بـ Next.js.
translation_last_updated: '2026-07-12T01:33:46.996Z'
source_file_mtime: '2026-07-12T01:15:35.414Z'
source_file_hash: e34ee98fed8efd780f0d40a5bd9d9d33307cb5bf12700487e6cb4054acd45660
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
pnpm install
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
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
    "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": true,
    "translateSVG": true
  },
  "glossary": {
    "uiGlossary": "locales/strings.json",
    "userGlossary": "glossary-user.csv",
    "autoAddUserEditedToGlossary": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "cacheDir": ".translation-cache",
  "documentations": [
    {
      "description": "Docusaurus docs and JSON UI strings under docs-site",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "jsonSource": "docs-site/i18n/en",
      "addFrontmatter": true,
      "markdownOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs",
        "postProcessing": {
          "regexAdjustments": [
            {
              "description": "Per-locale screenshot folders in docs-site static assets",
              "search": "screenshots/ar/]+/",
              "replace": "screenshots/ar/"
            }
          ]
        }
      }
    },
    {
      "description": "Root README only (flat markdown output)",
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "markdownOutput": {
        "style": "flat",
        "postProcessing": {
          "regexAdjustments": [
            {
              "description": "Per-locale screenshot folders under translated-docs",
              "search": "images/screenshots/ar/]+/",
              "replace": "images/screenshots/ar/"
            }
          ],
          "languageListBlock": {
            "start": "<small id=\"lang-list\">",
            "end": "</small>",
            "separator": " · "
          }
        }
      }
    }
  ],
  "svg": {
    "sourcePath": "images",
    "outputDir": "public/assets",
    "style": "flat"
  }
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
[docs] Translating to: ar, es, fr, de, pt-BR
[docs] feature-showcase.md — 14 segments translated (5 locales)
[docs] quick-start.md — 11 segments translated (5 locales)
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
pnpm start -- --locale de
```

يبدأ هذا خادم التطوير Docusaurus باللغة الألمانية. افتح [http://localhost:3040/de/](http://localhost:3040/de/) في متصفحك لاستعراض الوثائق المترجمة.

---

## الخطوة 7 — استكشاف عرض Next.js (اللغة المحلية + أشكال الجمع) {#step-7--explore-the-nextjs-demo-locale--cardinal-plurals}

يستخدم ترجمة الوثائق في هذا البرنامج التعليمي **Markdown فقط**. يأتي مستودع المثال نفسه مع واجهة مستخدم **Next.js** على المنفذ **3030** حيث يمكنك رؤية استدعاءات `t()`، وعناوين URL `?locale=`، وعرض توضيحي لـ **جمع أساسي**.

من `examples/nextjs-app/`:

```bash
pnpm dev
```

ثم افتح [http://localhost:3030](http://localhost:3030).

- قم بالتبديل بين اللغات باستخدام قائمة منسدلة **Locale**، أو أضف `?locale=<code>` (مثلاً `http://localhost:3030/?locale=ar`). تحافظ الواجهة على توافق سلسلة الاستعلام مع القائمة المنسدلة.
- مرر لأسفل إلى **الجمع: مثال على استخدام التوليد التلقائي**. تتكرر العبارة "تحتوي هذه الصفحة على ... أقسام" بعدد عينات ثابت (**1**، **2**، **5**، **50**) لكي تتمكن من مقارنة قواعد الجمع عبر المحال (بما في ذلك اللغات التي تحتوي على أشكال جمع متعددة).
- تستخدم الاستدعاءات `t("…", { plurals: true, count })`. مع `extract` / `translate-ui`، يصبح هذا المفتاح مجموعة جمع في `locales/strings.json`؛ تحمل الملفات المسطحة `public/locales/*.json` الأشكال المزودة بلاحقة. أما الربط أثناء التشغيل فيوجد في `src/lib/i18n.ts` — انظر قسم **مثال الجمع الأساسي** في [ملف README المثال](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/README.md) للحصول على شرح موجز.

---

## ما الذي يجب استكشافه بعد ذلك {#what-to-explore-next}

- اقرأ [عرض ميزات الترجمة](./feature-showcase) لترى كل عنصر في Markdown الذي يمكن لـ `ai-i18n-tools` التعامل معه — بما في ذلك كيفية ارتباط **سلاسل واجهة المستخدم للجمع العددي** بخط أنابيب الوثائق هذا.
- عدّل جملة في `docs-site/docs/feature-showcase.md` وأعد تشغيل `sync` — سيتم إرسال هذا الجزء فقط إلى نموذج اللغة الكبيرة (LLM)؛ بينما تُستعاد باقي الأجزاء من الذاكرة المؤقتة.
- أضف مصطلحًا إلى `glossary-user.csv` لفرض اتساق المصطلحات عبر جميع اللغات المحلية.
- فعّل خط أنابيب سلاسل واجهة المستخدم عن طريق تعيين `"translateUIStrings": true` وتشغيل `sync` دون استخدام علامة `--no-ui`.
