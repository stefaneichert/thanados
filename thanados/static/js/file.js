fileContainer = document.getElementById('fileContainer')

if (mimetype === 'img') {
    var mirador = Mirador.viewer({
        "id": "fileContainer",
        "selectedTheme": "dark",
        "windows": [
            {
                "manifestId": img_manifest
            }
        ],
        language: 'en',
        availableLanguages: { // All the languages available in the language switcher
            en: 'English'
        },
        window: {
            allowClose: false,
            defaultSideBarPanel: 'attribution',
            sideBarOpenByDefault: false,
            allowMaximize: false, // Configure if windows can be maximized or not
            allowTopMenuButton: false, // Configure if window view and thumbnail display menu are visible or not
            defaultView: 'single',  // Configure which viewing mode (e.g. single, book, gallery) for windows to be opened in
            sideBarOpen: false, // Configure if the sidebar (and its content panel) is open by default
        },
        workspace: {
            allowNewWindows: false,
            showZoomControls: false,
            type: 'mosaic', // Which workspace type to load by default. Other possible values are "elastic"
        },
        workspaceControlPanel: {
            enabled: false,
        }
    });
} else {


    document.addEventListener('DOMContentLoaded', function () {
        const metadataInfo = document.getElementById('metadataInfo');
        const infoBtn = document.getElementById('infoBtn');
        const infoButtons = document.querySelectorAll('.infoCircle');

        infoButtons.forEach(button => {
            button.addEventListener('click', function () {
                metadataInfo.classList.toggle('show');
            });
        });
    });

    getImageExt(fileid)
        .then(data => {
            // Handle the JSON data here
            console.log(data)
            let attrContainer = document.getElementById('attribution')
            attrContainer.innerHTML += '<h5>Resource</h5>' + data.label.none[0]
            attrContainer.innerHTML += '<h5>File</h5><a href="'+downloadUrl+'" target="_blank">'+filename+'</a>'
            attrContainer.innerHTML += '<h5>Attribution</h5>' + data.requiredStatement.value['none'][0]
            attrContainer.innerHTML += '<h5>License</h5><a href="' + data.rights + '" target="_blank">' + data.rights + '</a>'
            if (data.entities) {
                if (data.entities.length > 0) {
                    attrContainer.innerHTML += '<h5>Entities</h5>'
                    data.entities.forEach(dataset => attrContainer.innerHTML += dataset + '<br>')
                }
                infoBtn.innerHTML = 'Info'
            }
        })
        .catch(error => {
            console.error("Error:", error);
        });

}

async function getImageExt(id) {
    const response = await fetch("/file/" + id + ".json");
    const message = await response.json();
    return (message)
}

