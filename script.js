document.addEventListener('DOMContentLoaded', () => {
    // Элементы интерфейса
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    const closeBtn = document.getElementById('closeBtn');
    
    const themeSelect = document.getElementById('themeSelect');
    const customColorsGroup = document.getElementById('customColors');
    const bgColorPicker = document.getElementById('bgColorPicker');
    const textColorPicker = document.getElementById('textColorPicker');
    
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValue = document.getElementById('volumeValue');

    // ==========================================
    // 1. ОТКРЫТИЕ И ЗАКРЫТИЕ НАСТРОЕК (С ШЕСТЕРЁНКОЙ)
    // ==========================================
    
    const openSettings = () => {
        settingsPanel.classList.add('open');
        settingsBtn.classList.add('hide-gear'); // Плавное исчезновение шестерёнки
    };

    const closeSettings = () => {
        settingsPanel.classList.remove('open');
        settingsBtn.classList.remove('hide-gear'); // Плавное возвращение шестерёнки
    };

    settingsBtn.addEventListener('click', openSettings);
    closeBtn.addEventListener('click', closeSettings);

    // Закрытие панели при клике в любое другое место экрана
    document.addEventListener('click', (e) => {
        if (!settingsPanel.contains(e.target) && !settingsBtn.contains(e.target) && settingsPanel.classList.contains('open')) {
            closeSettings();
        }
    });

    // ==========================================
    // 2. УПРАВЛЕНИЕ УЛУЧШЕННЫМИ ТЕМАМИ
    // ==========================================
    
    const applyTheme = (theme, customBg = null, customText = null) => {
        // Чистим старые инлайн-стили, чтобы убрать следы кастомных цветов
        document.documentElement.removeAttribute('style');
        
        if (theme === 'custom') {
            customColorsGroup.classList.remove('hidden');
            document.documentElement.setAttribute('data-theme', 'custom');
            
            const bg = customBg || bgColorPicker.value;
            const text = customText || textColorPicker.value;
            
            // Для кастомной темы переопределяем переменные напрямую (включая замену градиента на чистый цвет)
            document.documentElement.style.setProperty('--bg-color', bg);
            document.documentElement.style.setProperty('--card-bg', adjustColorBrightness(bg, 8));
            document.documentElement.style.setProperty('--text-color', text);
            document.documentElement.style.setProperty('--border-color', adjustColorBrightness(bg, -10));
            
            bgColorPicker.value = bg;
            textColorPicker.value = text;
        } else {
            customColorsGroup.classList.add('hidden');
            document.documentElement.setAttribute('data-theme', theme);
        }
        
        localStorage.setItem('site-theme', theme);
    };

    // Слушатели для меню выбора и пикеров цветов
    themeSelect.addEventListener('change', (e) => applyTheme(e.target.value));
    
    bgColorPicker.addEventListener('input', () => {
        applyTheme('custom');
        localStorage.setItem('custom-bg-color', bgColorPicker.value);
    });

    textColorPicker.addEventListener('input', () => {
        applyTheme('custom');
        localStorage.setItem('custom-text-color', textColorPicker.value);
    });

    // Генератор подложки (карточки) для кастомного цвета (делает чуть темнее или светлее фона)
    function adjustColorBrightness(hex, percent) {
        let R = parseInt(hex.substring(1,3), 16);
        let G = parseInt(hex.substring(3,5), 16);
        let B = parseInt(hex.substring(5,7), 16);

        const brightness = (R * 299 + G * 587 + B * 114) / 1000;
        const direction = brightness > 128 ? -percent : percent;

        R = parseInt(R * (100 + direction) / 100);
        G = parseInt(G * (100 + direction) / 100);
        B = parseInt(B * (100 + direction) / 100);

        R = Math.min(255, Math.max(0, R));
        G = Math.min(255, Math.max(0, G));
        B = Math.min(255, Math.max(0, B));

        return `#${R.toString(16).padStart(2, '0')}${G.toString(16).padStart(2, '0')}${B.toString(16).padStart(2, '0')}`;
    }

    // ==========================================
    // 3. УПРАВЛЕНИЕ ПОЛЗУНКОМ ГРОМКОСТИ
    // ==========================================
    const updateVolume = (value) => {
        volumeSlider.value = value;
        volumeValue.textContent = `${value}%`;
        localStorage.setItem('site-volume', value);
    };

    volumeSlider.addEventListener('input', (e) => updateVolume(e.target.value));

    // ==========================================
    // 4. ИНИЦИАЛИЗАЦИЯ (ЗАГРУЗКА ПРИ СТАРТЕ)
    // ==========================================
    const savedTheme = localStorage.getItem('site-theme') || 'light';
    const savedBg = localStorage.getItem('custom-bg-color');
    const savedText = localStorage.getItem('custom-text-color');
    const savedVolume = localStorage.getItem('site-volume') || '50';

    themeSelect.value = savedTheme;
    applyTheme(savedTheme, savedBg, savedText);
    updateVolume(savedVolume);
});


