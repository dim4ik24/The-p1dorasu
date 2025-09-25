// Конфігурація гри "The Pidorasu"

const GameConfig = {
    // Основні налаштування гри
    game: {
        name: "The Pidorasu",
        version: "1.0.0",
        minBet: 1,
        maxBet: 100,
        defaultBet: 1,
        reelsCount: 5,
        rowsCount: 3,
        paylines: 3, // Горизонтальні лінії
        
        // RTP (Return to Player) - відсоток повернення гравцю
        rtp: 0.95, // 95%
        
        // Початкові бонуси
        welcomeBonus: {
            balance: 100,
            freeSpins: 5
        },
        
        // Бонус за реєстрацію
        registrationBonus: {
            balance: 50,
            freeSpins: 3
        }
    },

    // Налаштування символів збалансовані для The Dog House style
    symbols: [
        { 
            name: 'symbol-a', 
            value: 5, 
            probability: 0.20, // Збільшили ймовірність низьких символів
            type: 'low',
            description: 'Символ A'
        },
        { 
            name: 'symbol-10', 
            value: 5, 
            probability: 0.18,
            type: 'low',
            description: 'Символ 10'
        },
        { 
            name: 'symbol-j', 
            value: 8, 
            probability: 0.15,
            type: 'low',
            description: 'Символ J'
        },
        { 
            name: 'symbol-k', 
            value: 8, 
            probability: 0.15,
            type: 'low',
            description: 'Символ K'
        },
        { 
            name: 'symbol-q', 
            value: 12, 
            probability: 0.12,
            type: 'medium',
            description: 'Символ Q'
        },
        { 
            name: 'symbol-dog1', 
            value: 20, 
            probability: 0.08,
            type: 'medium',
            description: 'Собака 1'
        },
        { 
            name: 'symbol-dog2', 
            value: 30, 
            probability: 0.05,
            type: 'high',
            description: 'Собака 2'
        },
        { 
            name: 'symbol-dog3', 
            value: 50, 
            probability: 0.03,
            type: 'high',
            description: 'Собака 3'
        },
        { 
            name: 'symbol-dog4', 
            value: 100, 
            probability: 0.02,
            type: 'premium',
            description: 'Собака 4'
        },
        { 
            name: 'symbol-bone', 
            value: 0, // Скаттер не має звичайного виграшу
            probability: 0.02, // Менша ймовірність але все ще можлива
            type: 'scatter',
            description: 'Кістка (Скаттер)',
            isBonus: true,
            bonusRequirement: 3
        }
    ],

    // Множники як в The Dog House
    multipliers: {
        3: 1,   // 3 символи = x1
        4: 5,   // 4 символи = x5 (більший множник)
        5: 25   // 5 символів = x25 (значно більший)
    },

    // Налаштування бонусів
    bonus: {
        freeSpinsAwarded: 12,
        freeSpinsRetrigger: 5, // Додаткові фріспіни при повторному тригері
        maxFreeSpins: 50,      // Максимум фріспінів
        bonusMultiplier: 1,    // Множник під час бонусу
        
        // Прогресивний бонус
        progressive: {
            enabled: true,
            levels: [
                { spins: 100, bonus: 10 },   // 10 фріспінів за 100 спінів
                { spins: 500, bonus: 25 },   // 25 фріспінів за 500 спінів
                { spins: 1000, bonus: 50 }   // 50 фріспінів за 1000 спінів
            ]
        }
    },

    // Налаштування анімацій
    animations: {
        spinDuration: [1000, 1200, 1400, 1600, 1800], // Час спіну для кожного барабана
        winAnimationDuration: 2000,
        bonusAnimationDuration: 3000,
        symbolAnimationSpeed: 0.1, // секунди
        
        // Ефекти
        effects: {
            particles: true,
            screenShake: false,
            winGlow: true,
            bonusExplosion: true
        }
    },

    // Звукові налаштування
    audio: {
        enabled: true,
        volume: 0.5,
        backgroundMusic: true,
        backgroundVolume: 0.3,
        
        files: {
            main: 'sounds/song_main.mp3',
            bonus: 'sounds/song_bonus.mp3',
            symbol: 'sounds/song_symbol.mp3',
            bone: 'sounds/song_bone.mp3'
        },
        
        // Програмні звуки
        synthetic: {
            spin: { frequency: 200, duration: 0.5, waveType: 'sawtooth' },
            win: { frequency: 523, duration: 1.0, waveType: 'sine' },
            click: { frequency: 800, duration: 0.1, waveType: 'square' }
        }
    },

    // UI налаштування
    ui: {
        theme: 'default',
        showFPS: false,
        showDebugInfo: false,
        autoSaveInterval: 30000, // 30 секунд
        
        // Кольори теми
        colors: {
            primary: '#2a8cc8',
            secondary: '#fbbf24',
            success: '#10b981',
            danger: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        },
        
        // Розміри
        dimensions: {
            symbolSize: 60,
            mobileSymbolSize: 50,
            reelGap: 5,
            animationSpeed: 1
        }
    },

    // Налаштування збереження
    storage: {
        savePrefix: 'pidorasu_',
        autoSave: true,
        compression: false,
        encryption: false,
        
        // Що зберігати
        saveData: {
            users: true,
            gameHistory: true,
            statistics: true,
            settings: true
        }
    },

    // Налаштування безпеки
    security: {
        maxDepositAmount: 10000,
        minDepositAmount: 1,
        maxBetMultiplier: 10, // Максимум у скільки разів можна збільшити баланс за один спін
        
        // Антишахрайство
        antiFraud: {
            maxWinStreak: 10,     // Максимум виграшів поспіль
            suspiciousActivity: false,
            logTransactions: true
        }
    },

    // Статистика та аналітика
    analytics: {
        enabled: true,
        trackSpins: true,
        trackWins: true,
        trackBonuses: true,
        trackPlayTime: true,
        
        // Досягнення
        achievements: [
            { id: 'first_win', name: 'Перший виграш', description: 'Виграйте вперше' },
            { id: 'big_win', name: 'Великий виграш', description: 'Виграйте більше 100 монет' },
            { id: 'bonus_hunter', name: 'Мисливець за бонусами', description: 'Отримайте 10 бонусів' },
            { id: 'lucky_seven', name: 'Щасливчик', description: 'Виграйте 7 разів поспіль' },
            { id: 'marathon', name: 'Марафонець', description: 'Зробіть 1000 спінів' }
        ]
    },

    // Налаштування для розробки
    development: {
        debugMode: false,
        testMode: false,
        skipAnimations: false,
        fastSpin: false,
        
        // Чіти для тестування
        cheats: {
            alwaysWin: false,
            infiniteBalance: false,
            unlimitedFreeSpins: false
        }
    },

    // Мобільні налаштування
    mobile: {
        touchEnabled: true,
        hapticFeedback: false,
        orientationLock: false,
        fullscreenButton: true,
        
        // Адаптивність
        breakpoints: {
            mobile: 768,
            tablet: 1024,
            desktop: 1200
        }
    },

    // Локалізація
    localization: {
        defaultLanguage: 'uk',
        supportedLanguages: ['uk', 'en', 'ru'],
        
        translations: {
            uk: {
                welcome: 'Ласкаво просимо',
                spin: 'Спін',
                auto: 'Авто',
                balance: 'Баланс',
                bet: 'Ставка',
                win: 'Виграш',
                freeSpins: 'Фріспіни',
                bonus: 'Бонус',
                settings: 'Налаштування'
            }
        }
    }
};

