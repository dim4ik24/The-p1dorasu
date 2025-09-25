// Система звукових ефектів для слот-гри

class SoundSystem {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.volume = 0.5;
        this.isMuted = false;
        this.initialized = false;
        
        this.soundFiles = {
            'main': 'sounds/song_main.mp3',
            'bonus': 'sounds/song_bonus.mp3',
            'symbol': 'sounds/song_symbol.mp3',
            'bone': 'sounds/song_bone.mp3',
            'spin': null, // Генеруватимемо програмно
            'win': null,  // Генеруватимемо програмно
            'click': null // Генеруватимемо програмно
        };
    }

    // Ініціалізація Web Audio API
    async initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Резюмуємо контекст якщо він suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            this.initialized = true;
            await this.loadSounds();
            this.playBackgroundMusic();
        } catch (error) {
            console.warn('Web Audio API не підтримується:', error);
            this.fallbackToHTMLAudio();
        }
    }

    // Fallback до HTML Audio API
    fallbackToHTMLAudio() {
        this.useHTMLAudio = true;
        this.sounds = {};
        
        // Створюємо HTML audio елементи
        Object.keys(this.soundFiles).forEach(key => {
            if (this.soundFiles[key]) {
                const audio = new Audio(this.soundFiles[key]);
                audio.volume = this.volume;
                audio.preload = 'auto';
                this.sounds[key] = audio;
            }
        });
        
        this.initialized = true;
        this.playBackgroundMusic();
    }

    // Завантаження звукових файлів
    async loadSounds() {
        const loadPromises = Object.entries(this.soundFiles).map(async ([key, url]) => {
            if (url) {
                try {
                    const response = await fetch(url);
                    const arrayBuffer = await response.arrayBuffer();
                    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                    this.sounds[key] = audioBuffer;
                } catch (error) {
                    console.warn(`Не вдалося завантажити звук ${key}:`, error);
                    // Генеруємо простий звук для заміни
                    this.sounds[key] = this.generateSimpleSound(key);
                }
            } else {
                // Генеруємо програмні звуки
                this.sounds[key] = this.generateSimpleSound(key);
            }
        });

        await Promise.all(loadPromises);
    }

    // Генерація простих звуків програмно
    generateSimpleSound(type) {
        if (!this.audioContext) return null;

        const sampleRate = this.audioContext.sampleRate;
        let duration, frequency, waveType;

        switch (type) {
            case 'spin':
                duration = 0.5;
                frequency = 200;
                waveType = 'sawtooth';
                break;
            case 'win':
                duration = 1.0;
                frequency = 523; // До
                waveType = 'sine';
                break;
            case 'click':
                duration = 0.1;
                frequency = 800;
                waveType = 'square';
                break;
            default:
                duration = 0.3;
                frequency = 440;
                waveType = 'sine';
        }

        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const channelData = buffer.getChannelData(0);

        for (let i = 0; i < channelData.length; i++) {
            const t = i / sampleRate;
            let value = 0;

            switch (waveType) {
                case 'sine':
                    value = Math.sin(2 * Math.PI * frequency * t);
                    break;
                case 'square':
                    value = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
                    break;
                case 'sawtooth':
                    value = 2 * (t * frequency % 1) - 1;
                    break;
            }

            // Застосовуємо енвелоп для плавного затухання
            const envelope = Math.max(0, 1 - (t / duration));
            channelData[i] = value * envelope * 0.3; // Зменшуємо гучність
        }

        return buffer;
    }

    // Програвання звуку
    playSound(soundKey, options = {}) {
        if (!this.initialized || this.isMuted) return;

        const sound = this.sounds[soundKey];
        if (!sound) {
            console.warn(`Звук ${soundKey} не знайдено`);
            return;
        }

        if (this.useHTMLAudio) {
            // Використовуємо HTML Audio
            const audio = sound.cloneNode ? sound.cloneNode() : sound;
            audio.volume = (options.volume || 1) * this.volume;
            audio.currentTime = 0;
            
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn('Помилка програвання звуку:', error);
                });
            }
        } else {
            // Використовуємо Web Audio API
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = sound;
            gainNode.gain.value = (options.volume || 1) * this.volume;
            
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            source.start(0);
        }
    }

    // Програвання фонової музики
    playBackgroundMusic() {
        if (this.sounds.main && !this.backgroundMusicPlaying) {
            this.backgroundMusicPlaying = true;
            
            if (this.useHTMLAudio) {
                const audio = this.sounds.main;
                audio.loop = true;
                audio.volume = this.volume * 0.3; // Тиша фонова музика
                
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.warn('Не вдалося запустити фонову музику:', error);
                        this.backgroundMusicPlaying = false;
                    });
                }
            }
        }
    }

    // Зупинка фонової музики
    stopBackgroundMusic() {
        this.backgroundMusicPlaying = false;
        
        if (this.useHTMLAudio && this.sounds.main) {
            this.sounds.main.pause();
            this.sounds.main.currentTime = 0;
        }
    }

    // Встановлення гучності
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        
        if (this.useHTMLAudio) {
            Object.values(this.sounds).forEach(audio => {
                if (audio instanceof HTMLAudioElement) {
                    audio.volume = this.volume;
                }
            });
        }
    }

    // Вимкнення/увімкнення звуку
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.isMuted) {
            this.stopBackgroundMusic();
        } else {
            this.playBackgroundMusic();
        }
        
        return !this.isMuted;
    }

    // Отримання стану звуку
    isSoundEnabled() {
        return this.initialized && !this.isMuted;
    }
}

