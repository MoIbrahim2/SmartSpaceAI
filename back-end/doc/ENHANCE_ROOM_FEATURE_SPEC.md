# 🛠️ توثيق ميزة وسيناريو تحسين الغرف المفروشة (ENHANCE_ROOM Feature Specification)

وثيقة مرجعية تقنية تشرح التفاصيل المعمارية والتغييرات التي تم تطبيقها لدعم وضع **`ENHANCE_ROOM`** بشكل مستقل ومخصص في منصة **SmartSpaceAI**.

---

## 📌 1. نظرة عامة (Overview)

كان وضع تحسين الغرف (`ENHANCE_ROOM`) يعتمد سابقاً على نفس المسار وشروط التوليد الخاصة بـ `CREATE_FROM_SCRATCH`. تم تحديث المعمارية كلياً لتوفير مسار منفصل ومستقل يراعي وجود أثاث مسبق في الغرفة، ويعتمد تقنيات الـ **Inpainting & Restyling** واستخراج الإجراءات التفصيلية لكل قطعة أثاث (`REPLACE`, `ADD`, `KEEP`, `REMOVE`).

---

## 🏗️ 2. التغييرات الهيكلية في قاعدة البيانات والـ Validators

### أ. موديل التوليد ([`generation.model.js`](file:///d:/iti/SmartSpaceAi/SmartSpaceAI/back-end/src/models/generation.model.js))
- **تحديث `generationType` enum**: تم توحيد اسم الملاحظة في الموديل ليصبح `['CREATE_FROM_SCRATCH', 'ENHANCE_ROOM']`.
- **إضافة حقل `action`**: أُضيف الحقل `action` ضمن مصفوفة `categoryPreferences` لدعم تصنيف تفضيلات الفئات:
  ```javascript
  categoryPreferences: [{
    category: { type: String, required: true },
    included: { type: Boolean, default: null },
    excluded: { type: Boolean, default: null },
    quantity: { type: Number, default: null },
    preferredMaterial: { type: String, default: null },
    preferredColor: { type: String, default: null },
    preferredStyle: { type: String, default: null },
    preferredShape: { type: String, default: null },
    preferredSize: { type: String, default: null },
    budgetAdjustment: { type: String, default: null },
    importance: { type: String, default: null },
    action: { 
      type: String, 
      enum: ['REPLACE', 'ADD', 'KEEP', 'REMOVE', null], 
      default: null 
    }
  }]
  ```

### ب. المتحقق من المدخلات ([`generation.validator.js`](file:///d:/iti/SmartSpaceAi/SmartSpaceAI/back-end/src/validators/generation.validator.js))
- تحديث قواعد الـ Joi Validation في `createGenerationSchema` و `extractPreferencesSchema` لتقبل `ENHANCE_ROOM` كقيمة رسمية معتمدة.

---

## 🤖 3. تحديثات خدمات الذكاء الاصطناعي (AI Services)

### أ. استخراج التفضيلات NLU ([`promptBuilder.service.js`](file:///d:/iti/SmartSpaceAi/SmartSpaceAI/back-end/src/services/promptBuilder.service.js))
- **`buildSystemPrompt(availableCategories, generationType)`**:
  - عند اختيار `ENHANCE_ROOM`؛ يتم تزويد نموذج Gemini بتعليمات صريحة تفيد بأن الغرفة **مفروشة مسبقاً**، وتوجهه لاستخراج الـ `action` المناسب لكل فئة أثاث:
    * `REPLACE`: استبدال قطعة أثاث قائمة بقطعة جديدة.
    * `ADD`: إضافة قطعة أثاث جديدة في مكان شاغر.
    * `KEEP`: المحافظة على قطعة الأثاث الحالية كما هي دون تغيير.
    * `REMOVE`: إزالة وحذف قطعة أثاث من الغرفة.
- **`buildUserPrompt(roomDetails, userPrompt, availableCategories, generationType)`**:
  - إرسال نوع نمط التوليد `Generation Mode: ENHANCE_ROOM` ضمن البرومبت المرسل للنموذج.

### ب. هيكل استجابة Gemini ([`aiService.js`](file:///d:/iti/SmartSpaceAi/SmartSpaceAI/back-end/src/services/aiService.js))
- تحديث `buildResponseSchema` في `aiService.js` لتلقي حقل `action` ضمن كائن `categoryPreferences`.

### ج. التوليد البصري المركب Qwen Multimodal Engine ([`aiService.js`](file:///d:/iti/SmartSpaceAi/SmartSpaceAI/back-end/src/services/aiService.js))
- **تحديث `generateRoomCompositeImage`**:
  - قبول `generationType` ضمن المدخلات.
  - صياغة توجيهات Qwen System Prompt مخصصة لوضع `ENHANCE_ROOM`:
    * **EXISTING FURNITURE DIRECTIVE**: الإبقاء على قطع الأثاث غير المطلوبة استبدالها في `<|image_1|>`.
    * **INPAINTING & RESTYLING**: تنفيذ عمليات دمج بصرية ناعمة (Smooth Inpainting) لقطع الأثاث الجديدة مع المحافظة على الظلال والإضاءة المعمارية للغرفة.
    * **RESTYLING & CLEAN INTEGRATION**: إزالة وتفريغ المساحات الخاصة بالقطع المراد استبدالها أو حذفها بنظافة.
  - **إصلاح خطأ `systemPrompt ReferenceError`**: تم تصحيح القراءة في مسار التوليد الاحتياطي (Fallback) لاستخدام `prompt` بسلامة ومرونة.

---

## 📡 4. ربط بروتوكول البيانات والواجهة الأمامية (Pipeline & Frontend)

### أ. خدمة الجيل الباك إند ([`generation.service.js`](file:///d:/iti/SmartSpaceAi/SmartSpaceAI/back-end/src/services/generation.service.js))
- تمرير `generationType` من طلب المستخدم إلى دالة `promptBuilder.buildSystemPrompt` و `promptBuilder.buildUserPrompt`.
- تمرير `generation.generationType` المنسق إلى دالة التوليد البصري `aiService.generateRoomCompositeImage`.

### ب. الواجهة الأمامية ([`RoomGeneration.jsx`](file:///d:/iti/SmartSpaceAi/SmartSpaceAI/front-end/src/Pages/Dashboard/RoomGeneration.jsx))
- إرسال `generationType: form.generationType` ضمن طلب `extractPreferences` API.
- معالجة وإعادة تفعيل شريط إظهار الأخطاء في الخطوتين 3 و 4 لضمان عدم ابتلاع أخطاء الشبكة أو التوليد.

---

## 📑 5. توثيق المشروع التراكمي ([`project.md`](file:///d:/iti/SmartSpaceAi/SmartSpaceAI/project.md))

تم تحديث مستند المرجعية العام للمشروع (`project.md`) في القسم **3.D (AI Room Generation & Prompt Pipeline)** ليعكس المعمارية الجديدة ومحرك التوليد المزدوج لـ `CREATE_FROM_SCRATCH` و `ENHANCE_ROOM`.

---
