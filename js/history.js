// Система історії ігор та статистики

class GameHistory {
    constructor() {
        this.history = this.loadHistory();
        this.statistics = this.loadStatistics();
        this.achievements = this.loadAchievements();
        this.maxHistorySize = 1000; // Максимум записів в історії
    }

    // Завантаження історії з localStorage
    loadHistory() {
        try {
            const saved = localStorage.getItem('pidorasu_history');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.warn('Помилка завантаження історії:', error);
            return [];
        }
    }

    // Завантаження статистики
    loadStatistics() {
        try {
            const saved = localStorage.getItem('pidorasu_statistics');
            return saved ? JSON.parse(saved) : this.getDefaultStatistics();
        } catch (error) {
            console.warn('Помилка завантаження статистики:', error);
            return this.getDefaultStatistics();
        }
    }

    // Завантаження досягнень
    loadAchievements() {
        try {
            const saved = localStorage.getItem('pidorasu_achievements');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.warn('Помилка завантаження досягнень:', error);
            return [];
        }
    }

    // Початкова статистика
    getDefaultStatistics() {
        return {
            totalSpins: 0,
            totalWins: 0,
            totalLoses: 0,
            totalWinAmount: 0,
            totalBetAmount: 0,
            biggestWin: 0,
            longestWinStreak: 0,
            longestLoseStreak: 0,
            currentWinStreak: 0,
            currentLoseStreak: 0,
            totalBonuses: 0,
            totalFreeSpins: 0,
            totalPlayTime: 0,
            averageWinAmount: 0,
            winRatio: 0,
            rtp: 0, // Return to Player
            lastPlayed: null,
            sessionsCount: 0,
            favoriteSymbol: null,
            symbolStats: {}
        };
    }

    // Збереження даних
    saveHistory() {
        try {
            localStorage.setItem('pidorasu_history', JSON.stringify(this.history));
        } catch (error) {
            console.warn('Помилка збереження історії:', error);
        }
    }

    saveStatistics() {
        try {
            localStorage.setItem('pidorasu_statistics', JSON.stringify(this.statistics));
        } catch (error) {
            console.warn('Помилка збереження статистики:', error);
        }
    }

    saveAchievements() {
        try {
            localStorage.setItem('pidorasu_achievements', JSON.stringify(this.achievements));
        } catch (error) {
            console.warn('Помилка збереження досягнень:', error);
        }
    }

    // Додавання запису в історію
    addGameRecord(gameData) {
        const record = {
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            userId: gameData.userId,
            bet: gameData.bet,
            win: gameData.win,
            symbols: gameData.symbols,
            isWin: gameData.win > 0,
            isBonus: gameData.isBonus || false,
            freeSpinsUsed: gameData.freeSpinsUsed || 0,
            multiplier: gameData.multiplier || 1,
            winningLines: gameData.winningLines || [],
            balanceBefore: gameData.balanceBefore,
            balanceAfter: gameData.balanceAfter,
            sessionId: this.getCurrentSessionId()
        };

        this.history.unshift(record); // Додаємо на початок

        // Обмежуємо розмір історії
        if (this.history.length > this.maxHistorySize) {
            this.history = this.history.slice(0, this.maxHistorySize);
        }

        this.saveHistory();
        this.updateStatistics(record);
        this.checkAchievements(record);

        return record;
    }

