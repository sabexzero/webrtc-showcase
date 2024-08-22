import argparse
import asyncio
import json
import logging
import os
import ssl
import uuid

import websockets
from aiohttp import web
from aiortc import MediaStreamTrack, RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaBlackhole, MediaRecorder, MediaRelay

ROOT = os.path.dirname(__file__)
logger = logging.getLogger("pc")

"""
Глобальная переменная для хранения пир соединений.
Global variable to store peer connections. This set keeps track of all active connections 
to manage them, especially for closing them properly on shutdown.
"""
pcs = set()
relay = MediaRelay()

"""
Класс для манипуляций над треком, который является видео-контентом.
Class for handling the video track. It allows manipulating video content 
received from the track, such as applying transformations.
"""


class VideoTransformTrack(MediaStreamTrack):
    kind = "video"

    def __init__(self, track, transform):
        super().__init__()  # Важно вызвать конструктор родителя / Important to call the parent constructor
        self.track = track
        self.transform = transform

    async def recv(self):
        """
        Получаем трек в формате фрейма.
        Receives the track in frame format. Each frame represents a single unit of video content.
        """
        frame = await self.track.recv()

        """     
        Дальше можно каким-нибудь образом влиять на изображение, получив изображение кадров, например так:
        Here you can apply any transformation to the video frame. For example, to manipulate the image:

        img = frame.to_ndarray(format="bgr24")

        В рамках данного примера, мы вернем ровно то, что получили.
        In this example, we will simply return the frame as is without any modifications.
        """

        return frame


"""
Класс для обработки аудио-трека.
Class to handle the audio track. Similar to the video track, it can be processed frame by frame.
"""


class AudioTransformTrack(MediaStreamTrack):
    kind = "audio"

    def __init__(self, track):
        super().__init__()  # Важно вызвать конструктор родителя / Important to call the parent constructor
        self.track = track

    async def recv(self):
        """
        Получаем трек в формате фрейма.
        Receives the audio track in the form of frames. Each frame is a unit of audio content.
        """
        frame = await self.track.recv()

        """     
        Здесь аналогично можно проводить какие-либо операции над треком, но мы ничего изменять не будем.
        Similar to the video track, operations can be performed on the audio frame here. However, 
        in this example, no modifications are applied.
        """

        return frame


async def index(request):
    content = open(os.path.join(ROOT, "index.html"), "r").read()
    return web.Response(content_type="text/html", text=content)


async def javascript(request):
    content = open(os.path.join(ROOT, "client.js"), "r").read()
    return web.Response(content_type="application/javascript", text=content)


async def handle_websocket(websocket):
    """
    Обрабатываем каждое сообщение, которые мы получаем через вебсокет-соединение.
    Handles each message received through the WebSocket connection. 
    This function listens for incoming messages, processes them, and sends back responses.
    """
    async for message in websocket:
        data = json.loads(message)

        """
        Обрабатываем запрос внутри метода offer.
        Process the request inside the `offer` method.
        """
        answer = await offer(data)

        await websocket.send(json.dumps(answer))


