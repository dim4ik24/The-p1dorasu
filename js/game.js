// СЛОТ-ГРА ЯК THE DOG HOUSE - БЕЗ ЛАГІВ

class SlotGame {
    constructor() {
        // Символи як в The Dog House
        this.symbols = [
            { name: 'symbol-a', value: 5, probability: 0.25 },
            { name: 'symbol-10', value: 5, probability: 0.20 },
            { name: 'symbol-j', value: 8, probability: 0.18 },
            { name: 'symbol-k', value: 8, probability: 0.15 },
            { name: 'symbol-q', value: 12, probability: 0.10 },
            { name: 'symbol-dog1', value: 20, probability: 0.05 },
            { name: 'symbol-dog2', value: 30, probability: 0.03 },
            { name: 'symbol-dog3', value: 50, probability: 0.02 },
            { name: 'symbol-dog4', value: 100, probability: 0.01 },
            { name: 'symbol-bone', value: 0, probability: 0.01 } // Скаттер
        ];

        this.reels = [[], [], [], [], []];
        this.currentBet = 1;
        this.minBet = 1;
        this.maxBet = 100;
        this.isSpinning = false;
        this.autoSpinCount = 0;
        this.isAutoSpinning = false;
        this.soundEnabled = true;

        // PAYLINES ЯК В THE DOG HOUSE (спрощено але ефективно)
        this.paylines = [
            [1,1,1,1,1], // Середня лінія
            [0,0,0,0,0], // Верхня лінія
            [2,2,2,2,2], // Нижня лінія
            [0,1,2,1,0], // V-форма
            [2,1,0,1,2], // ^-форма
            [1,0,1,0,1], // Зигзаг вгору
            [1,2,1,2,1], // Зигзаг вниз
            [0,0,1,0,0], // Піку вгору
            [2,2,1,2,2], // Піку вниз
            [0,1,1,1,0], // Трапеція верх
            [2,1,1,1,2], // Трапеція низ
            [1,0,0,0,1], // W-форма
            [1,2,2,2,1], // M-форма
            [0,2,0,2,0], // Стрибки
            [2,0,2,0,2]  // Стрибки 2
        ];

        this.initGame();
    }

    initGame() {
        this.generateSymbols();
        this.updateBetDisplay();
        this.updateWinDisplay(0);
    }

    generateSymbols() {
        for (let reel = 0; reel < 5; reel++) {
            for (let row = 0; row < 3; row++) {
                const symbol = this.getRandomSymbol();
                this.reels[reel][row] = symbol;
                this.updateSymbolDisplay(reel, row, symbol);
            }
        }
    }

    getRandomSymbol() {
        const random = Math.random();
        let total = 0;

        for (const symbol of this.symbols) {
            total += symbol.probability;
            if (random <= total) {
                return symbol;
            }
        }
        return this.symbols[0];
    }

    updateSymbolDisplay(reel, row, symbol) {
        const element = document.querySelector(`#reel${reel + 1} .symbol:nth-child(${row + 1})`);
        if (element) {
            element.className = `symbol ${symbol.name}`;
            element.textContent = '';
        }
    }

    // ГОЛОВНА ФУНКЦІЯ СПІНУ - ОПТИМІЗОВАНА
    async spin() {
        if (this.isSpinning) return;

        const user = authSystem.getCurrentUser();
        if (!user) {
            showErrorMessage('Увійдіть в систему');
            return;
        }

        const isFreeSpin = user.freeSpins > 0;
        
        if (!isFreeSpin && user.balance < this.currentBet) {
            showErrorMessage('Недостатньо коштів');
            return;
        }

        this.isSpinning = true;
        this.disableSpinButton();

        // ШВИДКО списуємо кошти
        if (isFreeSpin) {
            authSystem.updateUserFreeSpins(user.id, user.freeSpins - 1);
        } else {
            authSystem.updateUserBalance(user.id, user.balance - this.currentBet);
        }
        updateUserInfo();

        // ОЧИЩАЄМО попередні анімації НЕГАЙНО
        this.clearAllWinAnimations();

        try {
            // Спін анімація
            await this.playSpinAnimation();
            
            // Генеруємо нові символи
            this.generateSymbols();
            
            // ШВИДКА перевірка виграшів
            const winResult = this.checkWins();
            
            // Якщо є виграш - показуємо анімацію
            if (winResult.totalWin > 0) {
                this.showWinAnimationFast(winResult.winningPositions);
                authSystem.updateUserBalance(user.id, user.balance + winResult.totalWin);
                
                if (this.soundEnabled) {
                    playSound(winResult.totalWin > 50 ? 'bonus' : 'win');
                }
            }

            // Перевірка скаттерів для бонусу
            if (winResult.scatterCount >= 3) {
                await this.triggerBonus(winResult.scatterCount);
            }

            this.updateWinDisplay(winResult.totalWin);
            updateUserInfo();

        } catch (error) {
            console.error('Помилка:', error);
        }

        this.isSpinning = false;
        this.enableSpinButton();
        this.handleAutoSpin();
    }