    // Оновлення статистики
    updateStatistics(record) {
        const stats = this.statistics;
        
        // Основні лічильники
        stats.totalSpins++;
        stats.totalBetAmount += record.bet;
        stats.lastPlayed = record.timestamp;

        if (record.isWin) {
            stats.totalWins++;
            stats.totalWinAmount += record.win;
            stats.currentWinStreak++;
            stats.currentLoseStreak = 0;
            
            if (stats.currentWinStreak > stats.longestWinStreak) {
                stats.longestWinStreak = stats.currentWinStreak;
            }
            
            if (record.win > stats.biggestWin) {
                stats.biggestWin = record.win;
            }
        } else {
            stats.totalLoses++;
            stats.currentLoseStreak++;
            stats.currentWinStreak = 0;
            
            if (stats.currentLoseStreak > stats.longestLoseStreak) {
                stats.longestLoseStreak = stats.currentLoseStreak;
            }
        }

        // Бонуси
        if (record.isBonus) {
            stats.totalBonuses++;
        }

        if (record.freeSpinsUsed > 0) {
            stats.totalFreeSpins += record.freeSpinsUsed;
        }

        // Розрахунок середніх значень
        stats.averageWinAmount = stats.totalWins > 0 ? (stats.totalWinAmount / stats.totalWins) : 0;
        stats.winRatio = stats.totalSpins > 0 ? (stats.totalWins / stats.totalSpins) : 0;
        stats.rtp = stats.totalBetAmount > 0 ? (stats.totalWinAmount / stats.totalBetAmount) : 0;

        // Статистика символів
        if (record.symbols) {
            record.symbols.flat().forEach(symbol => {
                if (symbol && symbol.name) {
                    if (!stats.symbolStats[symbol.name]) {
                        stats.symbolStats[symbol.name] = 0;
                    }
                    stats.symbolStats[symbol.name]++;
                }
            });

            // Знаходимо улюблений символ
            let maxCount = 0;
            for (const [symbolName, count] of Object.entries(stats.symbolStats)) {
                if (count > maxCount) {
                    maxCount = count;
                    stats.favoriteSymbol = symbolName;
                }
            }
        }

        this.saveStatistics();
    }

    // Перевірка досягнень
    checkAchievements(record) {
        const newAchievements = [];

        // Перший виграш
        if (record.isWin && !this.hasAchievement('first_win')) {
            newAchievements.push(this.unlockAchievement('first_win'));
        }

        // Великий виграш
        if (record.win >= 100 && !this.hasAchievement('big_win')) {
            newAchievements.push(this.unlockAchievement('big_win'));
        }

        // Мисливець за бонусами
        if (this.statistics.totalBonuses >= 10 && !this.hasAchievement('bonus_hunter')) {
            newAchievements.push(this.unlockAchievement('bonus_hunter'));
        }

        // Щасливчик (7 виграшів поспіль)
        if (this.statistics.currentWinStreak >= 7 && !this.hasAchievement('lucky_seven')) {
            newAchievements.push(this.unlockAchievement('lucky_seven'));
        }

        // Марафонець (1000 спінів)
        if (this.statistics.totalSpins >= 1000 && !this.hasAchievement('marathon')) {
            newAchievements.push(this.unlockAchievement('marathon'));
        }

        // Показуємо нові досягнення
        newAchievements.forEach(achievement => {
            this.showAchievementNotification(achievement);
        });
    }

    // Розблокування досягнення
    unlockAchievement(achievementId) {
        const achievementData = GameConfig.analytics.achievements.find(a => a.id === achievementId);
        if (!achievementData) return null;

        const achievement = {
            ...achievementData,
            unlockedAt: new Date().toISOString(),
            userId: authSystem.getCurrentUser()?.id
        };

        this.achievements.push(achievement);
        this.saveAchievements();

        return achievement;
    }

    // Перевірка чи є досягнення
    hasAchievement(achievementId) {
        return this.achievements.some(a => a.id === achievementId);
    }