// Глобальна система звуків
let soundSystem;

// Ініціалізація звукової системи
function initSounds() {
    soundSystem = new SoundSystem();
    
    // Ініціалізуємо при першому користувацькому жесті
    document.addEventListener('click', initAudioOnFirstClick, { once: true });
    document.addEventListener('keydown', initAudioOnFirstClick, { once: true });
    document.addEventListener('touchstart', initAudioOnFirstClick, { once: true });
}

// Ініціалізація аудіо при першому кліку (через policy browsers)
async function initAudioOnFirstClick() {
    if (!soundSystem.initialized) {
        await soundSystem.initAudioContext();
    }
}

// Глобальна функція для програвання звуків
function playSound(soundKey, options = {}) {
    if (soundSystem) {
        soundSystem.playSound(soundKey, options);
    }
}

// Функція для встановлення гучності
function setSoundVolume(volume) {
    if (soundSystem) {
        soundSystem.setVolume(volume);
    }
}

// Функція для перемикання звуку
function toggleSoundMute() {
    if (soundSystem) {
        return soundSystem.toggleMute();
    }
    return false;
}

// Додаткові звукові ефекти для UI
function playUISound(type) {
    switch (type) {
        case 'button':
            playSound('click', { volume: 0.5 });
            break;
        case 'win':
            playSound('win', { volume: 0.8 });
            break;
        case 'bonus':
            playSound('bonus', { volume: 1.0 });
            break;
        case 'spin':
            playSound('spin', { volume: 0.6 });
            break;
        default:
            playSound('click', { volume: 0.3 });
    }
}

// Додавання звукових ефектів до кнопок
document.addEventListener('DOMContentLoaded', function() {
    // Додаємо звуки до всіх кнопок
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            if (soundSystem && soundSystem.isSoundEnabled()) {
                playUISound('button');
            }
        });
    });

    // Спеціальні звуки для деяких кнопок
    const spinBtn = document.getElementById('spinBtn');
    if (spinBtn) {
        spinBtn.addEventListener('click', () => {
            if (soundSystem && soundSystem.isSoundEnabled()) {
                playUISound('spin');
            }
        });
    }
});

// Автоматична ініціалізація звуків при завантаженні
window.addEventListener('load', function() {
    // Невелика затримка для кращої сумісності
    setTimeout(initSounds, 100);
});

// Звукові ефекти для різних подій гри
const GameSounds = {
    // Звук при спіні
    spin() {
        playSound('spin');
    },

    // Звук при виграші
    win(amount) {
        if (amount > 100) {
            playSound('bonus'); // Великий виграш
        } else {
            playSound('win'); // Звичайний виграш
        }
    },

    // Звук бонусу
    bonus() {
        playSound('bonus');
    },

    // Звук при появі спеціального символу
    specialSymbol() {
        playSound('symbol');
    },

    // Звук при появі кістки
    boneSymbol() {
        playSound('bone');
    },

    // Звук кнопки
    button() {
        playUISound('button');
    }
};

// Експорт для використання в інших модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SoundSystem,
        playSound,
        setSoundVolume,
        toggleSoundMute,
        playUISound,
        GameSounds
    };
}