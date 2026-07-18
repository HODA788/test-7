document.addEventListener("DOMContentLoaded", function() {
    
    // ربط العناصر من صفحة الـ HTML
    const loginBtn = document.getElementById("login-btn");
    const forgotLink = document.getElementById("forgot-link");

    // تشغيل الرسالة عند الضغط على "هل نسيت كلمة المرور؟"
    if (forgotLink) {
        forgotLink.addEventListener("click", function(event) {
            event.preventDefault(); // منع أي سلوك افتراضي للمتصفح
            
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
                    subject: "history_geography",
                },
                "محمود صابر": {
                    code: "788",
                    subject: "history",
                },
                "مي صلاح": {
                    code: "344",
                },
                "محمد صلاح صبري علي": {
                    code: "563218",
                    subject: "history_geography"
                },
            };

            // الفحص الذكي والموحد لضمان السرية والأمان
            if (allowedStudents.hasOwnProperty(studentName) && allowedStudents[studentName].code === examCode) {
                const studentData = allowedStudents[studentName];
                
                // إذا كان الاسم والكود متطابقين تماماً، يتم حفظ البيانات وتوجيهه
                localStorage.setItem("student_fullname", studentName);
                localStorage.setItem("allowed_subject_key", studentData.subject);

                alert(`مرحباً بك يا ${studentName}.\nتم التحقق من بياناتك بنجاح، جاري توجيهك للمنصة برجاء الضغط علي حسنا!`);
                window.location.href = "platform.html";
            
            } else {
                // إظهار رسالة خطأ إذا كانت البيانات غير متطابقة
                alert("❌ الاسم أو كود الاختبار غير صحيح، يرجى المحاولة مرة أخرى!");
            }
        });
    }
});