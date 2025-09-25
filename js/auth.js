// Система авторизації та управління користувачами

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
    }

    // Завантаження користувачів з localStorage
    loadUsers() {
        const users = localStorage.getItem('slotGameUsers');
        return users ? JSON.parse(users) : {};
    }

    // Збереження користувачів в localStorage
    saveUsers() {
        localStorage.setItem('slotGameUsers', JSON.stringify(this.users));
    }

    // Генерація унікального ID
    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Валідація email
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Валідація Telegram username
    validateTelegram(username) {
        if (!username) return false;
        // Видаляємо @ якщо є
        username = username.replace('@', '');
        // Перевіряємо чи правильний формат
        const re = /^[a-zA-Z0-9_]{5,32}$/;
        return re.test(username);
    }

    // Створення нового користувача
    createUser(userData) {
        const userId = this.generateUserId();
        const user = {
            id: userId,
            name: userData.name,
            email: userData.email || null,
            telegram: userData.telegram || null,
            password: userData.password || null,
            balance: 100, // Початковий бонус
            freeSpins: 5, // Початкові фріспіни
            totalWins: 0,
            totalLoses: 0,
            lastLogin: new Date().toISOString(),
            registerDate: new Date().toISOString(),
            isActive: true
        };

        this.users[userId] = user;
        this.saveUsers();
        return user;
    }

    // Реєстрація через email
    registerWithEmail(name, email, password) {
        // Валідація
        if (!name || name.length < 2) {
            throw new Error('Ім\'я повинно містити мінімум 2 символи');
        }

        if (!this.validateEmail(email)) {
            throw new Error('Невірний формат email');
        }

        if (!password || password.length < 6) {
            throw new Error('Пароль повинен містити мінімум 6 символів');
        }

        // Перевірка чи email вже використовується
        const existingUser = Object.values(this.users).find(user => user.email === email);
        if (existingUser) {
            throw new Error('Користувач з таким email вже існує');
        }

        // Створення користувача
        const user = this.createUser({
            name: name,
            email: email,
            password: password
        });

        return user;
    }

    // Реєстрація через Telegram
    registerWithTelegram(name, telegram) {
        // Валідація
        if (!name || name.length < 2) {
            throw new Error('Ім\'я повинно містити мінімум 2 символи');
        }

        if (!this.validateTelegram(telegram)) {
            throw new Error('Невірний формат Telegram username');
        }

        // Очищаємо username
        telegram = telegram.replace('@', '');

        // Перевірка чи Telegram вже використовується
        const existingUser = Object.values(this.users).find(user => user.telegram === telegram);
        if (existingUser) {
            throw new Error('Користувач з таким Telegram вже існує');
        }

        // Створення користувача
        const user = this.createUser({
            name: name,
            telegram: telegram
        });

        return user;
    }

    // Логін через email
    loginWithEmail(email, password) {
        if (!this.validateEmail(email)) {
            throw new Error('Невірний формат email');
        }

        const user = Object.values(this.users).find(user => user.email === email);
        if (!user) {
            throw new Error('Користувача з таким email не знайдено');
        }

        if (user.password !== password) {
            throw new Error('Невірний пароль');
        }

        if (!user.isActive) {
            throw new Error('Акаунт заблоковано');
        }

        // Оновлюємо дату останнього входу
        user.lastLogin = new Date().toISOString();
        this.saveUsers();

        return user;
    }

    // Логін через Telegram
    loginWithTelegram(telegram) {
        if (!this.validateTelegram(telegram)) {
            throw new Error('Невірний формат Telegram username');
        }

        // Очищаємо username
        telegram = telegram.replace('@', '');

        const user = Object.values(this.users).find(user => user.telegram === telegram);
        if (!user) {
            throw new Error('Користувача з таким Telegram не знайдено');
        }

        if (!user.isActive) {
            throw new Error('Акаунт заблоковано');
        }

        // Оновлюємо дату останнього входу
        user.lastLogin = new Date().toISOString();
        this.saveUsers();

        return user;
    }

    // Встановлення поточного користувача
    setCurrentUser(user) {
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
    }

    // Отримання поточного користувача
    getCurrentUser() {
        if (!this.currentUser) {
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
            }
        }
        return this.currentUser;
    }

    // Оновлення балансу користувача
    updateUserBalance(userId, newBalance) {
        if (this.users[userId]) {
            this.users[userId].balance = newBalance;
            this.saveUsers();
            
            // Оновлюємо поточного користувача якщо це він
            if (this.currentUser && this.currentUser.id === userId) {
                this.currentUser.balance = newBalance;
                this.setCurrentUser(this.currentUser);
            }
        }
    }

    // Оновлення фріспінів користувача
    updateUserFreeSpins(userId, newFreeSpins) {
        if (this.users[userId]) {
            this.users[userId].freeSpins = newFreeSpins;
            this.saveUsers();
            
            // Оновлюємо поточного користувача якщо це він
            if (this.currentUser && this.currentUser.id === userId) {
                this.currentUser.freeSpins = newFreeSpins;
                this.setCurrentUser(this.currentUser);
            }
        }
    }

    // Додавання депозиту
    addDeposit(userId, amount) {
        if (this.users[userId] && amount > 0) {
            this.users[userId].balance += amount;
            this.saveUsers();
            
            // Оновлюємо поточного користувача якщо це він
            if (this.currentUser && this.currentUser.id === userId) {
                this.currentUser.balance += amount;
                this.setCurrentUser(this.currentUser);
            }
            
            return this.users[userId].balance;
        }
        return false;
    }

    // Вихід з системи
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
    }

    // Перевірка чи користувач залогінений
    isLoggedIn() {
        return this.getCurrentUser() !== null;
    }
}

