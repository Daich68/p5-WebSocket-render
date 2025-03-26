// frameSender.js
function initFrameSender(totalFrames = Infinity) {
    const ws = new WebSocket('ws://localhost:8080');
    let isPlaying = true;
    let framesSent = 0;

    ws.onopen = () => console.log('Connected to WebSocket server');
    ws.addEventListener('message', (event) => {
        const msg = event.data;
        isPlaying = msg === 'play';
    });
    ws.onclose = () => console.log('Disconnected from WebSocket server');

    return {
        sendFrame: (canvas) => {
            if (ws.readyState === WebSocket.OPEN && canvas && isPlaying) {
                const dataURL = canvas.elt.toDataURL('image/png');
                ws.send(JSON.stringify({ type: 'frame', data: dataURL }));
                framesSent++;
                if (framesSent >= totalFrames) {
                    ws.close();
                }
            }
        },
        getIsPlaying: () => isPlaying
    };
}