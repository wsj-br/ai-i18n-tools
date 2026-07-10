---
title: البدء السريع
description: >-
  احصل على أول مستند ترجمته في أقل من خمس دقائق باستخدام أدوات ai-i18n-tools مع
  هذا المثال Astro Starlight.
sidebar:
  order: 2
translation_last_updated: '2026-07-10T17:11:25.031Z'
source_file_mtime: '2026-07-09T16:56:12.938Z'
source_file_hash: 2e7e3283a7dc1df486ce3088aa4f1bec3dac1bbce14d43f8d513a52fb0cd1cd9
translation_language: ar
source_file_path: src/content/docs/quick-start.md
translation_models:
  - qwen/qwen3-235b-a22b-2507
---



اتبع الخطوات أدناه لتشغيل أول ترجمة لك باستخدام `ai-i18n-tools`. يستخدم هذا الدليل مثال Starlight الذي تقرأه حاليًا — يجب تشغيل كل أمر من دليل `examples/astro-docs/`.

---

<a id="prerequisites"></a>

## المتطلبات المسبقة
قبل أن تبدأ، تأكد من توفر ما يلي:

- **Node.js 22.16+** — تحقق باستخدام `node --version`
- **مفتاح واجهة برمجة تطبيقات OpenRouter** — سجّل في [openrouter.ai](https://openrouter.ai) وانسخ مفتاحك من لوحة التحكم
- **pnpm 10.33+** — تحقق باستخدام `pnpm --version`

---

<a id="step-1--install-dependencies"></a>

## الخطوة 1 — تثبيت التبعيات

```bash
cd examples/astro-docs
pnpm install
```

يؤدي هذا إلى تثبيت `ai-i18n-tools` (عبر مساحة العمل) مع Astro وStarlight.

---

<a id="step-2--set-your-api-key"></a>

## الخطوة 2 — تعيين مفتاح API الخاص بك
أنشئ ملف `.env` في دليل `examples/astro-docs/`:

```bash
echo "OPENROUTER_API_KEY=sk-or-..." > .env
```

يقرأ `ai-i18n-tools` هذا المتغير تلقائيًا. لا تقم أبدًا بإرسال `.env` إلى نظام التحكم بالإصدار.

---

<a id="step-3--review-the-configuration"></a>

## الخطوة 3 — مراجعة التهيئة
افتح ملف `ai-i18n-tools.config.json`. القسم المتعلق بترجمة الوثائق يبدو كالتالي:

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "translateMarkdown": true,
    "translateJSON": false
  },
  "documentations": [
    {
      "description": "Starlight docs under src/content/docs",
      "contentPaths": [
        "src/content/docs/quick-start.md",
        "src/content/docs/feature-showcase.mdx"
      ],
      "outputDir": "src/content/docs",
      "addFrontmatter": true,
      "markdownOutput": {
        "style": "astro-starlight",
        "docsRoot": "src/content/docs",
        "postProcessing": {
          "regexAdjustments": [
            {
              "description": "Per-locale screenshot folders in public assets",
              "search": "screenshots/ar/",
              "replace": "screenshots/ar/"
            }
          ]
        }
      }
    }
  ]
}
```

يحدد المصفوفة `contentPaths` الملفات التي سيتم ترجمتها. تُكتب النسخ المترجمة ضمن `src/content/docs/<locale>/` (مجلدات اللغات في Starlight).

---

<a id="step-4--run-the-sync"></a>

## الخطوة 4 — تشغيل المزامنة
ترجم الوثائق:

```bash
npx ai-i18n-tools sync --no-ui --no-svg
```

سترى مخرجات مشابهة لما يلي:

```text
[docs] Scanning src/content/docs/ — 2 files found
[docs] Translating to: ar, es, fr, de, pt-BR
[docs] feature-showcase.mdx — segments translated (5 locales)
[docs] quick-start.md — segments translated (5 locales)
```

في التشغيل الثاني، ستكون معظم المقاطع **إصابات ذاكرة مؤقتة** وسيكتمل الترجمة بسرعة.

---

<a id="step-5--inspect-the-output"></a>

## الخطوة 5 — فحص المخرجات
تُكتب الملفات المترجمة إلى `src/content/docs/<locale>/`. افتح ملفًا واحدًا لمقارنته مع المصدر:

```bash
# Compare Spanish translation with English source
diff src/content/docs/quick-start.md \
     src/content/docs/es/quick-start.mdx
```

الأمور الرئيسية التي يجب التحقق منها:

- تظل كتل التعليمات البرمجية **مطابقة تمامًا** للمصدر — لم يتم ترجمة أي كود.
- يتم ترجمة قيم البيانات الوصفية (`title`, `description`).
- تظل العناصر المضمنة `code spans` داخل النص الأصلي كما هي دون تغيير.
- تحتفظ الروابط بـ `href` الأصلي؛ ويتم تغيير نص الرابط فقط.

---

<a id="step-6--start-starlight"></a>

## الخطوة 6 — بدء تشغيل Starlight

```bash
pnpm dev
```

افتح [http://localhost:3050/de/quick-start](http://localhost:3050/de/quick-start) (أو اختر لغة من مفتاح التبديل اللغوي) لاستعراض الوثائق المترجمة.

---

<a id="step-7--explore-the-nextjs-demo-locale--cardinal-plurals"></a>

## الخطوة 7 — استكشاف عرض Next.js (اللغة المحلية + الجمع العددي)
تستخدم ترجمة الوثائق في هذا البرنامج التعليمي **Markdown فقط**. كما يحتوي المستودع على واجهة **Next.js** ضمن `examples/nextjs-app/` على المنفذ **3030** حيث يمكنك رؤية استدعاءات `t()`، وعناوين URL `?locale=`، وعرض توضيحي للجمع العددي **cardinal plural**.

```bash
cd ../nextjs-app
pnpm dev
```

ثم افتح [http://localhost:3030](http://localhost:3030).

- قم بالتبديل بين اللغات باستخدام قائمة **Locale** المنسدلة، أو أضف `?locale=<code>` (مثلاً `http://localhost:3030/?locale=ar`).
- مرر لأسفل إلى القسم **Plurals: automatic generation usage example** وقارن قواعد الجمع عبر اللغات المحلية.
- راجع القسم **Cardinal plurals example** في [ملف README الخاص بعينة Next.js](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/README.md).

---

<a id="what-to-explore-next"></a>

## ما الذي يجب استكشافه بعد ذلك
- اقرأ [عرض ميزات الترجمة](./feature-showcase) لترى كل عنصر في Markdown الذي يمكن لـ `ai-i18n-tools` التعامل معه.
- قم بتحرير جملة في `src/content/docs/feature-showcase.mdx` وأعد تشغيل `sync` — سيتم إرسال هذا الجزء فقط إلى نموذج اللغة الكبيرة (LLM).
- أضف مصطلحًا إلى `glossary-user.csv` لفرض اتساق المصطلحات عبر جميع اللغات المحلية.
- قارن موقع Starlight هذا مع عرض Docusaurus في `examples/nextjs-app/docs-site/` (نفس المحتوى، `style: "docusaurus"` مقابل `style: "astro-starlight"`).
