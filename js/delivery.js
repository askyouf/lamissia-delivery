// Инициализация карты
ymaps.ready(initMap);

function initMap() {
    const myMap = new ymaps.Map('map', {
        center: [44.947909, 34.083309], // Центрируем карту по центру ЖК
        zoom: 16 // Настраиваем зум для отображения всего ЖК
    });

    // Создаем метку ресторана
    const restaurantPlacemark = new ymaps.Placemark([44.947255, 34.082549], {
        hintContent: "Lamissia Cafe",
        balloonContent: "Lamissia Cafe"
    }, {
        preset: 'islands#orangeFoodIcon'
    });
    myMap.geoObjects.add(restaurantPlacemark);

    // Создаем полигон зоны доставки с точными координатами ЖК
    const deliveryZone = new ymaps.Polygon([
        // Внешний контур (точные координаты ЖК)
        [
            [44.949007, 34.081532],
            [44.949014, 34.082412],
            [44.949479, 34.082433],
            [44.949471, 34.084322],
            [44.948732, 34.084343],
            [44.948717, 34.085266],
            [44.947909, 34.085309],
            [44.947818, 34.085727],
            [44.946858, 34.085824],
            [44.946858, 34.082176],
            [44.947925, 34.081575],
            [44.949007, 34.081532]
        ]
    ], {
        hintContent: "Зона доставки - территория ЖК"
    }, {
        fillColor: '#FF6B0033',
        strokeColor: '#FF6B00',
        strokeWidth: 2,
        strokeStyle: 'solid'
    });

    // Добавляем зону доставки на карту
    myMap.geoObjects.add(deliveryZone);

    // Автоматически подстраиваем область видимости карты под полигон
    myMap.setBounds(deliveryZone.geometry.getBounds(), {
        checkZoomRange: true,
        zoomMargin: 20 // Отступ от краев полигона
    });

    // Функция проверки, находится ли точка в зоне доставки
    function isPointInDeliveryZone(coords) {
        return deliveryZone.geometry.contains(coords);
    }

    // Добавляем обработчик клика по карте
    myMap.events.add('click', function (e) {
        const coords = e.get('coords');
        
        if (isPointInDeliveryZone(coords)) {
            // Получаем адрес по координатам
            ymaps.geocode(coords).then(function (res) {
                const firstGeoObject = res.geoObjects.get(0);
                const address = firstGeoObject.getAddressLine();
                document.getElementById('address').value = address;
                
                // Удаляем предыдущую метку если она есть
                myMap.geoObjects.each((obj) => {
                    if (obj instanceof ymaps.Placemark && obj !== restaurantPlacemark) {
                        myMap.geoObjects.remove(obj);
                    }
                });

                // Добавляем метку на карту
                const placemark = new ymaps.Placemark(coords, {
                    hintContent: address
                }, {
                    preset: 'islands#orangeDotIcon'
                });
                myMap.geoObjects.add(placemark);
            });
        } else {
            alert('К сожалению, доставка осуществляется только в пределах ЖК');
        }
    });

    // Добавляем поисковый контрол
    const searchControl = new ymaps.control.SearchControl({
        options: {
            provider: 'yandex#search',
            boundedBy: deliveryZone.geometry.getBounds(),
            strictBounds: true
        }
    });
    myMap.controls.add(searchControl);

    // Обработчик выбора результата поиска
    searchControl.events.add('resultselect', function (e) {
        const index = e.get('index');
        searchControl.getResult(index).then(function (res) {
            const coords = res.geometry.getCoordinates();
            if (!isPointInDeliveryZone(coords)) {
                alert('К сожалению, доставка осуществляется только в пределах ЖК');
                // Очищаем поле адреса
                document.getElementById('address').value = '';
                // Удаляем метку с карты
                myMap.geoObjects.each((obj) => {
                    if (obj instanceof ymaps.Placemark && obj !== restaurantPlacemark) {
                        myMap.geoObjects.remove(obj);
                    }
                });
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // Обработка выбора времени доставки
    const timeOptions = document.querySelectorAll('.time-option input[type="radio"]');
    const scheduledTimeWrapper = document.querySelector('.scheduled-time-wrapper');
    const deliveryDateInput = document.getElementById('deliveryDate');
    
    // Устанавливаем минимальную дату (сегодня)
    if (deliveryDateInput) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        deliveryDateInput.min = tomorrow.toISOString().split('T')[0];
        deliveryDateInput.value = tomorrow.toISOString().split('T')[0];
    }

    timeOptions.forEach(option => {
        option.addEventListener('change', function() {
            // Убираем класс active у всех опций
            document.querySelectorAll('.time-option').forEach(opt => {
                opt.classList.remove('active');
            });
            
            // Добавляем класс active к выбранной опции
            this.closest('.time-option').classList.add('active');
            
            // Показываем/скрываем выбор времени
            if (scheduledTimeWrapper) {
                if (this.value === 'scheduled') {
                    scheduledTimeWrapper.classList.remove('hidden');
                } else {
                    scheduledTimeWrapper.classList.add('hidden');
                }
            }
        });
    });

    // Функция для прокрутки к первой секции формы
    function scrollToFirstSection() {
        const firstSection = document.querySelector('.form-section');
        if (firstSection) {
            const offset = 50;
            const elementPosition = firstSection.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }

    // Находим все кнопки "Оформить заказ"
    const orderButtons = document.querySelectorAll('.order-button, .header-order-button');
    
    // Добавляем обработчик для каждой кнопки
    orderButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            scrollToFirstSection();
        });
    });

    // Обработчик для кнопки "Оформить заказ"
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            // Находим форму доставки
            const deliveryForm = document.querySelector('#deliveryForm');
            if (deliveryForm) {
                // Плавно прокручиваем к началу формы
                deliveryForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Фокусируемся на поле адреса
                const addressInput = document.querySelector('#address');
                if (addressInput) {
                    setTimeout(() => {
                        addressInput.focus();
                    }, 800); // Даем время на прокрутку
                }
            }
        });
    }

    // Функция для обработки способов оплаты и отображения карты
    function togglePaymentAndMap(isDelivery) {
        const mapSection = document.querySelector('#map');
        const deliveryInfo = document.querySelector('.delivery-info');
        const addressSection = document.querySelector('.form-section:first-child');
        const deliveryTimeSection = document.querySelector('.delivery-time-section');
        
        // Переключаем способы оплаты
        const deliveryOnlyOptions = document.querySelectorAll('.payment-option.delivery-only');
        const pickupOnlyOptions = document.querySelectorAll('.payment-option.pickup-only');
        
        // Показываем/скрываем опции оплаты в зависимости от способа получения
        deliveryOnlyOptions.forEach(option => {
            option.style.display = isDelivery ? 'flex' : 'none';
        });
        
        pickupOnlyOptions.forEach(option => {
            option.style.display = isDelivery ? 'none' : 'flex';
        });

        // Сбрасываем выбор способа оплаты на картой онлайн
        const onlinePayment = document.querySelector('input[name="payment"][value="card_online"]');
        if (onlinePayment) {
            onlinePayment.checked = true;
        }

        // Переключаем видимость карты и информации о доставке
        if (mapSection) mapSection.style.display = isDelivery ? 'block' : 'none';
        if (deliveryInfo) deliveryInfo.style.display = isDelivery ? 'block' : 'none';
        if (addressSection) addressSection.style.display = isDelivery ? 'block' : 'none';
        if (deliveryTimeSection) deliveryTimeSection.style.display = isDelivery ? 'block' : 'none';
    }

    // Инициализация способов доставки
    const deliveryMethods = document.querySelectorAll('.method-option input[type="radio"]');
    const methodOptions = document.querySelectorAll('.method-option');

    deliveryMethods.forEach(radio => {
        radio.addEventListener('change', function() {
            // Убираем класс active у всех опций
            methodOptions.forEach(option => {
                option.classList.remove('active');
            });
            // Добавляем класс active к выбранной опции
            this.closest('.method-option').classList.add('active');
            
            // Обновляем отображение способов оплаты и карты
            const isDelivery = this.value === 'delivery';
            togglePaymentAndMap(isDelivery);
        });
    });

    // Инициализация способов оплаты
    const paymentOptions = document.querySelectorAll('.payment-option input[type="radio"]');
    paymentOptions.forEach(radio => {
        radio.addEventListener('change', function() {
            // Убираем класс active у всех опций оплаты
            document.querySelectorAll('.payment-option').forEach(option => {
                option.classList.remove('active');
            });
            // Добавляем класс active только к видимой выбранной опции
            const selectedOption = this.closest('.payment-option');
            if (selectedOption && selectedOption.style.display !== 'none') {
                selectedOption.classList.add('active');
            }
        });
    });

    // Инициализация при загрузке страницы
    const initialDeliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked');
    if (initialDeliveryMethod) {
        const isDelivery = initialDeliveryMethod.value === 'delivery';
        togglePaymentAndMap(isDelivery);
    }

    // Инициализация подсказок комментария
    const commentInput = document.querySelector('#comment');
    const commentLength = document.querySelector('#commentLength');
    const suggestionBtns = document.querySelectorAll('.suggestion-btn');
    
    // Обновление счетчика символов
    if (commentInput) {
        commentInput.addEventListener('input', function() {
            if (commentLength) {
                commentLength.textContent = this.value.length;
            }
            // Ограничиваем ввод 200 символами
            if (this.value.length > 200) {
                this.value = this.value.substring(0, 200);
            }
        });
    }
    
    // Обработка клика по кнопкам-подсказкам
    suggestionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if (commentInput) {
                const suggestion = this.getAttribute('data-comment');
                commentInput.value = suggestion;
                // Обновляем счетчик символов
                if (commentLength) {
                    commentLength.textContent = suggestion.length;
                }
            }
        });
    });

    // Обработка поля имени (первая буква заглавная)
    const nameInput = document.getElementById('name');
    if (nameInput) {
        nameInput.addEventListener('input', function(e) {
            let value = this.value;
            if (value.length > 0) {
                this.value = value.charAt(0).toUpperCase() + value.slice(1);
            }
        });
    }

    // Маска для телефона
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.value = '+7 (';

        function formatPhone(value) {
            // Убираем все нецифровые символы
            const numbers = value.replace(/\D/g, '');
            
            // Ограничиваем количество цифр до 10 (не считая код страны)
            const limitedNumbers = numbers.substring(1, 11);
            
            let result = '+7 (';
            
            for (let i = 0; i < limitedNumbers.length; i++) {
                if (i === 3) result += ') ';
                if (i === 6 || i === 8) result += '-';
                result += limitedNumbers[i];
            }
            
            return result;
        }

        phoneInput.addEventListener('input', function(e) {
            const cursorPosition = this.selectionStart;
            const previousValue = this.value;
            const newValue = formatPhone(this.value);
            
            this.value = newValue;

            // Вычисляем новую позицию курсора
            if (cursorPosition < 4) {
                this.setSelectionRange(4, 4);
            } else if (newValue.length > previousValue.length) {
                // Если добавляется символ
                const newPosition = cursorPosition + 
                    (newValue.length - previousValue.length);
                this.setSelectionRange(newPosition, newPosition);
            } else {
                // Если удаляется символ
                this.setSelectionRange(cursorPosition, cursorPosition);
            }
        });

        phoneInput.addEventListener('keydown', function(e) {
            // Разрешаем: backspace, delete, tab и escape
            if (e.key === 'Backspace' || e.key === 'Delete' || 
                e.key === 'Tab' || e.key === 'Escape') {
                if (e.key === 'Backspace' && this.value.length <= 4) {
                    e.preventDefault();
                }
                return;
            }
            
            // Разрешаем: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
            if ((e.ctrlKey || e.metaKey) && 
                ['a', 'c', 'v', 'x'].indexOf(e.key.toLowerCase()) !== -1) {
                return;
            }
            
            // Запрещаем ввод нецифровых символов
            if (!/[0-9]/.test(e.key)) {
                e.preventDefault();
            }
        });

        phoneInput.addEventListener('focus', function() {
            if (!this.value || this.value.length < 4) {
                this.value = '+7 (';
            }
            // Ставим курсор в конец номера или после "+7 ("
            const position = this.value.length > 4 ? this.value.length : 4;
            this.setSelectionRange(position, position);
        });

        phoneInput.addEventListener('blur', function() {
            // Если номер не полный, очищаем поле
            if (this.value.length < 18) {
                this.value = '';
            }
        });
    }

    // Функция проверки заполненности блока формы
    function isFormSectionFilled(section) {
        const inputs = section.querySelectorAll('input[required], textarea[required]');
        for (let input of inputs) {
            if (!input.value.trim()) {
                return false;
            }
        }
        return true;
    }

    // Функция для плавной прокрутки к элементу
    function scrollToElement(element) {
        const offset = 50; // отступ от верха страницы
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }

    // Инициализация навигации по форме
    const formSections = document.querySelectorAll('.form-section');
    const arrowButton = document.querySelector('.fa-arrow-right');

    // Обработчик клика по стрелке
    if (arrowButton) {
        arrowButton.addEventListener('click', function(e) {
            e.preventDefault();
            // Найдем первый незаполненный блок формы
            const firstEmptySection = Array.from(formSections).find(section => !isFormSectionFilled(section));
            // Если все заполнено, берем первый блок
            const targetSection = firstEmptySection || formSections[0];
            scrollToElement(targetSection);
        });

        // Добавляем стиль курсора, чтобы показать, что это кликабельный элемент
        arrowButton.style.cursor = 'pointer';
    }

    // Добавляем обработчики для каждого блока формы
    formSections.forEach((section, index) => {
        const inputs = section.querySelectorAll('input, textarea');
        const nextSection = formSections[index + 1];

        inputs.forEach(input => {
            input.addEventListener('change', function() {
                if (isFormSectionFilled(section) && nextSection) {
                    scrollToElement(nextSection);
                }
            });
        });

        // Специальная обработка для радио-кнопок
        const radioGroups = section.querySelectorAll('input[type="radio"]');
        radioGroups.forEach(radio => {
            radio.addEventListener('change', function() {
                if (nextSection) {
                    setTimeout(() => {
                        scrollToElement(nextSection);
                    }, 300); // небольшая задержка для лучшего UX
                }
            });
        });
    });
});
