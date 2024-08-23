// Получаем элементы DOM, к которым будем добавлять логи и другую информацию о соединении.
// Get DOM elements where we will log connection information.
let dataChannelLog = document.getElementById('data-channel'),
    iceConnectionLog = document.getElementById('ice-connection-state'),
    iceGatheringLog = document.getElementById('ice-gathering-state'),
    signalingLog = document.getElementById('signaling-state');

// Переменная для хранения объекта RTCPeerConnection.
// Variable to hold the RTCPeerConnection object.
let pc = null;

// Создаем объект WebSocket для связи с сервером по адресу ws://localhost:8080/webrtc.
// Create a WebSocket object to communicate with the server at ws://localhost:8080/webrtc.
websocket = new WebSocket('ws://localhost:8080/webrtc');

// Устанавливаем обработчик на открытие WebSocket соединения.
// Set up the handler for when the WebSocket connection is established.
websocket.onopen = function() {
    console.log("WebSocket connection established");
};

// Обработчик ошибок при установлении WebSocket соединения.
// Handler for errors that occur during WebSocket connection.
websocket.onerror = function(event) {
    console.error("WebSocket error:", event);
};

// Обработчик закрытия WebSocket соединения.
// Handler for when the WebSocket connection is closed.
websocket.onclose = function(event) {
    console.log("WebSocket connection closed:", event);
};

// Переменные для хранения DataChannel и его интервала.
// Variables to hold the DataChannel and its interval.
let dc = null, dcInterval = null;


/*
    Функция для созданияи инициализации RTCPeerConnection.
    Если checkbox input 'STUN server' находится в положении checked,
    то инициализируем RTCPeerConnection с конфигурацией STUN сервера
    гугл. Также по умолчанию устанавливается sdpSemantics: unified-plan.
    STUN сервер требуется включать в случае если сервер и клиент находятся
    в разных сетях.
    После инициализации p2p соединения обновляются логи.
*/
function createPeerConnection() {
    if (document.getElementById('use-stun').checked) {
        pc = new RTCPeerConnection({
            iceServers: [
                {
                    urls: "stun:stun.l.google.com:19302",
                },
            ],
        });
    } else {
        pc = new RTCPeerConnection()
    }

    /*
        ICE Gathering — это процесс сбора кандидатов для установления соединения.
        Кандидаты — это возможные пути (IP-адреса и порты), через которые два
        клиента могут установить связь. Этот процесс включает поиск локальных
        кандидатов (локальных IP-адресов) и получение удаленных кандидатов
        через STUN/TURN-сервера.

        Возможные состояния:
        new: сбор кандидатов еще не начался.
        gathering: идет сбор кандидатов.
        complete: сбор завершен
    */
    pc.addEventListener('icegatheringstatechange', () => {
        iceGatheringLog.textContent += ' -> ' + pc.iceGatheringState;
    }, false);
    iceGatheringLog.textContent = pc.iceGatheringState;

    /*
        ICE Connection State отображает текущее состояние соединения между двумя
        пирами WebRTC. Это состояние показывает, как идет процесс установления
        соединения, включая этапы подключения, проверки соединения и возможные ошибки.

        Возможные состояния:
        new: соединение еще не установлено.
        checking: идет проверка кандидатур.
        connected: соединение успешно установлено.
        disconnected: соединение прервано.
    */
    pc.addEventListener('iceconnectionstatechange', () => {
        iceConnectionLog.textContent += ' -> ' + pc.iceConnectionState;
    }, false);
    iceConnectionLog.textContent = pc.iceConnectionState;

    /*
        Сигнализация (signaling) — это процесс обмена сообщениями между клиентами для
        установления и управления соединением. Эти сообщения включают предложения (offer),
        ответы (answer) и ICE-кандидаты

        Возможные состояния:
        stable: сигнализация завершена, соединение установлено.
        have-local-offer: локальное предложение было создано.
        have-remote-offer: получено удаленное предложение.
    */
    pc.addEventListener('signalingstatechange', () => {
        signalingLog.textContent += ' -> ' + pc.signalingState;
    }, false);
    signalingLog.textContent = pc.signalingState;

    /*
        Track Event вызывается, когда новый медиа-трек (например, видео или аудио)
        добавляется к RTCPeerConnection. Это происходит, когда один из клиентов
        отправляет медиапоток, и другой клиент его принимает.
    */
    pc.addEventListener('track', (evt) => {
        if (evt.track.kind === 'video')
            document.getElementById('video').srcObject = evt.streams[0];
        else
            document.getElementById('audio').srcObject = evt.streams[0];
    });

    return pc;
}

