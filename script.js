document.addEventListener('DOMContentLoaded', () => {
    // Поиск элементов интерфейса
    const settingsBtn = document.getElementById('settingsBtn');
    const modalOverlay = document.getElementById('modalOverlay');
    const closeBtn = document.getElementById('closeBtn');
    
    const themeSelect = document.getElementById('themeSelect');
    const customColorsGroup = document.getElementById('customColors');
    const bgColorPicker = document.getElementById('bgColorPicker');
    const textColorPicker = document.getElementById('textColorPicker');
    
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValue = document.getElementById('volumeValue');

    // ==========================================
    // 1. ОТКРЫТИЕ И ЗАКРЫТИЕ МОДАЛЬНОГО ОКНА TG
    // ==========================================
    
    const openSettings = () => {
        modalOverlay.classList.add('open');
        settingsBtn.classList.add('hide-menu'); // Скрываем бургер-кнопку
    };

    const closeSettings = () => {
        modalOverlay.classList.remove('open');
        settingsBtn.classList.remove('hide-menu'); // Возвращаем бургер-кнопку
    };

    // Слушатели кликов
    settingsBtn.addEventListener('click', openSettings);
    closeBtn.addEventListener('click', closeSettings);

    // Закрытие при клике по тёмному фону вокруг окна
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeSettings();
        }
    });

    // ==========================================
    // 2. СИСТЕМА ТЕМ ОФОРМЛЕНИЯ
    // ==========================================
    
    const applyTheme = (theme, customBg = null, customText = null) => {
        // Очищаем инлайн-стили для сброса предыдущих кастомных настроек
        document.documentElement.removeAttribute('style');
        
        if (theme === 'custom') {
            customColorsGroup.classList.remove('hidden');
            document.documentElement.setAttribute('data-theme', 'custom');
            
            const bg = customBg || bgColorPicker.value;
            const text = customText || textColorPicker.value;
            
            // Настройка кастомных переменных (цвета генерируются динамически)
            document.documentElement.style.setProperty('--bg-color', bg);
            document.documentElement.style.setProperty('--card-bg', adjustColorBrightness(bg, 6));
            document.documentElement.style.setProperty('--text-color', text);
            document.documentElement.style.setProperty('--border-color', adjustColorBrightness(bg, -12));
            document.documentElement.style.setProperty('--sub-text', adjustColorBrightness(text, 30));
            
            bgColorPicker.value = bg;
            textColorPicker.value = text;
        } else {
            customColorsGroup.classList.add('hidden');
            document.documentElement.setAttribute('data-theme', theme);
        }
        
        localStorage.setItem('site-theme', theme);
    };

    // Обработчики для выпадающего списка и палитры
    themeSelect.addEventListener('change', (e) => applyTheme(e.target.value));
    
    bgColorPicker.addEventListener('input', () => {
        applyTheme('custom');
        localStorage.setItem('custom-bg-color', bgColorPicker.value);
    });

    textColorPicker.addEventListener('input', () => {
        applyTheme('custom');
        localStorage.setItem('custom-text-color', textColorPicker.value);
    });

    // Вспомогательная функция умной генерации оттенков подложек под элементы
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
    // 3. РАБОТА С ПОЛЗУНКОМ ГРОМКОСТИ
    // ==========================================
    const updateVolume = (value) => {
        volumeSlider.value = value;
        volumeValue.textContent = `${value}%`;
        localStorage.setItem('site-volume', value);
    };

    volumeSlider.addEventListener('input', (e) => updateVolume(e.target.value));

    // ==========================================
    // 4. ЗАГРУЗКА ДАННЫХ ИЗ ХРАНИЛИЩА (LOCALSTORAGE)
    // ==========================================
    const savedTheme = localStorage.getItem('site-theme') || 'light';
    const savedBg = localStorage.getItem('custom-bg-color');
    const savedText = localStorage.getItem('custom-text-color');
    const savedVolume = localStorage.getItem('site-volume') || '50';

    themeSelect.value = savedTheme;
    applyTheme(savedTheme, savedBg, savedText);
    updateVolume(savedVolume);
});



