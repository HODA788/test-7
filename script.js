const formspreeUrl = "https://formspree.io/f/mojodlvd"; 
const EXAM_DURATION_MINUTES = 1; 

// --- متغيرات الحالة (State) ---
let timeLeft = EXAM_DURATION_MINUTES * 60; 
let timerInterval;
let currentActiveSubject = ""; 
let currentActiveType = "exam"; 
let activeQuestionsList = [];
let currentSubjectVersion = 1; 

// 🔔 دالة إظهار التنبيهات المخصصة داخل الصفحة بدلاً من alert 🔔
function showCustomToast(message, type = 'error') {
    let toast = document.getElementById('custom-toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'custom-toast-notification';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 9999;
            padding: 12px 25px;
            border-radius: 12px;
            font-weight: bold;
            font-size: 1rem;
            text-align: center;
            box-shadow: 0 10px 25px rgba(0,0,0,0.4);
            transition: all 0.4s ease;
            backdrop-filter: blur(10px);
            color: #fff;
            min-width: 290px;
            max-width: 90%;
            display: none;
            opacity: 0;
            direction: rtl;
        `;
        document.body.appendChild(toast);
    }

    if (type === 'success') {
        toast.style.background = 'rgba(46, 204, 113, 0.95)';
        toast.style.border = '1px solid #2ecc71';
        toast.style.color = '#fff';
    } else if (type === 'warning') {
        toast.style.background = 'rgba(241, 196, 15, 0.95)';
        toast.style.border = '1px solid #f1c40f';
        toast.style.color = '#111';
    } else { // error
        toast.style.background = 'rgba(231, 76, 60, 0.95)';
        toast.style.border = '1px solid #e74c3c';
        toast.style.color = '#fff';
    }

    toast.innerHTML = message;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.opacity = '1'; }, 10);

    clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => { toast.style.display = 'none'; }, 400);
    }, 3500);
}

// --- ⚙️ قاعدة بيانات درجات وتقارير الطلاب ⚙️ ---
const studentsResultsDatabase = {
    "محمد علي": {
        "3445": { date: "12/07/2026", scoreOutOf10: 9.0, examName: "امتحان التاريخ - الشهر الأول", stage: "الصف الثالث الإعدادي" },
        "STU-101-ARAB": { date: "13/07/2026", scoreOutOf10: 8.0, examName: "امتحان اللغة العربية - الشهر الأول", stage: "الصف الثاني الإعدادي" }
    },
    "محمود صابر": {
        "677": { date: "11/07/2026", scoreOutOf10: 5.5, examName: "امتحان اللغة العربية - الشهر الأول", stage: "الصف الثاني الإعدادي" }
    },
    "مي صلاح": {
        "STU-103-GEO": { date: "10/07/2026", scoreOutOf10: 9.5, examName: "امتحان الجغرافيا - الشهر الأول", stage: "الصف الثالث الإعدادي" }
    },
    "محمد": {
        "77": { date: "10/07/2026", scoreOutOf10: 10, examName: "الاختبار القصير الأول", stage: "الصف الثالث الإعدادي" }
    },
    "محمود علي رفعت علي": {
        "STU-105-MATH": { date: "10/07/2026", scoreOutOf10: 6.0, examName: "الاختبار القصير الأول", stage: "الصف الثاني الإعدادي" }
    },
    "صلاح محمود علي علي": {
        "STU-106-SCI": { date: "10/07/2026", scoreOutOf10: 8.5, examName: "امتحان الشهر الأول الشامل", stage: "الصف الثالث الإعدادي" }
    },
    "صلاح محمود": {
        "3452": { date: "10/07/2026", scoreOutOf10: 9, examName: "امتحان الشهر الأول الشامل", stage: "الصف الثالث الإعدادي" }
    },
};

// --- 📝 قاعدة بيانات الأسئلة والأكواد المتاحة للحل 📝 ---
const examsDatabase = {
    "history_geography": {
        version: 80, 
        questions: [
            { 
                section: "history", 
                type: "choice", 
                question: "أمامك خريطة صماء للوطن العربي، ما اسم المضيق المشار إليه بالرقم (1)؟", 
                imageUrl: "https://i.postimg.cc/8CyY8vmz/images.jpg", 
                options: ["مضيق هرمز", "مضيق باب المندب", "مضيق جبل طارق"], 
                correctAnswer: "مضيق جبل طارق", 
                points: 2 
            }
        ]
    },
    "STU-101-ARAB": {
        version: 67, 
        questions: [
            { 
                section: "grammar", 
                type: "choice", 
                question: "الحالة الإعرابية الدائمة للمبتدأ والخبر في الجملة الاسمية المجردة هي:", 
                imageUrl: "", 
                options: ["الرفع", "النصب", "الجر"], 
                correctAnswer: "الرفع", 
                points: 2 
            }
        ]
    }
};

function isExamFinished(subjectKey, type) {
    const db = (type === "exam") ? examsDatabase : homeworksDatabase;
    if (!db || !db[subjectKey]) return false;
    const currentVer = db[subjectKey].version.toString().trim(); 
    const savedVer = localStorage.getItem('finished_' + subjectKey); 
    return savedVer && savedVer === currentVer;
}

window.onload = function() {
    const allowedSubject = localStorage.getItem("allowed_subject_key");
    const savedName = localStorage.getItem('student_fullname');

    if (!savedName || !allowedSubject) {
        showCustomToast("⚠️ أمن المنصة: يرجى تسجيل الدخول أولاً!", "error");
        setTimeout(() => { window.location.href = "login.html"; }, 2000);
        return;
    }

    const displayElement = document.getElementById('user-display-name');
    if (displayElement) {
        displayElement.textContent = "أهلاً: " + savedName;
    }

    createTimerBannerElement();
    updateExamButtonsStatus();
    // تم إلغاء توليد لوحة الأوائل تلقائياً عند فتح الصفحة
};

function createTimerBannerElement() {
    if (document.getElementById('timer-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'timer-banner';
    banner.style.cssText = "position: fixed; top: 10px; left: 50%; transform: translateX(-50%); background: #e74c3c; color: white; padding: 10px 20px; border-radius: 20px; font-weight: bold; z-index: 2000; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: none; text-align: center; direction: ltr;";
    banner.innerHTML = "Time Left: <span id='timer-display'>15:00</span>";
    document.body.appendChild(banner);
}

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
    if (score >= 9) return "امتياز ";
    if (score >= 8) return "جيد جداً ";
    if (score >= 6) return "جيد ";
    if (score >= 5) return "مقبول ";
    return "راسب (يرجى التواصل مع المعلم أو الدعم الفني) 📚";
}

// 🔍 دالة البحث عن نتيجة الطالب (وتوليد لوحة الأوائل بعدها حصراً) 🔍
function checkStudentResult() {
    const studentName = document.getElementById("search-student-name").value.trim();
    const examCode = document.getElementById("search-exam-code").value.trim().toUpperCase();
    const displayBox = document.getElementById("result-display-box");

    if (studentName === "" || examCode === "") {
        showCustomToast("⚠️ يرجى إدخال البيانات المطلوبة للاستعلام!", "warning");
        return;
    }

    if (studentsResultsDatabase[studentName] && studentsResultsDatabase[studentName][examCode]) {
        const res = studentsResultsDatabase[studentName][examCode];
        const percentage = (res.scoreOutOf10 / 10) * 100;
        const grade = calculateGrade(res.scoreOutOf10);
        const examDisplayName = res.examName ? res.examName : examCode;
        const currentStudentStage = res.stage || "غير محدد";

        let allScoresInThisStage = [];
        
        for (const name in studentsResultsDatabase) {
            for (const code in studentsResultsDatabase[name]) {
                const record = studentsResultsDatabase[name][code];
                if (record.stage === currentStudentStage) {
                    allScoresInThisStage.push(record.scoreOutOf10);
                }
            }
        }
        
        allScoresInThisStage.sort((a, b) => b - a);
        
        const studentRank = allScoresInThisStage.indexOf(res.scoreOutOf10) + 1;
        const totalStudentsInStage = allScoresInThisStage.length;

        displayBox.style.display = "block";
        displayBox.innerHTML = `
            <h4 style="color: #00d2ff; text-align: center; margin-bottom: 12px; font-weight: bold;">📜 بيان الدرجات المعتمد</h4>
            <p><strong>👤 الاسم:</strong> ${studentName}</p>
            <p><strong>🏫 الصف الدراسي:</strong> <span style="color:#00d2ff; font-weight:bold;">${currentStudentStage}</span></p>
            <p><strong>📖 المادة / نوع الامتحان:</strong> ${examDisplayName}</p>
            <p><strong>🔑 كود الاختبار الخاص:</strong> ${examCode}</p>
            <p><strong>📅 تاريخ الأداء:</strong> ${res.date}</p>
            <hr style="border:0; border-top:1px solid rgba(255,255,255,0.2); margin:10px 0;">
            <p style="font-size:1.1rem;"><strong>🎯 الدرجة المكتسبة:</strong> <span style="color:#2ecc71; font-weight:bold;">${res.scoreOutOf10} من 10</span></p>
            <p><strong>📈 النسبة المئوية:</strong> ${percentage}%</p>
            <p><strong>🏅 التقدير العام:</strong> <span style="color:#f1c40f; font-weight:bold;">${grade}</span></p>
            <p><strong>🏆 الترتيب التلقائي:</strong> <span style="color:#e74c3c; font-weight:bold;">المركز ( ${studentRank} )</span> من أصل ${totalStudentsInStage} طلاب في ${currentStudentStage}</p>
        `;

        // 🌟 إظهار لوحة الأوائل فقط بعد ظهور نتيجة الطالب بنجاح 🌟
        generateHonorRoll();

    } else {
        displayBox.style.display = "block";
        displayBox.innerHTML = `<p style="color:#e74c3c; text-align:center; font-weight:bold; margin:0;">❌ عذراً، لم نتمكن من العثور على نتيجة مطابقة. تأكد من الاسم والكود المكتوبين.</p>`;
        
        // إخفاء لوحة الأوائل في حالة عدم العثور على النتيجة
        const oldHonorRoll = document.getElementById("honor-roll-container");
        if (oldHonorRoll) oldHonorRoll.remove();
    }
}

function generateHonorRoll() {
    let resultsSection = document.getElementById("results-section");
    if (!resultsSection) return;

    const oldHonorRoll = document.getElementById("honor-roll-container");
    if (oldHonorRoll) oldHonorRoll.remove();

    let stagesData = {};

    for (const studentName in studentsResultsDatabase) {
        for (const examCode in studentsResultsDatabase[studentName]) {
            const record = studentsResultsDatabase[studentName][examCode];
            const stage = record.stage || "غير محدد";

            if (!stagesData[stage]) {
                stagesData[stage] = [];
            }

            let existingStudent = stagesData[stage].find(s => s.name === studentName);
            if (existingStudent) {
                if (record.scoreOutOf10 > existingStudent.score) {
                    existingStudent.score = record.scoreOutOf10;
                }
            } else {
                stagesData[stage].push({
                    name: studentName,
                    score: record.scoreOutOf10
                });
            }
        }
    }

    let honorRollHTML = `
        <div id="honor-roll-container" class="honor-roll-animate" style="margin-top: 30px; padding: 20px; background: rgba(255, 255, 255, 0.05); border: 2px solid #f1c40f; border-radius: 10px; box-shadow: 0 4px 15px rgba(241, 196, 15, 0.2);">
            <h3 style="color: #f1c40f; text-align: center; font-weight: bold; margin-bottom: 20px;">🏆 لوحة شرف أوائل الطلاب 🏆</h3>
    `;

    let delayCounter = 0;

    for (const stageName in stagesData) {
        stagesData[stageName].sort((a, b) => b.score - a.score);

        honorRollHTML += `
            <div style="margin-bottom: 20px;">
                <h5 style="color: #00d2ff; border-bottom: 1px dashed rgba(255,255,255,0.3); padding-bottom: 5px; font-weight: bold;">🥇 أوائل ${stageName}</h5>
                <ul style="list-style: none; padding: 0; margin: 10px 0;">
        `;

        const topStudents = stagesData[stageName].slice(0, 3);
        topStudents.forEach((student, index) => {
            let medal = index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉";
            let currentDelay = 0.3 + (delayCounter * 0.2);
            delayCounter++;

            honorRollHTML += `
                <li class="student-item-animate" style="animation-delay: ${currentDelay}s; padding: 8px 12px; background: rgba(255,255,255,0.03); margin-bottom: 5px; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
                    <span>${medal} <strong>${student.name}</strong></span>
                    <span style="color: #2ecc71; font-weight: bold;">الدرجة: ${student.score} / 10</span>
                </li>
            `;
        });

        honorRollHTML += `
                </ul>
            </div>
        `;
    }

    honorRollHTML += `</div>`;
    resultsSection.insertAdjacentHTML('beforeend', honorRollHTML);
}

function switchTab(tab) {
    if (window.isExamRunning) {
        showCustomToast("⚠️ عذراً! لا يمكنك التنقل أثناء أداء الامتحان.", "warning");
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
        showCustomToast("⚠️ عذراً، أنت قمت بأداء هذه النسخة مسبقاً!", "warning");
        return; 
    }

    const db = (cleanType === "exam") ? examsDatabase : homeworksDatabase;
    if (!db || !db[cleanSubjectKey]) {
        showCustomToast(`⚠️ تنبيه: الكود الممرر "${cleanSubjectKey}" غير موجود في قاعدة البيانات حالياً.`, "warning");
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

function startExamActual() {
    document.getElementById('portal-modal').style.display = 'none';
    document.getElementById('quiz-wrapper-box').style.display = 'block';
    
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.style.display = 'none'; 
    
    if(document.getElementById('exams-section')) document.getElementById('exams-section').style.display = 'none';
    if(document.getElementById('homework-section')) document.getElementById('homework-section').style.display = 'none';
    if(document.getElementById('results-section')) document.getElementById('results-section').style.display = 'none';
    
    window.isExamRunning = true; 

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
        
        if (q.imageUrl && q.imageUrl.trim() !== "") {
            html += `
            <div style="margin-bottom: 15px; text-align:center;">
                <img src="${q.imageUrl}" style="width:100%; max-width:450px; height:auto; border-radius:5px; display:inline-block; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
            </div>`;
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
            showCustomToast("⏰ انتهى الوقت المحدد! سيتم تسليم الإجابات تلقائياً.", "warning");
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
        showCustomToast(`⚠️ يرجى الإجابة على جميع الأسئلة أولاً! راجع سؤال رقم (${firstUnansweredIndex + 1}).`, "warning");
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
            showCustomToast("✅ تم استلام إجاباتك بنجاح وسيتم مراجعتها. بالتوفيق!", "success");
            window.isExamRunning = false; 
            setTimeout(() => { window.location.reload(); }, 2500);
        } else {
            showCustomToast("❌ حدث خطأ في الخادم أثناء تسليم الامتحان.", "error"); 
            submitBtn.disabled = false; submitBtn.innerText = "تسليم الإجابات";
        }
    })
    .catch(() => {
        showCustomToast("❌ حدث خطأ في الاتصال بالإنترنت.", "error"); 
        submitBtn.disabled = false; submitBtn.innerText = "تسليم الإجابات";
    });
}