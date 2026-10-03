document.addEventListener('DOMContentLoaded', () => {
    // Находим все необходимые элементы на странице
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
    // 1. ЛОГИКА ОТКРЫТИЯ/ЗАКРЫТИЯ ПАНЕЛИ
    // ==========================================
    settingsBtn.addEventListener('click', () => {
        settingsPanel.classList.toggle('open');
    });

    closeBtn.addEventListener('click', () => {
        settingsPanel.classList.remove('open');
    });

    // Закрытие панели при клике вне её области
    document.addEventListener('click', (e) => {
        if (!settingsPanel.contains(e.target) && !settingsBtn.contains(e.target)) {
            settingsPanel.classList.remove('open');
        }
    });

    // ==========================================
    // 2. УПРАВЛЕНИЕ ТЕМАМИ ОФОРМЛЕНИЯ
    // ==========================================
    
    // Функция применения темы
    const applyTheme = (theme, customBg = null, customText = null) => {
        // Сбрасываем инлайн-стили, если они были установлены кастомной темой
        document.documentElement.removeAttribute('style');
        
        if (theme === 'custom') {
            // Показываем блок выбора цветов
            customColorsGroup.classList.remove('hidden');
            document.documentElement.setAttribute('data-theme', 'custom');
            
            // Берем цвета из пикеров или переданных аргументов
            const bg = customBg || bgColorPicker.value;
            const text = customText || textColorPicker.value;
            
            // Применяем кастомные цвета через CSS-переменные напрямую к тегу HTML
            document.documentElement.style.setProperty('--bg-color', bg);
            document.documentElement.style.setProperty('--card-bg', adjustColorBrightness(bg, 10)); // чуть светлее/темнее для карточек
            document.documentElement.style.setProperty('--text-color', text);
            
            // Синхронизируем инпуты цветов
            bgColorPicker.value = bg;
            textColorPicker.value = text;
        } else {
            // Прячем блок выбора цветов для светлой и тёмной тем
            customColorsGroup.classList.add('hidden');
            document.documentElement.setAttribute('data-theme', theme);
        }
        
        // Сохраняем выбор в localStorage
        localStorage.setItem('site-theme', theme);
    };

    // Слушатель изменения выпадающего списка
    themeSelect.addEventListener('change', (e) => {
        applyTheme(e.target.value);
    });

    // Слушатели изменения кастомных цветов
    bgColorPicker.addEventListener('input', () => {
        applyTheme('custom');
        localStorage.setItem('custom-bg-color', bgColorPicker.value);
    });

    textColorPicker.addEventListener('input', () => {
        applyTheme('custom');
        localStorage.setItem('custom-text-color', textColorPicker.value);
    });

    // Вспомогательная функция для генерации цвета карточки на основе кастомного фона
    function adjustColorBrightness(hex, percent) {
        let R = parseInt(hex.substring(1,3),16);
        let G = parseInt(hex.substring(3,5),16);
        let B = parseInt(hex.substring(5,7),16);

        // Определяем, темный фон или светлый, чтобы правильно сместить цвет карточки
        const brightness = (R * 299 + G * 587 + B * 114) / 1000;
        const direction = brightness > 128 ? -percent : percent;

        R = parseInt(R * (100 + direction) / 100);
        G = parseInt(G * (100 + direction) / 100);
        B = parseInt(B * (100 + direction) / 100);

        R = (R<255)?R:255; G = (G<255)?G:255; B = (B<255)?B:255;  
        R = (R>0)?R:0; G = (G>0)?G:0; B = (B>0)?B:0;

        const rHex = R.toString(16).padStart(2, '0');
        const gHex = G.toString(16).padStart(2, '0');
        const bHex = B.toString(16).padStart(2, '0');

        return `#${rHex}${gHex}${bHex}`;
    }

    // ==========================================
    // 3. ЛОГИКА ПОЛЗУНКА ГРОМКОСТИ
    // ==========================================
    const updateVolume = (value) => {
        volumeSlider.value = value;
        volumeValue.textContent = `${value}%`;
        localStorage.setItem('site-volume', value);
        
        // Здесь в будущем можно связать громкость с вашим аудио/видео плеером, например:
        // myAudioElement.volume = value / 100;
    };

    volumeSlider.addEventListener('input', (e) => {
        updateVolume(e.target.value);
    });

    // ==========================================
    // 4. ЗАГРУЗКА НАСТРОЕК ПРИ СТАРТЕ СТРАНИЦЫ
    // ==========================================
    const savedTheme = localStorage.getItem('site-theme') || 'light';
    const savedBg = localStorage.getItem('custom-bg-color');
    const savedText = localStorage.getItem('custom-text-color');
    const savedVolume = localStorage.getItem('site-volume') || '50';

    // Устанавливаем сохраненное значение в выпадающий список
    themeSelect.value = savedTheme;
    
    // Применяем сохраненную тему
    applyTheme(savedTheme, savedBg, savedText);
    
    // Применяем сохраненную громкость
    updateVolume(savedVolume);
});

