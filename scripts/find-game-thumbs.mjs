async function getGameThumbs() {
  const ids = [1695, 1696, 1697, 1698, 1700, 1702, 1704, 1705, 1709, 1714, 1715, 1716];
  for (const id of ids) {
    try {
      const res = await fetch('https://www.bubbleshooter.net/embed.php?id=' + id);
      const text = await res.text();
      const mIframe = text.match(/<iframe[^>]+src=["']([^"']+)["']/i);
      console.log(id, 'iframe:', mIframe ? mIframe[1] : 'none');
    } catch (e) {
      console.log(id, 'err', e.message);
    }
  }
}
getGameThumbs();