    // ШВИДКА АНІМАЦІЯ СПІНУ
    async playSpinAnimation() {
        const reels = document.querySelectorAll('.reel');
        
        // Запускаємо спін
        reels.forEach(reel => reel.classList.add('spinning'));
        
        if (this.soundEnabled) {
            playSound('spin');
        }

        // Зупиняємо барабани швидко
        const delays = [600, 700, 800, 900, 1000];
        
        delays.forEach((delay, index) => {
            setTimeout(() => {
                reels[index].classList.remove('spinning');
                reels[index].classList.add('stopping');
                
                setTimeout(() => {
                    reels[index].classList.remove('stopping');
                }, 200);
            }, delay);
        });

        // Чекаємо завершення
        await new Promise(resolve => setTimeout(resolve, 1200));
    }

    // ПРАВИЛЬНА ПЕРЕВІРКА ВИГРАШІВ ЯК В THE DOG HOUSE
    checkWins() {
        let totalWin = 0;
        let winningPositions = [];
        let scatterCount = 0;

        // Рахуємо скаттери
        for (let reel = 0; reel < 5; reel++) {
            for (let row = 0; row < 3; row++) {
                if (this.reels[reel][row].name === 'symbol-bone') {
                    scatterCount++;
                }
            }
        }

        // Перевіряємо всі paylines
        for (const line of this.paylines) {
            const symbols = line.map((row, reel) => this.reels[reel][row]);
            const win = this.checkLineWin(symbols);
            
            if (win.count >= 3 && win.symbolName !== 'symbol-bone') {
                totalWin += win.value * this.currentBet;
                
                // ДОДАЄМО ТІЛЬКИ ВИГРАШНІ ПОЗИЦІЇ
                for (let i = 0; i < win.count; i++) {
                    const pos = { reel: i, row: line[i], symbol: win.symbolName };
                    // Перевіряємо що позиція ще не додана
                    if (!winningPositions.some(p => p.reel === pos.reel && p.row === pos.row)) {
                        winningPositions.push(pos);
                    }
                }
            }
        }

        return { totalWin, winningPositions, scatterCount };
    }

    // ПЕРЕВІРКА ЛІНІЇ
    checkLineWin(symbols) {
        const firstSymbol = symbols[0];
        
        // Скаттери не рахуються в звичайних лініях
        if (firstSymbol.name === 'symbol-bone') {
            return { count: 0, value: 0, symbolName: firstSymbol.name };
        }

        let count = 1;
        for (let i = 1; i < symbols.length; i++) {
            if (symbols[i].name === firstSymbol.name) {
                count++;
            } else {
                break;
            }
        }

        if (count >= 3) {
            let multiplier = 1;
            if (count === 4) multiplier = 5;
            if (count === 5) multiplier = 25;
            
            return { 
                count, 
                value: firstSymbol.value * multiplier, 
                symbolName: firstSymbol.name 
            };
        }

        return { count: 0, value: 0, symbolName: firstSymbol.name };
    }

    // ШВИДКА АНІМАЦІЯ ВИГРАШУ - ТІЛЬКИ ВИГРАШНІ СИМВОЛИ
    showWinAnimationFast(winningPositions) {
        // ВАЖЛИВО: анімуємо ТІЛЬКИ виграшні символи
        winningPositions.forEach(pos => {
            const element = document.querySelector(`#reel${pos.reel + 1} .symbol:nth-child(${pos.row + 1})`);
            if (element) {
                element.classList.add('winning');
            }
        });

        // Створюємо частинки
        if (winningPositions.length > 0) {
            this.createParticlesFast();
        }

        // Прибираємо анімацію через 2 секунди
        setTimeout(() => {
            this.clearAllWinAnimations();
        }, 2000);
    }

