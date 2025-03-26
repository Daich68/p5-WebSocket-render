const express = require('express');
const WebSocket = require('ws');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const port = 8080;

app.use(express.static(__dirname));
app.get('/favicon.ico', (req, res) => res.status(204).end());

const server = app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
const wss = new WebSocket.Server({ server });

let frameIndex = 0;
if (!fs.existsSync('frames')) fs.mkdirSync('frames');

wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.on('message', (message) => {
        console.log('Received message from client');
        const data = JSON.parse(message.toString());
        if (data.type === 'frame') {
            const base64Data = data.data.replace(/^data:image\/png;base64,/, '');
            const fileName = `frames/frame_${frameIndex.toString().padStart(5, '0')}.png`;
            try {
                fs.writeFileSync(fileName, base64Data, 'base64');
                console.log(`Saved frame ${frameIndex}`);
                frameIndex++;
            } catch (err) {
                console.error(`Error saving frame ${frameIndex}:`, err);
            }
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        console.log(`Total frames saved: ${frameIndex}`);
        if (frameIndex === 0) {
            console.log('No frames to process, skipping video creation.');
            return;
        }

        // Обновленная команда FFmpeg с дополнительными параметрами для совместимости
        const ffmpegCommand = 'ffmpeg -framerate 60 -i frames/frame_%05d.png -c:v libx264 -pix_fmt yuv420p -r 60 -movflags +faststart output.mp4';
        exec(ffmpegCommand, (err, stdout, stderr) => {
            if (err) {
                console.error('FFmpeg error:', err);
                console.error('FFmpeg stderr:', stderr);
                return;
            }
            console.log('FFmpeg stdout:', stdout);
            console.log('Video rendered as output.mp4');

            // Проверяем, что файл output.mp4 существует и не пустой
            fs.stat('output.mp4', (err, stats) => {
                if (err || stats.size === 0) {
                    console.error('Error: output.mp4 is missing or empty');
                    return;
                }

                // Удаление всех фреймов после успешного создания видео
                fs.readdir('frames', (err, files) => {
                    if (err) {
                        console.error('Error reading frames directory:', err);
                        return;
                    }
                    files.forEach(file => {
                        fs.unlink(`frames/${file}`, (err) => {
                            if (err) console.error(`Error deleting file ${file}:`, err);
                        });
                    });
                    console.log('All frames deleted');
                });
            });
        });
    });
});

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

readline.on('line', (input) => {
    const command = input.trim();
    if (command === 'play' || command === 'pause') {
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) client.send(command);
        });
    } else if (command === 'stop') {
        console.log('Stopping server...');
        server.close(() => {
            console.log('Server stopped.');
            process.exit(0);
        });
    } else {
        console.log('Unknown command. Use "play", "pause", or "stop".');
    }
});