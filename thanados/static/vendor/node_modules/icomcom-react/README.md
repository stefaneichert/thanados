IComCom React
===============

> A React component from handling communication with content in <iframe />

# Installation

```bash
npm install --save icomcom-react
# or
yarn add icomcom-react
```

## Props

This component can recevie the following methods:

- `handleReceiveMessage` - this method will be called when an iframe posts a
message to the parent
- `handleReady` - this method will be called once the iframe has been loaded

And the following properties:

- `postMessageData` - this data will be passed to the iframe on load
- `targetOrigin` - this is the target origin of the iframe, defaults to `*`
- `attributes` specify how the iframe will look, (please see [attributes](#attributes))

```javascript
<IComCom
  attributes={{
    src: "https://example.com",
  }}
  handleReceiveMessage={(data) => /* posted data */}
  handleReady={() => /* called once the iframe is loaded */}
/>
```

## Attributes

The following attributes are defaults from the `iframe` element. Please see
the [official documentation](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe)
for more details. Here are the supported ones:

- `frameBorder`
- `height`
- `name`
- `scrolling`
- `sandbox`
- `srcDoc`
- `src`
- `width`

## License

The [MIT License](LICENSE).

Heavily influenced by [react-iframe-comm](https://github.com/pbojinov/react-iframe-comm),
which is licensed under MIT.

## Credits

icomcom-react is maintained and sponsored by
[Infinum](http://www.infinum.co).

<img src="https://infinum.co/infinum.png" width="264">