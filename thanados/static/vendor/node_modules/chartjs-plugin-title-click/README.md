# chartjs-plugin-title-click

A simple title onClick/onHover plugin for Chart.js

## Configuration

To configure the title click plugin, add these options to your chart config:

```javascript
{
    title: {
        onClick: function(e, titleBlock) {
            console.log("Clicked title!");
        },
        onHover: function(e, titleBlock) {
            console.log("Hovered title!");  
        },
        onLeave: function(e, titleBlock) {
            console.log("Leaved title!");  
        },
    }
}
```

## Installation

To use, download chartjs-plugin-titleclick.js and reference it in your project.

## Documentation

You can find documentation for the main plugin, Chart.js, at [www.chartjs.org/docs](http://www.chartjs.org/docs).

There are some samples for this plugin in the [samples folder](samples).

## License

chartjs-plugin-titleclick.js is available under the [MIT license](http://opensource.org/licenses/MIT).