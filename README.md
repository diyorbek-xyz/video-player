# This is simple video player like Youtube

This package requires

-   [hls.js]() for .m3u8 video formats
-   [react]()
-   [react-dom]()

## Usage

### Props
- download - video for download path
- previews - previews for each specific seconds (hover time range, to see)
- video - master.m3u8 file format (currently only hls supported)
- poster - video poster
- baseUrl - Optional: if you have backend api use it as baseURL
- type - type of video, hls and mp4 supported

```js
import Player from '@diyorbek-xyz/video-player'

<Player type="hls-m3u8" video='/master.m3u8' previews='/previews.vtt' poster='/poster.jpg' download='/downloadPath.mp4' baseUrl='' />
```
