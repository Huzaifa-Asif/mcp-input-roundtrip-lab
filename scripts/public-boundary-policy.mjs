const editorialSegment = /(?:^|\/)editorial(?:\/|$)/i;
const editorialFilename = /(?:^|\/)[^/]*(?:launch[-_ ]?article|social[-_ ]?draft)[^/]*(?:$|\/)/i;
const coverImage = /(?:^|\/)cover(?:-draft)?\.(?:png|jpe?g|webp)$/i;

export const isEditorialPath = path => editorialSegment.test(path) || editorialFilename.test(path) || coverImage.test(path);
