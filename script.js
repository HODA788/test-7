const formspreeUrl = "https://formspree.io/f/mojodlvd"; 
const EXAM_DURATION_MINUTES = 15; 

// --- متغيرات الحالة (State) ---
let timeLeft = EXAM_DURATION_MINUTES * 60; 
let timerInterval;
let currentActiveSubject = ""; 
let currentActiveType = "exam"; 
let activeQuestionsList = [];
let currentSubjectVersion = 1; 

// --- ⚙️ قاعدة بيانات درجات وتقارير الطلاب ⚙️ ---
const studentsResultsDatabase = {
    "محمد علي": {
        "HIST100": { date: "12/07/2026", scoreOutOf10: 9.5 },
        "ARAB200": { date: "13/07/2026", scoreOutOf10: 8.0 }
    },
    "محمود صابر": {
        "ARAB200": { date: "11/07/2026", scoreOutOf10: 5.5 }
    },
    "مي صلاح": {
        "GEO300": { date: "10/07/2026", scoreOutOf10: 4.0 }
    }
};

// --- قاعدة بيانات الأسئلة (مفعلة ومتطابقة تماماً مع أزرار الـ HTML) ---
const examsDatabase = {
    "history_geography": {
        version: 28, 
        questions: [
            { section: "geography", type: "choice", question: "أمامك خريطة صماء للوطن العربي، ما اسم المضيق المشار إليه بالرقم (1)؟", imageUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600", options: ["مضيق هرمز", "مضيق باب المندب", "مضيق جبل طارق"], correctAnswer: "مضيق جبل طارق", points: 2 },
            { section: "history", type: "essay", question: "ما هي النتائج الاستراتيجية والعسكرية المترتبة على معركة أبو قير البحرية عام 1798؟", points: 5 }
        ]
    },
    "arabic_exam": {
        version: 4, 
        questions: [
            { section: "grammar", type: "choice", question: "الحالة الإعرابية الدائمة للمبتدأ والخبر في الجملة الاسمية المجردة هي:", options: ["الرفع", "النصب", "الجر"], correctAnswer: "الرفع", points: 2 }
        ]
    }
};

const homeworksDatabase = {
    "geo_homework_1": {
        version: 33,
        questions: [
            { section: "geography", type: "choice", question: "بالاستعانة بخريطة التضاريس، ما هي أعلى قمة جبلية في العالم؟", imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600", options: ["قمة إفرست", "قمة كليمنجارو"], correctAnswer: "قمة إفرست", points: 1 }
        ]
    }
};

function isExamFinished(subjectKey, type) {
    const db = (type === "exam") ? examsDatabase : homeworksDatabase;
    if (!db[subjectKey]) return false;
    const currentVer = db[subjectKey].version.toString().trim(); 
    const savedVer = localStorage.getItem('finished_' + subjectKey); 
    return savedVer && savedVer === currentVer;
}

// الفحص التلقائي والأمني عند التحميل
window.onload = function() {
    const allowedSubject = localStorage.getItem("allowed_subject_key");
    const savedName = localStorage.getItem('student_fullname');

    if (!savedName || !allowedSubject) {
        alert("⚠️ أمن المنصة: يرجى تسجيل الدخول أولاً باستخدام كود الاختبار الخاص بك!");
        window.location.href = "login.html";
        return;
    }

    const displayElement = document.getElementById('user-display-name');
    if (displayElement) {
        displayElement.textContent = "أهلاً: " + savedName;
    }

    createTimerBannerElement();
    updateExamButtonsStatus();
};

function createTimerBannerElement() {
    if (document.getElementById('timer-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'timer-banner';
    banner.style.cssText = "position: fixed; top: 10px; left: 50%; transform: translateX(-50%); background: #e74c3c; color: white; padding: 10px 20px; border-radius: 20px; font-weight: bold; z-index: 2000; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: none; text-align: center; direction: ltr;";
    banner.innerHTML = "Time Left: <span id='timer-display'>15:00</span>";
    document.body.appendChild(banner);
}

// تحديث وحظر الأزرار غير المصرح بها للكروت
function updateExamButtonsStatus() {
    const allowedSubject = localStorage.getItem("allowed_subject_key");
    const buttons = document.querySelectorAll('.main-content .btn');
    
    buttons.forEach(btn => {
        if (btn.classList.contains('btn-result-card')) return;

        const onClickAttr = btn.getAttribute('onclick');
        if (onClickAttr && onClickAttr.includes('resetPortalToStep1')) {
            const matches = onClickAttr.match(/'([^']+)'/g);
            if (matches && matches.length >= 2) {
                const subjectKey = matches[0].replace(/'/g, '').trim();
                const type = matches[1].replace(/'/g, '').trim();
                
                if (subjectKey !== allowedSubject) {
                    btn.style.background = "#7f8c8d";
                    btn.style.cursor = "not-allowed";
                    btn.disabled = true;
                    btn.innerHTML = "🔒 غير متاح لك";
                    btn.removeAttribute("onclick");
                    return;
                }

                if (isExamFinished(subjectKey, type)) {
                    btn.style.background = "#bdc3c7";
                    btn.style.cursor = "not-allowed";
                    btn.disabled = true;
                    btn.innerHTML = type === "exam" ? "🔒 تم أداء الامتحان" : "🔒 تم تسليم الواجب";
                } else {
                    btn.style.background = "#2ecc71"; 
                    btn.style.cursor = "pointer";
                    btn.disabled = false;
                    btn.innerHTML = type === "exam" ? "ابدأ الآن" : "ابدأ الحل";
                }
            }
        }
    });
}

function calculateGrade(score) {
    if (score >= 8.5) return "امتياز 🌟";
    if (score >= 7.5) return "جيد جداً 👑";
    if (score >= 6.5) return "جيد 👍";
    if (score >= 5.0) return "مقبول 👌";
    return "راسب (تحتاج مراجعة المادة) 📚";
}

function checkStudentResult() {
    const studentName = document.getElementById("search-student-name").value.trim();
    const examCode = document.getElementById("search-exam-code").value.trim().toUpperCase();
    const displayBox = document.getElementById("result-display-box");

    if (studentName === "" || examCode === "") {
        alert("⚠️ يرجى إدخال البيانات المطلوبة للاستعلام!");
        return;
    }

    if (studentsResultsDatabase[studentName] && studentsResultsDatabase[studentName][examCode]) {
        const res = studentsResultsDatabase[studentName][examCode];
        const percentage = (res.scoreOutOf10 / 10) * 100;
        const grade = calculateGrade(res.scoreOutOf10);

        displayBox.style.display = "block";
        displayBox.innerHTML = `
            <h4 style="color: #00d2ff; text-align: center; margin-bottom: 12px; font-weight: bold;">📜 بيان الدرجات المعتمد</h4>
            <p><strong>👤 الاسم:</strong> ${studentName}</p>
            <p><strong>🔑 كود الاختبار:</strong> ${examCode}</p>
            <p><strong>📅 تاريخ الأداء:</strong> ${res.date}</p>
            <hr style="border:0; border-top:1px solid rgba(255,255,255,0.2); margin:10px 0;">
            <p style="font-size:1.1rem;"><strong>🎯 الدرجة المكتسبة:</strong> <span style="color:#2ecc71; font-weight:bold;">${res.scoreOutOf10} من 10</span></p>
            <p><strong>📈 النسبة المئوية:</strong> ${percentage}%</p>
            <p><strong>🏅 التقدير العام:</strong> <span style="color:#f1c40f; font-weight:bold;">${grade}</span></p>
        `;
    } else {
        displayBox.style.display = "block";
        displayBox.innerHTML = `<p style="color:#e74c3c; text-align:center; font-weight:bold; margin:0;">❌ عذراً، لم نتمكن من العثور على نتيجة مطابقة. تأكد من الاسم والكود المكتوبين.</p>`;
    }
}

// التبديل بين الأقسام وحماية الطالب من المغادرة
function switchTab(tab) {
    if (window.isExamRunning) {
        alert("⚠️ عذراً! لا يمكنك التنقل أو مغادرة صفحة الامتحان حتى تقوم بتسليم الإجابات.");
        return;
    }

    const menuItems = document.querySelectorAll('.sidebar-menu li');
    menuItems.forEach(item => item.classList.remove('active'));
    
    if(document.getElementById('exams-section')) document.getElementById('exams-section').style.display = 'none';
    if(document.getElementById('homework-section')) document.getElementById('homework-section').style.display = 'none';
    if(document.getElementById('results-section')) document.getElementById('results-section').style.display = 'none';
    
    if (tab === 'exams') {
        document.getElementById('exams-section').style.display = 'block';
        if(menuItems[0]) menuItems[0].classList.add('active');
    } else if (tab === 'homework') {
        document.getElementById('homework-section').style.display = 'block';
        if(menuItems[1]) menuItems[1].classList.add('active');
    } else if (tab === 'results') {
        document.getElementById('results-section').style.display = 'block';
        if(menuItems[2]) menuItems[2].classList.add('active');
    }
}

function resetPortalToStep1(subjectKey, type) {
    const cleanSubjectKey = subjectKey.trim();
    const cleanType = type.trim();

    if (isExamFinished(cleanSubjectKey, cleanType)) {
        alert("⚠️ عذراً، أنت قمت بأداء هذه النسخة من الامتحان مسبقاً!");
        return; 
    }

    const db = (cleanType === "exam") ? examsDatabase : homeworksDatabase;
    if (!db[cleanSubjectKey]) {
        alert(`⚠️ تنبيه: الكود الممرر "${cleanSubjectKey}" غير موجود في قاعدة بيانات الجافا سكريبت حالياً.`);
        return;
    }

    currentActiveSubject = cleanSubjectKey;
    currentActiveType = cleanType;
    currentSubjectVersion = db[cleanSubjectKey].version; 
    activeQuestionsList = db[cleanSubjectKey].questions;

    document.getElementById('step-1').style.display = 'block';
    document.getElementById('step-2').style.display = 'none';
    document.getElementById('portal-modal').style.display = 'flex';
}

function showInstructionsPage() {
    document.getElementById('step-1').style.display = 'none';
    document.getElementById('step-2').style.display = 'block';
}

// لبدء الامتحان الفعلي وقفل شاشة المنصة تماماً خلف صندوق الحل
function startExamActual() {
    document.getElementById('portal-modal').style.display = 'none';
    document.getElementById('quiz-wrapper-box').style.display = 'block';
    
    // --- 🔒 كود القفل والحظر الشامل لمنع التقليب ---
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.style.display = 'none'; // إخفاء القائمة الجانبية تماماً
    
    // إخفاء كافة الأقسام التبادلية الخلفية لعدم تشتيت الطالب أو تمكينه من الرؤية
    if(document.getElementById('exams-section')) document.getElementById('exams-section').style.display = 'none';
    if(document.getElementById('homework-section')) document.getElementById('homework-section').style.display = 'none';
    if(document.getElementById('results-section')) document.getElementById('results-section').style.display = 'none';
    
    window.isExamRunning = true; // تفعيل جدار الحماية البرمجي
    // ---------------------------------------------

    renderQuestions();
    
    if (currentActiveType === "exam") {
        document.getElementById('timer-banner').style.display = 'block';
        timeLeft = EXAM_DURATION_MINUTES * 60;
        startTimer();
    } else {
        const timerBanner = document.getElementById('timer-banner');
        if (timerBanner) timerBanner.style.display = 'none';
    }
}

function renderQuestions() {
    const container = document.getElementById('questions-container');
    if (!container) return; 
    
    container.innerHTML = "<h3 style='text-align:right; margin-bottom:10px;'>أسئلة الاختبار</h3><hr style='margin-bottom:15px; opacity:0.2;'>"; 
    
    if (!activeQuestionsList || activeQuestionsList.length === 0) {
        container.innerHTML += "<p style='color:red; text-align:center;'>لا توجد أسئلة متوفرة حالياً.</p>";
        return;
    }

    activeQuestionsList.forEach((q, qIndex) => {
        let html = `<div id="block-q${qIndex}" class="question-block">`;
        if (q.imageUrl) {
            html += `<div style="margin-bottom: 15px; text-align:center;"><img src="${q.imageUrl}" style="max-width:100%; height:auto; border-radius:5px; max-height:200px;"></div>`;
        }
        html += `<p style="font-weight:bold; font-size:17px; margin-bottom:10px;">س${qIndex + 1}: ${q.question} <span style="color:red;">*</span></p>`;
        if (q.type === "choice") {
            q.options.forEach(opt => {
                html += `<label style="display:block; margin:6px 0; cursor:pointer;"><input type="radio" name="q${qIndex}" value="${opt}" style="margin-left:8px;"> ${opt}</label>`;
            });
        } else {
            html += `<textarea name="q${qIndex}" style="width:100%; height:80px; padding:10px; border-radius:5px; border:1px solid #ccc; resize:vertical;" placeholder="اكتب إجابتك المقالية هنا..."></textarea>`;
        }
        container.innerHTML += html + `</div>`;
    });
    document.getElementById('submit-btn').style.display = 'block';
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        let m = Math.floor(timeLeft / 60);
        let s = timeLeft % 60;
        const display = document.getElementById('timer-display');
        if (display) display.textContent = `${m}:${s < 10 ? '0'+s : s}`;
        if (--timeLeft < 0) { 
            clearInterval(timerInterval); 
            alert("⏰ انتهى الوقت المحدد! سيتم تسليم الإجابات تلقائياً.");
            calculateAndSend(true); 
        }
    }, 1000);
}

function calculateAndSend(bypassValidation = false) {
    let studentAnswers = {};
    let hasUnanswered = false;
    let firstUnansweredIndex = -1;
    let totalScoreObtained = 0;
    let maxChoiceScorePossible = 0;

    activeQuestionsList.forEach((_, idx) => {
        const block = document.getElementById(`block-q${idx}`);
        if (block) { block.style.background = "rgba(255,255,255,0.05)"; block.style.borderColor = "#3498db"; }
    });

    activeQuestionsList.forEach((q, qIndex) => {
        let questionKey = "س" + (qIndex + 1) + ": " + q.question;
        let answered = true;
        let value = "";
        let correctionStatus = "";

        if (q.type === "choice") {
            maxChoiceScorePossible += q.points;
            let selected = document.querySelector(`input[name="q${qIndex}"]:checked`);
            if (selected) {
                value = selected.value;
                if (value.trim() === q.correctAnswer.trim()) { totalScoreObtained += q.points; correctionStatus = ` [✅ إجابة صحيحة]`; }
                else { correctionStatus = ` [❌ خاطئة | النموذجية: ${q.correctAnswer}]`; }
            } else { answered = false; value = "لم يحل"; correctionStatus = ` [❌ لم يحل]`; }
        } else {
            let textarea = document.querySelector(`textarea[name="q${qIndex}"]`);
            if (textarea && textarea.value.trim() !== "") { value = textarea.value.trim(); } 
            else { answered = false; value = "لم يكتب إجابة"; }
            correctionStatus = ` [📝 مقالي من ${q.points} درجات]`;
        }

        if (!answered && !bypassValidation) {
            hasUnanswered = true; if (firstUnansweredIndex === -1) firstUnansweredIndex = qIndex;
            const block = document.getElementById(`block-q${qIndex}`);
            if (block) { block.style.background = "rgba(231, 76, 60, 0.2)"; block.style.borderColor = "#e74c3c"; }
        }
        studentAnswers[questionKey] = value + correctionStatus;
    });

    if (hasUnanswered && !bypassValidation) {
        alert(`⚠️ يرجى الإجابة على جميع الأسئلة أولاً! راجع سؤال رقم (${firstUnansweredIndex + 1}).`);
        document.getElementById(`block-q${firstUnansweredIndex}`).scrollIntoView({ behavior: 'smooth', block: 'center' });
        return; 
    }

    clearInterval(timerInterval);
    if (document.getElementById('timer-banner')) document.getElementById('timer-banner').style.display = 'none';

    let textMessage = `المادة: ${currentActiveSubject}\nالنوع: ${currentActiveType}\nالدرجة المبدئية: ${totalScoreObtained} من ${maxChoiceScorePossible}\n\nالإجابات:\n`;
    for (const [key, val] of Object.entries(studentAnswers)) { textMessage += `${key}\n الإجابة: ${val}\n-------------------\n`; }

    const formData = {
        "name": localStorage.getItem('student_fullname') || "طالب مجهول",
        "subject": "إجابات - " + (localStorage.getItem('student_fullname') || "طالب"),
        "message": textMessage,
        "date": new Date().toLocaleString('ar-EG')
    };

    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true; submitBtn.innerText = "جاري تسليم الإجابات...";

    fetch(formspreeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (response.ok) {
            localStorage.setItem('finished_' + currentActiveSubject, currentSubjectVersion.toString().trim());
            alert("✅ تم استلام إجاباتك بنجاح وسيقوم المعلم بمراجعتها. بالتوفيق!");
            window.isExamRunning = false; 
            window.location.reload();
        } else {
            alert("❌ حدث خطأ في الخادم."); submitBtn.disabled = false; submitBtn.innerText = "تسليم الإجابات";
        }
    })
    .catch(() => {
        alert("حدث خطأ في الاتصال بالإنترنت."); submitBtn.disabled = false; submitBtn.innerText = "تسليم الإجابات";
    });
}