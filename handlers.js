function onOptionsClick() {
    const options = document.getElementById('options-dropdown');
    if (options.style.display === 'none') {
        options.style.display = ''
    } else {
        options.style.display = 'none'
    }
}

function onLogsClick() {
    const logs = document.getElementById('logs-dropdown');
    if (logs.style.display === 'none') {
        logs.style.display = ''
    } else {
        logs.style.display = 'none'
    }
}

function checkDatachannel() {
    const dataChannelCheckbox = document.getElementById('use-datachannel');
    const dataChannel = document.getElementById('data-channel-div');

    if (!dataChannelCheckbox.checked) {
        dataChannel.style.display = 'none';
    } else {
        dataChannel.style.display = '';
    }
}