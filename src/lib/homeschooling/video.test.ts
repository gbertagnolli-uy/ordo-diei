import { test } from "node:test";
import assert from "node:assert/strict";
import { parsearEnlaceVideo, urlEmbed } from "./video.ts";

const ID = "dQw4w9WgXcQ";

test("reconoce los formatos de YouTube", () => {
  for (const u of [
    `https://youtu.be/${ID}`,
    `https://www.youtube.com/watch?v=${ID}`,
    `https://www.youtube.com/watch?feature=share&v=${ID}`,
    `https://www.youtube.com/embed/${ID}`,
    `https://www.youtube.com/shorts/${ID}`,
    `https://m.youtube.com/watch?v=${ID}`,
    `youtube.com/watch?v=${ID}`,
  ]) {
    const r = parsearEnlaceVideo(u);
    assert.equal(r?.plataforma, "youtube", u);
    assert.equal(r?.videoId, ID, u);
    assert.equal(r?.miniaturaUrl, `https://img.youtube.com/vi/${ID}/mqdefault.jpg`);
  }
});

test("reconoce los formatos de Vimeo", () => {
  for (const u of ["https://vimeo.com/123456", "https://player.vimeo.com/video/123456"]) {
    const r = parsearEnlaceVideo(u);
    assert.equal(r?.plataforma, "vimeo", u);
    assert.equal(r?.videoId, "123456", u);
    assert.equal(r?.miniaturaUrl, "https://vumbnail.com/123456.jpg");
  }
});

test("rechaza basura e ids de largo incorrecto", () => {
  for (const u of ["", "hola", "https://example.com/watch?v=" + ID, `https://youtu.be/${ID.slice(1)}`, `https://youtu.be/${ID}x`, "https://vimeo.com/abc"]) {
    assert.equal(parsearEnlaceVideo(u), null, u);
  }
});

test("urlEmbed usa youtube-nocookie", () => {
  assert.equal(urlEmbed("youtube", ID), `https://www.youtube-nocookie.com/embed/${ID}?rel=0`);
  assert.equal(urlEmbed("vimeo", "1"), "https://player.vimeo.com/video/1");
});
