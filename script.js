document.addEventListener('DOMContentLoaded', () => {
    // Находим все необходимые элементы интерфейса
    const burgerBtn = document.getElementById('burgerBtn');
    const leftSidebar = document.getElementById('leftSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    const moreMenuBtn = document.getElementById('moreMenuBtn');
    const moreDropdown = document.getElementById('moreDropdown');
    
    const openSettingsBtn = document.getElementById('openSettingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    
    const toggleThemeBtn = document.getElementById('toggleThemeBtn');
    const themeBtnText = document.getElementById('themeBtnText');

    // ==========================================
    // 1. УПРАВЛЕНИЕ БОКОВЫМ МЕНЮ И ОВЕРЛЕЕМ
    // ==========================================
    const openSidebar = () => {
        leftSidebar.classList.add('open');
        sidebarOverlay.style.display = 'block';
    };

    const closeSidebar = () => {
        leftSidebar.classList.remove('open');
        sidebarOverlay.style.display = 'none';
        moreDropdown.classList.add('hidden'); // Закрываем "Ещё" при закрытии шторки
    };

    burgerBtn.addEventListener('click', openSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);

    // Всплывающее меню "Ещё" (Скриншот 4)
    moreMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moreDropdown.classList.toggle('hidden');
    });

    // ==========================================
    // 2. ОТКРЫТИЕ И ЗАКРЫТИЕ НАСТРОЕК ПО ЦЕНТРУ
    // ==========================================
    openSettingsBtn.addEventListener('click', () => {
        closeSidebar(); // Закрываем шторку перед открытием профиля
        settingsModal.classList.remove('id-hidden');
    });

    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('id-hidden');
    });

    // Закрытие настроек при клике по полупрозрачному фону вокруг окна
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.add('id-hidden');
        }
    });

    // ==========================================
    // 3. БЫСТРОЕ ПЕРЕКЛЮЧЕНИЕ ТЕМЫ (ИЗ МЕНЮ "ЕЩЁ")
    // ==========================================
    const applyTheme = (theme) => {
        if (theme === 'light') {
            document.body.setAttribute('data-theme', 'light');
            themeBtnText.textContent = 'Ночной режим';
            toggleThemeBtn.querySelector('.drop-icon').textContent = '🌙';
        } else if (theme === 'dark') {
            document.body.removeAttribute('data-theme');
            themeBtnText.textContent = 'Светлый режим';
            toggleThemeBtn.querySelector('.drop-icon').textContent = '☀️';
        }
        localStorage.setItem('tg-site-theme', theme);
    };

    toggleThemeBtn.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        applyTheme(currentTheme);
        moreDropdown.classList.add('hidden'); // Прячем меню после выбора
    });
    // ==========================================
    // 4. КАСТОМНАЯ ПАЛИТРА И ПОЛЗУНОК ГРОМКОСТИ
    // ==========================================
    const customColorsTrigger = document.getElementById('customColorsTrigger');
    const customColorPickers = document.getElementById('customColorPickers');
    const customBgPicker = document.getElementById('customBgPicker');
    const customTextPicker = document.getElementById('customTextPicker');
    
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValLabel = document.getElementById('volumeValLabel');

    // Показ / скрытие блока выбора цвета
    customColorsTrigger.addEventListener('click', () => {
        customColorPickers.classList.toggle('hidden');
    });

    // Применение пользовательской палитры
    const applyCustomColors = (bg, text) => {
        document.documentElement.style.setProperty('--tg-panel', bg);
        document.documentElement.style.setProperty('--tg-bg', adjustColorBrightness(bg, -10));
        document.documentElement.style.setProperty('--tg-hover', adjustColorBrightness(bg, 8));
        document.documentElement.style.setProperty('--tg-border', adjustColorBrightness(bg, -15));
        document.documentElement.style.setProperty('--tg-text', text);
        document.documentElement.style.setProperty('--tg-subtext', adjustColorBrightness(text, -40));
        
        customBgPicker.value = bg;
        customTextPicker.value = text;
        
        localStorage.setItem('tg-custom-bg', bg);
        localStorage.setItem('tg-custom-text', text);
    };

    customBgPicker.addEventListener('input', () => {
        applyCustomColors(customBgPicker.value, customTextPicker.value);
    });

    customTextPicker.addEventListener('input', () => {
        applyCustomColors(customBgPicker.value, customTextPicker.value);
    });

    // Управление громкостью
    const updateVolume = (value) => {
        volumeSlider.value = value;
        volumeValLabel.textContent = `${value}%`;
        localStorage.setItem('tg-site-volume', value);
    };

    volumeSlider.addEventListener('input', (e) => {
        updateVolume(e.target.value);
    });

    // Генерация оттенков для кастомного стиля
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
    // 5. ИНИЦИАЛИЗАЦИЯ И ЗАГРУЗКА ПАРАМЕТРОВ
    // ==========================================
    const savedTheme = localStorage.getItem('tg-site-theme') || 'dark';
    const savedBg = localStorage.getItem('tg-custom-bg');
    const savedText = localStorage.getItem('tg-custom-text');
    const savedVolume = localStorage.getItem('tg-site-volume') || '50';

    // Восстанавливаем тему
    applyTheme(savedTheme);

    // Восстанавливаем цвета, если они были настроены ранее
    if (savedBg && savedText) {
        applyCustomColors(savedBg, savedText);
    }

    // Восстанавливаем уровень громкости
    updateVolume(savedVolume);
});