// Ініціалізація системи авторизації
const authSystem = new AuthSystem();

// Функції для UI
function switchTab(tabName) {
    // Перемикання табів
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });

    if (tabName === 'login') {
        document.querySelector('.auth-tab').classList.add('active');
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.querySelectorAll('.auth-tab')[1].classList.add('active');
        document.getElementById('registerForm').classList.add('active');
    }
}

// Реєстрація користувача через email
function registerUser() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;

    try {
        const user = authSystem.registerWithEmail(name, email, password);
        authSystem.setCurrentUser(user);
        showSuccessMessage('Реєстрація успішна! Ласкаво просимо до гри!');
        hideAuthModal();
        showGameContainer();
    } catch (error) {
        showErrorMessage(error.message);
    }
}

// Реєстрація користувача через Telegram
function registerTelegram() {
    const name = document.getElementById('regName').value.trim();
    const telegram = document.getElementById('regTelegram').value.trim();

    try {
        const user = authSystem.registerWithTelegram(name, telegram);
        authSystem.setCurrentUser(user);
        showSuccessMessage('Реєстрація успішна! Ласкаво просимо до гри!');
        hideAuthModal();
        showGameContainer();
    } catch (error) {
        showErrorMessage(error.message);
    }
}

// Логін користувача через email
function loginUser() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
        const user = authSystem.loginWithEmail(email, password);
        authSystem.setCurrentUser(user);
        showSuccessMessage('Вхід успішний! Ласкаво просимо назад!');
        hideAuthModal();
        showGameContainer();
    } catch (error) {
        showErrorMessage(error.message);
    }
}

// Логін користувача через Telegram
function loginTelegram() {
    const telegram = document.getElementById('loginTelegram').value.trim();

    try {
        const user = authSystem.loginWithTelegram(telegram);
        authSystem.setCurrentUser(user);
        showSuccessMessage('Вхід успішний! Ласкаво просимо назад!');
        hideAuthModal();
        showGameContainer();
    } catch (error) {
        showErrorMessage(error.message);
    }
}

// Вихід з системи
function logout() {
    authSystem.logout();
    showAuthModal();
    hideGameContainer();
    showSuccessMessage('Ви успішно вийшли з системи');
}

// Показати модалку авторизації
function showAuthModal() {
    document.getElementById('authModal').style.display = 'flex';
}

// Сховати модалку авторизації
function hideAuthModal() {
    document.getElementById('authModal').style.display = 'none';
}

// Показати контейнер гри
function showGameContainer() {
    document.getElementById('gameContainer').style.display = 'block';
    updateUserInfo();
}

// Сховати контейнер гри
function hideGameContainer() {
    document.getElementById('gameContainer').style.display = 'none';
}

// Оновити інформацію про користувача в UI
function updateUserInfo() {
    const user = authSystem.getCurrentUser();
    if (user) {
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userBalance').textContent = user.balance.toFixed(2);
        document.getElementById('freeSpins').textContent = user.freeSpins;
    }
}

// Показати повідомлення про помилку
function showErrorMessage(message) {
    // Створюємо тимчасове повідомлення
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(239, 68, 68, 0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    // Видаляємо через 3 секунди
    setTimeout(() => {
        errorDiv.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 300);
    }, 3000);
}

// Показати повідомлення про успіх
function showSuccessMessage(message) {
    // Створюємо тимчасове повідомлення
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(16, 185, 129, 0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    
    // Видаляємо через 3 секунди
    setTimeout(() => {
        successDiv.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 300);
    }, 3000);
}

// CSS для анімацій повідомлень
const messageStyles = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;

// Додаємо стилі до документа
const styleSheet = document.createElement('style');
styleSheet.textContent = messageStyles;
document.head.appendChild(styleSheet);

// Ініціалізація при завантаженні
function initAuth() {
    // Перевіряємо чи користувач вже залогінений
    if (authSystem.isLoggedIn()) {
        hideAuthModal();
        showGameContainer();
    } else {
        showAuthModal();
        hideGameContainer();
    }
}

// Обробники Enter для форм
document.addEventListener('DOMContentLoaded', function() {
    // Enter для форми логіну
    const loginInputs = ['loginEmail', 'loginPassword'];
    loginInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    loginUser();
                }
            });
        }
    });

    // Enter для Telegram логіну
    const telegramLoginInput = document.getElementById('loginTelegram');
    if (telegramLoginInput) {
        telegramLoginInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                loginTelegram();
            }
        });
    }

    // Enter для форми реєстрації
    const regInputs = ['regName', 'regEmail', 'regPassword'];
    regInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    registerUser();
                }
            });
        }
    });

    // Enter для Telegram реєстрації
    const telegramRegInput = document.getElementById('regTelegram');
    if (telegramRegInput) {
        telegramRegInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                registerTelegram();
            }
        });
    }
});