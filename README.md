# tileimg

Converts your image to map tiles which can be viewed using libraries like [LeafletJS](http://leafletjs.com/) and [OpenLayers](http://openlayers.org/).

## Install
```bash
npm install -g tileimg
```

## Arguments
| Arguments   | Type   | Default   | Description  |
|-------------|--------|-----------|--------------|
| `minZoom` | Number | `0`       | Minmum Zoom  |
| `maxZoom` | Number | `0`       | Maximum Zoom |
| `zoom`    | Number | N/A       | Use this argument to convert your image to one zoom level |

## Usage
```bash
$ tileimg image.png --minZoom 0 --maxZoom 5
```

```bash
$ tileimg image.png --zoom 2
```