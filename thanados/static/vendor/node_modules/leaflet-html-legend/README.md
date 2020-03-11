# Leaflet.HtmlLegend

A simple Leaflet plugin for creating legends with HTML.

*Tested with Leaflet 1.3.x*

## Install

From NPM:

```bash
npm install leaflet-html-legend
```


## Usage

Include the CSS:

```html
<link rel="stylesheet" href="L.Control.HtmlLegend.css" />
```


Include the JavaScript:

```html
<script src="L.Control.HtmlLegend.min.js"></script>
```


#### Control Options:
| Option | Type | Default | Description |
| :---   | :--- | :---    | :---        |
| position | String | 'topright' | Map position of element |
| legend | Array | - | Array of legend entries (see legend options below for details) |
| collapseSimple | bool | false | Whether to use compact presentation for legend entries that are from a simple renderer |
| detectStreched | bool | false | Test to see if legend entries look stretched (these are usually in sets of 3 with the middle element having no label) |
| collapsedOnInit | bool | false | Whether to initialize instance in collapsed mode |
| updateOpacity | function | null | If set, this function is used to update opacity of the attached layer (it receives the layer and opacity as arguments) |
| defaultOpacity | number | 1 | Default opacity for layers in specified in legends |
| removeIcon | String | 'leaflet-html-legend-icon-remove' | css class for the remove icon |
| visibleIcon | String | 'leaflet-html-legend-icon-eye' | css class for the visible icon on opacity slider |
| hiddenIcon | String | 'leaflet-html-legend-icon-eye-slash' | css class for the hidden icon on opacity slider |
| toggleIcon | String | 'leaflet-html-legend-icon-eye-slash' | css class for the icon on visibility toggle button |

#### Legend Options:
| Option | Type | Default | Description |
| :---   | :--- | :---    | :---        |
| name | String | - | Legend label |
| layer | Leaflet layer | - | The leafel layer to connect to this legend. The legend can control the layer visiblity via opacity slider, if `disableVisibilityControls` is set to true |
| allowRemove | boolean | false | Whether to add a remove icon that allows removal of the legend from the control |
| disableVisibilityControls | bool | false | Whether to add visibility toggle button and opacity slider |
| elements | Array | - | Array of elements (see element options below for details) |


#### Element options:
| Option | Type | Default | Description |
| :---   | :--- | :---    | :---        |
| label | String | - | Entry label |
| html | String | - | String representaiton of an HTML elemnt that goes into the legend block |
| style | Object | - | An object containing css styling of the legend block |

You can use `addLegend` method to add legends to existing instances of `HtmlLegend`:
```javascript
var htmlLegend = L.control.htmllegend({...});
htmlLegend.addLegend({
        name: 'Layer name',
        layer: layerInstance,
        elements: [{
            html: '<div>Legend description</div>'
        }]
    })
```

An existing entry in a legend control instance can be removed using `removeLegend`. This method needs id of the entry, which can be obtained from `htmllegend._entries` (see the example for usage).


See the [example](//consbio.github.io/Leaflet.HtmlLegend) for usage details.

## Contributors:
* [Kaveh Karimi](https://github.com/ka7eh)
