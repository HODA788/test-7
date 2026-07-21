 document.addEventListener("DOMContentLoaded", function() {
        
    const loginBtn = document.getElementById("login-btn");
    const forgotLink = document.getElementById("forgot-link");

    // دالة إظهار التحذيرات والرسائل
    function showMessage(text, type) {
        let msgBox = document.getElementById("custom-alert-msg");
        if (!msgBox) return;

        msgBox.innerText = text;
        msgBox.style.display = "block";

        if (type === "error") {
            msgBox.style.backgroundColor = "rgba(255, 0, 0, 0.15)";
            msgBox.style.color = "#ff4d4d";
            msgBox.style.border = "1px solid rgba(255, 0, 0, 0.3)";
        } else if (type === "success") {
            msgBox.style.backgroundColor = "rgba(0, 255, 0, 0.15)";
            msgBox.style.color = "#25d366"; 
            msgBox.style.border = "1px solid rgba(0, 255, 0, 0.3)";
        }
    }

    // عند الضغط على نسيت كود الاختبار
    if (forgotLink) {
        forgotLink.addEventListener("click", function(e) {
            e.preventDefault();
            
            // 1. إظهار رسالة التنبيه المباشرة
            showMessage("⚠️ نسيت الكود؟ يرجى التواصل مع الدعم الفني للحصول عليه!", "error");

            // 2. إظهار / إخفاء صندوق معلومات التواصل
            var info = document.getElementById("support-message");
            if (info) {
                info.style.display = (info.style.display === "block") ? "none" : "block";
            }
        });
    }

    // عند الضغط على زر دخول المنصة
    if (loginBtn) {
        loginBtn.addEventListener("click", function() {
            
            const studentNameInput = document.getElementById("login-name");
            const parentPhoneInput = document.getElementById("parent-phone");
            const examCodeInput = document.getElementById("login-pass");

            const studentName = studentNameInput ? studentNameInput.value.trim() : "";
            const parentPhone = parentPhoneInput ? parentPhoneInput.value.trim() : "";
            const examCode = examCodeInput ? examCodeInput.value.trim() : "";

            // التحقق والتحذير في حالة الحقول الفارغة
            if (studentName === "") {
                showMessage("⚠️ يرجى كتابة اسمك الرباعي أولاً!", "error");
                return;
            }
            
            if (parentPhone === "") {
                showMessage("⚠️ يرجى إدخال رقم ولي الأمر (إجباري)! ", "error");
                return;
            }

            if (parentPhone.length < 10 || isNaN(parentPhone)) {
                showMessage("⚠️ يرجى إدخال رقم هاتف صحيح لولي الأمر!", "error");
                return;
            }

            if (examCode === "") {
                showMessage("⚠️ يرجى إدخال كود الاختبار!", "error");
                return;
            }

            // قائمة الطلاب المعترف بهم
            const allowedStudents = {
                "محمد علي": { code: "455", subject: "history_geography" },
                "محمود صابر": { code: "788", subject: "history" },
                "مي صلاح": { code: "344", subject: "geography" },
                "محمد صلاح صبري علي": { code: "563218", subject: "history_geography" }
            };

            // التحقق وإرسال البيانات
            if (allowedStudents.hasOwnProperty(studentName) && allowedStudents[studentName].code === examCode) {
                const studentData = allowedStudents[studentName];
                
                localStorage.setItem("student_fullname", studentName);
                localStorage.setItem("parent_phone", parentPhone);
                localStorage.setItem("allowed_subject_key", studentData.subject);

                showMessage(`مرحباً بك يا ${studentName} ✅\nتم تسجيل دخولك، جاري تحويلك للمنصة...`, "success");

                fetch("https://formspree.io/f/mojodlvd", {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        "اسم الطالب": studentName,
                        "رقم ولي الأمر": parentPhone,
                        "كود الاختبار": examCode,
                        "وقت الدخول": new Date().toLocaleString("ar-EG")
                    })
                }).finally(() => {
                    setTimeout(function() {
                        window.location.href = "platform.html";
                    }, 1500);
                });

            } else {
                showMessage("❌ الاسم أو كود الاختبار غير صحيح، يرجى التأكد وإعادة المحاولة!", "error");
            }
        });
    }
});