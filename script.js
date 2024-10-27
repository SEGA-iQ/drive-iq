// توكن البوت ورابط القناة
const botToken = "2094023494:AAEpX9YYAv0mWx5qR3a2HJV5g_r9XbTrjNo";
const chatId = "@segabaghdad"; // اسم القناة

// مستمع تقديم الطلب
document.getElementById('orderForm').addEventListener('submit', function (e) {
    e.preventDefault();
    handleOrderSubmission();
});

// دالة لمعالجة تقديم الطلب
function handleOrderSubmission() {
    const orderType = document.getElementById('orderType').value;
    const orderDetails = document.getElementById('orderDetails').value;
    const message = `طلب جديد:\nنوع الطلب: ${orderType}\nتفاصيل الطلب: ${orderDetails}`;

    // إرسال الطلب إلى Telegram
    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
        }),
    })
    .then(response => {
        if (response.ok) {
            showSuccessMessage("تم إرسال الطلب بنجاح!");
            document.getElementById('orderForm').reset(); // إعادة تعيين النموذج
        } else {
            throw new Error('فشل في إرسال الطلب.');
        }
    })
    .catch(error => {
        showErrorMessage("فشل في إرسال الطلب. يرجى المحاولة مرة أخرى.");
    });
}

// دالة لعرض رسالة النجاح
function showSuccessMessage(message) {
    const successMessageDiv = document.getElementById("successMessage");
    successMessageDiv.textContent = message;
    successMessageDiv.style.display = "block";
    document.getElementById("errorMessage").style.display = "none"; // إخفاء رسالة الخطأ
}

// دالة لعرض رسالة الفشل
function showErrorMessage(message) {
    const errorMessageDiv = document.getElementById("errorMessage");
    errorMessageDiv.textContent = message;
    errorMessageDiv.style.display = "block";
    document.getElementById("successMessage").style.display = "none"; // إخفاء رسالة النجاح
}
