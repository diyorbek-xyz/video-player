# This is simple video player like Youtube

This package requires

-   [hls.js]() for .m3u8 video formats
-   [react-use]() for controll video

## Usage

### Props
- download - video for download path
- previews - previews for each specific seconds (hover time range, to see)
- video - master.m3u8 file format (currently only hls supported)
- poster - video poster
- baseUrl - Optional: if you have backend api use it as baseURL

```js
import VideoPlayer from '@diyorbek-xyz/video-player'

<VideoPlayer video='/master.m3u8' previews='/previews.vtt' poster='/poster.jpg' download='/downloadPath.mp4' baseUrl='' />
```