/*
    Функция для считывания устройств ввода-вывода(микрофона и/или видео).
    Функция populateSelect принимает id селектора и доступные устройства,
    устанавливая их как варианты выбора селектора.
*/
function enumerateInputDevices() {
    const populateSelect = (select, devices) => {
        let counter = 1;
        devices.forEach((device) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || ('Device #' + counter);
            select.appendChild(option);
            counter += 1;
        });
    };

    navigator.mediaDevices.enumerateDevices().then((devices) => {
        populateSelect(
            document.getElementById('audio-input'),
            devices.filter((device) => device.kind === 'audioinput')
        );
        populateSelect(
            document.getElementById('video-input'),
            devices.filter((device) => device.kind === 'videoinput')
        );
    }).catch((e) => {
        alert(e);
    });
}

/*
    Функция отвечает за начало процесса переговоров между двумя
    WebRTC-клиентами для установления соединения. Выполняет следующие шаги:
        1. Создание и установка локального описания (SDP) для текущего клиента.
        2. Ожидание завершения сбора ICE-кандидатов.
        3. Фильтрация кодеков (если это необходимо).
        4. Отправка SDP предложения удаленному пиру через WebSocket.
        5. Обработка SDP ответа от удаленного пира.
*/
function negotiate() {
    /*
        Создание предложения (SDP Offer) и установка его в качестве локального описания (SDP).
        SDP Offer — это описание параметров, которые инициатор предлагает для использования в
        соединении. В этом предложении содержится вся информация, необходимая для установления
        связи, включая описание медиа, кодеков, сетевых параметров и т.д.
    */
    return pc.createOffer().then((offer) => {
        return pc.setLocalDescription(offer);
    }).then(() => {
        /*
            Проверяем состояние сбора кандидатов, если кандидаты собраны (complete),
            то используем resolve для продолжения исполнения кода
            Если кандидаты не собраны, то вешаем функцию checkState на изменение
            состояния сбора кандидатов.
        */
        return new Promise((resolve) => {
            if (pc.iceGatheringState === 'complete') {
                resolve();
            } else {
                function checkState() {
                    if (pc.iceGatheringState === 'complete') {
                        pc.removeEventListener('icegatheringstatechange', checkState);
                        resolve();
                    }
                }
                pc.addEventListener('icegatheringstatechange', checkState);
            }
        });
    }).then(() => {
        /*
            Этот блок кода выполняет фильтрацию кодеков, если пользователь выбрал
            определенный кодек для аудио или видео. Если выбрано значение, отличное
            от default, используется функция sdpFilterCodec(), которая изменяет SDP,
            чтобы использовать только выбранный кодек.
        */
        let offer = pc.localDescription;
        let codec;

        codec = document.getElementById('audio-codec').value;
        if (codec !== 'default') {
            offer.sdp = sdpFilterCodec('audio', codec, offer.sdp);
        }

        codec = document.getElementById('video-codec').value;
        if (codec !== 'default') {
            offer.sdp = sdpFilterCodec('video', codec, offer.sdp);
        }

        document.getElementById('offer-sdp').textContent = offer.sdp;

        // Отправляет SDP-предложение (включая выбранные кодеки и возможные видео-трансформации)
        // через WebSocket-соединение удаленному клиенту.
        websocket.send(JSON.stringify({
            sdp: offer.sdp,
            type: offer.type,
            video_transform: document.getElementById('video-transform').value
        }));

        // Обработка WebSocket сообщения, содержащее SDP-ответ от удаленного клиента и
        // установка этого SDP-ответа как удаленное описание (Remote Description)
        websocket.addEventListener('message', function(event) {
            let answer = JSON.parse(event.data);
            document.getElementById('answer-sdp').textContent = answer.sdp;
            pc.setRemoteDescription(new RTCSessionDescription(answer)).catch(e => console.log(e));
        });
    }).catch((e) => {
        console.log(e)
        alert(e);
    });
}

