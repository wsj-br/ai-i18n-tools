---
sidebar_position: 2
title: بدء سريع
description: >-
  احصل على أول مستند مترجم لك في أقل من خمس دقائق باستخدام ai-i18n-tools مع
  مشروع Docusaurus التجريبي هذا.
translation_last_updated: '2026-09-03T22:52:20.887Z'
source_file_mtime: '2026-07-10T22:50:38.005Z'
source_file_hash: bb346aef23ab36ff210d39e8af7bbe4359fe6fcc88ad584942ebe6504f2a0f7f
translation_language: ar
source_file_path: docs/quick-start.md
translation_models:
  - google/gemini-2.5-flash
---



اتبع الخطوات أدناه لتشغيل أول ترجمة لك باستخدام `ai-i18n-tools`. يستخدم هذا الدليل مثال Docusaurus الذي تقرأه بالفعل — يجب تشغيل كل أمر من دليل `examples/docusaurus-docs/`.

---

## المتطلبات الأساسية {#prerequisites}

قبل البدء، تأكد من توفر ما يلي:

- **Node.js 22.16+** — تحقق باستخدام `node --version`
- **مفتاح OpenRouter API** — سجل في [openrouter.ai](https://openrouter.ai) وانسخ مفتاحك من لوحة التحكم
- **pnpm 10.33+** — تحقق باستخدام `pnpm --version`

---

## الخطوة 1 — تثبيت التبعيات {#step-1--install-dependencies}

```bash
cd examples/docusaurus-docs
pnpm install
```

يقوم هذا بتثبيت `ai-i18n-tools` جنبًا إلى جنب مع حزم Docusaurus المستخدمة في هذا المثال.

---

## الخطوة 2 — تعيين مفتاح API الخاص بك {#step-2--set-your-api-key}

أنشئ ملف `.env` في دليل `examples/docusaurus-docs/`:

```bash
echo "OPENROUTER_API_KEY=sk-or-..." > .env
```

يقرأ `ai-i18n-tools` هذا المتغير تلقائيًا. لا تقم أبدًا بتثبيت `.env` في التحكم في الإصدار.

---

## الخطوة 3 — مراجعة التكوين {#step-3--review-the-configuration}

افتح `ai-i18n-tools.config.json`. يبدو القسم ذو الصلة بترجمة الوثائق كما يلي:

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "description": "Docusaurus docs and shell JSON catalogs",
      "contentPaths": ["docs/"],
      "outputDir": "i18n",
      "docusaurusCatalogDir": "i18n/en",
      "addFrontmatter": true,
      "docsOutput": {
        "style": "docusaurus",
        "docsRoot": "docs",
        "postProcessing": {
          "regexAdjustments": [
            {
              "description": "Per-locale screenshot folders in static assets",
              "search": "screenshots/ar/]+/",
              "replace": "screenshots/ar/"
            }
          ]
        }
      }
    }
  ]
}
```

تخبر مصفوفة `contentPaths` الأداة بأي الدلائل (أو الملفات الفردية) التي يجب ترجمتها. `outputDir` هو المكان الذي تُكتب فيه الملفات المترجمة.

---

## الخطوة 4 — تشغيل المزامنة {#step-4--run-the-sync}

ترجمة الوثائق و JSON الخاص بـ Docusaurus shell:

```bash
pnpm run i18n:sync
```

سترى مخرجات مشابهة لما يلي:

```text
[docs] Scanning docs/ — 2 files found
[docs] Translating to: ar, es, fr, de, pt-BR
[docs] feature-showcase.md — 14 segments translated (5 locales)
[docs] quick-start.md — 11 segments translated (5 locales)
[docs] Done in 8.3 s (cache: 0 hits, 100 misses)
```

في التشغيل الثاني، ستكون معظم الأجزاء **إصابات ذاكرة التخزين المؤقت** وستكتمل الترجمة في أقل من ثانية.

---

## الخطوة 5 — فحص المخرجات {#step-5--inspect-the-output}

تُكتب الملفات المترجمة إلى `i18n/<locale>/docusaurus-plugin-content-docs/current/`. افتح أحدها لمقارنته بالمصدر:

```bash
# Compare Spanish translation with English source
diff docs/quick-start.md \
     i18n/es/docusaurus-plugin-content-docs/current/quick-start.md
```

نقاط أساسية للتحقق:

- كتل التعليمات البرمجية **مطابقة** للمصدر — لم تتم ترجمة أي تعليمات برمجية.
- قيم الواجهة الأمامية (`title`، `description`) مترجمة.
- `code spans` المضمنة داخل النثر محفوظة حرفيًا.
- الروابط تحتفظ بـ `href` الأصلي؛ يتغير نص الرابط فقط.

---

## الخطوة 6 — بدء Docusaurus {#step-6--start-docusaurus}

```bash
pnpm start
```

يقوم هذا بإنشاء كل لغة وتقديم الموقع حتى تعمل قائمة لغات شريط التنقل. افتح [http://localhost:3100/quick-start](http://localhost:3100/quick-start)، ثم قم بالتبديل إلى البرتغالية (البرازيل) — على سبيل المثال [http://localhost:3100/pt-BR/feature-showcase](http://localhost:3100/pt-BR/feature-showcase).

أثناء تحرير المصادر الإنجليزية، يوفر `pnpm dev` إعادة تحميل سريعة للغة الافتراضية فقط؛ أعد تشغيل `pnpm start` لتحديث جميع اللغات بعد التغييرات.

---

## ما الذي يجب استكشافه بعد ذلك {#what-to-explore-next}

- اقرأ [عرض ميزات الترجمة](./feature-showcase) لترى كل عنصر Markdown يمكن لـ `ai-i18n-tools` التعامل معه.
- قم بتحرير جملة في `docs/feature-showcase.md` وأعد تشغيل `pnpm run i18n:sync` — سيتم إرسال هذا الجزء فقط إلى LLM؛ وسيتم تقديم البقية من ذاكرة التخزين المؤقت.
- أضف مصطلحًا إلى `glossary-user.csv` لفرض مصطلحات متسقة عبر جميع اللغات.
- بالنسبة لسلاسل واجهة المستخدم، والجمع الأساسي، وترجمة SVG، وملف README مسطح في نفس المستودع، راجع [مثال Next.js](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) المدمج.
