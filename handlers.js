function openSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section.style.display === 'none') {
        section.style.display = ''
    } else {
        section.style.display = 'none'
    }
}

function checkboxLogic(checkboxId, logId) {
    const checkbox = document.getElementById(checkboxId);
    const log = document.getElementById(logId);

    if (checkbox.checked) {
        log.style.display = '';
    } else {
        log.style.display = 'none';
    }
}