/*
    Функция представляет собой входную точку(entry point) WebRTC приложения, которое управляет созданием
    и настройкой WebRTC соединения, а также опционально включает Data Channel для обмена сообщениями между двумя
    клиентами. Давайте рассмотрим его подробнее.
    Основные шаги:
        1. Инициализация WebRTC соединения.
        2. Использование Data Channel для обмена текстовыми сообщениями.
        3. Настройка аудио- и видеопотоков.
        4. Процесс получения медиа и начало переговоров.
*/
function start() {

    /*
        после нажатия на кнопку "Start", она скрывается, чтобы пользователь не мог нажать её снова.
        Создание WebRTC соединения: функция createPeerConnection() описана выше.
        Переменная time_start используется для отсчета времени с момента начала соединения.
        Функция current_stamp() возвращает текущий временной штамп (в миллисекундах) относительно момента начала.
    */
    document.getElementById('start').style.display = 'none';
    pc = createPeerConnection();

    let time_start = null;

    const current_stamp = () => {
        if (time_start === null) {
            time_start = new Date().getTime();
            return 0;
        } else {
            return new Date().getTime() - time_start;
        }
    };

    /*
        Data Channel — это механизм в WebRTC, который позволяет двум клиентам обмениваться данными в реальном
        времени без необходимости передавать их через медиатреки (аудио или видео), то есть позволяет обмениваться
        файлами, текстовыми сообщениями или другими данными не имеющим отношения к медиатрекам.
        Если пользователь выбрал использовать Data Channel (use-datachannel), создается канал с именем 'chat'
        и параметрами, которые были указаны в текстовом поле (datachannel-parameters).
    */
    if (document.getElementById('use-datachannel').checked) {
        let parameters = JSON.parse(document.getElementById('datachannel-parameters').value);

        dc = pc.createDataChannel('chat', parameters);

        /*
            Обработчики событий:
            close: срабатывает, когда канал закрывается. Очищается интервал dcInterval, и в лог добавляется
            запись о закрытии канала.

            open: срабатывает, когда канал открывается. В лог добавляется запись об открытии канала, и создается
            интервал, который каждую секунду отправляет сообщение 'ping <timestamp>' через канал.

            message: срабатывает, когда получено сообщение. Если сообщение начинается с 'pong', рассчитывается время
            задержки (RTT, round-trip time) и отображается в логе.
        */
        dc.addEventListener('close', () => {
            clearInterval(dcInterval);
            dataChannelLog.textContent += '- close\n';
        });
        dc.addEventListener('open', () => {
            dataChannelLog.textContent += '- open\n';
            dcInterval = setInterval(() => {
                let message = 'ping ' + current_stamp();
                dataChannelLog.textContent += '> ' + message + '\n';
                dc.send(message);
            }, 1000);
        });
        dc.addEventListener('message', (evt) => {
            dataChannelLog.textContent += '< ' + evt.data + '\n';

            if (evt.data.substring(0, 4) === 'pong') {
                let elapsed_ms = current_stamp() - parseInt(evt.data.substring(5), 10);
                dataChannelLog.textContent += ' RTT ' + elapsed_ms + ' ms\n';
            }
        });
    }

    /*
        Создаются начальные настройки для аудио- и видеопотоков(ограничения).
        Настройка аудио: Если выбран аудиоввод (use-audio), и если выбран конкретный аудиоустройство,
        оно добавляется к ограничениям.

        Настройка видео: Если выбран видеоввод (use-video), и если выбран конкретный видеоустройство,
        оно добавляется к ограничениям. Если выбрано разрешение видео, оно также добавляется к ограничениям.
    */
    const constraints = {
        audio: false,
        video: false
    };

    if (document.getElementById('use-audio').checked) {
        const audioConstraints = {};

        const device = document.getElementById('audio-input').value;
        if (device) {
            audioConstraints.deviceId = { exact: device };
        }

        constraints.audio = Object.keys(audioConstraints).length ? audioConstraints : true;
    }

    if (document.getElementById('use-video').checked) {
        const videoConstraints = {};

        const device = document.getElementById('video-input').value;
        if (device) {
            videoConstraints.deviceId = { exact: device };
        }

        const resolution = document.getElementById('video-resolution').value;
        if (resolution) {
            const dimensions = resolution.split('x');
            videoConstraints.width = parseInt(dimensions[0], 0);
            videoConstraints.height = parseInt(dimensions[1], 0);
        }

        constraints.video = Object.keys(videoConstraints).length ? videoConstraints : true;
    }

    /*
        Получение медиапотока: если включено аудио или видео, вызывается navigator.mediaDevices.getUserMedia()
        с соответствующими ограничениями. Если поток успешно получен, его треки добавляются к RTCPeerConnection
        с помощью pc.addTrack().
        Начало переговоров: после получения медиапотока вызывается функция negotiate() для начала процесса
        переговоров между клиентами. Если медиапотоки не нужны(при использовании только data channel),
        переговоры начинаются сразу.
    */
    if (constraints.audio || constraints.video) {
        if (constraints.video) {
            document.getElementById('media').style.display = 'flex';
        }
        navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
            stream.getTracks().forEach((track) => {
                pc.addTrack(track, stream);
            });
            return negotiate();
        }, (err) => {
            alert('Could not acquire media: ' + err);
        });
    } else {
        negotiate();
    }

    document.getElementById('stop').style.display = 'inline-block';
}