async def offer(request):
    offer = RTCSessionDescription(sdp=request["sdp"], type=request["type"])

    """
    Создаем новое пир соединение.
    Create a new peer connection.
    """
    pc = RTCPeerConnection()

    """
    Так вы можете отличать соединения между собой, с помощью UID.
    Each connection can be identified by a unique identifier (UID).
    """
    pc_id = "PeerConnection(%s)" % uuid.uuid4()
    pcs.add(pc)

    """
    Если указан путь для записи медиа, создаем MediaRecorder, иначе используем MediaBlackhole.
    If a path for recording media is specified, create a MediaRecorder instance; otherwise, 
    use MediaBlackhole, which discards the media data. This is useful for scenarios where recording 
    is optional.
    """

    if args.record_to:
        recorder = MediaRecorder(args.record_to)
    else:
        recorder = MediaBlackhole()

    """
    Здесь происходит настройка событий для data channel и состояния соединения.
    Set up event handlers for the data channel and connection state changes. These handlers define
    how to respond to specific events during the WebRTC connection lifecycle.
    """

    @pc.on("datachannel")
    def on_datachannel(channel):
        """
        Устанавливаем обработчик для сообщений в data channel.
        Set up a handler for messages received through the data channel. In this example,
        it responds with 'pong' when it receives a message starting with 'ping'.
        """

        @channel.on("message")
        def on_message(message):
            if isinstance(message, str) and message.startswith("ping"):
                channel.send("pong" + message[4:])

    @pc.on("connectionstatechange")
    async def on_connectionstatechange():
        """
        Обработчик изменения состояния соединения. Если состояние 'failed', соединение закрывается.
        Handle changes in the connection state. If the state becomes 'failed', the connection is closed.
        """
        if pc.connectionState == "failed":
            await pc.close()
            pcs.discard(pc)

    @pc.on("track")
    def on_track(track):
        """
        Обработчик получения трека. В зависимости от типа трека (audio или video),
        создается соответствующий класс для его обработки.
        Handle receiving a track. Depending on the track type (audio or video),
        a corresponding class is created to process the track.
        """

        if track.kind == "audio":
            pc.addTrack(
                AudioTransformTrack(relay.subscribe(track))
            )
        elif track.kind == "video":
            pc.addTrack(
                VideoTransformTrack(
                    relay.subscribe(track), transform=request.get("video_transform")
                )
            )
        if args.record_to:
            recorder.addTrack(relay.subscribe(track))

        @track.on("ended")
        async def on_ended():
            """
            Обработчик завершения трека. Закрываем MediaRecorder, если трек завершен.
            Handle track ending. Close the MediaRecorder if the track ends.
            """
            await recorder.stop()

    """
    Устанавливаем удаленное описание пир-соединения. Это необходимо, чтобы начать процесс
    настройки WebRTC-соединения.
    Set the remote description for the peer connection. This step is essential to initiate the 
    WebRTC connection setup process.
    """
    await pc.setRemoteDescription(offer)
    await recorder.start()

    """
    Создаем и отправляем ответное описание пир-соединения, которое будет использоваться для
    завершения процесса сигнального обмена.
    Create and send the answer description, which will be used to complete the signaling process.
    """
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    """
    Возвращаем описание ответа в виде словаря. Это необходимо для завершения настройки
    WebRTC-соединения на стороне клиента.
    Return the answer description as a dictionary. This is necessary to complete the WebRTC 
    connection setup on the client side.
    """
    response_data = {
        "sdp": pc.localDescription.sdp,
        "type": pc.localDescription.type
    }

    return response_data


async def on_shutdown(app):
    """
    При отключении сервера, закрываем все активные пир-соединения и очищаем список.
    On server shutdown, close all active peer connections and clear the list.
    """
    coros = [pc.close() for pc in pcs]
    await asyncio.gather(*coros)
    pcs.clear()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="WebRTC audio / video / data-channels demo"
    )

    """
    Здесь возможна настройка SSL-сертификатов для безопасного соединения.
    SSL certificates can be configured here for secure connections.
    """
    parser.add_argument("--cert-file", help="SSL certificate file (for HTTPS)")
    parser.add_argument("--key-file", help="SSL key file (for HTTPS)")
    parser.add_argument(
        "--host", default="0.0.0.0", help="Host for HTTP server (default: 0.0.0.0)"
    )
    parser.add_argument(
        "--port", type=int, default=8080, help="Port for HTTP server (default: 8080)"
    )
    parser.add_argument("--record-to", help="Write received media to a file.")
    parser.add_argument("--verbose", "-v", action="count")
    args = parser.parse_args()

    if args.verbose:
        logging.basicConfig(level=logging.DEBUG)
    else:
        logging.basicConfig(level=logging.INFO)

    if args.cert_file:
        ssl_context = ssl.SSLContext()
        ssl_context.load_cert_chain(args.cert_file, args.key_file)
    else:
        ssl_context = None

    """
    Здесь мы запускаем HTTP-эндпоинты для обслуживания веб-клиента и статических файлов.
    Here we start the HTTP endpoints to serve the web client and static files.
    """
    app = web.Application()
    app.on_shutdown.append(on_shutdown)
    app.router.add_get("/", index)
    app.router.add_get("/client.js", javascript)

    """
    А здесь мы запускаем WebSocket-сервер для обработки сигнальных сообщений и управления соединением.
    And here we start the WebSocket server to handle signaling messages and manage the connection.
    """
    start_server = websockets.serve(handle_websocket, args.host, args.port, ssl=ssl_context)
    loop = asyncio.get_event_loop()
    loop.run_until_complete(start_server)
    loop.run_forever()
