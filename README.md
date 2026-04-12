📂 Project Planner - Professional Blueprint
نظام متكامل لإدارة المشاريع يعتمد على معمارية Decoupled Architecture، مصمم ليكون منصة ذكية لإدارة المهام باستخدام تقنيات حديثة.

## 📂 Project Structure
- /django_backend  --> (Django Project Root)
  - /core          --> (Settings & WSGI)
  - /api           --> (Main App: Models, Views, Serializers)
- /frontend        --> (React Project Root)
  - /src
    - /api         --> (client.js & API calls)
    - /components  --> (Reusable UI Components)
    - /pages       --> (Main Dashboard & Project Pages)


🛠️ المكدس التقني (Tech Stack)
Backend: Django / Django REST Framework (DRF).

Database: PostgreSQL (لضمان استقرار البيانات وتوسيعها).

Frontend: React.js (Vite) + Tailwind CSS.

Authentication: JWT (JSON Web Tokens).

✅ الوضع الحالي للمشروع (Status)
المصادقة: نظام Login/Register يعمل بالكامل مع تخزين التوكن في localStorage.

قاعدة البيانات: النماذج (User, Project, Task) مكتملة ومترابطة في PostgreSQL.

تجريد الواجهة: الفرونت إند "خالٍ" من البيانات الوهمية ويعتمد كلياً على الـ API.

نظام اللغات: يدعم اللغتين (العربية/الإنجليزية) مع تعيين الإنجليزية كافتراضية.

لوحة كانبان: واجهة تفاعلية لإضافة ونقل المهام وتحديث تقدم المشروع تلقائياً.

🚀 خارطة الطريق المتبقية (Roadmap)
1️⃣ الذكاء الاصطناعي (AI Planner)
تطوير Endpoint لاستقبال الـ Prompt وتوليد خطة مهام JSON وتخزينها مباشرة في قاعدة البيانات.

إضافة زر في الفرونت إند لتفعيل التخطيط التلقائي.

2️⃣ التحليلات (Analytics Dashboard)
بناء لوحة إحصائيات تقرأ (عدد المشاريع، المهام المنجزة، والنسب المئوية) باستخدام مكتبة Recharts.

3️⃣ المخطط الزمني (Gantt Charts)
تطبيق المخطط الزمني باستخدام مكتبة gantt-task-react لضمان أعلى مستويات الاستقرار والاحترافية.

4️⃣ نظام الإشعارات (Notifications)
تفعيل الإشعارات الفورية عند اكتمال المشاريع أو اقتراب المواعيد النهائية باستخدام Django Signals.


⚠️ قواعد التطوير الصارمة
يُمنع استخدام Mock Data (بيانات وهمية) نهائياً.

اللغة: الكود (المتغيرات والدوال) بالإنجليزية، الواجهة تدعم اللغتين.

الأمان: كل طلب API يجب أن يحمل Authorization: Bearer <Token>.

🛠️ تعليمات التشغيل السريع
الباك إند:
cd django_backend
.\venv\Scripts\activate
python manage.py runserver

الفرونت إند:
cd frontend
npm run dev
