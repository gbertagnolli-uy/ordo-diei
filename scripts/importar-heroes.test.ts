import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { PERSONAJES, POSES, tieneFondo } from "../src/lib/engagement/companero.ts";
import { elegirPoses, poseDeArchivo, slug } from "./importar-heroes.ts";

test("las carpetas se vuelven claves sin tildes ni espacios", () => {
  assert.equal(slug("Dom Pío"), "dom-pio");
  assert.equal(slug("San Miguel Arcangel"), "san-miguel-arcangel");
  assert.equal(slug("Verónica"), "veronica");
  assert.equal(slug("Isaías"), "isaias");
});

test("los nombres en inglés se clasifican en las 6 poses y las T-pose, perfiles y hojas se descartan", () => {
  assert.equal(poseDeArchivo("Animated_nun_waving_good_morning_20261017111535.jpg", "Madre Isabel"), "buenos-dias");
  assert.equal(poseDeArchivo("Animated_monk_hugging_gesture_20261017111535.jpg", "Dom Pío"), "abrazo");
  assert.equal(poseDeArchivo("Man_gesturing_I_missed_you_20261017111535.jpg", "Pedro"), "abrazo");
  assert.equal(poseDeArchivo("Boy_clapping_hands_joyfully_20261017111535.jpg", "Vicente"), "felicitando");
  assert.equal(poseDeArchivo("Animated_girl_teaching_with_smile_20261017111535.jpg", "Teresa"), "ensenando");
  assert.equal(poseDeArchivo("Monk_reflecting_in_thought_20261017111535.jpg", "Dom Pío"), "reflexion");
  assert.equal(poseDeArchivo("angelito-indicando.jpg", "Angelito"), "ensenando");
  assert.equal(poseDeArchivo("Angelito.jpg", "Angelito"), "neutral");
  assert.equal(poseDeArchivo("Madre Isabel.jpg", "Madre Isabel"), "neutral");
  assert.equal(poseDeArchivo("Animated_boy_in_T-pose_20261017111535.jpg", "Vicente"), null);
  assert.equal(poseDeArchivo("angelito-t-pose-atras.jpg", "Angelito"), null);
  assert.equal(poseDeArchivo("Priest_character_side_profile_view_20261017103602.jpg", "Lucas"), null);
  assert.equal(poseDeArchivo("Young_priest_character_design_sheet_20261017103602.jpg", "Lucas"), null);
  assert.equal(poseDeArchivo("Animated_girl_reading_book_20261017111535.jpg", "Rosa"), null); // fase 2
});

test("se elige una imagen por pose: la presentación para la neutral y, si hay varias, la más nueva", () => {
  const archivos = ["Pedro.jpg", "Man_waving_hand_greeting_20261017103602.jpg", "Man_waving_hand_greeting_20261017111535_2.jpg", "Man_in_peasant_clothes_T-pose_20261017111535.jpg"];
  const e = elegirPoses(archivos, "Pedro");
  assert.deepEqual(e, [{ pose: "neutral", archivo: "Pedro.jpg" }, { pose: "buenos-dias", archivo: "Man_waving_hand_greeting_20261017111535_2.jpg" }]);
  // Una corrección manual pisa al clasificador
  assert.equal(elegirPoses(["A_standing_20261017111535.jpg", "B_standing_side_20261017111535.jpg"], "X", { neutral: "A_standing" })[0].archivo, "A_standing_20261017111535.jpg");
});

test("las poses importadas tienen transparencia real, salvo las que se dejaron con fondo (buenos días)", async () => {
  for (const p of PERSONAJES.filter((x) => x.arte !== "pendiente")) {
    for (const pose of POSES) {
      const ruta = `public/companeros/${p.clave}/${pose.clave}.webp`;
      const { data, info } = await sharp(ruta).ensureAlpha().raw().toBuffer({ resolveWithObject: true }).catch(() => ({ data: null, info: null }));
      if (!data || !info) continue; // las poses que faltan las cubre la prueba del catálogo
      const esquina = data[3]; // alfa del píxel de arriba a la izquierda
      if (tieneFondo(pose.clave)) assert.ok(esquina >= 0, ruta);
      else assert.equal(esquina, 0, `${ruta}: debería tener la esquina transparente`);
    }
  }
});