/*
    Функция, вызываемая при нажитии на кнопку Stop, закрывает WebRTC соединиение.
*/
function stop() {
    // После нажатия на кнопку "Stop", она скрывается, чтобы пользователь не мог нажать её снова.
    document.getElementById('stop').style.display = 'none';

    // Закрывается дата канал (data channel)
    if (dc) {
        dc.close();
    }

    // Закрывается получение медиа-треков от всех отправителей
    pc.getSenders().forEach((sender) => {
        sender.track.stop();
    });

    // Закрыавется p2p соединение
    setTimeout(() => {
        pc.close();
    }, 500);

    // Заново отображаем кнопку Start
    document.getElementById('start').style.display = 'inline-block';
}

/*
    Функция фильтрует кодеки в SDP (Session Description Protocol) на основании типа медиа (например, аудио или видео)
    и заданного кодека. Это делается для того, чтобы обеспечить использование только определенного кодека при
    установлении WebRTC-соединения.

    kind: тип медиа — либо "audio", либо "video".
    codec: строка с именем кодека, который вы хотите оставить, например "VP8" для видео или "opus" для аудио.
    realSdp: SDP строка, которая содержит все параметры соединения.
*/
function sdpFilterCodec(kind, codec, realSdp) {
    let allowed = []

    // Находит строки, которые связаны с параметрами повторной передачи (retransmission, RTX).
    let rtxRegex = new RegExp('a=fmtp:(\\d+) apt=(\\d+)\r$');

    // Находит строки, которые описывают параметры кодека, заданного в codec.
    let codecRegex = new RegExp('a=rtpmap:([0-9]+) ' + escapeRegExp(codec))

    // Находит строки, которые определяют медиа (audio/video) в SDP, и собирает все поддерживаемые
    // форматами идентификаторы (payload types).
    let videoRegex = new RegExp('(m=' + kind + ' .*?)( ([0-9]+))*\\s*$')

    /*
        Проходит по каждой строке SDP и ищет строки, соответствующие kind (аудио или видео).
        Если строка соответствует кодеку (например, "VP8" для видео), идентификатор этого кодека
        добавляется в массив allowed.
        Если строка соответствует RTX (повторная передача), проверяет, связан ли этот RTX с ранее
        добавленным кодеком и, если да, также добавляет его в allowed.
    */
    let lines = realSdp.split('\n');
    let isKind = false;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('m=' + kind + ' ')) {
            isKind = true;
        } else if (lines[i].startsWith('m=')) {
            isKind = false;
        }

        if (isKind) {
            let match = lines[i].match(codecRegex);
            if (match) {
                allowed.push(parseInt(match[1]));
            }

            match = lines[i].match(rtxRegex);
            if (match && allowed.includes(parseInt(match[2]))) {
                allowed.push(parseInt(match[1]));
            }
        }
    }

    /*
        Проходит по строкам SDP и удаляет все строки, которые относятся к неподдерживаемым кодекам.
        Если строка соответствует кодеку или RTX, который не был добавлен в allowed, она пропускается.
        Строки, которые отвечают за настройку медиа (строки с m=, например, m=video), обновляются так,
        чтобы содержать только разрешенные форматы.
    */
    let skipRegex = 'a=(fmtp|rtcp-fb|rtpmap):([0-9]+)';
    let sdp = '';

    isKind = false;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('m=' + kind + ' ')) {
            isKind = true;
        } else if (lines[i].startsWith('m=')) {
            isKind = false;
        }

        if (isKind) {
            let skipMatch = lines[i].match(skipRegex);
            if (skipMatch && !allowed.includes(parseInt(skipMatch[2]))) {
                continue;
            } else if (lines[i].match(videoRegex)) {
                sdp += lines[i].replace(videoRegex, '$1 ' + allowed.join(' ')) + '\n';
            } else {
                sdp += lines[i] + '\n';
            }
        } else {
            sdp += lines[i] + '\n';
        }
    }

    return sdp;
}

/*
    Эта вспомогательная функция используется для экранирования специальных символов
    в регулярных выражениях.
    Это нужно для того, чтобы корректно составить регулярные выражения, если название
    кодека содержит специальные символы.
*/
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

// При загрузке страницы запускаем функцию, считывающую устройства ввода-вывода.
enumerateInputDevices();