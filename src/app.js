// playback voice constant
const VOICE = "verse";

// WebRTC とデータチャネル用グローバル変数
let peerConnection;
let dataChannel;

// UI から入力値を取得
function getDeployment() {
    return document.getElementById('deployment').value;
}
function getWebRtcUrl() {
    const region = document.getElementById('webrtcRegion').value;
    return `https://${region}.realtimeapi-preview.ai.azure.com/v1/realtimertc`;
}
function getSessionsUrl() {
    const resourceName = document.getElementById('resourceName').value;
    return `https://${resourceName}.openai.azure.com/openai/realtimeapi/sessions?api-version=2025-04-01-preview`;
}
function getApiKey() {
    return document.getElementById('apiKey').value;
}

// ボタン状態を更新
function updateButtonStates() {
    const startBtn = document.getElementById('startSessionBtn');
    const closeBtn = document.getElementById('closeSessionBtn');
    const resource = document.getElementById('resourceName').value.trim();
    const apiKey = getApiKey().trim();
    const sessionActive = !!peerConnection;
    if (sessionActive) {
        startBtn.disabled = true;
        closeBtn.disabled = false;
    } else {
        closeBtn.disabled = true;
        startBtn.disabled = !(resource && apiKey);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const resourceInput = document.getElementById('resourceName');
    const apiInput = document.getElementById('apiKey');
    const stored = localStorage.getItem('resourceName');
    if (stored) resourceInput.value = stored;
    resourceInput.addEventListener('input', e => {
        localStorage.setItem('resourceName', e.target.value);
        updateButtonStates();
    });
    apiInput.addEventListener('input', updateButtonStates);
    updateButtonStates();
});

// セッション開始
async function StartSession() {
    document.getElementById('startSessionBtn').disabled = true;
    const resourceName = document.getElementById('resourceName').value.trim();
    const apiKey = getApiKey();
    if (!resourceName || !apiKey) {
        alert('Resource Name and API Key are required');
        return;
    }
    try {
        const response = await fetch(getSessionsUrl(), {
            method: 'POST',
            headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: getDeployment(), voice: VOICE })
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        const sessionId = data.id;
        const ephemeralKey = data.client_secret?.value;
        logMessage('Ephemeral Key Received: ***');
        logMessage('WebRTC Session Id = ' + sessionId);
        await init(ephemeralKey);
    } catch (error) {
        logMessage('Error fetching ephemeral key: ' + error.message);
    } finally {
        updateButtonStates();
    }
}

// WebRTC セッション初期化
async function init(ephemeralKey) {
    peerConnection = new RTCPeerConnection();
    const audioElement = document.createElement('audio');
    audioElement.autoplay = true;
    document.body.appendChild(audioElement);
    peerConnection.ontrack = event => {
        audioElement.srcObject = event.streams[0];
    };
    const clientMedia = await navigator.mediaDevices.getUserMedia({ audio: true });
    peerConnection.addTrack(clientMedia.getAudioTracks()[0]);
    dataChannel = peerConnection.createDataChannel('realtime-channel');
    dataChannel.onopen = () => { logMessage('Data channel is open'); updateSession(); };
    dataChannel.onmessage = event => {
        const realtimeEvent = JSON.parse(event.data);
        logMessage('Received server event: ' + JSON.stringify(realtimeEvent, null, 2));
        if (realtimeEvent.type === 'session.update') {
            logMessage('Instructions: ' + realtimeEvent.session.instructions);
        } else if (realtimeEvent.type === 'session.error') {
            logMessage('Error: ' + realtimeEvent.error.message);
        } else if (realtimeEvent.type === 'session.end') {
            logMessage('Session ended.');
        }
    };
    dataChannel.onclose = () => { logMessage('Data channel is closed'); };
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    const sdpResponse = await fetch(`${getWebRtcUrl()}?model=${getDeployment()}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${ephemeralKey}`, 'Content-Type': 'application/sdp' },
        body: offer.sdp
    });
    const answer = { type: 'answer', sdp: await sdpResponse.text() };
    await peerConnection.setRemoteDescription(answer);
}

// クライアントイベント送信
function updateSession() {
    const event = { type: 'session.update', session: { instructions: 'You are a helpful AI assistant responding in natural, engaging language.' } };
    dataChannel.send(JSON.stringify(event));
    logMessage('Sent client event: ' + JSON.stringify(event, null, 2));
}

// セッション終了
function stopSession() {
    if (dataChannel) dataChannel.close();
    if (peerConnection) peerConnection.close();
    peerConnection = null;
    logMessage('Session closed.');
    updateButtonStates();
}

// ログ出力
function logMessage(message) {
    const logContainer = document.getElementById('logContainer');
    logContainer.value += message + '\n';
    logContainer.scrollTop = logContainer.scrollHeight;
}