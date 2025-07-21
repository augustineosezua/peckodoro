export const notEmpty = (x) => x != null;

export const pickImg = (imgs, pref = 200) => {
  if (!imgs || !imgs.length) return "/window.svg";
  return imgs.reduce((best, img) =>
    Math.abs((img.width || pref) - pref) < Math.abs((best.width || pref) - pref)
      ? img
      : best
  ).url;
};

export const joinArtists = (arr) => (arr || []).map((a) => a.name).join(", ");