// Функції для роботи з конфігурацією
const ConfigManager = {
    // Отримання значення з конфігурації
    get(path, defaultValue = null) {
        const keys = path.split('.');
        let value = GameConfig;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }
        
        return value;
    },

    // Встановлення значення в конфігурації
    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let current = GameConfig;
        
        for (const key of keys) {
            if (!(key in current)) {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[lastKey] = value;
        this.save();
    },

    // Збереження конфігурації
    save() {
        try {
            localStorage.setItem('pidorasu_config', JSON.stringify(GameConfig));
        } catch (error) {
            console.warn('Не вдалося зберегти конфігурацію:', error);
        }
    },

    // Завантаження конфігурації
    load() {
        try {
            const saved = localStorage.getItem('pidorasu_config');
            if (saved) {
                const savedConfig = JSON.parse(saved);
                Object.assign(GameConfig, savedConfig);
            }
        } catch (error) {
            console.warn('Не вдалося завантажити конфігурацію:', error);
        }
    },

    // Скидання до початкових налаштувань
    reset() {
        localStorage.removeItem('pidorasu_config');
        location.reload(); // Перезавантажуємо сторінку
    },

    // Експорт конфігурації
    export() {
        return JSON.stringify(GameConfig, null, 2);
    },

    // Імпорт конфігурації
    import(configString) {
        try {
            const newConfig = JSON.parse(configString);
            Object.assign(GameConfig, newConfig);
            this.save();
            return true;
        } catch (error) {
            console.error('Помилка імпорту конфігурації:', error);
            return false;
        }
    },

    // Валідація конфігурації
    validate() {
        const errors = [];
        
        // Перевіряємо основні поля
        if (!GameConfig.game || !GameConfig.game.name) {
            errors.push('Відсутня назва гри');
        }
        
        if (!GameConfig.symbols || !Array.isArray(GameConfig.symbols)) {
            errors.push('Відсутні або некоректні символи');
        }
        
        // Перевіряємо ймовірності символів
        if (GameConfig.symbols) {
            const totalProbability = GameConfig.symbols.reduce((sum, symbol) => sum + (symbol.probability || 0), 0);
            if (Math.abs(totalProbability - 1) > 0.01) {
                errors.push(`Сума ймовірностей символів має дорівнювати 1, а не ${totalProbability}`);
            }
        }
        
        return errors.length === 0 ? null : errors;
    }
};

// Ініціалізація конфігурації при завантаженні
document.addEventListener('DOMContentLoaded', function() {
    ConfigManager.load();
    
    const validationErrors = ConfigManager.validate();
    if (validationErrors) {
        console.warn('Помилки в конфігурації:', validationErrors);
    }
});

// Експорт для використання в інших модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameConfig, ConfigManager };
}