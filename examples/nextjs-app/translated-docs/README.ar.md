# مثال تطبيق Next.js

يوضح هذا المثال كيفية استخدام `ai-i18n-tools` مع تطبيق **TypeScript** [Next.js](https://nextjs.org/) وـ pnpm. ويوافق واجهة المستخدم مثال تطبيق [الوحدة](../../console-app/)، باستخدام نفس مفاتيح النصوص ومنتقي موقعية يتم تشغيله بواسطة `locales/ui-languages.json` (محلية المصدر `en-GB` أولاً، تليها أهداف الترجمة). يقوم `[src/lib/i18n.ts](../src/lib/i18n.ts)` ببناء `localeLoaders` من هذا البيان (كل `code` باستثناء `SOURCE_LOCALE`)، مثل تطبيق الوحدة؛ ويتم تحميل الحُزم باستخدام `fetch` إلى `public/locales/<locale>.json`.

ضمن هذا المجلد يوجد موقع صغير مبني على [Docusaurus](https://docusaurus.io/) (`[docs-site/](../docs-site/)`) يحتوي على مجموعة مختارة من وثائق المشروع الرئيسي للتصفح المحلي.

**اقرأ بلغات أخرى:**
[الإنجليزية](../README.md) · [العربية](README.ar.md) · [الإسبانية](README.es.md) · [الفرنسية](README.fr.md) · [الألمانية](README.de.md) · [البرتغالية (البرازيل)](README.pt-BR.md)

## لقطة شاشة

لقطة شاشة

## المتطلبات

- Node.js >= 22.16 (مطابقة لحقل `engines` في المستودع)
- [pnpm](https://pnpm.io/) >= 10.33 (انظر `package.json` `packageManager` / `engines` في الجذر)
- مفتاح API من [OpenRouter](https://openrouter.ai) (لتوليد الترجمات)

## التثبيت

من الجذر الخاص بالمستودع، قم بتشغيل:

```bash
pnpm install
```

يشمل الجذر `pnpm-workspace.yaml` المكتبة وعينة هذا المثال، وبالتالي pnpm يربط `ai-i18n-tools` عبر `"ai-i18n-tools": "workspace:^"` في `package.json`. لا حاجة لخطوة بناء أو ربط منفصلة — بعد تعديل مصادر المكتبة، قم بتشغيل `pnpm run build` من جذر المستودع وسيتم تلقائياً تحميل النسخة المحدثة من `dist/` في المثال.

**دليل العمل:** قم بتشغيل تطبيق Next.js وجميع أوامر `pnpm run i18n:*` من `examples/nextjs-app` (حيث يوجد `ai-i18n-tools.config.json`)، أو قم بتمرير `--config` / تعيين دليل العمل بحيث يمكن للأداة سطر الأوامر (CLI) تحديد هذا الإعداد.

## الاستخدام

### تطبيق Next.js (المنفذ 3030)

من جذر المستودع بعد `pnpm install`:

```bash
cd examples/nextjs-app
```

خادم التطوير:

```bash
pnpm dev
```

بناء الإنتاج والبدء:

```bash
pnpm build
pnpm start
```

افتح [http://localhost:3030](http://localhost:3030). استخدم القائمة المنسدلة للموقعية لتغيير اللغة (معرّف الموقعية / الاسم الإنجليزي / التسمية الأصلية). يمكنك أيضًا الربط المباشر بموقعية باستخدام سلسلة الاستعلام `?locale=<code>` (على سبيل المثال `[?locale=ar](http://localhost:3030/?locale=ar)`); حيث تحتفظ الصفحة بتناسق بين القائمة المنسدلة وعنوان URL.

### مثال الجمع العددي

تشمل الصفحة الرئيسية عرضًا تجريبيًا للجمع ("الجمع: مثال على استخدام التوليد التلقائي") يوضح كيفية ربط سلاسل واجهة المستخدم للجمع الأساسي من البداية إلى النهاية:

- **العرض:** يتم تكرار نفس الرسالة بعدد من القيم النموذجية محددة في `PLURAL_DEMO_COUNTS` ضمن `[src/app/page.tsx](../src/app/page.tsx)` (بشكل افتراضي 1، 2، 5، و50) لكي تتمكن من مقارنة سلوك الجمع عبر اللغات (بما في ذلك اللغات ذات أشكال الجمع المتعددة مثل العربية).
- **واجهة برمجة التطبيقات (API):** يستخدم كل سطر `t("This page has {{count}} sections", { plurals: true, count })`. قم بتمرير `plurals: true` بحيث تتعامل أدوات الاستخراج والترجمة مع المفتاح كمجموعة جمع؛ ويحدد `count` شكل الجمع النشط أثناء التشغيل.
- **التشغيل:** يتم حل أشكال الجمع أثناء التشغيل عبر المساعدات الموصولة في `[src/lib/i18n.ts](../src/lib/i18n.ts)`؛ راجع وثائق التشغيل الخاصة بالحزمة (`ai-i18n-tools/runtime`) للحصول على الصورة الكاملة.
- **المخرجات:** تستخدم اللغات المستهدفة إدخالات ذات لواحق في `public/locales/<locale>.json`؛ بينما تحتفظ اللغة المصدر بحزم الجمع في `public/locales/en-GB.json` إلى جانب الإدخالات المسطحة المعتادة.

كما يعرض العرض التجريبي كتلة صغيرة رمادية من الكود تحتوي على مقتطف JSX فوق الأمثلة المباشرة كمرجع سريع.

تُظهر الصفحة الرئيسية أيضًا صورة SVG تجريبية في أسفل الصفحة. يتبع عنوان URL للصورة `public/assets/translation_demo_svg.<locale>.svg` (تخطيط مسطح من كتلة `svg` في `ai-i18n-tools.config.json`). بعد تشغيل `translate-svg`، تحتوي كل ملف لغة على محتوى مترجم لـ `<text>` و`<title>` و`<desc>`؛ قبل ذلك، قد تبدو النسخ المحفوظة متطابقة عبر اللغات.

### موقع التوثيق (المنفذ 3040)

```bash
cd examples/nextjs-app/docs-site
pnpm install
pnpm build
pnpm start
```

إذا لم يتم الفتح تلقائيًا، افتح متصفحك واذهب إلى [http://localhost:3040](http://localhost:3040).

## اللغات المدعومة

| الكود    | اللغة             |
| ------- | -------------------- |
| `ar`    | العربية               |
| `en-GB` | الإنجليزية (المملكة المتحدة) الافتراضية |
| `fr`     | الفرنسية               |
| `de`     | الألمانية               |
| `pt-BR`  | البرتغالية (البرازيل)  |
| `es`     | الإسبانية              |

## سير العمل

### 1. استخراج سلاسل واجهة المستخدم

يقوم بمسح `src/` بحثًا عن استدعاءات `t()` ويحدّث `locales/strings.json`:

```bash
pnpm run i18n:extract
```

### 2. الترجمة

اضبط `OPENROUTER_API_KEY`، ثم نفّذ من ``examples/nextjs-app`` جميع خطوات الترجمة بالترتيب (واجهة المستخدم بصيغة JSON مسطّحة → ملفات SVG → الوثائق):

```bash
export OPENROUTER_API_KEY=your_key_here
pnpm run i18n:translate
```

لتشغيل مرحلة واحدة فقط، استخدم واجهة سطر الأوامر (نفس دليل العمل):

```bash
ai-i18n-tools translate-ui
ai-i18n-tools translate-svg
ai-i18n-tools translate-docs
```

### أمر المزامنة

يُشغّل أمر المزامنة خطوات الاستخراج وجميع خطوات الترجمة بالترتيب:

```bash
pnpm run i18n:sync
```

أو

```bash
ai-i18n-tools sync
```

الخطوات تُنفّذ بالترتيب:

1. ``ai-i18n-tools extract`` — يستخرج سلاسل واجهة المستخدم ويحدّث `locales/strings.json`.
2. ``ai-i18n-tools translate-ui`` — يُولّد ملفات JSON مسطّحة حسب اللغة ضمن `public/locales/` من `locales/strings.json`.
3. ``ai-i18n-tools translate-svg`` — يترجم ملفات SVG من `images/` إلى `public/assets/` عندما تكون قيمة `features.translateSVG` صحيحة ويكون كتلة `svg` مضبوطة في `ai-i18n-tools.config.json` (يستخدم هذا المثال أسماء مسطّحة: `translation_demo_svg.<locale>.svg`).
4. ``ai-i18n-tools translate-docs`` — يترجم محتوى **الصفحة** في Docusaurus (ملفات markdown/MDX ضمن `docs-site/docs/`) إلى `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/`، وعند تعيين `features.translateJSON` و `jsonSource`، يترجم أيضًا **ملفات JSON للواجهة** من `docs-site/i18n/en/` (حسب `documentations[]` في `ai-i18n-tools.config.json`؛ انظر سير العمل 2 في `docs/GETTING_STARTED.md` في جذر المستودع).

يمكنك تشغيل أي خطوة بشكل منفصل (مثلاً `ai-i18n-tools translate-svg`) عندما تتغير فقط المصادر الخاصة بذلك المسار.

إذا أظهرت السجلات تخطيًا كثيرًا وكتابة قليلة، فإن الأداة تعيد استخدام المخرجات الحالية والذاكرة المؤقتة SQLite في `.translation-cache/`. لإجبار إعادة الترجمة، مرر `--force` أو `--force-update` في الأمر المناسب عند دعم ذلك، أو قم بتشغيل `pnpm run i18n:clean` (يحذف فقط `.translation-cache/` في هذا المجلد) ثم قم بالترجمة مجددًا.

يحتوي هذا المثال على `features.translateSVG` وكتلة `svg`، لذا يقوم `i18n:sync` بتشغيل نفس خطوة SVG كما في `translate-svg`. لا يزال بإمكانك استدعاء `ai-i18n-tools translate-svg` وحدها لتلك الخطوة، أو استخدام `pnpm run i18n:translate` للترتيب الثابت واجهة المستخدم → SVG → الوثائق دون تشغيل `extract`.

### 3. تنظيف الذاكرة المؤقتة وإعادة الترجمة

بعد إجراء تغييرات على واجهة المستخدم أو الوثائق، قد تصبح بعض إدخالات الذاكرة المؤقتة قديمة أو مهجورة (مثلاً إذا تم إزالة مستند أو تغيير اسمه). يقوم `i18n:cleanup` بتشغيل `sync --force-update` أولًا، ثم يزيل الإدخالات القديمة:

```bash
pnpm run i18n:cleanup
```

لإجبار الأداة على إعادة ترجمة واجهة المستخدم أو المستندات أو ملفات SVG، استخدم `--force`. هذا يتجاهل الذاكرة المؤقتة ويعيد الترجمة باستخدام نماذج الذكاء الاصطناعي.

لإعادة ترجمة المشروع بأكمله (واجهة المستخدم، المستندات، ملفات SVG):

```bash
pnpm run i18n:sync --force
```

لإعادة ترجمة لغة محلية واحدة فقط:

```bash
pnpm run i18n:sync --force --locale pt-BR
```

لإعادة ترجمة سلاسل واجهة المستخدم فقط بلغة محلية محددة:

```bash
ai-i18n-tools translate-ui --force --locale pt-BR
```

### 4. التعديلات اليدوية (محرر الذاكرة المؤقتة)

يمكنك تشغيل واجهة ويب محلية لمراجعة الترجمات وتحريرها يدويًا في الذاكرة المؤقتة، وسلاسل واجهة المستخدم، والمعجم (من ``examples/nextjs-app``):

```bash
pnpm run i18n:editor
```

من ``docs-site/``، يقوم ``pnpm run i18n:editor`` بنفس الشيء (إذ يُحوّل `cd` إلى هذا المجلد ويشغّل واجهة سطر الأوامر CLI).

> **مهم:** إذا قمت بتعديل إدخال يدويًا في محرر الذاكرة المؤقتة، فعليك تشغيل `sync --force-update` (مثلاً `pnpm run i18n:sync --force-update`) لإعادة كتابة الملفات المسطحة أو ملفات markdown التي تم إنشاؤها باستخدام الترجمة المحدثة. لاحظ أيضًا أنه إذا تغير النص الأصلي في المستقبل، فستفقد تعديلاتك اليدوية لأن الأداة ستُنشئ تجزئة جديدة للنص الأصلي الجديد.

## هيكل المشروع

```text
nextjs-app/
├── ai-i18n-tools.config.json # UI, docs, svg, glossary; `cacheDir`: .translation-cache/
├── glossary-user.csv         # Optional user glossary (see config `glossary.userGlossary`)
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   └── lib/
│       └── i18n.ts
├── images/
│   └── translation_demo_svg.svg   # Source SVG for translate-svg
├── locales/
│   ├── ui-languages.json
│   └── strings.json          # Generated string catalogue (extract)
├── public/locales/           # Flat per-locale JSON (committed; regenerate with translate-ui)
│   ├── en-GB.json            # Source locale bundle (includes plural keys)
│   ├── ui-languages.json     # Copied/served for runtime if needed
│   ├── es.json
│   ├── fr.json
│   ├── de.json
│   ├── pt-BR.json
│   └── ar.json
├── public/assets/            # Per-locale SVGs (translate-svg; page uses translation_demo_svg.<locale>.svg)
│   └── translation_demo_svg.*.svg
├── translated-docs/          # README translations (flat markdown; second `documentations` block)
└── docs-site/                # Docusaurus docs (port 3040)
    ├── docs/                 # English sources for this example (curated subset)
    ├── docusaurus.config.mjs
    └── i18n/                 # Translated docs + Docusaurus JSON catalogs (committed in git)
```

يوجد الملف markdown باللغة الإنجليزية لموقع المثال ضمن `docs-site/docs/`. لا يوجد مزامنة تلقائية من الجذر `docs/` للمستودع؛ قم بتحديث تلك الملفات مباشرة عند تجديد المحتوى. لروابط العناوين المستقرة، استخدم ``write-heading-ids`` من Docusaurus من ``docs-site/`` (انظر ``pnpm run write-heading-ids`` في `[docs-site/package.json](../docs-site/package.json)`).

تُرجمت سلاسل واجهة المستخدم، وملفات SVG التوضيحية، وترجمات الجذر `README`، ومخرجات Docusaurus وتُخزن ضمن `public/locales/`، `public/assets/`، `locales/strings.json`، `translated-docs/`، و`docs-site/i18n/`. بعد تعديل المصادر وتشغيل ``pnpm run i18n:translate`` أو ``pnpm run i18n:sync``، أعد تشغيل خوادم التطوير لـ Next.js وDocusaurus عند الحاجة. ويتم تعريف التوجيه حسب اللغة و``localeConfigs`` في `**docs-site/docusaurus.config.mjs**`.
