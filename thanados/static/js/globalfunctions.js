function exportToJsonFile(data) {
    L.extend(data, {
        name: myjson.name,
        properties: myjson.properties,
        site_id: myjson.site_id
    });
    console.log(data);
    var mydata = JSON.stringify(data).replace('\u2028', '\\u2028').replace('\u2029', '\\u2029');
    var file = new Blob([mydata]);
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = 'export.json';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}

function openInNewTab(url) {
  var win = window.open(url, '_self'); //change to _blank for new tabs.
  win.focus();
}


function attributionChange() {
    $(".leaflet-control-attribution").find(':first-child').remove();
var val = $(".leaflet-control-attribution").html();
console.log(val);
$(".leaflet-control-attribution").html(val.substring(2, val.length));
}

$(document).ready(function () {
    $('#show_passwords').show();
    $('#show_passwords').change(function () {
        $('#password')[0].type = this.checked ? 'text' : 'password';
    });
    $("form").each(function () {
        $(this).validate();
    });
})