    // Показ нотифікації про досягнення
    showAchievementNotification(achievement) {
        if (!achievement) return;

        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-content">
                <div class="achievement-icon">🏆</div>
                <div class="achievement-text">
                    <h4>Досягнення розблоковано!</h4>
                    <p><strong>${achievement.name}</strong></p>
                    <p>${achievement.description}</p>
                </div>
            </div>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
            color: white;
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(251, 191, 36, 0.5);
            z-index: 10000;
            animation: achievementShow 3s ease-out forwards;
            max-width: 300px;
            text-align: center;
        `;

        // Додаємо CSS анімацію
        if (!document.querySelector('#achievement-styles')) {
            const styles = document.createElement('style');
            styles.id = 'achievement-styles';
            styles.textContent = `
                @keyframes achievementShow {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                    20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                    30% { transform: translate(-50%, -50%) scale(1); }
                    90% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
                }
                .achievement-content {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                .achievement-icon {
                    font-size: 32px;
                }
                .achievement-text h4 {
                    margin: 0 0 5px 0;
                    font-size: 16px;
                }
                .achievement-text p {
                    margin: 2px 0;
                    font-size: 14px;
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Видаляємо через 3 секунди
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // Отримання поточного ID сесії
    getCurrentSessionId() {
        let sessionId = sessionStorage.getItem('pidorasu_session');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('pidorasu_session', sessionId);
            this.statistics.sessionsCount++;
        }
        return sessionId;
    }

    // Отримання історії користувача
    getUserHistory(userId, limit = 50) {
        return this.history
            .filter(record => record.userId === userId)
            .slice(0, limit);
    }

    // Отримання статистики за період
    getStatisticsByPeriod(userId, days = 7) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const records = this.history.filter(record => 
            record.userId === userId && 
            new Date(record.timestamp) >= startDate
        );

        return {
            totalSpins: records.length,
            totalWins: records.filter(r => r.isWin).length,
            totalWinAmount: records.reduce((sum, r) => sum + r.win, 0),
            totalBetAmount: records.reduce((sum, r) => sum + r.bet, 0),
            biggestWin: Math.max(...records.map(r => r.win), 0),
            winRatio: records.length > 0 ? records.filter(r => r.isWin).length / records.length : 0
        };
    }

    // Експорт історії
    exportHistory(format = 'json') {
        const currentUser = authSystem.getCurrentUser();
        if (!currentUser) return null;

        const userHistory = this.getUserHistory(currentUser.id, this.history.length);
        const exportData = {
            user: {
                id: currentUser.id,
                name: currentUser.name
            },
            statistics: this.statistics,
            achievements: this.achievements,
            history: userHistory,
            exportDate: new Date().toISOString()
        };

        if (format === 'csv') {
            return this.convertToCSV(userHistory);
        }

        return JSON.stringify(exportData, null, 2);
    }

    // Конвертація в CSV
    convertToCSV(data) {
        if (!data.length) return '';

        const headers = ['Дата', 'Ставка', 'Виграш', 'Результат', 'Баланс до', 'Баланс після'];
        const rows = data.map(record => [
            new Date(record.timestamp).toLocaleString(),
            record.bet,
            record.win,
            record.isWin ? 'Виграш' : 'Програш',
            record.balanceBefore,
            record.balanceAfter
        ]);

        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }

    // Очищення старої історії
    clearOldHistory(days = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const oldCount = this.history.length;
        this.history = this.history.filter(record => 
            new Date(record.timestamp) >= cutoffDate
        );

        const removedCount = oldCount - this.history.length;
        if (removedCount > 0) {
            this.saveHistory();
            console.log(`Видалено ${removedCount} старих записів історії`);
        }

        return removedCount;
    }

    // Скидання всієї історії
    resetHistory() {
        this.history = [];
        this.statistics = this.getDefaultStatistics();
        this.achievements = [];
        
        this.saveHistory();
        this.saveStatistics();
        this.saveAchievements();
    }
}

// Глобальний екземпляр історії
let gameHistory;

// Ініціалізація системи історії
function initHistory() {
    gameHistory = new GameHistory();
}

// Функції для інтеграції з грою
function recordGameResult(gameData) {
    if (gameHistory) {
        return gameHistory.addGameRecord(gameData);
    }
}

function getPlayerStatistics() {
    if (gameHistory) {
        return gameHistory.statistics;
    }
    return null;
}

function getUserAchievements() {
    if (gameHistory) {
        return gameHistory.achievements;
    }
    return [];
}

// Ініціалізація при завантаженні
document.addEventListener('DOMContentLoaded', function() {
    initHistory();
});

// Експорт для використання в інших модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameHistory, recordGameResult, getPlayerStatistics, getUserAchievements };
}