    // ШВИДКІ ЧАСТИНКИ
    createParticlesFast() {
        const container = document.createElement('div');
        container.className = 'particles';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 999;
        `;
        document.body.appendChild(container);

        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: 8px;
                height: 8px;
                background: #fbbf24;
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: -10px;
                animation: particleDrop 2s linear forwards;
                animation-delay: ${Math.random() * 1}s;
            `;
            container.appendChild(particle);
        }

        // Додаємо CSS анімацію
        if (!document.getElementById('particles-style')) {
            const style = document.createElement('style');
            style.id = 'particles-style';
            style.textContent = `
                @keyframes particleDrop {
                    to { 
                        transform: translateY(100vh) rotate(360deg); 
                        opacity: 0; 
                    }
                }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => {
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
        }, 3000);
    }

    // ОЧИЩЕННЯ АНІМАЦІЙ
    clearAllWinAnimations() {
        document.querySelectorAll('.symbol.winning').forEach(el => {
            el.classList.remove('winning');
        });
        
        document.querySelectorAll('.particles').forEach(el => {
            if (el.parentNode) el.parentNode.removeChild(el);
        });
    }

    // БОНУС
    async triggerBonus(scatterCount) {
        if (this.soundEnabled) {
            playSound('bonus');
        }

        const user = authSystem.getCurrentUser();
        let freeSpins = 12;
        
        if (scatterCount === 4) freeSpins = 15;
        if (scatterCount === 5) freeSpins = 20;

        authSystem.updateUserFreeSpins(user.id, user.freeSpins + freeSpins);

        const modal = document.getElementById('bonusModal');
        const title = document.getElementById('bonusTitle');
        title.textContent = `${freeSpins} FREE SPINS`;
        modal.classList.add('show');

        setTimeout(() => {
            modal.classList.remove('show');
            updateUserInfo();
            showSuccessMessage(`Отримано ${freeSpins} фріспінів!`);
        }, 2500);
    }

    // UI КОНТРОЛЬ
    disableSpinButton() {
        const btn = document.getElementById('spinBtn');
        btn.disabled = true;
        btn.textContent = 'SPINNING...';
    }

    enableSpinButton() {
        const btn = document.getElementById('spinBtn');
        btn.disabled = false;
        btn.textContent = 'SPIN';
    }

    handleAutoSpin() {
        if (this.isAutoSpinning && this.autoSpinCount > 0) {
            this.autoSpinCount--;
            setTimeout(() => {
                if (this.isAutoSpinning) this.spin();
            }, 500); // Швидший автоспін
        } else if (this.autoSpinCount === 0) {
            this.stopAutoSpin();
        }
    }

    // СТАВКИ
    adjustBet(change) {
        if (this.isSpinning) return;

        this.currentBet += change;
        
        if (this.currentBet < this.minBet) this.currentBet = this.minBet;
        if (this.currentBet > this.maxBet) this.currentBet = this.maxBet;

        this.updateBetDisplay();
    }

    updateBetDisplay() {
        document.getElementById('currentBet').textContent = this.currentBet;
    }

    updateWinDisplay(amount) {
        document.getElementById('lastWin').textContent = amount.toFixed(2);
    }

    // АВТОСПІН
    toggleAutoSpin() {
        if (this.isAutoSpinning) {
            this.stopAutoSpin();
        } else {
            this.startAutoSpin();
        }
    }

    startAutoSpin() {
        const count = parseInt(document.getElementById('autoSpins').value) || 10;
        
        if (count <= 0) {
            showErrorMessage('Введіть кількість автоспінів');
            return;
        }

        this.isAutoSpinning = true;
        this.autoSpinCount = count;
        
        const btn = document.getElementById('autoBtn');
        btn.textContent = 'STOP';
        btn.classList.add('active');

        this.spin();
    }

    stopAutoSpin() {
        this.isAutoSpinning = false;
        this.autoSpinCount = 0;
        
        const btn = document.getElementById('autoBtn');
        btn.textContent = 'AUTO';
        btn.classList.remove('active');
    }

    // ЗВУК
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const btn = document.getElementById('soundBtn');
        btn.textContent = this.soundEnabled ? '🔊' : '🔇';
        
        showSuccessMessage(this.soundEnabled ? 'Звук увімкнено' : 'Звук вимкнено');
    }
}

// ІНІЦІАЛІЗАЦІЯ
let slotGame;

function initGame() {
    initAuth();
    slotGame = new SlotGame();
    initSounds();
}

// UI ФУНКЦІЇ
function adjustBet(change) {
    if (slotGame) slotGame.adjustBet(change);
}

function spin() {
    if (slotGame) slotGame.spin();
}

function toggleAutoSpin() {
    if (slotGame) slotGame.toggleAutoSpin();
}

function toggleSound() {
    if (slotGame) slotGame.toggleSound();
}

// МОДАЛЬНІ ВІКНА
function openSettings() {
    document.getElementById('settingsModal').classList.add('show');
}

function closeSettingsModal() {
    document.getElementById('settingsModal').classList.remove('show');
}

function openDepositModal() {
    document.getElementById('depositModal').classList.add('show');
}

function closeDepositModal() {
    document.getElementById('depositModal').classList.remove('show');
}

function openStatistics() {
    document.getElementById('statisticsModal').classList.add('show');
    updateStatisticsDisplay();
}

function closeStatisticsModal() {
    document.getElementById('statisticsModal').classList.remove('show');
}

// СТАТИСТИКА
function switchStatsTab(tabName) {
    document.querySelectorAll('.stats-section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.querySelectorAll('.stats-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`stats${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
    if (targetSection) {
        targetSection.classList.add('active');
        event.target.classList.add('active');
    }
    
    if (tabName === 'overview') updateStatisticsOverview();
    if (tabName === 'history') updateHistoryDisplay();
    if (tabName === 'achievements') updateAchievementsDisplay();
}

function updateStatisticsDisplay() {
    updateStatisticsOverview();
    updateHistoryDisplay();
    updateAchievementsDisplay();
}

function updateStatisticsOverview() {
    const stats = getPlayerStatistics ? getPlayerStatistics() : null;
    if (!stats) return;
    
    document.getElementById('statTotalSpins').textContent = stats.totalSpins || 0;
    document.getElementById('statWinRatio').textContent = ((stats.winRatio || 0) * 100).toFixed(1) + '%';
    document.getElementById('statBiggestWin').textContent = (stats.biggestWin || 0).toFixed(2);
    document.getElementById('statTotalBonuses').textContent = stats.totalBonuses || 0;
    document.getElementById('statWinStreak').textContent = stats.longestWinStreak || 0;
    document.getElementById('statRTP').textContent = ((stats.rtp || 0) * 100).toFixed(1) + '%';
}

function updateHistoryDisplay() {
    const historyList = document.getElementById('historyList');
    if (historyList) {
        historyList.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Історія ігор</div>';
    }
}

function updateAchievementsDisplay() {
    const achievementsList = document.getElementById('achievementsList');
    if (achievementsList) {
        achievementsList.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Досягнення</div>';
    }
}

function exportHistory() {
    showSuccessMessage('Експорт в розробці');
}

// ПОПОВНЕННЯ
function makeDeposit() {
    const amount = parseFloat(document.getElementById('depositAmount').value);
    
    if (!amount || amount <= 0) {
        showErrorMessage('Введіть суму');
        return;
    }

    if (amount > 10000) {
        showErrorMessage('Максимум 10,000');
        return;
    }

    const user = authSystem.getCurrentUser();
    if (!user) return;

    authSystem.addDeposit(user.id, amount);
    showSuccessMessage(`Поповнено на ${amount.toFixed(2)} грн`);
    updateUserInfo();
    closeDepositModal();
    document.getElementById('depositAmount').value = '';
}

// EVENT LISTENERS
document.addEventListener('DOMContentLoaded', function() {
    // Закриття модалок
    window.addEventListener('click', function(event) {
        ['settingsModal', 'depositModal', 'statisticsModal'].forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (event.target === modal) {
                modal.classList.remove('show');
            }
        });
    });

    // Enter для депозиту
    const depositInput = document.getElementById('depositAmount');
    if (depositInput) {
        depositInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') makeDeposit();
        });
    }
});

// КЛАВІШІ
document.addEventListener('keydown', function(event) {
    if (!authSystem.isLoggedIn() || !slotGame || slotGame.isSpinning) return;
    
    switch(event.code) {
        case 'Space':
            event.preventDefault();
            spin();
            break;
        case 'ArrowUp':
            event.preventDefault();
            adjustBet(1);
            break;
        case 'ArrowDown':
            event.preventDefault();
            adjustBet(-1);
            break;
    }
});