document.addEventListener("DOMContentLoaded", function() {
    
    // ربط العناصر من صفحة الـ HTML
    const loginBtn = document.getElementById("login-btn");
    const forgotLink = document.getElementById("forgot-link");

    // تشغيل الرسالة عند الضغط على "هل نسيت كلمة المرور؟"
    if (forgotLink) {
        forgotLink.addEventListener("click", function(event) {
            event.preventDefault(); // منع أي سلوك افتراضي للمتصفح
            alert("📞 عذراً! يرجى الاتصال بالدعم الفني فوراً للحصول على كود الاختبار الخاص بك.");
        });
    }

    // دالة فحص البيانات وتوجيه الطالب
    if (loginBtn) {
        loginBtn.addEventListener("click", function() {
            const studentName = document.getElementById("login-name").value.trim();
            const examCode = document.getElementById("login-pass").value.trim().toUpperCase();

            // التحقق من إدخال الحقول أولاً قبل الفحص
            if (studentName === "") {
                alert("⚠️ يرجى كتابة اسمك أولاً!");
                return;
            }
            if (examCode === "") {
                alert("⚠️ يرجى إدخال كود الاختبار!");
                return;
            }

            // ⚙️ قاعدة بيانات الطلاب المسموح لهم بدخول الامتحان
            const allowedStudents = {
                "محمد علي": {
                    code: "455",
                    subject: "history_geography"
                },
                "محمود صابر": {
                    code: "ARAB200",
                    subject: "arabic_exam"
                },
                "مي صلاح": {
                    code: "344",
                    subject: "geo_homework_1"
                }
            };

            // الفحص الذكي والموحد لضمان السرية والأمان
            if (allowedStudents.hasOwnProperty(studentName) && allowedStudents[studentName].code === examCode) {
                const studentData = allowedStudents[studentName];
                
                // إذا كان الاسم والكود متطابقين تماماً، يتم حفظ البيانات وتوجيهه
                localStorage.setItem("student_fullname", studentName);
                localStorage.setItem("allowed_subject_key", studentData.subject);

                alert(`مرحباً بك يا ${studentName}.\nتم التحقق من بياناتك بنجاح، جاري التوجيه للاختبار...`);
                window.location.href = "platform.html";
            } else {
                // رسالة خطأ موحدة في حال كان الاسم خطأ أو الكود خطأ
                alert("❌ الاسم أو كود الاختبار خاطئ! يرجى التأكد من البيانات المكتوبة أو التواصل مع المعلم.");
            }
        });
    }
});